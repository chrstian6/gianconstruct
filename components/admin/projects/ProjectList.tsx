"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  Plus,
  Clock,
  CheckCircle,
  Search,
  Eye,
  X,
  Trash2,
  CheckSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  getProjectsPaginated,
  deleteProject,
  deleteMultipleProjects,
  PaginatedProjectsResponse,
} from "@/action/project";
import { getUsers } from "@/action/userManagement";
import { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import NotFound from "../NotFound";
import { useModalStore } from "@/lib/stores";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
}

type StatusFilter = "all" | "not-started" | "active" | "completed" | "pending";
type DateFilter = "any" | "today" | "thisWeek" | "thisMonth" | "overdue";

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active"); // Default to "active"
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const cardsPerPage = 12;

  // Multi-select state
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // State for paginated data
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const {
    setIsCreateProjectOpen,
    isCreateProjectOpen,
    isEditProjectOpen,
    setIsEditProjectOpen,
    editingProject,
  } = useModalStore();

  // Available statuses for tags - Always visible regardless of data
  const statuses = ["all", "not-started", "active", "completed", "pending"];

  // ✅ useCallback to prevent re-creation
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getProjectsPaginated({
        page: currentPage,
        limit: cardsPerPage,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
        dateFilter: dateFilter !== "any" ? dateFilter : undefined,
      });

      if (response.success && response.data) {
        const data = response.data as PaginatedProjectsResponse;
        setProjects(data.projects || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(response.error || "Failed to fetch projects");
        setProjects([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error("Failed to fetch projects");
      console.error("Error fetching projects:", error);
      setProjects([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery, dateFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      if (response.success) {
        setUsers(response.users || []);
      } else {
        toast.error(response.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  // Reset selection when projects change
  useEffect(() => {
    setSelectedProjects(new Set());
    setIsSelectMode(false);
  }, [projects, currentPage, statusFilter, searchQuery, dateFilter]);

  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find((user) => user.user_id === userId);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    },
    [users]
  );

  const handleProjectSelect = useCallback(
    (project: Project) => {
      if (isSelectMode) {
        // Toggle selection in select mode
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(project.project_id)) {
          newSelected.delete(project.project_id);
        } else {
          newSelected.add(project.project_id);
        }
        setSelectedProjects(newSelected);
      } else {
        // Navigate to project detail in normal mode
        router.push(`/admin/admin-project/${project.project_id}`);
      }
    },
    [router, isSelectMode, selectedProjects]
  );

  const handleDeleteClick = useCallback((project: Project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      const response = await deleteProject(projectToDelete.project_id);

      if (response.success) {
        toast.success("Project deleted successfully");
        // Refetch projects to get updated data
        await fetchProjects();
      } else {
        toast.error(response.error || "Failed to delete project");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the project");
      console.error("Delete error:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  }, [projectToDelete, fetchProjects]);

  const handleMultiDeleteConfirm = useCallback(async () => {
    if (selectedProjects.size === 0) return;

    try {
      const projectIds = Array.from(selectedProjects);
      const response = await deleteMultipleProjects(projectIds);

      if (response.success) {
        toast.success(
          `Successfully deleted ${selectedProjects.size} project${selectedProjects.size > 1 ? "s" : ""}`
        );
        // Refetch projects to get updated data
        await fetchProjects();
        setSelectedProjects(new Set());
        setIsSelectMode(false);
      } else {
        toast.error(response.error || "Failed to delete projects");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the projects");
      console.error("Multi-delete error:", error);
    } finally {
      setIsMultiDeleteModalOpen(false);
    }
  }, [selectedProjects, fetchProjects]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const handleMultiDeleteCancel = useCallback(() => {
    setIsMultiDeleteModalOpen(false);
  }, []);

  const handleEditProject = useCallback(
    (project: Project) => {
      setIsEditProjectOpen(true, project);
    },
    [setIsEditProjectOpen]
  );

  const handleProjectUpdated = useCallback(
    async (updatedProject: Project) => {
      // Refetch projects to get updated data
      await fetchProjects();
    },
    [fetchProjects]
  );

  const handleProjectCreated = useCallback(async () => {
    // Refetch projects to get updated data
    await fetchProjects();
  }, [fetchProjects]);

  const getPageNumbers = useCallback(
    (totalPages: number, currentPage: number) => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push("ellipsis");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("ellipsis");
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push("ellipsis");
          for (let i = currentPage - 1; i <= currentPage + 1; i++)
            pages.push(i);
          pages.push("ellipsis");
          pages.push(totalPages);
        }
      }
      return pages;
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDateFilter("any");
    setStatusFilter("active"); // Reset to "active" when clearing filters
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () => searchQuery || dateFilter !== "any" || statusFilter !== "active", // Changed from "all" to "active"
    [searchQuery, dateFilter, statusFilter]
  );

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatStatusDisplay = (status: string): string => {
    if (status === "not-started") return "Not Started";
    return capitalizeFirstLetter(status);
  };

  // Multi-select functions
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedProjects(new Set());
    }
  }, [isSelectMode]);

  const toggleSelectAll = useCallback(() => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      const allProjectIds = projects.map((project) => project.project_id);
      setSelectedProjects(new Set(allProjectIds));
    }
  }, [projects, selectedProjects.size]);

  const toggleProjectSelection = useCallback(
    (projectId: string) => {
      const newSelected = new Set(selectedProjects);
      if (newSelected.has(projectId)) {
        newSelected.delete(projectId);
      } else {
        newSelected.add(projectId);
      }
      setSelectedProjects(newSelected);
    },
    [selectedProjects]
  );

  const handleMultiDeleteClick = useCallback(() => {
    if (selectedProjects.size > 0) {
      setIsMultiDeleteModalOpen(true);
    }
  }, [selectedProjects.size]);

  return (
    <div className="flex flex-col h-screen px-10 font-geist">
      {/* Fixed Header Section - Matching CatalogList layout */}
      <div className="flex-shrink-0 px-6 py-2 bg-white border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 mb-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 font-geist">
              Construction Projects
            </h1>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              {isLoading
                ? "Loading..."
                : `${totalCount.toLocaleString()} projects found${hasActiveFilters ? " (filtered)" : ""}`}
            </p>
          </div>
        </div>

        {/* Search and Filters - Matching CatalogList layout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search projects..."
                className="pl-10 w-full border-gray-300 rounded-lg focus:border-gray-500 focus:ring-gray-500 font-geist"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <X
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              )}
            </div>

            <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-geist"
                >
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center"
                    >
                      !
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-4 space-y-4 bg-white shadow-lg rounded-lg border border-gray-200 font-geist">
                <div>
                  <Label
                    htmlFor="dropdown_status_filter"
                    className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                  >
                    Status
                  </Label>
                  <Select
                    onValueChange={(value: StatusFilter) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                    value={statusFilter}
                  >
                    <SelectTrigger
                      id="dropdown_status_filter"
                      className="w-full border-gray-300 rounded-lg font-geist"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="font-geist">
                      <SelectItem value="all" className="font-geist">
                        All Projects
                      </SelectItem>
                      <SelectItem value="not-started" className="font-geist">
                        Not Started
                      </SelectItem>
                      <SelectItem value="active" className="font-geist">
                        Active
                      </SelectItem>
                      <SelectItem value="completed" className="font-geist">
                        Completed
                      </SelectItem>
                      <SelectItem value="pending" className="font-geist">
                        Pending
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="dropdown_date_filter"
                    className="block text-sm font-medium text-gray-700 mb-1 font-geist"
                  >
                    Date Filter
                  </Label>
                  <Select
                    onValueChange={(value: DateFilter) => {
                      setDateFilter(value);
                      setCurrentPage(1);
                    }}
                    value={dateFilter}
                  >
                    <SelectTrigger
                      id="dropdown_date_filter"
                      className="w-full border-gray-300 rounded-lg font-geist"
                    >
                      <SelectValue placeholder="Select date filter" />
                    </SelectTrigger>
                    <SelectContent className="font-geist">
                      <SelectItem value="any" className="font-geist">
                        Any Date
                      </SelectItem>
                      <SelectItem value="today" className="font-geist">
                        Today
                      </SelectItem>
                      <SelectItem value="thisWeek" className="font-geist">
                        This Week
                      </SelectItem>
                      <SelectItem value="thisMonth" className="font-geist">
                        This Month
                      </SelectItem>
                      <SelectItem value="overdue" className="font-geist">
                        Overdue
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 font-geist"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Project Button - Moved down to align with search input */}
            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white font-geist whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>

          {/* Multi-select Actions - Moved to the right/end */}
          <div className="flex items-center gap-2">
            {isSelectMode ? (
              <div className="flex gap-2 items-center">
                {/* Select All / Deselect All */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="font-geist"
                >
                  {selectedProjects.size === projects.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>

                {/* X icon for cancel */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectMode}
                  className="font-geist"
                  title="Cancel selection"
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Trash icon for delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMultiDeleteClick}
                  disabled={selectedProjects.size === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 font-geist"
                  title={`Delete ${selectedProjects.size} selected project${selectedProjects.size > 1 ? "s" : ""}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Selection count badge */}
                {selectedProjects.size > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm"
                  >
                    {selectedProjects.size} selected
                  </Badge>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectMode}
                className="font-geist flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
            )}
          </div>
        </div>

        {/* Status Tags - Always visible like CatalogList categories */}
        <div className="flex flex-wrap gap-2 mt-4 border-t py-3">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status as StatusFilter);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 font-geist ${
                statusFilter === status
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All Projects" : formatStatusDisplay(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Section with Cards and Pagination */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Skeleton Loading State - Matching CatalogList
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {Array.from({ length: cardsPerPage }).map((_, index) => (
                <div key={index} className="animate-pulse font-geist">
                  <div className="bg-gray-200 rounded-xl aspect-video mb-3"></div>
                  <div className="bg-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-300 rounded h-4 w-3/4 mb-2"></div>
                        <div className="bg-gray-300 rounded h-3 w-1/2"></div>
                      </div>
                      <div className="bg-gray-300 rounded-full h-7 w-7"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6">
            <div className="p-8 text-center mx-auto font-geist">
              <NotFound description="Try adjusting the filters or start your new project" />
            </div>
          </div>
        ) : (
          <div className="px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  activeTab={statusFilter}
                  onSelect={handleProjectSelect}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteClick}
                  userName={getUserName(project.userId)}
                  isSelectMode={isSelectMode}
                  isSelected={selectedProjects.has(project.project_id)}
                  onToggleSelect={() =>
                    toggleProjectSelection(project.project_id)
                  }
                />
              ))}
            </div>

            {/* Pagination Section - Always visible even with 1 page */}
            <div className="my-6 px-6 p-10 border-gray-200">
              <Pagination>
                <PaginationContent className="font-geist">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={cn(
                        "font-geist text-sm",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {getPageNumbers(totalPages, currentPage).map(
                    (page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis className="font-geist" />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(page as number)}
                            isActive={currentPage === page}
                            className={cn(
                              "font-geist text-sm",
                              currentPage === page
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={cn(
                        "font-geist text-sm",
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              {/* Page info */}
              <div className="text-center mt-4 text-sm text-gray-600 font-geist">
                Page {currentPage} of {totalPages} •{" "}
                {totalCount.toLocaleString()} total projects
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals - All functionality preserved */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
      <EditProjectModal
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={editingProject}
        users={users}
        onUpdate={handleProjectUpdated}
        onBackToUserSelection={() => {}}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Project"
        description={`Are you sure you want to delete project "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ConfirmationModal
        isOpen={isMultiDeleteModalOpen}
        onConfirm={handleMultiDeleteConfirm}
        onCancel={handleMultiDeleteCancel}
        title={`Delete ${selectedProjects.size} Project${selectedProjects.size > 1 ? "s" : ""}`}
        description={`Are you sure you want to delete ${selectedProjects.size} selected project${selectedProjects.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText={`Delete ${selectedProjects.size} Project${selectedProjects.size > 1 ? "s" : ""}`}
        cancelText="Cancel"
      />
    </div>
  );
}
