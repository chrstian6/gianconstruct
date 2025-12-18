"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  GripVertical,
  Check,
  Save,
} from "lucide-react";
import { Milestone } from "@/types/project";
import {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
} from "@/action/milestone";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuthStore } from "@/lib/stores"; // Import auth store

interface MilestonesTabProps {
  projectId: string;
}

interface MilestoneFormData {
  title: string;
  description: string;
  progress: number;
  target_date: Date | undefined;
}

export default function MilestonesTab({ projectId }: MilestonesTabProps) {
  const { user } = useAuthStore(); // Get user from auth store
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [progressValues, setProgressValues] = useState<{
    [key: string]: number;
  }>({});

  // Form states
  const [newMilestone, setNewMilestone] = useState<MilestoneFormData>({
    title: "",
    description: "",
    progress: 0,
    target_date: undefined,
  });

  const [editForm, setEditForm] = useState<MilestoneFormData>({
    title: "",
    description: "",
    progress: 0,
    target_date: undefined,
  });

  // Check if user has permission (admin or project_manager)
  const hasPermission =
    user?.role === "admin" || user?.role === "project_manager";

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const result = await getProjectMilestones(projectId);
      if (result.success) {
        setMilestones(result.milestones);
        // Initialize progress values from fetched milestones
        const initialProgressValues: { [key: string]: number } = {};
        result.milestones.forEach((milestone: Milestone) => {
          initialProgressValues[milestone.id] = milestone.progress;
        });
        setProgressValues(initialProgressValues);
      } else {
        toast.error(result.error || "Failed to fetch milestones");
        setMilestones([]);
        setProgressValues({});
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
      toast.error("Failed to fetch milestones");
      setMilestones([]);
      setProgressValues({});
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalProgress = () => {
    if (milestones.length === 0) return 0;
    const total = milestones.reduce(
      (sum, milestone) => sum + milestone.progress,
      0
    );
    return Math.round(total / milestones.length);
  };

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error("Please enter a milestone title");
      return;
    }

    try {
      const result = await createMilestone(projectId, {
        title: newMilestone.title,
        description: newMilestone.description || undefined,
        progress: newMilestone.progress,
        target_date: newMilestone.target_date,
        order: milestones.length,
      });

      if (result.success && result.milestone) {
        toast.success("Milestone created successfully");
        setIsCreateDialogOpen(false);
        setNewMilestone({
          title: "",
          description: "",
          progress: 0,
          target_date: undefined,
        });
        fetchMilestones();
      } else {
        toast.error(result.error || "Failed to create milestone");
      }
    } catch (error) {
      console.error("Error creating milestone:", error);
      toast.error("Failed to create milestone");
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !editForm.title.trim()) {
      toast.error("Please enter a milestone title");
      return;
    }

    try {
      const result = await updateMilestone(editingMilestone.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        progress: editForm.progress,
        target_date: editForm.target_date,
      });

      if (result.success) {
        toast.success("Milestone updated successfully");
        setIsEditDialogOpen(false);
        setEditingMilestone(null);
        fetchMilestones();
      } else {
        toast.error(result.error || "Failed to update milestone");
      }
    } catch (error) {
      console.error("Error updating milestone:", error);
      toast.error("Failed to update milestone");
    }
  };

  const handleUpdateProgress = async (milestoneId: string) => {
    setUpdatingProgress(milestoneId);
    try {
      const result = await updateMilestone(milestoneId, {
        progress: progressValues[milestoneId],
      });

      if (result.success) {
        toast.success("Progress updated successfully");
        fetchMilestones();
      } else {
        toast.error(result.error || "Failed to update progress");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setUpdatingProgress(null);
    }
  };

  const handleProgressChange = (milestoneId: string, value: number) => {
    setProgressValues((prev) => ({
      ...prev,
      [milestoneId]: value,
    }));
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    setIsCompleting(milestoneId);
    try {
      const result = await completeMilestone(milestoneId); // This sets both progress to 100% and completed to true

      if (result.success) {
        toast.success("Milestone marked as completed");
        fetchMilestones();
      } else {
        toast.error(result.error || "Failed to complete milestone");
      }
    } catch (error) {
      console.error("Error completing milestone:", error);
      toast.error("Failed to complete milestone");
    } finally {
      setIsCompleting(null);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteMilestone(milestoneId);
      if (result.success) {
        toast.success("Milestone deleted successfully");
        fetchMilestones();
      } else {
        toast.error(result.error || "Failed to delete milestone");
      }
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast.error("Failed to delete milestone");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditForm({
      title: milestone.title,
      description: milestone.description || "",
      progress: milestone.progress,
      target_date: milestone.target_date
        ? new Date(milestone.target_date)
        : undefined,
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalProgress = calculateTotalProgress();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-zinc-200 rounded w-48 animate-pulse" />
          <div className="h-9 bg-zinc-200 rounded w-32 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 border border-zinc-200 rounded-xl animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-zinc-200 rounded w-48" />
              <div className="h-5 bg-zinc-200 rounded w-20" />
            </div>
            <div className="h-2 bg-zinc-200 rounded mb-2" />
            <div className="h-2 bg-zinc-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">
            Project Milestones
          </h2>
          <p className="text-zinc-600 mt-1">
            Track your project progress through key milestones
          </p>
        </div>
        {hasPermission && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-zinc-900">
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">
                Project Completion
              </span>
              <span className="text-2xl font-bold text-zinc-900">
                {totalProgress}%
              </span>
            </div>
            <Progress value={totalProgress} className="h-3 bg-zinc-100" />
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>{milestones.length} milestones</span>
              <span>
                {milestones.filter((m) => m.completed).length} completed
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.length === 0 ? (
          <Card className="border-zinc-200 shadow-none rounded-xl bg-white">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                No milestones yet
              </h3>
              <p className="text-zinc-600 mb-6 max-w-sm mx-auto">
                Add your first milestone to start tracking your project
                progress.
              </p>
              {hasPermission && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Milestone
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => (
            <Card
              key={milestone.id}
              className="border-zinc-200 shadow-none rounded-xl bg-white hover:shadow-sm transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-zinc-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3
                          className={cn(
                            "text-lg font-semibold",
                            milestone.completed
                              ? "text-emerald-900 line-through"
                              : "text-zinc-900"
                          )}
                        >
                          {milestone.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            milestone.completed
                              ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                              : "bg-zinc-100 text-zinc-700 border-zinc-200"
                          )}
                        >
                          {milestone.completed ? "Completed" : "In Progress"}
                        </Badge>
                      </div>

                      {milestone.description && (
                        <p className="text-zinc-600 mb-4">
                          {milestone.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-500">
                            Progress
                          </span>
                          <span className="text-sm font-medium text-zinc-900">
                            {progressValues[milestone.id] ?? milestone.progress}
                            %
                          </span>
                        </div>
                        <div className="space-y-3">
                          <Slider
                            value={[
                              progressValues[milestone.id] ??
                                milestone.progress,
                            ]}
                            onValueChange={(value) =>
                              handleProgressChange(milestone.id, value[0])
                            }
                            max={100}
                            step={1}
                            disabled={milestone.completed || !hasPermission}
                            className={cn(
                              "w-full",
                              (milestone.completed || !hasPermission) &&
                                "opacity-50 cursor-not-allowed"
                            )}
                          />
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        {!milestone.completed && hasPermission && (
                          <Button
                            onClick={() => handleUpdateProgress(milestone.id)}
                            disabled={updatingProgress === milestone.id}
                            size="sm"
                            className="h-8 bg-zinc-900 text-white hover:bg-zinc-800"
                          >
                            {updatingProgress === milestone.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Update Progress
                          </Button>
                        )}
                      </div>

                      {milestone.target_date && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500">
                          <CalendarIcon className="h-4 w-4" />
                          Target: {formatDate(milestone.target_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasPermission && (
                    <div className="flex items-center gap-2">
                      {!milestone.completed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteMilestone(milestone.id)}
                          disabled={isCompleting === milestone.id}
                          className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          {isCompleting === milestone.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border border-emerald-700 border-t-transparent" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Complete
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(milestone)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            disabled={isDeleting}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Milestone Dialog */}
      {hasPermission && (
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          modal={false}
        >
          <DialogContent className="sm:max-w-[500px] bg-white font-geist border-zinc-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zinc-900">
                Create Milestone
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                Add a new milestone to track your project progress.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-zinc-700 font-medium">
                  Milestone Title *
                </Label>
                <Input
                  id="title"
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                  placeholder="e.g., Design Phase Completion"
                  className="border-zinc-200 focus:ring-zinc-900"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="description"
                  className="text-zinc-700 font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this milestone entails..."
                  rows={3}
                  className="border-zinc-200 focus:ring-zinc-900 resize-none"
                />
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="progress"
                    className="text-zinc-700 font-medium"
                  >
                    Progress: {newMilestone.progress}%
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={[newMilestone.progress]}
                      onValueChange={(value) =>
                        setNewMilestone({ ...newMilestone, progress: value[0] })
                      }
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-700 font-medium">
                    Target Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-zinc-200",
                          !newMilestone.target_date && "text-zinc-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newMilestone.target_date ? (
                          format(newMilestone.target_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newMilestone.target_date}
                        onSelect={(date) => {
                          setNewMilestone({
                            ...newMilestone,
                            target_date: date,
                          });
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMilestone}
                className="bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Create Milestone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Milestone Dialog */}
      {hasPermission && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          modal={false}
        >
          <DialogContent className="sm:max-w-[500px] bg-white font-geist border-zinc-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zinc-900">
                Edit Milestone
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                Update the milestone details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-title"
                  className="text-zinc-700 font-medium"
                >
                  Milestone Title *
                </Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="border-zinc-200 focus:ring-zinc-900"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-description"
                  className="text-zinc-700 font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className="border-zinc-200 focus:ring-zinc-900 resize-none"
                />
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="edit-progress"
                    className="text-zinc-700 font-medium"
                  >
                    Progress: {editForm.progress}%
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={[editForm.progress]}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, progress: value[0] })
                      }
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-zinc-700 font-medium">
                    Target Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-zinc-200",
                          !editForm.target_date && "text-zinc-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editForm.target_date ? (
                          format(editForm.target_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editForm.target_date}
                        onSelect={(date) => {
                          setEditForm({ ...editForm, target_date: date });
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
                onClick={handleUpdateMilestone}
                className="bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
