// components/admin/projects/tasks/TaskSection.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Calendar,
  User,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Task } from "@/types/project";

interface TaskSectionProps {
  tasks?: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: (task: Omit<Task, "id">) => void;
  onTaskDelete?: (taskId: string) => void;
  loading?: boolean;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  tasks = [],
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    description: "",
    status: "not-started",
    priority: "medium",
  });

  // Filter tasks based on search and filters - only include tasks with IDs
  const filteredTasks = tasks.filter((task): task is Task & { id: string } => {
    // Only include tasks that have an ID
    if (!task.id) return false;

    // Search filter
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      onTaskCreate?.(newTask);
      setNewTask({
        title: "",
        description: "",
        status: "not-started",
        priority: "medium",
      });
      setIsCreating(false);
    }
  };

  const getStatusConfig = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "in-progress":
        return {
          label: "In Progress",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
        };
      case "pending":
        return {
          label: "Pending",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
        };
      default:
        return {
          label: "Not Started",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Clock,
        };
    }
  };

  const getPriorityConfig = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return {
          label: "High",
          color: "bg-red-100 text-red-800 border-red-200",
        };
      case "medium":
        return {
          label: "Medium",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      default:
        return {
          label: "Low",
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="border border-gray-200 shadwow-none rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 bg-gray-100">
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
            Project Tasks
          </CardTitle>
          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300"
              disabled={loading}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-gray-300">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-gray-300">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 mr-2" />
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : (
          <>
            {/* Create Task Form */}
            {isCreating && (
              <div className="p-4 bg-gray-50 border border-gray-200 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Create New Task
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="border-gray-300"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="border-gray-300"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={newTask.status}
                      onValueChange={(value: Task["status"]) =>
                        setNewTask({ ...newTask, status: value })
                      }
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={newTask.priority}
                      onValueChange={(value: Task["priority"]) =>
                        setNewTask({ ...newTask, priority: value })
                      }
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateTask}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      Create Task
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No tasks found</p>
                  {tasks.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Create your first task to get started
                    </p>
                  )}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const statusConfig = getStatusConfig(task.status);
                  const priorityConfig = getPriorityConfig(task.priority);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() =>
                              onTaskUpdate?.(task.id, {
                                status:
                                  task.status === "completed"
                                    ? "not-started"
                                    : "completed",
                              })
                            }
                            className={`mt-1 p-1 ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              <Badge className={priorityConfig.color}>
                                {priorityConfig.label}
                              </Badge>
                              {task.dueDate && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Due: {formatDate(task.dueDate)}
                                </div>
                              )}
                              {task.assignedTo && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <User className="h-4 w-4 mr-1" />
                                  {task.assignedTo}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={task.status}
                          onValueChange={(value: Task["status"]) =>
                            onTaskUpdate?.(task.id, { status: value })
                          }
                        >
                          <SelectTrigger className="w-[130px] border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-started">
                              Not Started
                            </SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="relative group">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          <div className="absolute right-0 top-8 hidden group-hover:block bg-white border border-gray-200 shadow-md z-10">
                            <button
                              onClick={() => {
                                // Edit functionality would go here
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => onTaskDelete?.(task.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskSection;
