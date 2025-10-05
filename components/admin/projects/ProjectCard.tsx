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
  Edit,
  User,
  MapPin,
  MoreVertical,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  HardHat,
  CheckSquare,
} from "lucide-react";
import { Project } from "@/types/project";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  activeTab: string;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  userName?: string;
  location?: string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export default function ProjectCard({
  project,
  activeTab,
  onSelect,
  onEdit,
  onDelete,
  userName,
  location,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
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
    "not-started": {
      label: "Not Started",
      icon: Clock,
      color: "bg-gray-100 text-gray-700 border-gray-200",
    },
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
      icon: XCircle,
      color: "bg-red-100 text-red-700 border-red-200",
    },
  };

  // Use the location from project if available, otherwise fall back to the prop
  const displayLocation =
    project.location?.fullAddress || location || "Construction Site";

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

  const handleCardClick = (e: React.MouseEvent) => {
    // If in select mode, prevent navigation and handle selection
    if (isSelectMode) {
      e.preventDefault();
      onSelect(project);
    } else {
      onSelect(project);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md transition-all shadow-none rounded-sm cursor-pointer border-gray-200 flex flex-col relative",
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
              className={`flex-shrink-0 text-[0.6rem] px-1 py-0.5 ${statusConfig[project.status as keyof typeof statusConfig]?.color}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[project.status as keyof typeof statusConfig]?.label}
            </Badge>

            {/* Dropdown Menu - Only show when not in select mode */}
            {!isSelectMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                    }}
                    className="text-xs cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project);
                    }}
                    className="text-xs cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="flex items-center text-[0.6rem] text-gray-600 mt-1">
          <Hash className="h-3 w-3 mr-1" />
          <span className="font-mono">{project.project_id}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-2 pt-2 flex-1 px-3">
        <div className="space-y-2">
          {/* Top row - Location and Client */}
          <div className="grid grid-cols-2 gap-2">
            {/* Location */}
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

            {/* Client information */}
            {userName && (
              <div className="flex items-start">
                <User className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Client
                  </div>
                  <div className="text-xs text-gray-900 truncate">
                    {userName}
                  </div>
                </div>
              </div>
            )}
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

          {/* Progress section - Only show for active and completed projects */}
          {(project.status === "active" || project.status === "completed") &&
            project.endDate && (
              <div className="pt-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[0.6rem] font-medium text-gray-700">
                    Progress: {progress}%
                  </span>
                  {project.status === "completed" ? (
                    <span className="text-[0.6rem] text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded">
                      Completed
                    </span>
                  ) : (
                    <span
                      className={`text-[0.6rem] font-medium px-1 py-0.5 rounded ${
                        isOverdue
                          ? "text-red-700 bg-red-50"
                          : "text-blue-700 bg-blue-50"
                      }`}
                    >
                      {isOverdue
                        ? "Overdue"
                        : daysRemaining === 0
                          ? "Final day"
                          : `${daysRemaining}d left`}
                    </span>
                  )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${progressColorClass} transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-3 pb-1">
        <Button
          variant="default"
          size="sm"
          className="w-full bg-gray-900 rounded-sm text-white hover:bg-gray-800 text-[0.8rem] font-medium h-7"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(project);
          }}
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
  );
}
