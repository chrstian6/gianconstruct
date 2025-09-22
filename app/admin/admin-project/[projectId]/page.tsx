"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { getProjects } from "@/action/project";
import { getUsers } from "@/action/userManagement";
import { getTasks, createTask, updateTask, deleteTask } from "@/action/task";
import { Button } from "@/components/ui/button";
import ProjectDetails from "@/components/admin/projects/ProjectDetails";
import { Project, Task } from "@/types/project";

interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = params?.projectId as string;

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setError("No project ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch all projects to find the matching one
        const projectResponse = await getProjects();
        if (projectResponse.success && projectResponse.projects) {
          const foundProject = projectResponse.projects.find(
            (p) => p.project_id === projectId
          );

          if (foundProject) {
            setProject(foundProject);

            // Fetch tasks for this project
            await fetchTasks(projectId);

            // Fetch users to find the associated user
            const userResponse = await getUsers();
            if (userResponse.success && userResponse.users) {
              const foundUser = userResponse.users.find(
                (u) => u.user_id === foundProject.userId
              );
              setUser(foundUser || null);
            }
          } else {
            setError("Project not found");
          }
        } else {
          setError(projectResponse.error || "Failed to fetch project");
        }
      } catch (error) {
        setError("An error occurred while fetching project details");
        console.error("Client-side fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const fetchTasks = async (projectId: string) => {
    setTasksLoading(true);
    try {
      const tasksData = await getTasks(projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]); // Set empty array instead of throwing error
      toast.error("Failed to fetch tasks");
    } finally {
      setTasksLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/admin-project");
  };

  const handleUpdate = async (updatedProject: Project) => {
    setProject(updatedProject);
    toast.success("Project updated successfully");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-geist mb-2">
            Error
          </h2>
          <p className="text-base text-gray-600 font-geist">{error}</p>
        </div>
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 font-geist"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-base text-gray-600 font-geist">
            Loading project details...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
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
          onClick={handleBack}
          className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900 font-geist"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <ProjectDetails
      project={project}
      user={user}
      onBack={handleBack}
      onUpdate={handleUpdate}
      isLoading={false}
      // Pass tasks and task handlers as props
      tasks={tasks}
      onTaskUpdate={handleTaskUpdate}
      onTaskCreate={handleTaskCreate}
      onTaskDelete={handleTaskDelete}
      tasksLoading={tasksLoading}
    />
  );
}
