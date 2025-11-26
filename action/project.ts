// actions/projects.ts - COMPLETE OPTIMIZED VERSION WITH NOTIFICATION INTEGRATION
"use server";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Timeline from "@/models/Timeline";
import {
  Project as ProjectType,
  ProjectZodSchema,
  ProjectPreSaveZodSchema,
  UpdateProjectResponse,
  ProjectImage,
  TimelineEntry,
  TimelineResponse,
  GalleryResponse,
} from "@/types/project";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/redis";
import mongoose from "mongoose";
import { notificationService } from "@/lib/notification-services";
import User from "@/models/User";
import Transaction from "@/models/Transactions";
import { getProjectPaymentSummary } from "@/lib/paymentUtils";

interface ActionResponse {
  success: boolean;
  project?: ProjectType;
  projects?: ProjectType[];
  error?: string;
}

// Counter schema for incremental project IDs
interface ICounterDocument {
  _id: string;
  sequence_value: number;
}

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

// Get or create counter model
const getCounterModel = () => {
  if (mongoose.models.Counter) {
    return mongoose.models.Counter;
  }
  return mongoose.model<ICounterDocument>("Counter", counterSchema);
};

// Generate incremental project ID
async function generateProjectId(): Promise<string> {
  await dbConnect();
  const Counter = getCounterModel();

  const sequence = await (Counter as any).findOneAndUpdate(
    { _id: "project_id" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = sequence.sequence_value.toString().padStart(4, "0");
  return `constr-${sequenceNumber}`;
}

// Helper function to get user details with proper error handling
async function getUserDetails(userId: string) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      console.warn(`User not found for userId: ${userId}`);
      return null;
    }

    return {
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Valued Client",
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
}

// Upload image to Supabase
async function uploadImageToSupabase(
  file: File,
  projectId: string,
  fileName: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { data, error } = await supabase.storage
    .from("project-images")
    .upload(`${projectId}/${fileName}`, buffer, {
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("project-images")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

// Zod schema for project creation
const ProjectCreateZodSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Project name is required").trim(),
  startDate: z.date({ required_error: "Start date is required" }),
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["pending", "active", "completed", "cancelled"], {
    required_error: "Status is required",
  }),
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
  projectImages: z
    .array(
      z.object({
        url: z.string().url("Image URL must be valid"),
        title: z.string().min(1, "Image title is required"),
        description: z.string().optional(),
        uploadedAt: z.date(),
      })
    )
    .optional(),
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
      case "projectImages":
        return "- Invalid project images data";
      case "projectImages[].url":
        return "- Invalid image URL in project images";
      case "projectImages[].title":
        return "- Image title is required";
      default:
        return `- ${path}: ${err.message}`;
    }
  });

  return `Unable to process your request.\nPlease verify your project information and try again.\n\n${errorMessages.join("\n")}`;
}

// Create project notification helper
async function createProjectNotification(
  project: any,
  userDetails: any,
  notificationType: string,
  title: string,
  message: string,
  additionalMetadata: any = {}
) {
  try {
    console.log(`📝 Creating ${notificationType} notification...`);

    const baseMetadata = {
      projectId: project.project_id,
      projectName: project.name,
      status: project.status,
      startDate: project.startDate?.toISOString(),
      endDate: project.endDate?.toISOString(),
      totalCost: project.totalCost || 0,
      location: project.location?.fullAddress,
      clientName: userDetails?.fullName,
      clientEmail: userDetails?.email,
    };

    const notificationParams = {
      userId: project.userId,
      userEmail: userDetails?.email,
      targetUserRoles: ["admin"],
      feature: "projects",
      type: notificationType,
      title,
      message,
      channels: ["in_app", "email"],
      projectMetadata: {
        ...baseMetadata,
        ...additionalMetadata,
      },
      relatedId: project.project_id,
      actionUrl: `/admin/admin-project?project=${project.project_id}`,
      actionLabel: "View Project",
      metadata: {
        ...baseMetadata,
        ...additionalMetadata,
      },
    };

    console.log("📧 Notification params:", {
      userEmail: notificationParams.userEmail,
      type: notificationParams.type,
      channels: notificationParams.channels,
    });

    const notificationResult =
      await notificationService.createNotification(notificationParams);

    if (notificationResult && notificationResult._id) {
      console.log(
        `✅ ${notificationType} notification created:`,
        notificationResult._id
      );
      return true;
    } else {
      console.log(
        `❌ ${notificationType} notification failed - no ID returned`
      );
      return false;
    }
  } catch (notificationError) {
    console.error(
      `❌ Error creating ${notificationType} notification:`,
      notificationError
    );
    return false;
  }
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
            projectImages: project.projectImages || [],
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
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = formData.get("endDate")
      ? new Date(formData.get("endDate") as string)
      : undefined;
    const userId = formData.get("userId") as string;
    const totalCost = formData.get("totalCost")
      ? parseFloat(formData.get("totalCost") as string)
      : undefined;
    const status = formData.get("status") as
      | "pending"
      | "active"
      | "completed"
      | "cancelled";

    // Generate incremental project ID
    const project_id = await generateProjectId();

    // Extract location data
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

    // Extract and upload project images
    const projectImages: ProjectImage[] = [];
    const imageFiles: File[] = [];
    const imageTitles: string[] = [];
    const imageDescriptions: string[] = [];

    // Collect all image data from formData
    for (const [key, value] of formData.entries()) {
      if (
        key.startsWith("projectImages[") &&
        key.includes("][file]") &&
        value instanceof File
      ) {
        imageFiles.push(value);
      }
      if (key.startsWith("projectImages[") && key.includes("][title]")) {
        imageTitles.push(value as string);
      }
      if (key.startsWith("projectImages[") && key.includes("][description]")) {
        imageDescriptions.push(value as string);
      }
    }

    // Upload images and create projectImages array
    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const title = imageTitles[i] || `Image ${i + 1}`;
        const description = imageDescriptions[i] || "";

        const fileName = `project-images/${Date.now()}_${file.name}`;
        const imageUrl = await uploadImageToSupabase(
          file,
          project_id,
          fileName
        );

        projectImages.push({
          url: imageUrl,
          title,
          description,
          uploadedAt: new Date(),
        });
      }
    }

    const validationData = {
      project_id,
      name,
      startDate,
      endDate,
      userId,
      totalCost,
      status: status || "pending",
      location,
      projectImages: projectImages.length > 0 ? projectImages : undefined,
    };

    // Validate data before saving
    ProjectCreateZodSchema.parse(validationData);
    console.log("Validated data for creation:", validationData);

    const project = await Project.create(validationData);

    // Get user details for notification
    const userDetails = await getUserDetails(userId);

    // Create project creation notification
    await createProjectNotification(
      project,
      userDetails,
      "project_created",
      "New Project Created",
      `New project "${name}" has been created and is awaiting confirmation`,
      {
        previousStatus: null,
        newStatus: "pending",
      }
    );

    // Create automatic timeline entry for project creation
    await Timeline.create({
      project_id: project_id,
      type: "project_created",
      title: "Project Created",
      description: `Project "${name}" has been created and is awaiting confirmation.`,
      date: new Date(),
    });

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
      projectImages: project.projectImages || [],
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
      | "pending"
      | "active"
      | "completed"
      | "cancelled";
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const totalCost = formData.get("totalCost")
      ? parseFloat(formData.get("totalCost") as string)
      : 0;

    // Extract location data
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
      projectImages: existingProject.projectImages || [],
    };

    // Validate data before updating
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

    // Get user details for notification
    const userDetails = await getUserDetails(existingProject.userId);

    // Create project update notification
    await createProjectNotification(
      updatedProject,
      userDetails,
      "project_updated",
      "Project Updated",
      `Project "${name}" has been updated from ${existingProject.status} to ${status}`,
      {
        previousStatus: existingProject.status,
        newStatus: status,
        updatedFields: Object.keys(updateData),
      }
    );

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
      projectImages: updatedProject.projectImages || [],
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
    const dateString = formData.get("date")?.toString();
    const progress = formData.get("progress")?.toString();

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
            $position: 0,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updateTimeline) {
      console.error("Project not found for project_id:", projectId);
      return { success: false, error: "Project not found" };
    }

    // Get user details for notification
    const userDetails = await getUserDetails(project.userId);

    if (userDetails) {
      // Timeline photo upload notification
      await createProjectNotification(
        project,
        userDetails,
        "timeline_photo_upload",
        "Project Timeline Updated",
        caption || "New photos added to project timeline",
        {
          updateTitle: "Timeline Photo Update",
          updateDescription: caption,
          progress: progress ? parseInt(progress) : undefined,
          photoCount: photos.length,
        }
      );

      // Also create milestone notification if progress is provided
      if (progress) {
        await createProjectNotification(
          project,
          userDetails,
          "milestone_reached",
          "Project Milestone Reached",
          `Project "${project.name}" has reached ${progress}% completion`,
          {
            milestone: caption || "Progress Update",
            progress: parseInt(progress),
            previousProgress: project.progress || 0,
          }
        );
      }
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
      projectImages: updateTimeline.projectImages || [],
      __v: updateTimeline.__v,
      createdAt: updateTimeline.createdAt.toISOString(),
      updatedAt: updateTimeline.updatedAt.toISOString(),
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
    const newDateString = formData.get("newDate")?.toString();

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

    // Get user details for notification
    const userDetails = await getUserDetails(project.userId);

    if (userDetails) {
      await createProjectNotification(
        project,
        userDetails,
        "project_timeline_update",
        "Timeline Entry Updated",
        `Timeline entry has been updated for project "${project.name}"`,
        {
          updateDescription: caption,
          photoCount: photos.length,
        }
      );
    }

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
      projectImages: project.projectImages || [],
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
            projectImages: project.projectImages || [],
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
    await deleteProjectImagesFromSupabase(project);

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
      if (project.status === "completed") return false;

      const projectEndDate = project.endDate ? new Date(project.endDate) : null;
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

    // Delete all photos from Supabase storage for all projects
    for (const project of projects) {
      await deleteProjectImagesFromSupabase(project);
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
          projectImages: project.projectImages || [],
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

// Helper function to delete project images from Supabase
async function deleteProjectImagesFromSupabase(project: any): Promise<void> {
  const allPhotoUrls: string[] = [];

  // Collect photo URLs from timeline entries
  if (project.timeline && project.timeline.length > 0) {
    project.timeline.forEach((entry: any) => {
      if (entry.photoUrls && Array.isArray(entry.photoUrls)) {
        allPhotoUrls.push(...entry.photoUrls);
      } else if (entry.photoUrl) {
        allPhotoUrls.push(entry.photoUrl);
      }
    });
  }

  // Collect photo URLs from project images
  if (project.projectImages && project.projectImages.length > 0) {
    project.projectImages.forEach((image: any) => {
      if (image.url) {
        allPhotoUrls.push(image.url);
      }
    });
  }

  if (allPhotoUrls.length === 0) return;

  // Extract file paths from URLs
  const filePaths = allPhotoUrls
    .map((url: string) => {
      const timelineMatch = url.match(/gianprojectimage\/(.*)$/);
      const projectImageMatch = url.match(/project-images\/(.*)$/);
      return timelineMatch
        ? timelineMatch[1]
        : projectImageMatch
          ? projectImageMatch[1]
          : null;
    })
    .filter((path): path is string => !!path);

  if (filePaths.length === 0) return;

  // Delete from gianprojectimage bucket (timeline photos)
  const timelinePaths = filePaths.filter(
    (path) => !path.includes("project-images")
  );
  if (timelinePaths.length > 0) {
    const { error: timelineDeleteError } = await supabase.storage
      .from("gianprojectimage")
      .remove(timelinePaths);

    if (timelineDeleteError) {
      console.error(
        "Error deleting timeline photos from storage:",
        timelineDeleteError
      );
    } else {
      console.log(
        `Deleted ${timelinePaths.length} timeline photos from Supabase`
      );
    }
  }

  // Delete from project-images bucket (project images)
  const projectImagePaths = filePaths.filter((path) =>
    path.includes("project-images")
  );
  if (projectImagePaths.length > 0) {
    const { error: projectImageDeleteError } = await supabase.storage
      .from("project-images")
      .remove(projectImagePaths);

    if (projectImageDeleteError) {
      console.error(
        "Error deleting project images from storage:",
        projectImageDeleteError
      );
    } else {
      console.log(
        `Deleted ${projectImagePaths.length} project images from Supabase`
      );
    }
  }

  // Also delete the entire project folder from both buckets
  try {
    // Delete project folder from gianprojectimage bucket
    const { data: timelineFolderData, error: timelineFolderError } =
      await supabase.storage.from("gianprojectimage").list(project.project_id);

    if (
      !timelineFolderError &&
      timelineFolderData &&
      timelineFolderData.length > 0
    ) {
      const timelineFolderFiles = timelineFolderData.map(
        (file) => `${project.project_id}/${file.name}`
      );
      await supabase.storage
        .from("gianprojectimage")
        .remove(timelineFolderFiles);
    }

    // Delete project folder from project-images bucket
    const { data: projectImagesFolderData, error: projectImagesFolderError } =
      await supabase.storage.from("project-images").list(project.project_id);

    if (
      !projectImagesFolderError &&
      projectImagesFolderData &&
      projectImagesFolderData.length > 0
    ) {
      const projectImagesFolderFiles = projectImagesFolderData.map(
        (file) => `${project.project_id}/${file.name}`
      );
      await supabase.storage
        .from("project-images")
        .remove(projectImagesFolderFiles);
    }
  } catch (folderError) {
    console.error("Error deleting project folders from Supabase:", folderError);
  }
}

// Delete timeline entry (for project timeline entries)
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
        .map((url: string) => {
          const match = url.match(/gianprojectimage\/(.*)$/);
          return match ? match[1] : null;
        })
        .filter((path: any): path is string => !!path);

      if (paths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("gianprojectimage")
          .remove(paths);

        if (deleteError) {
          console.error("Supabase delete error:", deleteError);
          return {
            success: false,
            error:
              deleteError?.message || "Failed to delete photos from storage",
          };
        } else {
          console.log(`Deleted ${paths.length} photos from timeline entry`);
        }
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
      projectImages: project.projectImages || [],
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

// Fetch projects by user ID with optional status filter
export async function getProjectsByUserId(
  userId: string,
  status?: string
): Promise<ActionResponse> {
  await dbConnect();
  try {
    console.log(
      `🔍 Fetching projects for user: ${userId}, status: ${status || "all"}`
    );

    const filter: any = { userId };

    if (status && status !== "all") {
      filter.status = status;
    }

    console.log(`📋 MongoDB filter:`, JSON.stringify(filter, null, 2));

    const projects = await Project.find(filter)
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    console.log(`📊 Raw MongoDB results count:`, projects.length);

    if (projects.length > 0) {
      console.log(
        `👥 User IDs in found projects:`,
        projects.map((p) => p.userId)
      );
      console.log(
        `🔍 Comparing session userId (${userId}) with project userIds`
      );
    } else {
      console.log(`❌ No projects found for user: ${userId}`);
    }

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
            userId: project.userId,
            totalCost: project.totalCost || 0,
            location: project.location || undefined,
            timeline: project.timeline?.map((entry: any) => ({
              date: new Date(entry.date),
              photoUrls:
                entry.photoUrls ||
                (entry.photoUrl ? [entry.photoUrl] : undefined),
              caption: entry.caption,
            })),
            projectImages: project.projectImages || [],
            __v: project.__v || 0,
            createdAt: project.createdAt?.toISOString() || "",
            updatedAt: project.updatedAt?.toISOString() || "",
          });
        } catch (parseError) {
          console.error(
            `❌ Validation error for project ${project.project_id}:`,
            parseError
          );
          return null;
        }
      })
      .filter((p): p is ProjectType => p !== null);

    console.log(
      `🎯 Successfully converted ${convertedProjects.length} projects`
    );
    return { success: true, projects: convertedProjects };
  } catch (error) {
    console.error("❌ Error fetching user projects:", error);
    return { success: false, error: "Failed to fetch user projects" };
  }
}

// Get project counts by status for a user
export async function getUserProjectCounts(userId: string): Promise<{
  success: boolean;
  counts?: {
    all: number;
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  error?: string;
}> {
  await dbConnect();
  try {
    console.log(`🔢 Counting projects for user: ${userId}`);

    const counts = await Project.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log(`📊 Raw counts from aggregation:`, counts);

    const countMap = {
      all: 0,
      active: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
    };

    counts.forEach((item: any) => {
      countMap[item._id as keyof typeof countMap] = item.count;
      countMap.all += item.count;
    });

    console.log(`✅ Final counts for user ${userId}:`, countMap);
    return { success: true, counts: countMap };
  } catch (error) {
    console.error("❌ Error fetching project counts:", error);
    return { success: false, error: "Failed to fetch project counts" };
  }
}
export async function confirmProjectStart(
  projectId: string,
  downpaymentAmount: number
): Promise<{
  success: boolean;
  project?: ProjectType;
  transaction?: {
    transaction_id: string;
    amount: number;
    total_amount: number;
    type: string;
    payment_deadline: Date;
    remaining_balance: number;
  };
  error?: string;
}> {
  await dbConnect();
  try {
    console.log("🔍 Starting project confirmation for:", projectId);
    console.log("💰 Downpayment amount:", downpaymentAmount);

    // Find the project
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      console.log("❌ Project not found:", projectId);
      return { success: false, error: "Project not found" };
    }

    console.log("📋 Project found:", {
      name: project.name,
      status: project.status,
      userId: project.userId,
      totalCost: project.totalCost,
    });

    // Validate downpayment amount - more strict validation
    if (
      !downpaymentAmount ||
      downpaymentAmount <= 0 ||
      downpaymentAmount > project.totalCost
    ) {
      console.log("❌ Invalid downpayment amount:", downpaymentAmount);
      return {
        success: false,
        error:
          "Invalid downpayment amount. Must be greater than 0 and less than or equal to total project cost.",
      };
    }

    // Check if project is in "pending" status
    if (project.status !== "pending") {
      console.log(
        "❌ Project cannot be confirmed - wrong status:",
        project.status
      );
      return {
        success: false,
        error:
          "Project cannot be confirmed. It is already in progress or completed.",
      };
    }

    // Update project status to "active" and set start date to current date
    const currentDate = new Date();
    const updatedProject = await Project.findOneAndUpdate(
      { project_id: projectId },
      {
        status: "active",
        startDate: currentDate,
        confirmedAt: currentDate,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      console.log("❌ Failed to update project");
      return { success: false, error: "Failed to confirm project" };
    }

    console.log("✅ Project updated successfully:", updatedProject.status);

    // ✅ CREATE DOWNPAYMENT TRANSACTION ONLY
    console.log("💰 Creating downpayment transaction...");

    const paymentDeadline = new Date(currentDate);
    paymentDeadline.setHours(paymentDeadline.getHours() + 48); // 48 hours from now

    // Use the Transaction model with proper typing for static method
    const TransactionModel = Transaction as any;

    // Generate transaction ID first to ensure it works
    let transactionId;
    try {
      transactionId = await TransactionModel.generateTransactionId();
      console.log("✅ Generated transaction ID:", transactionId);
    } catch (error) {
      console.error("❌ Failed to generate transaction ID:", error);
      return { success: false, error: "Failed to generate transaction ID" };
    }

    // Create transaction data with proper validation
    const transactionData = {
      transaction_id: transactionId,
      project_id: projectId,
      user_id: project.userId,
      amount: Number(downpaymentAmount), // Ensure it's a number
      total_amount: Number(project.totalCost), // Ensure it's a number
      type: "downpayment",
      status: "pending",
      due_date: currentDate,
      payment_deadline: paymentDeadline,
      notes: `Initial downpayment for project ${project.name}. Total project cost: ₱${project.totalCost.toLocaleString("en-PH")}`,
    };

    console.log("📋 Transaction data to create:", transactionData);

    // Validate transaction data before creating
    if (!transactionData.amount || transactionData.amount <= 0) {
      console.log("❌ Invalid transaction amount:", transactionData.amount);
      return { success: false, error: "Invalid transaction amount" };
    }

    let downpaymentTransaction;
    try {
      downpaymentTransaction = await TransactionModel.create(transactionData);
      console.log(
        "✅ Transaction created successfully:",
        downpaymentTransaction
      );
    } catch (transactionError) {
      console.error("❌ Failed to create transaction:", transactionError);
      return {
        success: false,
        error:
          "Failed to create transaction: " +
          (transactionError as Error).message,
      };
    }

    const remainingBalance = project.totalCost - downpaymentAmount;

    console.log("✅ Downpayment transaction created:", {
      transaction_id: downpaymentTransaction.transaction_id,
      amount: downpaymentTransaction.amount,
      remaining_balance: remainingBalance,
      deadline: downpaymentTransaction.payment_deadline,
    });

    // Get user details for client notification
    const userDetails = await getUserDetails(project.userId);
    console.log("👤 User lookup:", {
      userId: project.userId,
      userFound: !!userDetails,
      email: userDetails?.email,
      name: userDetails?.fullName,
    });

    // ✅ CREATE NOTIFICATION FOR ADMIN
    console.log("📢 Creating admin notification for project confirmation...");

    try {
      const adminNotificationResult =
        await notificationService.createNotification({
          targetUserRoles: ["admin"],
          feature: "projects",
          type: "project_confirmed",
          title: "Project Confirmed by Client",
          message: `Project "${project.name}" has been confirmed by ${userDetails?.fullName || "the client"} and is now active. Downpayment: ₱${downpaymentAmount.toLocaleString("en-PH")} (Remaining: ₱${remainingBalance.toLocaleString("en-PH")})`,
          channels: ["in_app", "email"],
          projectMetadata: {
            projectId: project.project_id,
            projectName: project.name,
            status: "active",
            previousStatus: "pending",
            startDate: currentDate.toISOString(),
            confirmedAt: currentDate.toISOString(),
            location: project.location?.fullAddress,
            totalCost: project.totalCost,
            downpaymentAmount: downpaymentAmount,
            remainingBalance: remainingBalance,
            clientName: userDetails?.fullName,
            clientEmail: userDetails?.email,
            clientId: project.userId,
            transactionId: downpaymentTransaction.transaction_id,
            paymentDeadline: paymentDeadline.toISOString(),
          },
          actionUrl: `/admin/admin-project?project=${project.project_id}`,
          actionLabel: "View Project",
        });

      if (adminNotificationResult) {
        console.log(
          "✅ Admin notification created successfully:",
          adminNotificationResult._id
        );
      } else {
        console.error("❌ Failed to create admin notification");
      }
    } catch (notificationError) {
      console.error("❌ Error creating admin notification:", notificationError);
      // Don't fail the whole process if notification fails
    }

    // ✅ CREATE NOTIFICATION FOR CLIENT
    if (userDetails) {
      console.log(
        "📢 Creating client notification for project confirmation..."
      );

      try {
        await createProjectNotification(
          updatedProject.toObject(), // Convert to plain object
          userDetails,
          "project_confirmed",
          "Project Confirmed Successfully",
          `Your project "${project.name}" has been confirmed and is now active. Please pay the downpayment of ₱${downpaymentAmount.toLocaleString("en-PH")} within 48 hours (by ${paymentDeadline.toLocaleString()}). Remaining balance: ₱${remainingBalance.toLocaleString("en-PH")}`,
          {
            previousStatus: "pending",
            newStatus: "active",
            confirmedAt: currentDate.toISOString(),
            downpaymentAmount: downpaymentAmount,
            remainingBalance: remainingBalance,
            transactionId: downpaymentTransaction.transaction_id,
            paymentDeadline: paymentDeadline.toLocaleString(),
          }
        );
      } catch (clientNotificationError) {
        console.error(
          "❌ Error creating client notification:",
          clientNotificationError
        );
        // Don't fail the whole process if notification fails
      }
    } else {
      console.log("❌ User not found for client notification");
    }

    // Create project confirmed timeline entry
    try {
      await Timeline.create({
        project_id: projectId,
        type: "project_confirmed",
        title: "Project Confirmed by Client",
        description: `Project "${project.name}" has been confirmed by the client and is now active. Downpayment of ₱${downpaymentAmount.toLocaleString("en-PH")} due within 48 hours. Remaining balance: ₱${remainingBalance.toLocaleString("en-PH")}`,
        date: currentDate,
        metadata: {
          downpaymentAmount: downpaymentAmount,
          remainingBalance: remainingBalance,
          transactionId: downpaymentTransaction.transaction_id,
          paymentDeadline: paymentDeadline.toISOString(),
        },
      });
      console.log("✅ Timeline entry created");
    } catch (timelineError) {
      console.error("❌ Error creating timeline entry:", timelineError);
      // Don't fail the whole process if timeline creation fails
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
      projectImages: updatedProject.projectImages || [],
      __v: updatedProject.__v,
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    });

    revalidatePath("/user/projects");
    revalidatePath("/admin/admin-project");
    revalidatePath("/admin/notifications");
    revalidatePath("/admin/transactions");

    console.log("✅ Project confirmation completed successfully");

    // ✅ RETURN BOTH PROJECT AND TRANSACTION DATA
    return {
      success: true,
      project: plainProject,
      transaction: {
        transaction_id: downpaymentTransaction.transaction_id,
        amount: downpaymentTransaction.amount,
        total_amount: downpaymentTransaction.total_amount,
        type: downpaymentTransaction.type,
        payment_deadline: downpaymentTransaction.payment_deadline,
        remaining_balance: remainingBalance,
      },
    };
  } catch (error) {
    console.error("❌ Error confirming project start:", error);
    return {
      success: false,
      error: "Failed to confirm project: " + (error as Error).message,
    };
  }
}

// Cancel a project
export async function cancelProject(
  projectId: string
): Promise<UpdateProjectResponse> {
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

    // Check if project can be cancelled (only pending or active projects can be cancelled)
    if (project.status !== "pending" && project.status !== "active") {
      return {
        success: false,
        error: `Cannot cancel project: Project is already ${project.status}. Only pending or active projects can be cancelled.`,
      };
    }

    // Update project status to "cancelled"
    const updatedProject = await Project.findOneAndUpdate(
      { project_id: projectId },
      {
        status: "cancelled",
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return { success: false, error: "Failed to cancel project" };
    }

    // Get user details for notification
    const userDetails = await getUserDetails(project.userId);

    // Create project cancellation notification
    if (userDetails) {
      await createProjectNotification(
        updatedProject,
        userDetails,
        "project_cancelled",
        "Project Cancelled",
        `Project "${project.name}" has been cancelled`,
        {
          previousStatus: project.status,
          newStatus: "cancelled",
          cancelledAt: new Date().toISOString(),
        }
      );
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
      projectImages: updatedProject.projectImages || [],
      __v: updatedProject.__v,
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    });

    revalidatePath("/admin/admin-project");
    return { success: true, project: plainProject };
  } catch (error) {
    console.error("Error cancelling project:", error);
    return {
      success: false,
      error:
        "Failed to cancel project: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Complete a project
export async function completeProject(
  projectId: string
): Promise<UpdateProjectResponse> {
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

    // Update project status to "completed"
    const updatedProject = await Project.findOneAndUpdate(
      { project_id: projectId },
      {
        status: "completed",
        endDate: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return { success: false, error: "Failed to complete project" };
    }

    // Get user details for notification
    const userDetails = await getUserDetails(project.userId);

    // Create project completion notification
    if (userDetails) {
      await createProjectNotification(
        updatedProject,
        userDetails,
        "project_completed",
        "Project Completed",
        `Project "${project.name}" has been completed successfully`,
        {
          previousStatus: project.status,
          newStatus: "completed",
          completedAt: new Date().toISOString(),
        }
      );
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
      projectImages: updatedProject.projectImages || [],
      __v: updatedProject.__v,
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    });

    revalidatePath("/admin/admin-project");
    revalidatePath("/user/projects");
    return { success: true, project: plainProject };
  } catch (error) {
    console.error("Error completing project:", error);
    return {
      success: false,
      error:
        "Failed to complete project: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// ========== TIMELINE FUNCTIONS ==========

// Upload image to Supabase for timeline
async function uploadTimelineImageToSupabase(
  file: File,
  projectId: string,
  fileName: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { data, error } = await supabase.storage
    .from("timeline-images")
    .upload(`${projectId}/${fileName}`, buffer, {
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("timeline-images")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

// Create automatic timeline entry when project is created
export async function createProjectTimelineEntry(
  projectId: string,
  type: TimelineEntry["type"],
  title: string,
  description?: string
): Promise<TimelineResponse> {
  await dbConnect();
  try {
    const timelineEntry = await Timeline.create({
      project_id: projectId,
      type,
      title,
      description,
      date: new Date(),
    });

    const plainEntry: TimelineEntry = {
      _id: timelineEntry._id.toString(),
      project_id: timelineEntry.project_id,
      type: timelineEntry.type,
      title: timelineEntry.title,
      description: timelineEntry.description,
      photoUrls: timelineEntry.photoUrls,
      status: timelineEntry.status,
      assignedTo: timelineEntry.assignedTo,
      date: new Date(timelineEntry.date),
      createdAt: timelineEntry.createdAt.toISOString(),
      updatedAt: timelineEntry.updatedAt.toISOString(),
    };

    return { success: true, entry: plainEntry };
  } catch (error) {
    console.error("Error creating timeline entry:", error);
    return {
      success: false,
      error: "Failed to create timeline entry",
    };
  }
}
// Add photo update to project timeline
export async function addTimelinePhotoUpdate(
  projectId: string,
  formData: FormData
): Promise<TimelineResponse> {
  await dbConnect();
  try {
    // Check if user is authenticated and has admin role
    const session = await verifySession();
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const photos = formData.getAll("photos") as File[];
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const progress = formData.get("progress")?.toString();

    if (photos.length === 0) {
      return { success: false, error: "At least one photo is required" };
    }

    if (!title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    // Validate files
    for (const photo of photos) {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      if (!validTypes.includes(photo.type)) {
        return {
          success: false,
          error:
            "Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP, SVG).",
        };
      }
      const maxSize = 50 * 1024 * 1024;
      if (photo.size > maxSize) {
        return {
          success: false,
          error:
            "File size too large. Please upload an image smaller than 50MB.",
        };
      }
    }

    // Upload photos to Supabase
    const photoUrls: string[] = [];
    for (const photo of photos) {
      const fileName = `timeline-${Date.now()}-${photo.name}`;
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { data, error } = await supabase.storage
        .from("gianprojectimage")
        .upload(`${projectId}/${fileName}`, buffer, {
          contentType: photo.type,
        });
      if (error) {
        console.error("Supabase upload error:", error);
        return {
          success: false,
          error: `Failed to upload image: ${error.message}`,
        };
      }
      const { data: publicUrlData } = supabase.storage
        .from("gianprojectimage")
        .getPublicUrl(data.path);
      photoUrls.push(publicUrlData.publicUrl);
    }

    // Create timeline entry with progress - using photo_timeline_update type
    const timelineEntry = await Timeline.create({
      project_id: projectId,
      type: "photo_timeline_update",
      title: title.trim(),
      description: description?.trim(),
      photoUrls,
      progress: progress ? parseInt(progress) : undefined,
      date: new Date(),
    });

    console.log("✅ Timeline entry created:", timelineEntry._id);

    // Get project and user details for notification
    const project = await Project.findOne({ project_id: projectId });

    if (!project) {
      console.error("❌ Project not found for notifications");
      return {
        success: false,
        error: "Project found but user notification failed",
      };
    }

    const userDetails = await getUserDetails(project.userId);

    if (!userDetails) {
      console.error("❌ User details not found for project:", project.userId);
    } else {
      console.log("👤 User details found:", {
        name: userDetails.fullName,
        email: userDetails.email,
      });

      try {
        // ✅ SINGLE NOTIFICATION: photo_timeline_update handles both photos and progress
        const notificationResult = await createProjectNotification(
          project,
          userDetails,
          "photo_timeline_update",
          `Progress Update: ${title}`,
          `New construction progress photos have been uploaded for your project "${project.name}". ${description || ""}`,
          {
            updateTitle: title,
            updateDescription: description || "",
            progress: progress ? parseInt(progress) : undefined,
            photoCount: photos.length,
            projectName: project.name,
            projectId: project.project_id,
            status: project.status,
            startDate: project.startDate?.toISOString(),
            endDate: project.endDate?.toISOString(),
            totalCost: project.totalCost,
            location: project.location?.fullAddress,
            clientName: userDetails.fullName,
            clientEmail: userDetails.email,
          }
        );

        if (notificationResult) {
          console.log(
            "✅ Photo timeline update notification created successfully"
          );
        } else {
          console.error(
            "❌ Photo timeline update notification creation failed"
          );
        }

        // ✅ REMOVED: No separate milestone notification needed
        // The photo_timeline_update template already shows progress information
      } catch (notificationError) {
        console.error("❌ Error creating notifications:", notificationError);
        // Continue anyway - don't fail the entire operation
      }
    }

    const plainEntry: TimelineEntry = {
      _id: timelineEntry._id.toString(),
      project_id: timelineEntry.project_id,
      type: timelineEntry.type,
      title: timelineEntry.title,
      description: timelineEntry.description,
      photoUrls: timelineEntry.photoUrls,
      progress: timelineEntry.progress,
      date: new Date(timelineEntry.date),
      createdAt: timelineEntry.createdAt.toISOString(),
      updatedAt: timelineEntry.updatedAt.toISOString(),
    };

    revalidatePath("/admin/admin-project");
    revalidatePath("/user/projects");
    return { success: true, entry: plainEntry };
  } catch (error) {
    console.error("Error adding timeline photo update:", error);
    return {
      success: false,
      error:
        "Failed to add photo update to timeline: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Get timeline for a specific project
export async function getProjectTimeline(
  projectId: string
): Promise<TimelineResponse> {
  await dbConnect();
  try {
    const timelineEntries = await Timeline.find({ project_id: projectId })
      .sort({ date: -1 })
      .lean();

    console.log("=== BACKEND TIMELINE DEBUG ===");
    console.log("Number of entries:", timelineEntries.length);

    timelineEntries.forEach((entry: any, index: number) => {
      console.log(`DB Entry ${index}:`, {
        title: entry.title,
        progress: entry.progress,
        hasProgress: entry.progress !== undefined && entry.progress !== null,
        progressType: typeof entry.progress,
        progressValue: entry.progress,
      });
    });

    const convertedTimeline = timelineEntries.map((entry: any) => ({
      _id: entry._id?.toString() || "",
      project_id: entry.project_id,
      type: entry.type,
      title: entry.title,
      description: entry.description,
      photoUrls: entry.photoUrls || [],
      status: entry.status,
      assignedTo: entry.assignedTo,
      progress: entry.progress,
      date: new Date(entry.date),
      createdAt: entry.createdAt?.toISOString() || "",
      updatedAt: entry.updatedAt?.toISOString() || "",
    }));

    console.log("=== CONVERTED TIMELINE ===");
    convertedTimeline.forEach((entry: any, index: number) => {
      console.log(`Converted Entry ${index}:`, {
        title: entry.title,
        progress: entry.progress,
        hasProgress: entry.progress !== undefined && entry.progress !== null,
        inResponse: "progress" in entry,
      });
    });

    return { success: true, timeline: convertedTimeline };
  } catch (error) {
    console.error("Error fetching project timeline:", error);
    return {
      success: false,
      error: "Failed to fetch project timeline",
    };
  }
}

// Get all gallery images across all projects
export async function getAllGalleryImages(): Promise<GalleryResponse> {
  await dbConnect();
  try {
    // Check if user is authenticated and has admin role
    const session = await verifySession();
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Get all timeline entries with photos
    const photoEntries = await Timeline.find({
      photoUrls: { $exists: true, $ne: [] },
    })
      .populate("project_id", "name")
      .sort({ date: -1 })
      .lean();

    const galleryImages = photoEntries.flatMap((entry: any) => {
      if (!entry.photoUrls || entry.photoUrls.length === 0) return [];

      return entry.photoUrls.map((url: string, index: number) => ({
        url,
        title:
          entry.title || `Update ${new Date(entry.date).toLocaleDateString()}`,
        description: entry.description,
        project_id: entry.project_id,
        project_name: entry.project_id?.name || "Unknown Project",
        uploadedAt: new Date(entry.date),
        timeline_id: entry._id.toString(),
      }));
    });

    return { success: true, images: galleryImages };
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return {
      success: false,
      error: "Failed to fetch gallery images",
    };
  }
}

// Get gallery images for a specific project
export async function getProjectGalleryImages(
  projectId: string
): Promise<GalleryResponse> {
  await dbConnect();
  try {
    // Get timeline entries with photos for specific project
    const photoEntries = await Timeline.find({
      project_id: projectId,
      photoUrls: { $exists: true, $ne: [] },
    })
      .populate("project_id", "name")
      .sort({ date: -1 })
      .lean();

    const galleryImages = photoEntries.flatMap((entry: any) => {
      if (!entry.photoUrls || entry.photoUrls.length === 0) return [];

      return entry.photoUrls.map((url: string, index: number) => ({
        url,
        title:
          entry.title || `Update ${new Date(entry.date).toLocaleDateString()}`,
        description: entry.description,
        project_id: entry.project_id,
        project_name: entry.project_id?.name || "Unknown Project",
        uploadedAt: new Date(entry.date),
        timeline_id: entry._id.toString(),
      }));
    });

    return { success: true, images: galleryImages };
  } catch (error) {
    console.error("Error fetching project gallery images:", error);
    return {
      success: false,
      error: "Failed to fetch project gallery images",
    };
  }
}

// Add status update to timeline
export async function addTimelineStatusUpdate(
  projectId: string,
  status: "pending" | "active" | "completed" | "cancelled",
  title: string,
  description?: string
): Promise<TimelineResponse> {
  await dbConnect();
  try {
    const timelineEntry = await Timeline.create({
      project_id: projectId,
      type: "status_update",
      title,
      description,
      status,
      date: new Date(),
    });

    // Get project and user details for notification
    const project = await Project.findOne({ project_id: projectId });
    if (project) {
      const userDetails = await getUserDetails(project.userId);

      if (userDetails) {
        await createProjectNotification(
          project,
          userDetails,
          "project_timeline_update",
          "Project Status Update",
          `Status update: ${title}`,
          {
            updateTitle: title,
            updateDescription: description,
            status: status,
            previousStatus: project.status,
            newStatus: status,
          }
        );
      }
    }

    const plainEntry: TimelineEntry = {
      _id: timelineEntry._id.toString(),
      project_id: timelineEntry.project_id,
      type: timelineEntry.type,
      title: timelineEntry.title,
      description: timelineEntry.description,
      status: timelineEntry.status,
      date: new Date(timelineEntry.date),
      createdAt: timelineEntry.createdAt.toISOString(),
      updatedAt: timelineEntry.updatedAt.toISOString(),
    };

    revalidatePath("/admin/admin-project");
    return { success: true, entry: plainEntry };
  } catch (error) {
    console.error("Error adding status update to timeline:", error);
    return {
      success: false,
      error: "Failed to add status update to timeline",
    };
  }
}

// Delete timeline entry by ID (for Timeline model entries)
export async function deleteTimelineEntryById(
  timelineId: string
): Promise<TimelineResponse> {
  await dbConnect();
  try {
    // Check if user is authenticated and has admin role
    const session = await verifySession();
    if (!session || session.role.toLowerCase() !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const timelineEntry = await Timeline.findById(timelineId);
    if (!timelineEntry) {
      return { success: false, error: "Timeline entry not found" };
    }

    // Delete photos from Supabase if they exist
    if (timelineEntry.photoUrls && timelineEntry.photoUrls.length > 0) {
      interface TimelineEntryPhotos {
        photoUrls?: string[];
      }

      type SupabaseFilePath = string;

      const entryWithPhotos = timelineEntry as TimelineEntryPhotos;

      const filePaths: SupabaseFilePath[] = (entryWithPhotos.photoUrls || [])
        .map((url: string): string | null => {
          const match = url.match(/timeline-images\/(.*)$/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => !!path);

      if (filePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("timeline-images")
          .remove(filePaths);

        if (deleteError) {
          console.error(
            "Error deleting timeline photos from storage:",
            deleteError
          );
        }
      }
    }

    await Timeline.findByIdAndDelete(timelineId);

    revalidatePath("/admin/admin-project");
    return { success: true };
  } catch (error) {
    console.error("Error deleting timeline entry:", error);
    return {
      success: false,
      error: "Failed to delete timeline entry",
    };
  }
}
