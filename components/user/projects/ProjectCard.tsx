import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Hash,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle,
  Play,
  HardHat,
  CheckSquare,
  Target,
} from "lucide-react";
import { Project } from "@/types/project";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onOpenConfirmModal: (project: Project) => void;
  isConfirming?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  milestonesProgress?: number; // Add this prop for milestones progress
}

interface StatusConfig {
  [key: string]: {
    label: string;
    icon: LucideIcon;
    color: string;
  };
}

export default function ProjectCard({
  project,
  onOpenConfirmModal,
  isConfirming = false,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  milestonesProgress = 0, // Default to 0 if not provided
}: ProjectCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressColorClass = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-amber-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  // Status configuration with icons and colors
  const statusConfig: StatusConfig = {
    pending: {
      label: "Pending",
      icon: Clock,
      color: "bg-amber-100 text-amber-700 border-amber-200",
    },
    active: {
      label: "Active",
      icon: Play,
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle,
      color: "bg-green-100 text-green-700 border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      icon: Clock,
      color: "bg-red-100 text-red-700 border-red-200",
    },
  };

  // Use the location from project if available
  const displayLocation = project.location?.fullAddress || "Construction Site";

  const progressColorClass = getProgressColorClass(milestonesProgress);

  const StatusIcon = statusConfig[project.status]?.icon || Clock;

  const projectDetailUrl = `/user/projects/${encodeURIComponent(project.name.replace(/ /g, "-"))}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // If in select mode, handle selection
    if (isSelectMode) {
      e.preventDefault();
      onToggleSelect?.();
    }
    // For pending projects, do nothing on card click - only allow confirmation button
    // For other projects, the Link wrapper will handle navigation
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenConfirmModal(project);
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigation is handled by the Link component
  };

  // Early return for pending projects
  if (project.status === "pending") {
    return (
      <Card
        className={cn(
          "w-full max-w-md transition-all shadow-md rounded-sm cursor-default border-none flex flex-col relative",
          "bg-white", // Always use white background for pending projects
          isSelectMode && "border-gray-300",
          isSelected && "border-blue-500 ring-2 ring-blue-200"
        )}
        onClick={handleCardClick}
      >
        {/* Checkbox for multi-select mode */}
        {isSelectMode && (
          <div
            className="absolute top-3 left-3 z-10"
            onClick={handleCheckboxClick}
          >
            <Checkbox
              checked={isSelected}
              className={cn(
                "h-5 w-5 rounded border-2",
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300"
              )}
            />
          </div>
        )}

        <CardHeader className="pb-2 border-b border-gray-100 px-3 pt-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-md font-medium text-gray-900 line-clamp-2 leading-tight flex-1 min-w-0">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={`flex-shrink-0 text-[0.6rem] px-1 py-0.5 ${statusConfig[project.status]?.color}`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[project.status]?.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center text-[0.6rem] text-gray-600 mt-1">
            <Hash className="h-3 w-3 mr-1" />
            <span className="font-mono">{project.project_id}</span>
          </div>
        </CardHeader>

        <CardContent className="pb-2 pt-2 flex-1 px-3">
          <div className="space-y-2">
            {/* Top row - Location */}
            <div className="flex items-start">
              <MapPin className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                  Location
                </div>
                <div className="text-xs text-gray-900 truncate">
                  {displayLocation}
                </div>
              </div>
            </div>

            {/* Middle row - Dates and Total Cost */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start">
                <Calendar className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Start Date
                  </div>
                  <div className="text-xs text-gray-900">
                    {formatDate(project.startDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Est. Completion
                  </div>
                  <div className="text-xs text-gray-900">
                    {project.endDate ? formatDate(project.endDate) : "TBD"}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <HardHat className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Total Cost
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    ₱ {(project.totalCost ?? 0).toLocaleString("en-PH")}
                  </div>
                </div>
              </div>
            </div>

            {/* Special message for pending projects */}
            <div className="border border-amber-200 rounded p-2 mt-1 bg-amber-50">
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-amber-600 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-amber-800">
                    Awaiting Your Confirmation
                  </div>
                  <div className="text-[0.55rem] text-amber-700">
                    Please confirm to begin construction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 px-3 pb-3 flex flex-col gap-2">
          {/* Confirm Project Button */}
          <Button
            variant="default"
            size="sm"
            className={cn(
              "w-full rounded-sm text-white text-[0.8rem] font-medium h-7",
              isConfirming
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-orange-500 hover:bg-orange-600"
            )}
            onClick={handleConfirmClick}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <Clock className="mr-1 h-3 w-3 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Confirm Project
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // For non-pending projects, wrap the entire card in Link
  return (
    <Link href={projectDetailUrl} className="block">
      <Card
        className={cn(
          "w-full max-w-md transition-all shadow-md rounded-sm cursor-pointer border-none flex flex-col relative hover:shadow-lg transition-shadow duration-200",
          project.status === "completed" ? "bg-gray-50" : "bg-white",
          isSelectMode && "border-gray-300",
          isSelected && "border-blue-500 ring-2 ring-blue-200"
        )}
        onClick={handleCardClick}
      >
        {/* Checkbox for multi-select mode */}
        {isSelectMode && (
          <div
            className="absolute top-3 left-3 z-10"
            onClick={handleCheckboxClick}
          >
            <Checkbox
              checked={isSelected}
              className={cn(
                "h-5 w-5 rounded border-2",
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300"
              )}
            />
          </div>
        )}

        <CardHeader className="pb-2 border-b border-gray-100 px-3 pt-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-md font-medium text-gray-900 line-clamp-2 leading-tight flex-1 min-w-0">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={`flex-shrink-0 text-[0.6rem] px-1 py-0.5 ${statusConfig[project.status]?.color}`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[project.status]?.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center text-[0.6rem] text-gray-600 mt-1">
            <Hash className="h-3 w-3 mr-1" />
            <span className="font-mono">{project.project_id}</span>
          </div>
        </CardHeader>

        <CardContent className="pb-2 pt-2 flex-1 px-3">
          <div className="space-y-2">
            {/* Top row - Location */}
            <div className="flex items-start">
              <MapPin className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                  Location
                </div>
                <div className="text-xs text-gray-900 truncate">
                  {displayLocation}
                </div>
              </div>
            </div>

            {/* Middle row - Dates and Total Cost */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start">
                <Calendar className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Start Date
                  </div>
                  <div className="text-xs text-gray-900">
                    {formatDate(project.startDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Est. Completion
                  </div>
                  <div className="text-xs text-gray-900">
                    {project.endDate ? formatDate(project.endDate) : "TBD"}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <HardHat className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Total Cost
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    ₱ {(project.totalCost ?? 0).toLocaleString("en-PH")}
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones Progress section - Show for active and completed projects */}
            {project.status === "active" || project.status === "completed" ? (
              <div className="pt-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-gray-600" />
                    <span className="text-[0.6rem] font-medium text-gray-700">
                      Milestones: {milestonesProgress}%
                    </span>
                  </div>
                  {project.status === "completed" ? (
                    <span className="text-[0.6rem] text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded">
                      Completed
                    </span>
                  ) : (
                    <span
                      className={`text-[0.6rem] font-medium px-1 py-0.5 rounded ${
                        milestonesProgress === 100
                          ? "text-green-700 bg-green-50"
                          : milestonesProgress >= 75
                            ? "text-blue-700 bg-blue-50"
                            : milestonesProgress >= 50
                              ? "text-amber-700 bg-amber-50"
                              : "text-gray-700 bg-gray-50"
                      }`}
                    >
                      {milestonesProgress === 100
                        ? "All Complete"
                        : milestonesProgress >= 75
                          ? "Almost Done"
                          : milestonesProgress >= 50
                            ? "Halfway"
                            : "In Progress"}
                    </span>
                  )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${progressColorClass} transition-all duration-300`}
                    style={{ width: `${milestonesProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Special message for cancelled projects */
              project.status === "cancelled" && (
                <div className="border border-red-200 rounded p-2 mt-1 bg-red-50">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 text-red-600 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[0.6rem] font-medium text-red-800">
                        Project Cancelled
                      </div>
                      <div className="text-[0.55rem] text-red-700">
                        This project has been cancelled
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 px-3 pb-3 flex flex-col gap-2">
          {/* View Details Button */}
          <Button
            variant="default"
            size="sm"
            className="w-full bg-orange-500 rounded-sm text-white hover:bg-orange-600 text-[0.8rem] font-medium h-7"
            onClick={handleViewDetailsClick}
          >
            {isSelectMode ? (
              <>
                <CheckSquare className="mr-1 h-3 w-3" />
                {isSelected ? "Selected" : "Select"}
              </>
            ) : (
              <>
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
