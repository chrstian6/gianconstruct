"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Project } from "@/types/project";
import {
  Search,
  AlertCircle,
  Loader2,
  Building,
  X,
  Plus,
  CheckSquare,
  Trash2,
  ListFilter,
  ArrowUpDown,
  LayoutGrid,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProjectCard from "./ProjectCard";
import ConfirmProjectDrawer from "./ConfirmProjectDrawer";
import { confirmProjectStart } from "@/action/project";
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
import { Badge } from "@/components/ui/badge";
import { useModalStore } from "@/lib/stores";
import { toast } from "sonner";

interface ProjectsClientProps {
  initialProjects: Project[];
  projectCounts?: {
    all: number;
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  error?: string;
  userId: string;
  initialStatus: string;
  initialSearch: string;
}

export default function ProjectsClient({
  initialProjects,
  projectCounts,
  error,
  userId,
  initialStatus,
  initialSearch,
}: ProjectsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Zustand store for modal management
  const {
    setIsAddTimelineUpdateOpen,
    timelineProject,
    isAddTimelineUpdateOpen,
  } = useModalStore();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [confirmingProjectId, setConfirmingProjectId] = useState<string | null>(
    null
  );
  const [confirmDrawerOpen, setConfirmDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const cardsPerPage = 12;

  // Sync with initialProjects prop
  useEffect(() => {
    setProjects(initialProjects);
    setTotalCount(initialProjects.length);
    setTotalPages(Math.ceil(initialProjects.length / cardsPerPage));
  }, [initialProjects]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (searchTerm) params.set("search", searchTerm);

    const newUrl = `/user/projects${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  }, [status, searchTerm, router]);

  // Handle opening confirmation drawer
  const handleOpenConfirmModal = (project: Project) => {
    setSelectedProject(project);
    setConfirmDrawerOpen(true);
  };

  // Handle closing confirmation drawer
  const handleCloseConfirmDrawer = () => {
    setConfirmDrawerOpen(false);
    setSelectedProject(null);
  };

  // Handle project confirmation with proper error handling and timeline creation
  const handleConfirmProject = async (
    projectId: string,
    downpaymentAmount: number
  ) => {
    setConfirmingProjectId(projectId);
    try {
      console.log(`🔄 Starting confirmation for project: ${projectId}`);
      console.log(`💰 Downpayment amount: ${downpaymentAmount}`);

      const result = await confirmProjectStart(projectId, downpaymentAmount);

      if (result.success && result.project) {
        // Update project status locally
        setProjects((prev) =>
          prev.map((project) =>
            project.project_id === projectId
              ? { ...project, status: "active" as const }
              : project
          )
        );

        // Close the drawer
        handleCloseConfirmDrawer();

        // Show success toast
        toast.success(
          "Project confirmed successfully! Construction will begin shortly."
        );

        console.log(`✅ Project ${projectId} confirmed successfully`);
        console.log(`📝 Timeline entry should be created automatically`);
      } else {
        // Handle error
        console.error(`❌ Confirmation failed: ${result.error}`);
        toast.error(
          result.error || "Failed to confirm project. Please try again."
        );
      }
    } catch (error) {
      console.error("Error confirming project:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setConfirmingProjectId(null);
    }
  };

  // Handle timeline update click using Zustand store
  const handleAddTimelineUpdate = (project: Project) => {
    setIsAddTimelineUpdateOpen(true, project);
  };

  // Filter projects based on status and search term
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // First filter by status
    if (status !== "all") {
      filtered = filtered.filter((project) => project.status === status);
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchLower) ||
          project.project_id.toLowerCase().includes(searchLower) ||
          project.location?.fullAddress?.toLowerCase().includes(searchLower) ||
          project.status.toLowerCase().includes(searchLower)
      );
    }

    // Update pagination data
    const filteredCount = filtered.length;
    setTotalCount(filteredCount);
    setTotalPages(Math.ceil(filteredCount / cardsPerPage));

    // Reset to page 1 if current page exceeds total pages
    if (currentPage > Math.ceil(filteredCount / cardsPerPage)) {
      setCurrentPage(1);
    }

    return filtered;
  }, [projects, status, searchTerm, currentPage]);

  // Get paginated projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Status categories for tags
  const statusCategories = [
    "all",
    "active",
    "pending",
    "completed",
    "cancelled",
  ];

  const hasActiveFilters = useMemo(
    () => searchTerm || status !== "all",
    [searchTerm, status]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatus("all");
    setCurrentPage(1);
  }, []);

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

  const formatStatusDisplay = useCallback(
    (status: string): string => {
      return capitalizeFirstLetter(status);
    },
    [capitalizeFirstLetter]
  );

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50/30 font-geist">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="border-red-200 max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center text-center py-12">
                <div className="space-y-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Error Loading Projects
                  </h2>
                  <p className="text-gray-600">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30 font-geist">
      {/* Sticky Modern Header - Matching ProjectList */}
      <div className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-col gap-4 px-6 py-5 md:px-8">
          {/* Top Row: Title & Primary Action */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              {/* Increased Text Size */}
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 font-geist">
                My Projects
              </h1>
              {/* Replaced dynamic count with static description */}
              <p className="text-zinc-500 mt-1 text-sm font-medium font-geist">
                Track and manage your construction projects.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Optional: Add a primary action button if needed */}
              {/* <Button
                onClick={() => {}}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-all duration-200 font-medium px-5 h-10 rounded-lg w-full md:w-auto font-geist"
              >
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button> */}
            </div>
          </div>

          {/* Middle Row: Search, Filters & Selection Tools */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              <Input
                placeholder="Search projects..."
                className="pl-10 h-10 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-orange-500/10 rounded-lg transition-all font-geist"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-zinc-500" />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-zinc-200 hidden md:block mx-1" />

            {/* Filters Dropdown */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className={cn(
                  "h-10 border-dashed border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 font-geist w-full md:w-auto justify-between md:justify-center",
                  hasActiveFilters &&
                    "border-orange-300 bg-orange-50 text-orange-700"
                )}
                onClick={clearFilters}
              >
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span>Clear Filters</span>
                </div>
                {hasActiveFilters && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 rounded-full text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex-1" />

            {/* Optional: Selection Tools - Commented out as user side might not need multi-select */}
            {/* <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                variant="ghost"
                className="h-10 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-geist"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
            </div> */}
          </div>

          {/* Status Filter Tabs - Orange Theme */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-6 px-6 md:mx-0 md:px-0">
            {statusCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setStatus(category);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap font-geist border",
                  status === category
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm hover:bg-orange-600 hover:border-orange-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                )}
              >
                <span className="flex items-center gap-2">
                  {category === "all"
                    ? "All Projects"
                    : formatStatusDisplay(category)}
                  {projectCounts && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-xs font-medium rounded-full",
                        status === category
                          ? "bg-white/20 text-white/90 hover:bg-white/30"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      )}
                    >
                      {projectCounts[
                        category as keyof typeof projectCounts
                      ]?.toLocaleString() || 0}
                    </Badge>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
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
        ) : paginatedProjects.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
              <Building className="h-8 w-8 text-zinc-300" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-zinc-900">
                {projects.length === 0
                  ? "No Projects Found"
                  : "No Matching Projects"}
              </h3>
              <p className="text-zinc-600 max-w-md mx-auto text-sm">
                {projects.length === 0
                  ? "You don't have any projects assigned yet. Projects will appear here once they're assigned to you."
                  : "No projects match your current filters. Try adjusting your search or status filter."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4 font-geist border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="px-10 overflow-y-auto mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {paginatedProjects.map((project) => (
                <div key={project.project_id} className="min-w-0">
                  <ProjectCard
                    project={project}
                    onOpenConfirmModal={handleOpenConfirmModal}
                    isConfirming={confirmingProjectId === project.project_id}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Section */}
            {totalPages > 0 && (
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
                                  ? "bg-orange-500 text-white hover:bg-orange-600"
                                  : "text-zinc-700 hover:bg-orange-50 hover:text-orange-700"
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
            )}
          </div>
        )}
      </div>

      {/* Confirmation Drawer */}
      <ConfirmProjectDrawer
        isOpen={confirmDrawerOpen}
        onClose={handleCloseConfirmDrawer}
        project={selectedProject}
        onConfirm={handleConfirmProject}
        isConfirming={confirmingProjectId === selectedProject?.project_id}
      />
    </div>
  );
}
