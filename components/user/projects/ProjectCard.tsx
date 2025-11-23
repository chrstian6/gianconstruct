// components/user/projects/ProjectCard.tsx
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
} from "lucide-react";
import { Project } from "@/types/project";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectCardProps {
  project: Project;
  onOpenConfirmModal?: (project: Project) => void;
  isConfirming?: boolean;
}

export default function ProjectCard({
  project,
  onOpenConfirmModal,
  isConfirming = false,
}: ProjectCardProps) {
  const calculateProgress = (startDate: Date, endDate: Date | undefined) => {
    if (!endDate) return 0;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    const totalDuration = end - start;
    const elapsed = now - start;

    return Math.min(
      100,
      Math.max(0, Math.round((elapsed / totalDuration) * 100))
    );
  };

  const getDaysRemaining = (endDate: Date | undefined) => {
    if (!endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 0;
    if (diffDays === 0) return 0;

    return diffDays;
  };

  const isProjectOverdue = (endDate: Date | undefined) => {
    if (!endDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    return today > end;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressColorClass = (progress: number, isOverdue: boolean) => {
    if (isOverdue) return "bg-red-500";
    if (progress >= 90) return "bg-amber-500";
    if (progress >= 75) return "bg-blue-500";
    return "bg-green-500";
  };

  // Status configuration with icons and colors
  const statusConfig = {
    pending: {
      label: "Pending",
      icon: Clock,
      color: "bg-amber-100 text-amber-700 border-amber-200",
      action: "confirm",
    },
    active: {
      label: "Active",
      icon: Play,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      action: "view",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle,
      color: "bg-green-100 text-green-700 border-green-200",
      action: "view",
    },
    cancelled: {
      label: "Cancelled",
      icon: Clock,
      color: "bg-red-100 text-red-700 border-red-200",
      action: "view",
    },
  };

  const displayLocation = project.location?.fullAddress || "Construction Site";

  const progress =
    project.status === "completed"
      ? 100
      : calculateProgress(project.startDate, project.endDate);
  const daysRemaining = getDaysRemaining(project.endDate);
  const isOverdue = isProjectOverdue(project.endDate);
  const progressColorClass =
    project.status === "completed"
      ? "bg-green-500"
      : getProgressColorClass(progress, isOverdue);

  const StatusIcon =
    statusConfig[project.status as keyof typeof statusConfig]?.icon || Clock;

  const handleConfirmClick = () => {
    if (onOpenConfirmModal) {
      onOpenConfirmModal(project);
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "w-full transition-all shadow-sm rounded-lg cursor-pointer border border-gray-200 flex flex-col relative hover:shadow-md",
          project.status === "completed" ? "bg-gray-50" : "bg-white"
        )}
      >
        <CardHeader className="pb-2 border-b border-gray-100 px-3 pt-3">
          <div className="flex justify-between items-start gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight flex-1 min-w-0">
                  {project.name}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.name}</p>
              </TooltipContent>
            </Tooltip>
            <Badge
              variant="outline"
              className={cn(
                "flex-shrink-0 text-[0.65rem] px-2 py-0.5",
                statusConfig[project.status as keyof typeof statusConfig]?.color
              )}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[project.status as keyof typeof statusConfig]?.label}
            </Badge>
          </div>
          <div className="flex items-center text-[0.7rem] text-gray-600 mt-1">
            <Hash className="h-3 w-3 mr-1" />
            <span className="font-mono">{project.project_id}</span>
          </div>
        </CardHeader>

        <CardContent className="pb-2 pt-2 flex-1 px-3">
          <div className="space-y-2">
            {/* Location */}
            <div className="flex items-center">
              <MapPin className="h-3 w-3 text-gray-500 mr-2 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[0.7rem] font-medium text-gray-400 mb-0.5">
                  Location
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-gray-900 truncate">
                      {displayLocation}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{displayLocation}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Dates and Cost in compact grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 text-gray-500 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.7rem] font-medium text-gray-400">
                    Start Date
                  </div>
                  <div className="text-xs text-gray-900">
                    {formatDate(project.startDate)}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-3 w-3 text-gray-500 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.7rem] font-medium text-gray-400">
                    {project.status === "completed"
                      ? "Completed"
                      : "Completion"}
                  </div>
                  <div className="text-xs text-gray-900">
                    {project.endDate ? formatDate(project.endDate) : "TBD"}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <HardHat className="h-3 w-3 text-gray-500 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.7rem] font-medium text-gray-400">
                    Total Cost
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    ₱{(project.totalCost ?? 0).toLocaleString("en-PH")}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress section - Only show for active and completed projects */}
            {(project.status === "active" || project.status === "completed") &&
              project.endDate && (
                <div className="pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[0.7rem] font-medium text-gray-700">
                      Progress: {progress}%
                    </span>
                    {project.status === "completed" ? (
                      <span className="text-[0.7rem] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                        Completed
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-[0.7rem] font-medium px-2 py-0.5 rounded",
                          isOverdue
                            ? "text-red-700 bg-red-50"
                            : "text-blue-700 bg-blue-50"
                        )}
                      >
                        {isOverdue
                          ? "Overdue"
                          : daysRemaining === 0
                            ? "Final day"
                            : `${daysRemaining}d left`}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        progressColorClass
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

            {/* Special message for pending projects */}
            {project.status === "pending" && (
              <div
                className={cn(
                  "border rounded p-2 mt-1",
                  "bg-amber-50 border-amber-200"
                )}
              >
                <div className="flex items-center">
                  <Clock
                    className={cn(
                      "h-3 w-3 mr-2 flex-shrink-0",
                      "text-amber-600"
                    )}
                  />
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "text-[0.7rem] font-medium",
                        "text-amber-800"
                      )}
                    >
                      Awaiting Your Confirmation
                    </div>
                    <div className={cn("text-[0.65rem]", "text-amber-700")}>
                      Review project details and confirm to begin construction
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 px-3 pb-3">
          {/* Show confirm button only for pending projects */}
          {project.status === "pending" ? (
            <Button
              variant="default"
              size="sm"
              className="w-full bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium h-8"
              onClick={handleConfirmClick}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <CheckSquare className="ml-1 h-3 w-3 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckSquare className="ml-1 h-3 w-3" />
                  Confirm Project
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium h-8"
              asChild
            >
              <Link
                href={`/user/projects/${encodeURIComponent(project.name.replace(/ /g, "-"))}`}
              >
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
