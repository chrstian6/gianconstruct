"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Edit,
  Plus,
  Upload,
  FileText,
  Layout,
  Users,
  Info,
  Images,
  Activity,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Project, Task } from "@/types/project";
import { updateProject } from "@/action/project";
import { getTasks } from "@/action/task";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientInformation from "./details/ClientInformation";
import ProjectTimeline from "./ProjectTimeline";
import ProposedDesignTab from "./design/ProposedDesignTab";
import Documents from "./details/Documents";
import Gallery from "./details/Gallery";
import AddTimelineUpdateModal from "@/components/admin/projects/AddTimelineUpdateModal";
import { useModalStore } from "@/lib/stores";
import NotFound from "@/components/admin/NotFound";
import { getProjectDocuments, uploadDocument } from "@/action/document";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// --- Types ---
interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
}

interface ProjectDetailsProps {
  project: Project | undefined | null;
  user: User | null;
  onBack: () => void;
  onUpdate?: (updatedProject: Project) => void;
  isLoading?: boolean;
  tasks?: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: (task: Omit<Task, "id">) => void;
  onTaskDelete?: (taskId: string) => void;
  tasksLoading?: boolean;
}

interface Document {
  id: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  file_url: string;
}

export default function ProjectDetails({
  project,
  user,
  onBack,
  onUpdate,
  isLoading: externalLoading = false,
}: ProjectDetailsProps) {
  const router = useRouter();

  // Modal States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Edit Form State
  const [editedProject, setEditedProject] = useState({
    name: "",
    status: "pending" as "pending" | "active" | "completed" | "cancelled",
    startDate: "",
    estCompletion: "",
  });

  // Data States
  const [internalLoading, setInternalLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tasks, setTasks] = useState<Task[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tasksLoading, setTasksLoading] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState("timeline");
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  // Document State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Store
  const { setIsAddTimelineUpdateOpen, timelineProject } = useModalStore();

  const isLoading = externalLoading || internalLoading;

  useEffect(() => {
    if (project) {
      setEditedProject({
        name: project.name || "",
        status: project.status,
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "",
        estCompletion: project.endDate
          ? new Date(project.endDate).toISOString().split("T")[0]
          : "",
      });
      setInternalLoading(false);
      fetchTasks();
      fetchDocuments();
    } else if (project === null) {
      setInternalLoading(false);
    }
  }, [project]);

  const fetchTasks = async () => {
    if (!project) return;
    setTasksLoading(true);
    try {
      const tasksData = await getTasks(project.project_id);
      setTasks(tasksData);
    } catch (error) {
      toast.error("Failed to fetch tasks");
      console.error("Error fetching tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!project) return;
    setDocumentsLoading(true);
    try {
      const result = await getProjectDocuments(project.project_id);
      if (result.success && result.documents) {
        const transformedDocs = result.documents.map((doc: any) => ({
          id: doc.doc_id || "",
          name: doc.name,
          original_name: doc.original_name,
          file_type: doc.file_type,
          file_size: doc.file_size,
          uploaded_at: doc.uploaded_at.toString(),
          uploaded_by: doc.uploaded_by_name,
          file_url: doc.file_url,
        }));
        setDocuments(transformedDocs);
      } else {
        toast.error(result.error || "Failed to fetch documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !project) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const result = await uploadDocument(project.project_id, formData);

      if (result.success && result.document) {
        toast.success(`Document "${files[0].name}" uploaded successfully`);
        fetchDocuments();
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const isProjectOverdue = (estCompletion: Date | undefined) => {
    if (!estCompletion) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(estCompletion);
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

  const handleSave = async () => {
    try {
      if (!project) return;
      const formData = new FormData();
      formData.append("name", editedProject.name);
      formData.append("status", editedProject.status);
      formData.append("startDate", editedProject.startDate);
      if (editedProject.estCompletion) {
        formData.append("endDate", editedProject.estCompletion);
      }

      const result = await updateProject(project.project_id, formData);

      if (result.success && result.project) {
        toast.success("Project updated successfully");
        setIsEditDialogOpen(false);
        if (onUpdate) {
          onUpdate(result.project);
        }
      } else {
        toast.error(result.error || "Failed to update project");
      }
    } catch (error) {
      toast.error("An error occurred while updating the project");
      console.error("Update error:", error);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const handleAddUpdateClick = () => {
    if (project) setIsAddTimelineUpdateOpen(true, project);
  };

  const handleUpdateAdded = () => {
    setTimelineRefreshKey((prev) => prev + 1);
  };

  // --- Skeletons ---
  const GenericSkeleton = () => (
    <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto p-6">
      <div className="h-40 bg-zinc-100 rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-zinc-100 rounded-xl" />
        <div className="h-32 bg-zinc-100 rounded-xl" />
        <div className="h-32 bg-zinc-100 rounded-xl" />
      </div>
    </div>
  );

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 gap-4 font-geist">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
            Project Not Found
          </h2>
          <p className="text-zinc-500">
            The project you're looking for doesn't exist or has been deleted.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-2 font-geist"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 font-geist">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

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
    { id: "timeline", label: "Timeline", icon: Activity },
    { id: "proposed-design", label: "Design", icon: Layout },
    { id: "client", label: "Client", icon: Users },
    { id: "details", label: "Details", icon: Info },
    { id: "documents", label: "Docs", icon: FileText },
    { id: "gallery", label: "Gallery", icon: Images },
  ];

  return (
    <div className="flex flex-col min-h-screen font-geist bg-zinc-50">
      {/* Static, Clean Header Section */}
      <div className="w-full bg-white border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto">
          {/* Top Row: Navigation & Actions */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="pl-0 hover:bg-transparent text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>

            <div className="flex items-center gap-3">
              {/* Hidden File Input */}
              <Input
                type="file"
                id="document-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />

              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() =>
                    document.getElementById("document-upload")?.click()
                  }
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>

                <Button
                  size="sm"
                  className="h-9 bg-zinc-900 text-white hover:bg-zinc-800 shadow-none"
                  onClick={handleAddUpdateClick}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Update
                </Button>
              </div>

              {/* Mobile Menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        document.getElementById("document-upload")?.click()
                      }
                    >
                      Upload File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddUpdateClick}>
                      New Update
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
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

            {/* Information Grid - Replaces Cards */}
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
          {isLoading ? (
            <GenericSkeleton />
          ) : (
            <>
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  <ProjectTimeline
                    project={project}
                    key={timelineRefreshKey}
                    onUpdate={onUpdate}
                  />
                </div>
              )}

              {activeTab === "proposed-design" && (
                <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
                  <CardHeader className="border-b border-zinc-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-zinc-900">
                      Proposed Design
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ProposedDesignTab project={project} />
                  </CardContent>
                </Card>
              )}

              {activeTab === "client" && (
                <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
                  <CardHeader className="border-b border-zinc-100 pb-4">
                    <CardTitle className="text-lg font-semibold text-zinc-900">
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {user ? (
                      <ClientInformation user={user} />
                    ) : (
                      <NotFound
                        title="No client assigned"
                        description="Client details haven't been linked to this project yet."
                      />
                    )}
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
                            <span className="text-sm text-zinc-500">
                              Status
                            </span>
                            <span className="text-sm font-medium text-zinc-900 capitalize">
                              {project.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-sm font-medium text-zinc-900 uppercase tracking-wide">
                          Location Info
                        </h3>
                        {project.location ? (
                          <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-zinc-100">
                              <span className="text-sm text-zinc-500">
                                Region
                              </span>
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
                    {documentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mr-2" />
                        <p className="text-zinc-500">Loading documents...</p>
                      </div>
                    ) : (
                      <Documents
                        projectId={project.project_id}
                        documents={documents}
                        onDocumentsUpdate={fetchDocuments}
                      />
                    )}
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
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white font-geist border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Edit Project
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Make changes to the project details here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-zinc-700 font-medium">
                Project Name
              </Label>
              <Input
                id="name"
                value={editedProject.name}
                onChange={(e) =>
                  setEditedProject({ ...editedProject, name: e.target.value })
                }
                className="border-zinc-200 focus:ring-zinc-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-zinc-700 font-medium">
                  Status
                </Label>
                <Select
                  value={editedProject.status}
                  onValueChange={(value: any) =>
                    setEditedProject({ ...editedProject, status: value })
                  }
                >
                  <SelectTrigger className="border-zinc-200 focus:ring-zinc-900">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="startDate"
                  className="text-zinc-700 font-medium"
                >
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={editedProject.startDate}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      startDate: e.target.value,
                    })
                  }
                  className="border-zinc-200 focus:ring-zinc-900"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="estCompletion"
                className="text-zinc-700 font-medium"
              >
                Estimated Completion
              </Label>
              <Input
                id="estCompletion"
                type="date"
                value={editedProject.estCompletion}
                onChange={(e) =>
                  setEditedProject({
                    ...editedProject,
                    estCompletion: e.target.value,
                  })
                }
                className="border-zinc-200 focus:ring-zinc-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Timeline Update Modal */}
      {timelineProject && timelineProject.project_id === project.project_id && (
        <AddTimelineUpdateModal
          isOpen={true}
          setIsOpen={(open) => {
            if (!open) setIsAddTimelineUpdateOpen(false);
          }}
          project={project}
          onUpdateAdded={handleUpdateAdded}
        />
      )}
    </div>
  );
}
