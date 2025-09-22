// action/task.ts
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import TaskModel from "@/models/Task";
import { Task } from "@/types/project";

export async function getTasks(projectId: string): Promise<Task[]> {
  try {
    await dbConnect();

    console.log("Fetching tasks for project:", projectId);

    const tasks = await TaskModel.find({ project_id: projectId })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Raw tasks from database:", tasks);

    // Transform and validate tasks
    const transformedTasks = tasks.map((task) => {
      // Ensure the task has all required fields with proper defaults
      const transformedTask: Task = {
        id: task._id?.toString() || "",
        title: task.title || "",
        description: task.description || "",
        status: task.status || "not-started",
        priority: task.priority || "medium",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        assignedTo: task.assignedTo || undefined,
        project_id: task.project_id || projectId,
      };
      return transformedTask;
    });

    console.log("Transformed tasks:", transformedTasks);
    return transformedTasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw new Error(
      `Failed to fetch tasks: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function createTask(
  projectId: string,
  taskData: Omit<Task, "id">
) {
  try {
    await dbConnect();

    console.log(
      "Creating task for project:",
      projectId,
      "with data:",
      taskData
    );

    const task = await TaskModel.create({
      ...taskData,
      project_id: projectId,
    });

    console.log("Created task:", task);

    const transformedTask: Task = {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status as Task["status"],
      priority: task.priority as Task["priority"],
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      assignedTo: task.assignedTo || undefined,
      project_id: task.project_id,
    };

    revalidatePath(`/admin/projects/${projectId}`);

    return transformedTask;
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error(
      `Failed to create task: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  try {
    await dbConnect();

    console.log("Updating task:", taskId, "with updates:", updates);

    const task = await TaskModel.findByIdAndUpdate(
      taskId,
      { ...updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      throw new Error("Task not found");
    }

    const transformedTask: Task = {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status as Task["status"],
      priority: task.priority as Task["priority"],
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      assignedTo: task.assignedTo || undefined,
      project_id: task.project_id,
    };

    revalidatePath(`/admin/projects/${task.project_id}`);

    return transformedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error(
      `Failed to update task: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteTask(taskId: string) {
  try {
    await dbConnect();

    console.log("Deleting task:", taskId);

    const task = await TaskModel.findByIdAndDelete(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    revalidatePath(`/admin/projects/${task.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error(
      `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
