"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Hash,
  Layout,
  Users,
  Info,
  Images,
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotFound from "@/components/admin/NotFound";
import Gallery from "@/components/admin/projects/details/Gallery";
import ProjectTimeline from "@/components/admin/projects/ProjectTimeline";
import ProposedDesignTab from "@/components/admin/projects/design/ProposedDesignTab";

interface UserProjectDetailsProps {
  project: Project;
}

export default function UserProjectDetails({
  project,
}: UserProjectDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("proposed-design");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isProjectOverdue = (estCompletion: Date | undefined) => {
    if (!estCompletion) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(estCompletion);
    end.setHours(0, 0, 0, 0);
    return today > end;
  };

  const isOverdue = isProjectOverdue(project.endDate);
  const status =
    project.status === "completed"
      ? "completed"
      : isOverdue
        ? "overdue"
        : project.status;

  // Modern Monochrome Status Configuration
  const statusConfig = {
    active: {
      label: "Active",
      className: "bg-zinc-900 text-white border-zinc-900",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-900 border-emerald-200",
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-50 text-red-700 border-red-100",
    },
    pending: {
      label: "Pending",
      className: "bg-zinc-100 text-zinc-700 border-zinc-200",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "bg-zinc-50 text-zinc-400 border-zinc-200 decoration-slice line-through",
    },
  };

  const tabs = [
    { id: "proposed-design", label: "Proposed Design", icon: Layout },
    { id: "timeline", label: "Timeline", icon: Activity },
    { id: "details", label: "Details", icon: Info },
    { id: "documents", label: "Docs", icon: FileText },
    { id: "gallery", label: "Gallery", icon: Images },
  ];

  return (
    <div className="flex flex-col min-h-screen font-geist bg-zinc-50">
      {/* Static, Clean Header Section */}
      <div className="w-full bg-white border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto">
          {/* Top Row: Navigation */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/user/projects")}
              className="pl-0 hover:bg-transparent text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>

          {/* Title Row */}
          <div className="px-6 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {project.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors",
                  statusConfig[status].className
                )}
              >
                {statusConfig[status].label}
              </Badge>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-6 mt-8 pt-6 border-t border-zinc-100">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                  Project ID
                </span>
                <div className="flex items-center gap-1.5 font-mono text-sm text-zinc-700">
                  <Hash className="h-3.5 w-3.5 text-zinc-400" />
                  {project.project_id.substring(0, 8)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                  Location
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  <span
                    className="truncate block max-w-[200px]"
                    title={project.location?.fullAddress}
                  >
                    {project.location?.fullAddress || "No address"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                  Start Date
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  {formatDate(project.startDate)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                  Completion (Est.)
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  {project.endDate ? formatDate(project.endDate) : "TBD"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
                  Budget
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                  {project.totalCost
                    ? `₱${project.totalCost.toLocaleString()}`
                    : "TBD"}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-6 flex items-center gap-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 pb-3 text-sm font-medium transition-all relative whitespace-nowrap",
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-zinc-900" : "text-zinc-400"
                    )}
                  />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full p-6 md:p-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "proposed-design" && (
            <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  Proposed Design
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ProposedDesignTab project={project} />

                {/* Special message for pending projects */}
                {project.status === "pending" && (
                  <Card className="border-zinc-200 mt-6 bg-zinc-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-zinc-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-zinc-900 text-lg mb-2">
                            Awaiting Your Confirmation
                          </h4>
                          <p className="text-zinc-700">
                            Please review the proposed design carefully. Once
                            you confirm, the project will move to active status
                            and construction will begin.
                          </p>
                          <div className="mt-4">
                            <Button
                              className="bg-zinc-900 text-white hover:bg-zinc-800"
                              onClick={() => {
                                // This would typically open a confirmation modal
                                alert(
                                  "Confirmation feature will be implemented here"
                                );
                              }}
                            >
                              Confirm Project Start
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "timeline" && (
            <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ProjectTimeline project={project} />
              </CardContent>
            </Card>
          )}

          {activeTab === "details" && (
            <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  Project Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-medium text-zinc-900 uppercase tracking-wide">
                      General Info
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-sm text-zinc-500">
                          Project ID
                        </span>
                        <span className="text-sm font-medium font-mono text-zinc-900">
                          {project.project_id}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-sm text-zinc-500">Status</span>
                        <span className="text-sm font-medium text-zinc-900 capitalize">
                          {project.status}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-100">
                        <span className="text-sm text-zinc-500">
                          Start Date
                        </span>
                        <span className="text-sm font-medium text-zinc-900">
                          {formatDate(project.startDate)}
                        </span>
                      </div>
                      {project.endDate && (
                        <div className="flex justify-between py-2 border-b border-zinc-100">
                          <span className="text-sm text-zinc-500">
                            Estimated Completion
                          </span>
                          <span className="text-sm font-medium text-zinc-900">
                            {formatDate(project.endDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-sm font-medium text-zinc-900 uppercase tracking-wide">
                      Location Info
                    </h3>
                    {project.location ? (
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-zinc-100">
                          <span className="text-sm text-zinc-500">Region</span>
                          <span className="text-sm font-medium text-zinc-900">
                            {project.location.region || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-zinc-100">
                          <span className="text-sm text-zinc-500">
                            Province
                          </span>
                          <span className="text-sm font-medium text-zinc-900">
                            {project.location.province || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-zinc-100">
                          <span className="text-sm text-zinc-500">
                            Municipality
                          </span>
                          <span className="text-sm font-medium text-zinc-900">
                            {project.location.municipality || "N/A"}
                          </span>
                        </div>
                        {project.location.barangay && (
                          <div className="flex justify-between py-2 border-b border-zinc-100">
                            <span className="text-sm text-zinc-500">
                              Barangay
                            </span>
                            <span className="text-sm font-medium text-zinc-900">
                              {project.location.barangay}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 italic">
                        No location data available.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "documents" && (
            <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    No Documents Available
                  </h3>
                  <p className="text-zinc-600 max-w-md mx-auto">
                    Project documents will appear here once they are uploaded by
                    the admin team. This may include contracts, permits, and
                    other important project files.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "gallery" && (
            <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  Project Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Gallery projectId={project.project_id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
