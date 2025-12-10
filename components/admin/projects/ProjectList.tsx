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
  Search,
  X,
  Trash2,
  CheckSquare,
  ListFilter,
  ArrowUpDown,
  LayoutGrid,
  Users,
  Settings,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  cancelProject,
  PaginatedProjectsResponse,
} from "@/action/project";
import { getUsers } from "@/action/userManagement";
import { getProjectMilestones } from "@/action/milestone";
import { Project, Milestone } from "@/types/project";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import AssignProjectsModal from "./AssignProjectsModal";
import ManageAssignmentsModal from "./ManageAssignmentsModal"; // New import
import ConfirmationModal from "@/components/ConfirmationModal";
import NotFound from "../NotFound";
import { useModalStore } from "@/lib/stores";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
}

type StatusFilter = "all" | "pending" | "active" | "completed" | "cancelled";
type DateFilter = "any" | "today" | "thisWeek" | "thisMonth" | "overdue";

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
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

  // Assign Projects Modal state
  const [isAssignProjectsOpen, setIsAssignProjectsOpen] = useState(false);
  // Manage Assignments Modal state
  const [isManageAssignmentsOpen, setIsManageAssignmentsOpen] = useState(false);

  // Milestones progress state
  const [milestonesProgress, setMilestonesProgress] = useState<{
    [key: string]: number;
  }>({});

  // State for paginated data
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // State for status counts
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    all: 0,
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  const {
    setIsCreateProjectOpen,
    isCreateProjectOpen,
    isEditProjectOpen,
    setIsEditProjectOpen,
    editingProject,
  } = useModalStore();

  // Available statuses for tags
  const statuses = ["all", "pending", "active", "completed", "cancelled"];

  // Function to calculate milestones progress - using imported Milestone type
  const calculateMilestonesProgress = useCallback(
    (milestones: Milestone[]): number => {
      if (!milestones || milestones.length === 0) return 0;
      const total = milestones.reduce(
        (sum, milestone) => sum + milestone.progress,
        0
      );
      return Math.round(total / milestones.length);
    },
    []
  );

  // Fetch milestones for all projects
  const fetchMilestonesProgress = useCallback(
    async (projects: Project[]) => {
      const progressMap: { [key: string]: number } = {};

      // Use Promise.all to fetch milestones for all projects concurrently
      const promises = projects.map(async (project) => {
        try {
          const result = await getProjectMilestones(project.project_id);
          if (result.success && result.milestones) {
            progressMap[project.project_id] = calculateMilestonesProgress(
              result.milestones
            );
          } else {
            progressMap[project.project_id] = 0;
          }
        } catch (error) {
          console.error(
            `Error fetching milestones for project ${project.project_id}:`,
            error
          );
          progressMap[project.project_id] = 0;
        }
      });

      await Promise.all(promises);
      setMilestonesProgress(progressMap);
    },
    [calculateMilestonesProgress]
  );

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
        const projectsData = data.projects || [];
        setProjects(projectsData);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);

        // Fetch milestones progress for the loaded projects
        if (projectsData.length > 0) {
          await fetchMilestonesProgress(projectsData);
        }
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
  }, [
    currentPage,
    statusFilter,
    searchQuery,
    dateFilter,
    fetchMilestonesProgress,
  ]);

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

  // Fetch status counts for all statuses
  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts: Record<string, number> = {};

      // Fetch count for "all" status (no filter)
      const allResult = await getProjectsPaginated({
        page: 1,
        limit: 1,
        search: searchQuery || undefined,
        dateFilter: dateFilter !== "any" ? dateFilter : undefined,
      });

      counts.all =
        allResult.success && allResult.data
          ? allResult.data.totalCount || 0
          : 0;

      // Fetch counts for each specific status
      for (const status of statuses.filter((s) => s !== "all")) {
        const statusResult = await getProjectsPaginated({
          page: 1,
          limit: 1,
          status: status,
          search: searchQuery || undefined,
          dateFilter: dateFilter !== "any" ? dateFilter : undefined,
        });

        counts[status] =
          statusResult.success && statusResult.data
            ? statusResult.data.totalCount || 0
            : 0;
      }

      setStatusCounts(counts);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  }, [searchQuery, dateFilter]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchStatusCounts();
  }, [fetchProjects, fetchUsers, fetchStatusCounts]);

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
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(project.project_id)) {
          newSelected.delete(project.project_id);
        } else {
          newSelected.add(project.project_id);
        }
        setSelectedProjects(newSelected);
      } else {
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
        await fetchProjects();
        await fetchStatusCounts();
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
  }, [projectToDelete, fetchProjects, fetchStatusCounts]);

  const handleMultiDeleteConfirm = useCallback(async () => {
    if (selectedProjects.size === 0) return;
    try {
      const projectIds = Array.from(selectedProjects);
      const response = await deleteMultipleProjects(projectIds);
      if (response.success) {
        toast.success(
          `Successfully deleted ${selectedProjects.size} project${selectedProjects.size > 1 ? "s" : ""}`
        );
        await fetchProjects();
        await fetchStatusCounts();
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
  }, [selectedProjects, fetchProjects, fetchStatusCounts]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const handleMultiDeleteCancel = useCallback(() => {
    setIsMultiDeleteModalOpen(false);
  }, []);

  const handleCancelProject = useCallback(
    async (project: Project) => {
      try {
        const response = await cancelProject(project.project_id);
        if (response.success) {
          toast.success("Project cancelled successfully");
          await fetchProjects();
          await fetchStatusCounts();
        } else {
          toast.error(response.error || "Failed to cancel project");
        }
      } catch (error) {
        toast.error("An error occurred while cancelling the project");
        console.error("Cancel project error:", error);
      }
    },
    [fetchProjects, fetchStatusCounts]
  );

  const handleEditProject = useCallback(
    (project: Project) => {
      setIsEditProjectOpen(true, project);
    },
    [setIsEditProjectOpen]
  );

  const handleProjectUpdated = useCallback(
    async (updatedProject: Project) => {
      await fetchProjects();
      await fetchStatusCounts();
    },
    [fetchProjects, fetchStatusCounts]
  );

  const handleProjectCreated = useCallback(async () => {
    await fetchProjects();
    await fetchStatusCounts();
  }, [fetchProjects, fetchStatusCounts]);

  const handleProjectsAssigned = useCallback(async () => {
    toast.success("Projects assigned successfully!");
    await fetchProjects();
    await fetchStatusCounts();
  }, [fetchProjects, fetchStatusCounts]);

  const handleAssignmentsManaged = useCallback(async () => {
    toast.success("Assignments updated successfully!");
    await fetchProjects();
    await fetchStatusCounts();
  }, [fetchProjects, fetchStatusCounts]);

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
    setStatusFilter("active");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () => searchQuery || dateFilter !== "any" || statusFilter !== "active",
    [searchQuery, dateFilter, statusFilter]
  );

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatStatusDisplay = (status: string): string => {
    return status === "all" ? "All Projects" : capitalizeFirstLetter(status);
  };

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
    <div className="flex flex-col min-h-screen bg-zinc-50/30 font-geist">
      {/* Sticky Modern Header */}
      <div className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-col gap-4 px-6 py-5 md:px-8">
          {/* Top Row: Title & Primary Action */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 font-geist">
                Projects
              </h1>
              <p className="text-zinc-500 mt-1 text-sm font-medium font-geist">
                Manage and organize your construction projects.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Assign Projects Button */}
              <Button
                onClick={() => setIsAssignProjectsOpen(true)}
                variant="outline"
                className="border-zinc-300 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 shadow-sm transition-all duration-200 font-medium px-5 h-10 rounded-lg w-full md:w-auto font-geist"
              >
                <Users className="mr-2 h-4 w-4" /> Assign Projects
              </Button>

              {/* Manage Assignments Button */}
              <Button
                onClick={() => setIsManageAssignmentsOpen(true)}
                variant="outline"
                className="border-zinc-300 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 shadow-sm transition-all duration-200 font-medium px-5 h-10 rounded-lg w-full md:w-auto font-geist"
              >
                <Settings className="mr-2 h-4 w-4" /> Manage Assignments
              </Button>

              <Button
                onClick={() => setIsCreateProjectOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all duration-200 font-medium px-5 h-10 rounded-lg w-full md:w-auto font-geist"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            </div>
          </div>

          {/* Middle Row: Search, Filters & Selection Tools */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              <Input
                placeholder="Search projects..."
                className="pl-10 h-10 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10 rounded-lg transition-all font-geist"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-zinc-500" />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-zinc-200 hidden md:block mx-1" />

            {/* Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 border-dashed border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 font-geist w-full md:w-auto justify-between md:justify-center",
                    hasActiveFilters &&
                      "border-zinc-400 bg-zinc-50 text-zinc-900"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    <span>Filter</span>
                  </div>
                  {hasActiveFilters && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 rounded-full text-[10px]">
                      !
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-72 p-4 space-y-4 font-geist"
              >
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-zinc-900 flex items-center gap-2">
                    <Filter className="h-3 w-3" /> Status
                  </h4>
                  <Select
                    onValueChange={(value: StatusFilter) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                    value={statusFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-zinc-900 flex items-center gap-2">
                    <ArrowUpDown className="h-3 w-3" /> Date Range
                  </h4>
                  <Select
                    onValueChange={(value: DateFilter) => {
                      setDateFilter(value);
                      setCurrentPage(1);
                    }}
                    value={dateFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-9 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                      onClick={clearFilters}
                    >
                      Reset Filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* Selection Tools */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {isSelectMode ? (
                <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg border border-zinc-200 animate-in fade-in slide-in-from-right-4 duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 text-xs font-medium text-zinc-700 hover:text-zinc-900 font-geist"
                  >
                    {selectedProjects.size === projects.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>

                  <div className="h-4 w-px bg-zinc-300" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectMode}
                    className="h-8 w-8 p-0 hover:bg-zinc-200 rounded-md"
                  >
                    <X className="h-4 w-4 text-zinc-600" />
                  </Button>

                  {selectedProjects.size > 0 && (
                    <>
                      <div className="h-4 w-px bg-zinc-300" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMultiDeleteClick}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 font-geist"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete ({selectedProjects.size})
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={toggleSelectMode}
                  className="h-10 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-geist"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs with Number Badges */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-6 px-6 md:mx-0 md:px-0">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as StatusFilter);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap font-geist border relative",
                  statusFilter === status
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                <span className="flex items-center gap-2">
                  {formatStatusDisplay(status)}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 px-1.5 text-xs font-medium rounded-full",
                      statusFilter === status
                        ? "bg-white/20 text-white/90 hover:bg-white/30"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    )}
                  >
                    {statusCounts[status]?.toLocaleString() || 0}
                  </Badge>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {Array.from({ length: cardsPerPage }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3 animate-pulse"
                >
                  <div className="bg-zinc-100 rounded-lg aspect-[4/3] w-full" />
                  <div className="space-y-2">
                    <div className="bg-zinc-100 h-4 w-3/4 rounded" />
                    <div className="bg-zinc-100 h-3 w-1/2 rounded" />
                  </div>
                  <div className="pt-2 flex justify-between">
                    <div className="bg-zinc-100 h-6 w-16 rounded-full" />
                    <div className="bg-zinc-100 h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
              <LayoutGrid className="h-8 w-8 text-zinc-300" />
            </div>
            <NotFound description="No projects found matching your criteria. Try adjusting the filters or start a new project." />
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4 font-geist border-zinc-200"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="px-10 overflow-y-auto mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                  milestonesProgress={
                    milestonesProgress[project.project_id] || 0
                  }
                />
              ))}
            </div>

            {/* Original Pagination Section */}
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
                                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                : "text-zinc-700 hover:bg-zinc-100"
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
              <div className="text-center mt-4 text-sm text-zinc-600 font-geist">
                Page {currentPage} of {totalPages} •{" "}
                {totalCount.toLocaleString()} total projects
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
      <AssignProjectsModal
        isOpen={isAssignProjectsOpen}
        onClose={() => setIsAssignProjectsOpen(false)}
        onProjectsAssigned={handleProjectsAssigned}
      />
      <ManageAssignmentsModal
        isOpen={isManageAssignmentsOpen}
        onClose={() => setIsManageAssignmentsOpen(false)}
        onAssignmentsManaged={handleAssignmentsManaged}
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
