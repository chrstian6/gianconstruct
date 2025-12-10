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
  X,
  ListFilter,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NotFound from "@/components/admin/NotFound";

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
  const [isMobile, setIsMobile] = useState(false);

  const [confirmingProjectId, setConfirmingProjectId] = useState<string | null>(
    null
  );
  const [confirmDrawerOpen, setConfirmDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const cardsPerPage = 12;

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      if (status === "all") return "All";
      return capitalizeFirstLetter(status);
    },
    [capitalizeFirstLetter]
  );

  // Mobile status select handler
  const handleStatusSelect = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  // Custom NotFound content for projects
  const getNotFoundContent = () => {
    if (projects.length === 0) {
      return {
        title: "No projects assigned yet",
        description: "Projects will appear here once they're assigned to you.",
      };
    } else {
      return {
        title: "No projects match your search",
        description:
          "Try adjusting your search or status filter to find what you're looking for.",
      };
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50/30 font-geist">
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
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30 font-geist">
      {/* Sticky Modern Header - Fixed for both desktop and mobile */}
      <div className="w-full border-b border-zinc-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/95">
        <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5 lg:px-8">
          {/* Top Row: Title */}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 font-geist">
              My Projects
            </h1>
            <p className="text-zinc-500 mt-1 text-sm font-medium font-geist">
              Track and manage your construction projects.
            </p>
          </div>

          {/* Middle Row: Search, Filters & Selection Tools */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            {/* Search Bar */}
            <div className="relative w-full group flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              <Input
                placeholder="Search projects..."
                className="pl-10 h-10 bg-zinc-50/50 border-zinc-200 focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-orange-500/10 rounded-lg transition-all font-geist w-full"
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

            {/* Mobile Filter Section */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Mobile Status Select */}
              <Select value={status} onValueChange={handleStatusSelect}>
                <SelectTrigger className="h-10 w-full border-zinc-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center justify-between w-full">
                        <span>{formatStatusDisplay(category)}</span>
                        {projectCounts && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700"
                          >
                            {projectCounts[
                              category as keyof typeof projectCounts
                            ]?.toLocaleString() || 0}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button for mobile */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 border-orange-200 text-orange-700 hover:bg-orange-50"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Desktop Filter Section */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-6 w-px bg-zinc-200 mx-1" />

              <Button
                variant="outline"
                className={cn(
                  "h-10 border-dashed border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-600 font-geist",
                  hasActiveFilters &&
                    "border-orange-300 bg-orange-50 text-orange-700"
                )}
                onClick={clearFilters}
              >
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <span className="hidden lg:inline">Clear Filters</span>
                  <span className="lg:hidden">Clear</span>
                </div>
                {hasActiveFilters && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 rounded-full text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Status Filter Tabs - Desktop only, properly contained */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-0">
              {statusCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setStatus(category);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0 font-geist border",
                    status === category
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm hover:bg-orange-600 hover:border-orange-600"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {category === "all" ? "All" : formatStatusDisplay(category)}
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

          {/* Mobile Active Filter Indicator */}
          {hasActiveFilters && (
            <div className="md:hidden flex items-center gap-2 flex-wrap">
              <div className="text-sm text-zinc-600 font-medium">
                Active filters:
              </div>
              {status !== "all" && (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
                  Status: {formatStatusDisplay(status)}
                </Badge>
              )}
              {searchTerm && (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
                  Search: "{searchTerm}"
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
              {Array.from({ length: Math.min(cardsPerPage, 6) }).map(
                (_, index) => (
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
                )
              )}
            </div>
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
            <NotFound
              title={getNotFoundContent().title}
              description={getNotFoundContent().description}
            />
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-6 font-geist border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 md:p-6 lg:px-10 mt-4 md:mt-6">
            {/* Results Count */}
            <div className="mb-4 md:mb-6 text-sm md:text-base text-zinc-600 font-medium font-geist">
              Showing {paginatedProjects.length} of {filteredProjects.length}{" "}
              projects
              {status !== "all" && ` • Status: ${formatStatusDisplay(status)}`}
            </div>

            {/* Projects Grid - Responsive columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
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
            {totalPages > 1 && (
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-200">
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
