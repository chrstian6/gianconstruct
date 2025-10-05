"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import {
  Project as ProjectType,
  ProjectZodSchema,
  ProjectPreSaveZodSchema,
  UpdateProjectResponse,
} from "@/types/project";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/redis";
import { sendEmail } from "@/lib/nodemailer";

interface ActionResponse {
  success: boolean;
  project?: ProjectType;
  projects?: ProjectType[];
  error?: string;
}

// Zod schema for project creation with all fields required (except endDate and timeline)
const ProjectCreateZodSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Project name is required").trim(),
  startDate: z.date({ required_error: "Start date is required" }),
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(
    ["not-started", "pending", "active", "completed", "cancelled"],
    {
      required_error: "Status is required",
    }
  ),
  totalCost: z.number().min(0, "Total cost must be a positive number"),
  location: z.object(
    {
      region: z.string().min(1, "Location region is required").trim(),
      province: z.string().min(1, "Location province is required").trim(),
      municipality: z
        .string()
        .min(1, "Location municipality is required")
        .trim(),
      barangay: z.string().min(1, "Location barangay is required").trim(),
      fullAddress: z
        .string()
        .min(1, "Location full address is required")
        .trim(),
    },
    { required_error: "Location is required" }
  ),
  endDate: z.date().optional(),
});

// Format Zod errors into a bullet-pointed list
function formatZodErrors(errors: z.ZodError["errors"]): string {
  const errorMessages = errors.map((err) => {
    const path = err.path.join(".");
    switch (path) {
      case "project_id":
        return "- Check your project ID";
      case "name":
        return "- Ensure project name is provided";
      case "startDate":
        return "- Verify start date";
      case "userId":
        return "- Ensure user ID is provided";
      case "status":
        return "- Ensure status is valid";
      case "totalCost":
        return "- Verify total cost is a positive number";
      case "location":
        return "- Ensure location is provided";
      case "location.region":
        return "- Ensure location region is provided";
      case "location.province":
        return "- Ensure location province is provided";
      case "location.municipality":
        return "- Ensure location municipality is provided";
      case "location.barangay":
        return "- Ensure location barangay is provided";
      case "location.fullAddress":
        return "- Ensure location full address is provided";
      default:
        return `- ${path}: ${err.message}`;
    }
  });

  return `Unable to process your request.\nPlease verify your project information and try again.\n\n${errorMessages.join("\n")}`;
}

// Fetch all projects
export async function getProjects(): Promise<ActionResponse> {
  await dbConnect();
  try {
    const projects = await Project.find().lean();
    const convertedProjects = projects
      .map((project: any) => {
        try {
          return ProjectZodSchema.parse({
            _id: project._id?.toString() || "",
            project_id: project.project_id,
            name: project.name,
            status: project.status,
            startDate: new Date(project.startDate),
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            userId: project.userId || "default-user-id",
            totalCost: project.totalCost || 0,
            location: project.location || undefined,
            timeline: project.timeline?.map((entry: any) => ({
              date: new Date(entry.date),
              photoUrls:
                entry.photoUrls ||
                (entry.photoUrl ? [entry.photoUrl] : undefined),
              caption: entry.caption,
            })),
            __v: project.__v || 0,
            createdAt: project.createdAt?.toISOString() || "",
            updatedAt: project.updatedAt?.toISOString() || "",
          });
        } catch (parseError) {
          console.error(
            `Validation error for project ${project.project_id}:`,
            parseError
          );
          return null;
        }
      })
      .filter((p): p is ProjectType => p !== null);
    console.log("Fetched projects:", convertedProjects);
    return { success: true, projects: convertedProjects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

// Create a new project
export async function createProject(
  formData: FormData
): Promise<ActionResponse> {
  await dbConnect();
  try {
    const name = formData.get("name") as string;
    const project_id = formData.get("project_id") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = formData.get("endDate")
      ? new Date(formData.get("endDate") as string)
      : undefined;
    const userId = formData.get("userId") as string;
    const totalCost = formData.get("totalCost")
      ? parseFloat(formData.get("totalCost") as string)
      : undefined;
    const status = formData.get("status") as
      | "not-started"
      | "pending"
      | "active"
      | "completed"
      | "cancelled";

    // Extract location data (all fields required)
    const locationRegion = formData.get("location[region]") as string;
    const locationProvince = formData.get("location[province]") as string;
    const locationMunicipality = formData.get(
      "location[municipality]"
    ) as string;
    const locationBarangay = formData.get("location[barangay]") as string;
    const locationFullAddress = formData.get("location[fullAddress]") as string;

    const location = {
      region: locationRegion,
      province: locationProvince,
      municipality: locationMunicipality,
      barangay: locationBarangay,
      fullAddress: locationFullAddress,
    };

    const validationData = {
      project_id,
      name,
      startDate,
      endDate,
      userId,
      totalCost,
      status: status || "not-started", // Fallback to default if not provided
      location,
    };

    // Validate data before saving using ProjectCreateZodSchema
    ProjectCreateZodSchema.parse(validationData);
    console.log("Validated data for creation:", validationData);

    const project = await Project.create(validationData);

    const plainProject: ProjectType = ProjectZodSchema.parse({
      _id: project._id.toString(),
      project_id: project.project_id,
      name: project.name,
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      userId: project.userId,
      totalCost: project.totalCost,
      location: project.location,
      timeline: project.timeline?.map((entry: any) => ({
        date: new Date(entry.date),
        photoUrls:
          entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : undefined),
        caption: entry.caption,
      })),
      __v: project.__v,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });

    revalidatePath("/admin/admin-project");
    return { success: true, project: plainProject };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation errors:", error.errors);
      return {
        success: false,
        error: formatZodErrors(error.errors),
      };
    }
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

// Update an existing project
export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<UpdateProjectResponse> {
  await dbConnect();
  try {
    // Extract form data
    const name = formData.get("name") as string;
    const status = formData.get("status") as
      | "not-started"
      | "pending"
      | "active"
      | "completed"
      | "cancelled";
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const totalCost = formData.get("totalCost")
      ? parseFloat(formData.get("totalCost") as string)
      : 0;

    // Extract location data (optional)
    const locationRegion = formData.get("location[region]") as string;
    const locationProvince = formData.get("location[province]") as string;
    const locationMunicipality = formData.get(
      "location[municipality]"
    ) as string;
    const locationBarangay = formData.get("location[barangay]") as string;
    const locationFullAddress = formData.get("location[fullAddress]") as string;

    // Prepare update data
    const updateData: any = {
      name,
      status,
      startDate: new Date(startDate),
      totalCost,
    };

    // Only add endDate if provided and not empty
    if (endDate) {
      updateData.endDate = new Date(endDate);
    } else {
      // If endDate is empty, set it to null/undefined
      updateData.endDate = undefined;
    }

    // Only include location if at least one field is provided
    if (
      locationRegion ||
      locationProvince ||
      locationMunicipality ||
      locationBarangay ||
      locationFullAddress
    ) {
      updateData.location = {
        region: locationRegion || undefined,
        province: locationProvince || undefined,
        municipality: locationMunicipality || undefined,
        barangay: locationBarangay || undefined,
        fullAddress: locationFullAddress || undefined,
      };
    } else {
      // If no location data provided, remove location field
      updateData.location = undefined;
    }

    // Find the existing project to get the original userId
    const existingProject = await Project.findOne({ project_id: projectId });
    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    // Create validation data with the original project_id and userId
    const validationData = {
      project_id: projectId,
      name,
      status,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      userId: existingProject.userId,
      totalCost,
      location: updateData.location,
    };

    // Validate data before updating using ProjectPreSaveZodSchema
    ProjectPreSaveZodSchema.parse(validationData);
    console.log("Validated data for update:", validationData);

    // Update the project
    const updatedProject = await Project.findOneAndUpdate(
      { project_id: projectId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return { success: false, error: "Project not found" };
    }

    const plainProject: ProjectType = ProjectZodSchema.parse({
      _id: updatedProject._id.toString(),
      project_id: updatedProject.project_id,
      name: updatedProject.name,
      status: updatedProject.status,
      startDate: new Date(updatedProject.startDate),
      endDate: updatedProject.endDate
        ? new Date(updatedProject.endDate)
        : undefined,
      userId: updatedProject.userId,
      totalCost: updatedProject.totalCost,
      location: updatedProject.location || undefined,
      timeline: updatedProject.timeline?.map((entry: any) => ({
        date: new Date(entry.date),
        photoUrls:
          entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : undefined),
        caption: entry.caption,
      })),
      __v: updatedProject.__v,
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    });

    revalidatePath("/admin/admin-project");
    return { success: true, project: plainProject };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation errors:", error.errors);
      return {
        success: false,
        error: `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`,
      };
    }
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

// Delete a project (only if completed or past end date)
export async function deleteProject(
  projectId: string
): Promise<ActionResponse> {
  await dbConnect();

  try {
    // Check if user is authenticated and has admin role
    const session = await verifySession();
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Find the project
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const currentDate = new Date();
    const projectEndDate = project.endDate ? new Date(project.endDate) : null;

    // Check if project can be deleted
    if (project.status !== "completed") {
      // If project is not completed, check if end date has passed
      if (!projectEndDate || projectEndDate > currentDate) {
        return {
          success: false,
          error:
            "Cannot delete project: Project is still active and has not reached its completion date",
        };
      }
    }

    // Delete all photos associated with this project from Supabase storage
    if (project.timeline && project.timeline.length > 0) {
      const allPhotoUrls: string[] = [];

      // Collect all photo URLs from timeline entries
      project.timeline.forEach((entry: any) => {
        if (entry.photoUrls && Array.isArray(entry.photoUrls)) {
          allPhotoUrls.push(...entry.photoUrls);
        } else if (entry.photoUrl) {
          allPhotoUrls.push(entry.photoUrl);
        }
      });

      // Extract file paths from URLs
      const filePaths = allPhotoUrls
        .map((url: string) => {
          const match = url.match(/gianprojectimage\/(.*)$/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => !!path);

      // Delete files from Supabase storage
      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("gianprojectimage")
          .remove(filePaths);

        if (deleteError) {
          console.error(
            "Error deleting project photos from storage:",
            deleteError
          );
          // Continue with project deletion even if photo deletion fails
        }
      }
    }

    // Delete the project from database
    const result = await Project.findOneAndDelete({ project_id: projectId });

    if (!result) {
      return { success: false, error: "Failed to delete project" };
    }

    revalidatePath("/admin/admin-project");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      error:
        "Failed to delete project: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Upload multiple photos to a project timeline
export async function uploadProjectPhoto(
  projectId: string,
  formData: FormData
): Promise<UpdateProjectResponse> {
  try {
    await dbConnect();

    // Check if user is authenticated and has admin role
    const session = await verifySession();
    console.log("Redis session check:", { session });
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const photos = formData.getAll("photos") as File[];
    const caption = formData.get("caption")?.toString();
    const dateString = formData.get("date")?.toString(); // Get the date from form data

    if (photos.length === 0 && !caption?.trim()) {
      return {
        success: false,
        error: "At least one photo or caption is required",
      };
    }

    // Use custom date if provided, otherwise use current date
    const entryDate = dateString ? new Date(dateString) : new Date();

    // Fetch project to validate start date
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return { success: false, error: "Project not found" };
    }
    const startDate = new Date(project.startDate);
    if (entryDate < startDate) {
      return {
        success: false,
        error: `Upload date cannot be before the project start date (${startDate.toLocaleDateString()})`,
      };
    }

    let photoUrls: string[] | undefined;
    if (photos.length > 0) {
      photoUrls = [];
      for (const photo of photos) {
        // Upload each photo to Supabase
        const fileName = `${projectId}/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from("gianprojectimage")
          .upload(fileName, photo);

        if (error || !data) {
          console.error("Supabase upload error for photo:", error);
          return {
            success: false,
            error: error?.message || "Failed to upload photo to storage",
          };
        }

        const { data: publicUrlData } = supabase.storage
          .from("gianprojectimage")
          .getPublicUrl(fileName);

        const photoUrl = publicUrlData?.publicUrl;
        if (!photoUrl) {
          return { success: false, error: "Failed to get photo URL" };
        }
        photoUrls.push(photoUrl);
      }
    }

    // Validate timeline entry
    const timelineEntry = {
      date: entryDate,
      photoUrls: photoUrls?.length ? photoUrls : undefined,
      caption: caption?.trim() || undefined,
    };

    try {
      z.object({
        date: z.date(),
        photoUrls: z.array(z.string().url()).optional(),
        caption: z.string().optional(),
      }).parse(timelineEntry);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error(
          "Zod validation errors for timeline entry:",
          validationError.errors
        );
        return {
          success: false,
          error: `Validation failed: ${validationError.errors.map((e) => e.message).join(", ")}`,
        };
      }
      throw validationError;
    }

    // Update project timeline
    const updateTimeline = await Project.findOneAndUpdate(
      { project_id: projectId },
      {
        $push: {
          timeline: {
            $each: [timelineEntry],
            $position: 0, // Insert at the beginning to show latest first
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updateTimeline) {
      console.error("Project not found for project_id:", projectId);
      return { success: false, error: "Project not found" };
    }

    const plainProject: ProjectType = ProjectZodSchema.parse({
      _id: updateTimeline._id.toString(),
      project_id: updateTimeline.project_id,
      name: updateTimeline.name,
      status: updateTimeline.status,
      startDate: new Date(updateTimeline.startDate),
      endDate: updateTimeline.endDate
        ? new Date(updateTimeline.endDate)
        : undefined,
      userId: updateTimeline.userId,
      totalCost: updateTimeline.totalCost,
      location: updateTimeline.location || undefined,
      timeline: updateTimeline.timeline?.map((entry: any) => ({
        date: new Date(entry.date),
        photoUrls:
          entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : undefined),
        caption: entry.caption,
      })),
      __v: updateTimeline.__v,
      createdAt: updateTimeline.createdAt.toISOString(),
      updatedAt: updateTimeline.updatedAt.toISOString(),
    });

    console.log("Updated project timeline:", plainProject.timeline);

    // Send email notification to company/admin
    const companyEmail = process.env.COMPANY_EMAIL || "admin@gianconstruct.com";
    const emailHtml = `
        <p>Hi Team,</p>
        <h2>${updateTimeline.name}</h2>
        <p>A new update is now live for your project as of ${entryDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Please check it out and stay updated!</p>
        <p>Head over to the <a href="http://yourdomain.com/admin/admin-project">admin panel</a> for the latest details.</p>
      `;
    await sendEmail({
      to: companyEmail,
      subject: `New Timeline Update for Project ${projectId}`,
      html: emailHtml,
    });

    revalidatePath("/admin/admin-project");
    return { success: true, project: plainProject };
  } catch (error) {
    console.error("Error uploading photos:", error);
    return {
      success: false,
      error:
        "Failed to upload photos: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Edit a timeline entry
export async function editTimelineEntry(
  projectId: string,
  entryDate: string,
  formData: FormData
): Promise<UpdateProjectResponse> {
  try {
    await dbConnect();

    // Admin auth check
    const session = await verifySession();
    console.log("Redis session check for edit:", { session });
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const date = new Date(entryDate);
    const photos = formData.getAll("photos") as File[];
    const caption = formData.get("caption")?.toString() ?? "";
    const newDateString = formData.get("newDate")?.toString(); // Get the new date from form data

    if (photos.length === 0 && !caption.trim()) {
      return {
        success: false,
        error: "At least one photo or caption is required",
      };
    }

    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const entryIndex = project.timeline.findIndex(
      (e: any) => e.date.getTime() === date.getTime()
    );
    if (entryIndex === -1) {
      return { success: false, error: "Timeline entry not found" };
    }

    let photoUrls =
      project.timeline[entryIndex].photoUrls ||
      (project.timeline[entryIndex].photoUrl
        ? [project.timeline[entryIndex].photoUrl]
        : []);
    if (photos.length > 0) {
      // Delete old photos if they exist
      if (photoUrls.length > 0) {
        const oldPaths = photoUrls
          .map((url: string) => url.split("/gianprojectimage/")[1])
          .filter(Boolean);
        const { error: deleteError } = await supabase.storage
          .from("gianprojectimage")
          .remove(oldPaths);
        if (deleteError) {
          console.error("Supabase delete error:", deleteError);
        }
      }

      // Upload new photos
      photoUrls = [];
      for (const photo of photos) {
        const fileName = `${projectId}/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from("gianprojectimage")
          .upload(fileName, photo, { upsert: true });
        if (error || !data) {
          console.error("Supabase upload error:", error);
          return {
            success: false,
            error: error?.message || "Failed to upload new photo",
          };
        }

        const { data: publicUrlData } = supabase.storage
          .from("gianprojectimage")
          .getPublicUrl(fileName);
        const photoUrl = publicUrlData?.publicUrl;
        if (!photoUrl) {
          return { success: false, error: "Failed to get new photo URL" };
        }
        photoUrls.push(photoUrl);
      }
    }

    // Update entry
    project.timeline[entryIndex].caption = caption;
    project.timeline[entryIndex].photoUrls =
      photoUrls.length > 0 ? photoUrls : undefined;
    if (newDateString) {
      project.timeline[entryIndex].date = new Date(newDateString);
    }
    await project.save();

    const plainProject: ProjectType = ProjectZodSchema.parse({
      _id: project._id.toString(),
      project_id: project.project_id,
      name: project.name,
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      userId: project.userId,
      totalCost: project.totalCost,
      location: project.location || undefined,
      timeline: project.timeline.map((entry: any) => ({
        date: new Date(entry.date),
        photoUrls:
          entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : undefined),
        caption: entry.caption,
      })),
      __v: project.__v,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });

    revalidatePath("/admin/admin-project");
    return { success: true, project: plainProject };
  } catch (error) {
    console.error("Error editing timeline entry:", error);
    return {
      success: false,
      error:
        "Failed to edit timeline entry: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Delete a timeline entry
export async function deleteTimelineEntry(
  projectId: string,
  entryDate: string
): Promise<UpdateProjectResponse> {
  try {
    await dbConnect();

    // Admin auth check
    const session = await verifySession();
    console.log("Redis session check for delete:", { session });
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const date = new Date(entryDate);

    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const entry = project.timeline.find(
      (e: any) => e.date.getTime() === date.getTime()
    );
    if (!entry) {
      return { success: false, error: "Timeline entry not found" };
    }

    // Delete photos if they exist
    const photoUrls =
      entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : []);
    if (photoUrls.length > 0) {
      const paths = photoUrls
        .map((url: string) => url.split("/gianprojectimage/")[1])
        .filter(Boolean);
      const { error: deleteError } = await supabase.storage
        .from("gianprojectimage")
        .remove(paths);
      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return {
          success: false,
          error: deleteError?.message || "Failed to delete photos from storage",
        };
      }
    }

    // Remove entry
    project.timeline = project.timeline.filter(
      (e: any) => e.date.getTime() !== date.getTime()
    );
    await project.save();

    const plainProject: ProjectType = ProjectZodSchema.parse({
      _id: project._id.toString(),
      project_id: project.project_id,
      name: project.name,
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      userId: project.userId,
      totalCost: project.totalCost,
      location: project.location || undefined,
      timeline: project.timeline.map((entry: any) => ({
        date: new Date(entry.date),
        photoUrls:
          entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : undefined),
        caption: entry.caption,
      })),
      __v: project.__v,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });

    revalidatePath("/admin/admin-project");
    return { success: true, project: plainProject };
  } catch (error) {
    console.error("Error deleting timeline entry:", error);
    return {
      success: false,
      error:
        "Failed to delete timeline entry: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

export interface PaginatedProjectsResponse {
  projects: ProjectType[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Fetch projects with pagination and filtering
export async function getProjectsPaginated(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  dateFilter?: string;
}): Promise<{
  success: boolean;
  data?: PaginatedProjectsResponse;
  error?: string;
}> {
  await dbConnect();
  try {
    const { page = 1, limit = 12, status, search, dateFilter } = params;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { "location.fullAddress": { $regex: search, $options: "i" } },
      ];
    }

    // Date filtering logic
    if (dateFilter && dateFilter !== "any") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case "today":
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filter.startDate = { $gte: today, $lt: tomorrow };
          break;
        case "thisWeek":
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
          endOfWeek.setHours(23, 59, 59, 999);
          filter.startDate = { $gte: startOfWeek, $lte: endOfWeek };
          break;
        case "thisMonth":
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
          );
          endOfMonth.setHours(23, 59, 59, 999);
          filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
          break;
        case "overdue":
          filter.$and = [
            { endDate: { $lt: today } },
            { status: { $ne: "completed" } },
          ];
          break;
      }
    }

    // Get total count for pagination
    const totalCount = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated projects
    const projects = await Project.find(filter)
      .sort({ startDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const convertedProjects = projects
      .map((project: any) => {
        try {
          return ProjectZodSchema.parse({
            _id: project._id?.toString() || "",
            project_id: project.project_id,
            name: project.name,
            status: project.status,
            startDate: new Date(project.startDate),
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            userId: project.userId || "default-user-id",
            totalCost: project.totalCost || 0,
            location: project.location || undefined,
            timeline: project.timeline?.map((entry: any) => ({
              date: new Date(entry.date),
              photoUrls:
                entry.photoUrls ||
                (entry.photoUrl ? [entry.photoUrl] : undefined),
              caption: entry.caption,
            })),
            __v: project.__v || 0,
            createdAt: project.createdAt?.toISOString() || "",
            updatedAt: project.updatedAt?.toISOString() || "",
          });
        } catch (parseError) {
          console.error(
            `Validation error for project ${project.project_id}:`,
            parseError
          );
          return null;
        }
      })
      .filter((p): p is ProjectType => p !== null);

    return {
      success: true,
      data: {
        projects: convertedProjects,
        totalCount,
        totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error fetching paginated projects:", error);
    return {
      success: false,
      error: "Failed to fetch projects",
    };
  }
}

export async function getProjectsCount(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  await dbConnect();
  try {
    const count = await Project.countDocuments();
    return { success: true, count };
  } catch (error) {
    console.error("Error counting projects:", error);
    return {
      success: false,
      error: "Failed to count projects",
    };
  }
}

// Delete multiple projects
export async function deleteMultipleProjects(
  projectIds: string[]
): Promise<ActionResponse> {
  await dbConnect();

  try {
    // Check if user is authenticated and has admin role
    const session = await verifySession();
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    if (!projectIds || projectIds.length === 0) {
      return { success: false, error: "No project IDs provided" };
    }

    // Find all projects to be deleted
    const projects = await Project.find({ project_id: { $in: projectIds } });

    if (projects.length === 0) {
      return { success: false, error: "No projects found to delete" };
    }

    const currentDate = new Date();

    // Check if any projects cannot be deleted
    const undeletableProjects = projects.filter((project) => {
      if (project.status === "completed") return false; // Completed projects can be deleted

      const projectEndDate = project.endDate ? new Date(project.endDate) : null;
      // If project is not completed and end date hasn't passed, it cannot be deleted
      return !projectEndDate || projectEndDate > currentDate;
    });

    if (undeletableProjects.length > 0) {
      const undeletableNames = undeletableProjects
        .map((p) => p.name)
        .join(", ");
      return {
        success: false,
        error: `Cannot delete projects that are still active and haven't reached completion date: ${undeletableNames}`,
      };
    }

    // Collect all photo URLs from all projects for deletion
    const allPhotoUrls: string[] = [];

    projects.forEach((project) => {
      if (project.timeline && project.timeline.length > 0) {
        project.timeline.forEach((entry: any) => {
          if (entry.photoUrls && Array.isArray(entry.photoUrls)) {
            allPhotoUrls.push(...entry.photoUrls);
          } else if (entry.photoUrl) {
            allPhotoUrls.push(entry.photoUrl);
          }
        });
      }
    });

    // Delete all photos from Supabase storage
    if (allPhotoUrls.length > 0) {
      const filePaths = allPhotoUrls
        .map((url: string) => {
          const match = url.match(/gianprojectimage\/(.*)$/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => !!path);

      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("gianprojectimage")
          .remove(filePaths);

        if (deleteError) {
          console.error(
            "Error deleting project photos from storage:",
            deleteError
          );
          // Continue with project deletion even if photo deletion fails
        }
      }
    }

    // Delete all projects from database
    const result = await Project.deleteMany({
      project_id: { $in: projectIds },
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Failed to delete projects" };
    }

    revalidatePath("/admin/admin-project");
    return {
      success: true,
      projects: projects.map((project) =>
        ProjectZodSchema.parse({
          _id: project._id.toString(),
          project_id: project.project_id,
          name: project.name,
          status: project.status,
          startDate: new Date(project.startDate),
          endDate: project.endDate ? new Date(project.endDate) : undefined,
          userId: project.userId,
          totalCost: project.totalCost,
          location: project.location || undefined,
          timeline: project.timeline?.map((entry: any) => ({
            date: new Date(entry.date),
            photoUrls:
              entry.photoUrls ||
              (entry.photoUrl ? [entry.photoUrl] : undefined),
            caption: entry.caption,
          })),
          __v: project.__v,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        })
      ),
    };
  } catch (error) {
    console.error("Error deleting multiple projects:", error);
    return {
      success: false,
      error:
        "Failed to delete projects: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
