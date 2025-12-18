"use client";

import React, { useState, useEffect } from "react";
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
  Play,
  HardHat,
  CheckSquare,
  Target,
  Wallet,
  Loader2,
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
import { getProjectPaymentSummaryAction } from "@/action/project"; // Use the server action

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
  milestonesProgress?: number;
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
  milestonesProgress = 0,
}: ProjectCardProps) {
  const [paymentSummary, setPaymentSummary] = useState<{
    total_cost: number;
    total_paid: number;
    total_pending: number;
    remaining_balance: number;
  } | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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

  const statusConfig = {
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

  const displayLocation =
    project.location?.fullAddress || location || "Construction Site";

  const progressColorClass = getProgressColorClass(milestonesProgress);

  const StatusIcon =
    statusConfig[project.status as keyof typeof statusConfig]?.icon || Clock;

  const handleCardClick = (e: React.MouseEvent) => {
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

  // Fetch payment summary when component mounts
  useEffect(() => {
    const fetchPaymentSummary = async () => {
      // Only fetch for non-pending projects
      if (project.project_id && project.status !== "pending") {
        setIsLoadingBalance(true);
        try {
          const response = await getProjectPaymentSummaryAction(
            project.project_id
          );
          if (response.success && response.data) {
            setPaymentSummary(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch payment summary:", error);
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchPaymentSummary();
  }, [project.project_id, project.status]);

  const getBalanceBadgeClass = (balance: number) => {
    if (balance <= 0) return "bg-green-100 text-green-700 border-green-200";
    if (balance > 0 && balance <= (project.totalCost || 0) * 0.3)
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md transition-all shadow-md rounded-sm cursor-pointer border-none flex flex-col relative",
        project.status === "completed" ? "bg-gray-50" : "bg-white",
        isSelectMode && "border-gray-300",
        isSelected && "border-blue-500 ring-2 ring-blue-200"
      )}
      onClick={handleCardClick}
    >
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
                <DropdownMenuContent align="end" className="w-48">
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
          <div className="grid grid-cols-2 gap-2">
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
                  {formatCurrency(project.totalCost ?? 0)}
                </div>
              </div>
            </div>

            {project.status !== "pending" && (
              <div className="flex items-start">
                <Wallet className="h-3 w-3 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-gray-400 mb-0.5">
                    Balance
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {isLoadingBalance ? (
                      <span className="text-gray-400 flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </span>
                    ) : paymentSummary ? (
                      <Badge
                        variant="outline"
                        className={`text-[0.6rem] px-1 py-0 ${getBalanceBadgeClass(paymentSummary.remaining_balance)}`}
                      >
                        {formatCurrency(paymentSummary.remaining_balance)}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">{formatCurrency(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {project.status !== "pending" && paymentSummary && (
            <div className="mt-1 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-1 text-[0.55rem] text-gray-500">
                <div className="text-center">
                  <div className="font-medium">Paid</div>
                  <div className="text-green-600 font-bold">
                    {formatCurrency(paymentSummary.total_paid)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Pending</div>
                  <div className="text-amber-600 font-bold">
                    {formatCurrency(paymentSummary.total_pending)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Balance</div>
                  <div
                    className={
                      paymentSummary.remaining_balance === 0
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {formatCurrency(paymentSummary.remaining_balance)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {project.status !== "cancelled" && (
            <div className="pt-1">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-gray-600" />
                  <span className="text-[0.6rem] font-medium text-gray-700">
                    Milestones Progress: {milestonesProgress}%
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
          )}

          {project.status === "pending" && (
            <div className="border border-amber-200 rounded p-2 mt-1 bg-amber-50">
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-amber-600 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[0.6rem] font-medium text-amber-800">
                    Awaiting Client Confirmation
                  </div>
                  <div className="text-[0.55rem] text-amber-700">
                    Project is pending client confirmation to begin construction
                  </div>
                </div>
              </div>
            </div>
          )}

          {project.status === "cancelled" && (
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
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-3 pb-3 flex flex-col gap-2">
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
