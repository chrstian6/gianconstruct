"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CheckCircle, Search, Filter, X, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getProjects, deleteProject } from "@/action/project";
import { getUsers } from "@/action/userManagement";
import { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useModalStore } from "@/lib/stores";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface Region {
  region_code: string;
  region_name: string;
  psgc_code: string;
  id: string;
}

interface Province {
  province_code: string;
  province_name: string;
  psgc_code: string;
  region_code: string;
}

interface City {
  city_code: string;
  city_name: string;
  province_code: string;
  region_desc: string;
}

interface Barangay {
  brgy_code: string;
  brgy_name: string;
  province_code: string;
  region_code: string;
}

interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
}

type StatusFilter = "all" | "active" | "completed" | "pending";
type DateFilter = "any" | "today" | "thisWeek" | "thisMonth" | "overdue";

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionList, setRegionList] = useState<Region[]>([]);
  const [provinceList, setProvinceList] = useState<Province[]>([]);
  const [cityList, setCityList] = useState<City[]>([]);
  const [barangayList, setBarangayList] = useState<Barangay[]>([]);
  const [currentActivePage, setCurrentActivePage] = useState<number>(1);
  const [currentCompletedPage, setCurrentCompletedPage] = useState<number>(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>("any");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const cardsPerPage = 12;

  const {
    setIsCreateProjectOpen,
    isCreateProjectOpen,
    isEditProjectOpen,
    setIsEditProjectOpen,
    editingProject,
  } = useModalStore();

  // ✅ useCallback to prevent re-creation
  const fetchProjects = useCallback(async () => {
    try {
      const response = await getProjects();
      if (response.success) {
        setProjects(response.projects || []);
      } else {
        toast.error(response.error || "Failed to fetch projects");
      }
    } catch (error) {
      toast.error("Failed to fetch projects");
      console.error("Error fetching projects:", error);
    }
  }, []);

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

  const fetchRegions = useCallback(async () => {
    try {
      const data = await regions();
      if (Array.isArray(data)) {
        setRegionList(data);
      } else {
        toast.error("Failed to fetch regions: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch regions");
      console.error("Error fetching regions:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchRegions();
  }, [fetchProjects, fetchUsers, fetchRegions]);

  useEffect(() => {
    setCurrentActivePage(1);
    setCurrentCompletedPage(1);
  }, [searchQuery, dateFilter, statusFilter]);

  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find((user) => user.user_id === userId);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    },
    [users]
  );

  const handleProjectSelect = useCallback(
    (project: Project) => {
      router.push(`/admin/admin-project/${project.project_id}`);
    },
    [router]
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
        setProjects((prev) =>
          prev.filter((p) => p.project_id !== projectToDelete.project_id)
        );
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
  }, [projectToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  }, []);

  const handleEditProject = useCallback(
    (project: Project) => {
      setIsEditProjectOpen(true, project);
    },
    [setIsEditProjectOpen]
  );

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.project_id === updatedProject.project_id ? updatedProject : p
      )
    );
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter)
        return false;

      if (
        searchQuery &&
        !project.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      if (dateFilter !== "any") {
        const today = new Date();
        const projectDate = new Date(project.startDate);

        switch (dateFilter) {
          case "today":
            return (
              projectDate.getDate() === today.getDate() &&
              projectDate.getMonth() === today.getMonth() &&
              projectDate.getFullYear() === today.getFullYear()
            );
          case "thisWeek":
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
            endOfWeek.setHours(23, 59, 59, 999);

            return projectDate >= startOfWeek && projectDate <= endOfWeek;
          case "thisMonth":
            return (
              projectDate.getMonth() === today.getMonth() &&
              projectDate.getFullYear() === today.getFullYear()
            );
          case "overdue":
            if (project.endDate) {
              const endDate = new Date(project.endDate);
              return endDate < today && project.status !== "completed";
            }
            return false;
          default:
            return true;
        }
      }
      return true;
    });
  }, [projects, searchQuery, dateFilter, statusFilter]);

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
  }, []);

  const hasActiveFilters = useMemo(
    () => searchQuery || dateFilter !== "any" || statusFilter !== "active",
    [searchQuery, dateFilter, statusFilter]
  );

  const totalPages = Math.ceil(filteredProjects.length / cardsPerPage);
  const currentPage =
    statusFilter === "active" ? currentActivePage : currentCompletedPage;
  const setCurrentPage =
    statusFilter === "active" ? setCurrentActivePage : setCurrentCompletedPage;

  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice(
      (currentPage - 1) * cardsPerPage,
      currentPage * cardsPerPage
    );
  }, [filteredProjects, currentPage, cardsPerPage]);

  return (
    <div className="min-h-screen flex flex-col font-geist">
      {" "}
      {/* Updated for scrolling */}
      {/* Header Section */}
      <div className="flex-shrink-0">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2 tracking-tight">
                Construction Projects
              </h1>
              <p className="text-sm text-gray-600">
                {filteredProjects.length} projects found
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-800" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 rounded-sm border-gray-300 text-gray-800 focus:ring-gray-500 font-geist"
                />
                {searchQuery && (
                  <X
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer"
                    onClick={() => setSearchQuery("")}
                  />
                )}
              </div>

              <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-300 gap-2 font-geist"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
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
                <DropdownMenuContent className="w-56 bg-white font-geist">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className={statusFilter === "all" ? "bg-gray-100" : ""}
                      onClick={() => setStatusFilter("all")}
                    >
                      All Projects
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={statusFilter === "active" ? "bg-gray-100" : ""}
                      onClick={() => setStatusFilter("active")}
                    >
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "completed" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("completed")}
                    >
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        statusFilter === "pending" ? "bg-gray-100" : ""
                      }
                      onClick={() => setStatusFilter("pending")}
                    >
                      Pending
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className={dateFilter === "any" ? "bg-gray-100" : ""}
                      onClick={() => setDateFilter("any")}
                    >
                      Any Date
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={dateFilter === "today" ? "bg-gray-100" : ""}
                      onClick={() => setDateFilter("today")}
                    >
                      Today
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={dateFilter === "thisWeek" ? "bg-gray-100" : ""}
                      onClick={() => setDateFilter("thisWeek")}
                    >
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={
                        dateFilter === "thisMonth" ? "bg-gray-100" : ""
                      }
                      onClick={() => setDateFilter("thisMonth")}
                    >
                      This Month
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={dateFilter === "overdue" ? "bg-gray-100" : ""}
                      onClick={() => setDateFilter("overdue")}
                    >
                      Overdue
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters}>
                        Clear Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="rounded-full text-gray-600 hover:text-gray-900 font-geist"
                >
                  Clear
                  <X className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              onClick={() => setIsCreateProjectOpen(true)}
              className="rounded-sm bg-gray-900 hover:bg-gray-800 text-white whitespace-nowrap font-geist"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>

          {/* Status Dropdown */}
          <div className="mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-sm border-gray-300 gap-2 font-geist text-sm"
                >
                  {statusFilter === "all" && <Eye className="h-4 w-4" />}
                  {statusFilter === "active" && <Clock className="h-4 w-4" />}
                  {statusFilter === "completed" && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {statusFilter === "pending" && <Clock className="h-4 w-4" />}
                  {statusFilter === "all"
                    ? "All Projects"
                    : statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white font-geist">
                <DropdownMenuItem
                  className={statusFilter === "all" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("all")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  All Projects
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={statusFilter === "active" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("active")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={statusFilter === "completed" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("completed")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={statusFilter === "pending" ? "bg-gray-100" : ""}
                  onClick={() => setStatusFilter("pending")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 font-geist">
                No projects found
              </h3>
              <p className="text-gray-600 mt-2 font-geist">
                {hasActiveFilters
                  ? "Try adjusting your filters or search query."
                  : "No projects available. Create a new project to get started."}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  className="mt-4 rounded-full font-geist"
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.project_id}
                    project={project}
                    activeTab={statusFilter}
                    onSelect={handleProjectSelect} // Updated: Navigates to dynamic route
                    onEdit={handleEditProject}
                    onDelete={handleDeleteClick}
                    userName={getUserName(project.userId)}
                  />
                ))}
              </div>

              {/* Pagination - Sticky bottom */}
              {totalPages > 1 && (
                <div className="bg-white sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 z-10">
                  <Pagination>
                    <PaginationContent className="justify-center font-geist">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          className={cn(
                            "rounded-md border border-gray-300 hover:bg-gray-100 font-geist",
                            currentPage === 1 && "opacity-50 cursor-not-allowed"
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
                                  "rounded-md border border-gray-300 font-geist",
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
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          className={cn(
                            "rounded-md border border-gray-300 hover:bg-gray-100 font-geist",
                            currentPage === totalPages &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={fetchProjects}
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
    </div>
  );
}
