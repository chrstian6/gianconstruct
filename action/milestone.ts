"use server";

import { revalidatePath } from "next/cache";
import Milestone from "@/models/Milestone";
import dbConnect from "@/lib/db";
import { Milestone as MilestoneType } from "@/types/project";

export async function getProjectMilestones(projectId: string): Promise<{
  success: boolean;
  milestones: MilestoneType[];
  error?: string;
}> {
  try {
    await dbConnect();

    const milestones = await Milestone.find({ project_id: projectId })
      .sort({ order: 1, created_at: 1 })
      .lean();

    const transformedMilestones: MilestoneType[] = milestones.map(
      (milestone) => ({
        id: milestone._id?.toString() || "",
        project_id: milestone.project_id,
        title: milestone.title,
        description: milestone.description,
        progress: milestone.progress,
        target_date: milestone.target_date
          ? new Date(milestone.target_date)
          : undefined,
        completed: milestone.completed,
        completed_at: milestone.completed_at
          ? new Date(milestone.completed_at)
          : undefined,
        order: milestone.order,
        created_at: new Date(milestone.created_at),
        updated_at: new Date(milestone.updated_at),
      })
    );

    return {
      success: true,
      milestones: transformedMilestones,
    };
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return {
      success: false,
      error: "Failed to fetch milestones",
      milestones: [],
    };
  }
}

export async function createMilestone(
  projectId: string,
  data: {
    title: string;
    description?: string;
    progress?: number;
    target_date?: Date;
    order?: number;
  }
): Promise<{
  success: boolean;
  milestone?: MilestoneType;
  error?: string;
}> {
  try {
    await dbConnect();

    const milestone = new Milestone({
      project_id: projectId,
      title: data.title,
      description: data.description,
      progress: data.progress || 0,
      target_date: data.target_date,
      order: data.order || 0,
    });

    await milestone.save();

    const createdMilestone: MilestoneType = {
      id: milestone._id.toString(),
      project_id: milestone.project_id,
      title: milestone.title,
      description: milestone.description,
      progress: milestone.progress,
      target_date: milestone.target_date
        ? new Date(milestone.target_date)
        : undefined,
      completed: milestone.completed,
      completed_at: milestone.completed_at
        ? new Date(milestone.completed_at)
        : undefined,
      order: milestone.order,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    };

    revalidatePath(`/admin/projects/${projectId}`);

    return {
      success: true,
      milestone: createdMilestone,
    };
  } catch (error) {
    console.error("Error creating milestone:", error);
    return {
      success: false,
      error: "Failed to create milestone",
    };
  }
}

export async function updateMilestone(
  milestoneId: string,
  updates: {
    title?: string;
    description?: string;
    progress?: number;
    target_date?: Date;
    order?: number;
    completed?: boolean;
  }
): Promise<{
  success: boolean;
  milestone?: MilestoneType;
  error?: string;
}> {
  try {
    await dbConnect();

    // Use findById + save to trigger pre-save middleware
    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
      return {
        success: false,
        error: "Milestone not found",
      };
    }

    // Update the fields
    if (updates.title !== undefined) milestone.title = updates.title;
    if (updates.description !== undefined)
      milestone.description = updates.description;
    if (updates.progress !== undefined) milestone.progress = updates.progress;
    if (updates.target_date !== undefined)
      milestone.target_date = updates.target_date;
    if (updates.order !== undefined) milestone.order = updates.order;

    // Handle completed status
    if (updates.completed !== undefined) {
      milestone.completed = updates.completed;
      if (updates.completed === true) {
        milestone.completed_at = new Date();
      } else {
        milestone.completed_at = undefined;
      }
    }

    // This will trigger the pre-save middleware
    await milestone.save();

    const updatedMilestone: MilestoneType = {
      id: milestone._id.toString(),
      project_id: milestone.project_id,
      title: milestone.title,
      description: milestone.description,
      progress: milestone.progress,
      target_date: milestone.target_date
        ? new Date(milestone.target_date)
        : undefined,
      completed: milestone.completed,
      completed_at: milestone.completed_at
        ? new Date(milestone.completed_at)
        : undefined,
      order: milestone.order,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    };

    revalidatePath(`/admin/projects/${milestone.project_id}`);

    return {
      success: true,
      milestone: updatedMilestone,
    };
  } catch (error) {
    console.error("Error updating milestone:", error);
    return {
      success: false,
      error: "Failed to update milestone",
    };
  }
}

export async function completeMilestone(milestoneId: string): Promise<{
  success: boolean;
  milestone?: MilestoneType;
  error?: string;
}> {
  try {
    await dbConnect();

    // Use findByIdAndUpdate to bypass the pre-save middleware and set both progress and completed
    const milestone = await Milestone.findByIdAndUpdate(
      milestoneId,
      {
        progress: 100, // Set progress to 100%
        completed: true, // Set completed to true
        completed_at: new Date(), // Set completion timestamp
      },
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return {
        success: false,
        error: "Milestone not found",
      };
    }

    const updatedMilestone: MilestoneType = {
      id: milestone._id.toString(),
      project_id: milestone.project_id,
      title: milestone.title,
      description: milestone.description,
      progress: milestone.progress,
      target_date: milestone.target_date
        ? new Date(milestone.target_date)
        : undefined,
      completed: milestone.completed,
      completed_at: milestone.completed_at
        ? new Date(milestone.completed_at)
        : undefined,
      order: milestone.order,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    };

    revalidatePath(`/admin/projects/${milestone.project_id}`);

    return {
      success: true,
      milestone: updatedMilestone,
    };
  } catch (error) {
    console.error("Error completing milestone:", error);
    return {
      success: false,
      error: "Failed to complete milestone",
    };
  }
}

export async function deleteMilestone(milestoneId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await dbConnect();

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
      return {
        success: false,
        error: "Milestone not found",
      };
    }

    const projectId = milestone.project_id;
    await Milestone.findByIdAndDelete(milestoneId);

    revalidatePath(`/admin/projects/${projectId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return {
      success: false,
      error: "Failed to delete milestone",
    };
  }
}

export async function reorderMilestones(
  projectId: string,
  milestoneIds: string[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await dbConnect();

    const updatePromises = milestoneIds.map((milestoneId, index) =>
      Milestone.findByIdAndUpdate(milestoneId, { order: index })
    );

    await Promise.all(updatePromises);

    revalidatePath(`/admin/projects/${projectId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error reordering milestones:", error);
    return {
      success: false,
      error: "Failed to reorder milestones",
    };
  }
}
