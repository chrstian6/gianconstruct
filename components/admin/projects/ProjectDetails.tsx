"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added for App Router back navigation
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { Project, Task } from "@/types/project";
import { updateProject } from "@/action/project";
import { getTasks, createTask, updateTask, deleteTask } from "@/action/task";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ClientInformation from "./details/ClientInformation";
import ProjectTimeline from "./ProjectTimeline";
import TaskSection from "./tasks/TaskSection";
import Documents from "./details/Documents";
import Gallery from "./details/Gallery";

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
  // Add these new props for tasks
  tasks?: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: (task: Omit<Task, "id">) => void;
  onTaskDelete?: (taskId: string) => void;
  tasksLoading?: boolean;
}

export default function ProjectDetails({
  project,
  user,
  onBack,
  onUpdate,
  isLoading: externalLoading = false,
}: ProjectDetailsProps) {
  const router = useRouter(); // Added for smooth back navigation
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    name: "",
    status: "active" as
      | "active"
      | "completed"
      | "pending"
      | "not-started"
      | "cancelled",
    startDate: "",
    estCompletion: "",
  });
  const [internalLoading, setInternalLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
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

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await updateTask(taskId, updates);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
      console.error("Error updating task:", error);
    }
  };

  const handleTaskCreate = async (newTaskData: Omit<Task, "id">) => {
    if (!project) return;

    try {
      const newTask = await createTask(project.project_id, newTaskData);
      setTasks((prev) => [...prev, newTask]);
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("Failed to create task");
      console.error("Error creating task:", error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
      console.error("Error deleting task:", error);
    }
  };

  // Updated: Handle back navigation with router for smooth SPA feel
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back(); // Falls back to browser history
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        {" "}
        {/* Updated h-screen to min-h-screen */}
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-base text-gray-600 font-geist">
            Loading project details...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if project is null (not found)
  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        {" "}
        {/* Updated h-screen to min-h-screen */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-geist mb-2">
            Project Not Found
          </h2>
          <p className="text-base text-gray-600 font-geist">
            The project you're looking for doesn't exist.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleBack} // Updated to use handleBack
          className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 font-geist"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
      </div>
    );
  }

  // Final safety check - should never reach here if project is undefined
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        {" "}
        {/* Updated h-screen to min-h-screen */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-geist mb-2">
            Unexpected Error
          </h2>
          <p className="text-base text-gray-600 font-geist">
            Failed to load project details.
          </p>
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

  const statusConfig = {
    active: {
      label: "Active",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    completed: {
      label: "Completed",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    overdue: {
      label: "Overdue",
      color: "bg-red-100 text-red-800 border-red-200",
    },
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    "not-started": {
      label: "Not Started",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-200 text-red-900 border-red-300",
    },
  };

  return (
    <div className="min-h-screen flex font-geist max-w-7xl mx-auto">
      {" "}
      {/* Updated h-screen to min-h-screen */}
      {/* Sidebar with Back Button */}
      <div className="w-25 flex-shrink-0 bg-gray-50 flex flex-col items-center py-5 pt-5">
        <Button
          variant="ghost"
          onClick={handleBack} // Updated to use handleBack
          className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-900 font-geist"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Button>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
        {" "}
        {/* Added overflow-y-auto for full scrolling */}
        {/* Project Header */}
        <div className="flex-shrink-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {project.name}
              </h1>
              <div className="flex items-center text-gray-600 mt-2">
                <Hash className="h-5 w-5 mr-2 text-gray-500" />
                <span className="font-mono text-sm">{project.project_id}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                className={`${statusConfig[status].color} border-0 text-sm font-medium`}
              >
                {statusConfig[status].label}
              </Badge>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded-sm font-medium"
                onClick={() => setIsEditDialogOpen(true)}
              >
                Edit Project
              </Button>
            </div>
          </div>
          {/* Project Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-100 border-1 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Start Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(project.startDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Est. Completion
                </p>
                <p className="text-sm font-semibold text-black">
                  {project.endDate ? formatDate(project.endDate) : "TBD"}
                </p>
              </div>
            </div>

            {project.location?.fullAddress && (
              <div className="flex items-center gap-3">
                <MapPin className="h-8s w-8 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Location</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {project.location.fullAddress}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <p className="text-xl text-gray-500">₱</p>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Cost</p>
                <p className="text-xl font-bold text-gray-900">
                  {project.totalCost
                    ? formatCurrency(project.totalCost)
                    : "TBD"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content Area - Scrollable */}
        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
          {" "}
          {/* Added overflow-y-auto for tab content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="justify-start bg-transparent h-auto gap-1 border-b rounded-none">
              <TabsTrigger
                value="overview"
                className="rounded-sm data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-none px-2 py-2 text-sm font-medium cursor-pointer"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="client"
                className="rounded-sm data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-none px-2 py-2 text-sm font-medium cursor-pointer"
              >
                Client
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-sm data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-none px-2 py-2 text-sm font-medium cursor-pointer"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-sm data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-none px-2 py-2 text-sm font-medium cursor-pointer"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="rounded-sm data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-none px-2 py-2 text-sm font-medium cursor-pointer"
              >
                Gallery
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <ProjectTimeline project={project} />
                  </div>
                  <div>
                    <TaskSection
                      tasks={tasks}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskCreate={handleTaskCreate}
                      onTaskDelete={handleTaskDelete}
                      loading={tasksLoading}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Project Summary Card */}
                  <Card className="border border-gray-200 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Project Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Status
                        </p>
                        <Badge
                          className={`${statusConfig[status].color} border-0 mt-1 text-sm font-medium`}
                        >
                          {statusConfig[status].label}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Timeline
                        </p>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {formatDate(project.startDate)} -{" "}
                          {project.endDate
                            ? formatDate(project.endDate)
                            : "Present"}
                        </p>
                      </div>
                      {project.location?.fullAddress && (
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Location
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {project.location.fullAddress}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Total Cost
                        </p>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {project.totalCost
                            ? formatCurrency(project.totalCost)
                            : "TBD"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Recent Activity */}
                  <Card className="border border-gray-200 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-base font-semibold text-gray-900">
                          Project updated
                        </p>
                        <p className="text-sm text-gray-600">
                          Status changed to {statusConfig[status].label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          2 hours ago
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-base font-semibold text-gray-900">
                          New task created
                        </p>
                        <p className="text-sm text-gray-600">
                          "Foundation Work" added
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Client Information Tab */}
            <TabsContent value="client" className="mt-6">
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientInformation user={user} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Project Details Tab */}
            <TabsContent value="details" className="mt-6">
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Project ID
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {project.project_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Status
                          </p>
                          <Badge
                            className={`${statusConfig[status].color} border-0 text-sm font-medium`}
                          >
                            {statusConfig[status].label}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Start Date
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {formatDate(project.startDate)}
                          </p>
                        </div>
                        {project.endDate && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium">
                              Est. Completion
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {formatDate(project.endDate)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600 font-medium">
                            Total Cost
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {project.totalCost
                              ? formatCurrency(project.totalCost)
                              : "TBD"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Location Details
                      </h3>
                      {project.location ? (
                        <div className="space-y-3">
                          {project.location.region && (
                            <div>
                              <p className="text-sm text-gray-600 font-medium">
                                Region
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {project.location.region}
                              </p>
                            </div>
                          )}
                          {project.location.province && (
                            <div>
                              <p className="text-sm text-gray-600 font-medium">
                                Province
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {project.location.province}
                              </p>
                            </div>
                          )}
                          {project.location.municipality && (
                            <div>
                              <p className="text-sm text-gray-600 font-medium">
                                Municipality
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {project.location.municipality}
                              </p>
                            </div>
                          )}
                          {project.location.barangay && (
                            <div>
                              <p className="text-sm text-gray-600 font-medium">
                                Barangay
                              </p>
                              <p className="text-base font-semibold text-gray-900">
                                {project.location.barangay}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-base text-gray-600 font-geist">
                          No location information available
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6">
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Documents projectId={project.project_id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="mt-6">
              <Card className="border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Gallery projectId={project.project_id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Edit Project Dialog - Unchanged */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-300 shadow-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Edit Project
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              Update project details and timeline
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit-name"
                className="text-sm font-medium text-gray-900"
              >
                Project Name
              </Label>
              <Input
                id="edit-name"
                value={editedProject.name}
                onChange={(e) =>
                  setEditedProject({ ...editedProject, name: e.target.value })
                }
                className="border-gray-300 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="edit-status"
                className="text-sm font-medium text-gray-900"
              >
                Status
              </Label>
              <Select
                value={editedProject.status}
                onValueChange={(
                  value:
                    | "active"
                    | "completed"
                    | "pending"
                    | "not-started"
                    | "cancelled"
                ) => setEditedProject({ ...editedProject, status: value })}
              >
                <SelectTrigger
                  id="edit-status"
                  className="border-gray-300 text-base"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-startDate"
                  className="text-sm font-medium text-gray-900"
                >
                  Start Date
                </Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editedProject.startDate}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      startDate: e.target.value,
                    })
                  }
                  className="border-gray-300 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-estCompletion"
                  className="text-sm font-medium text-gray-900"
                >
                  Est. Completion
                </Label>
                <Input
                  id="edit-estCompletion"
                  type="date"
                  value={editedProject.estCompletion}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      estCompletion: e.target.value,
                    })
                  }
                  className="border-gray-300 text-base"
                  min={editedProject.startDate}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-2 flex flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-base font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gray-900 hover:bg-gray-800 text-white text-base font-medium"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
