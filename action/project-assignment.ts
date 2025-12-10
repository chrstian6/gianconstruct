// actions/project-assignment.ts
"use server";

import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import ProjectAssignment from "@/models/ProjectAssignment";
import { verifySession } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

interface ActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper function to safely clean Mongoose objects for client components
const cleanMongooseObject = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;

  // If it's a Mongoose document, call toJSON first
  if (typeof obj.toJSON === "function") {
    return cleanMongooseObject(obj.toJSON());
  }

  // If it's an ObjectId, convert to string
  if (
    obj &&
    typeof obj.toString === "function" &&
    obj._bsontype === "ObjectId"
  ) {
    return obj.toString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(cleanMongooseObject);
  }

  // Handle plain objects
  const cleanObj: any = {};
  for (const key in obj) {
    // Skip Mongoose private fields except _id
    if (key.startsWith("__")) continue;
    if (key === "__v") continue; // Skip Mongoose version key

    const value = obj[key];

    // Skip functions and undefined
    if (typeof value === "function" || value === undefined) continue;

    // Handle ObjectId _id fields (common in nested objects)
    if (key === "_id") {
      if (value && typeof value.toString === "function") {
        cleanObj[key] = value.toString();
      } else if (value && value.buffer) {
        // Handle Buffer-like ObjectId
        cleanObj[key] = Buffer.from(value.buffer).toString("hex");
      } else {
        cleanObj[key] = value;
      }
    }
    // Handle dates
    else if (value instanceof Date) {
      cleanObj[key] = value.toISOString();
    }
    // Handle objects with toISOString method (Mongoose dates)
    else if (
      value &&
      typeof value.toISOString === "function" &&
      typeof value.getTime === "function"
    ) {
      try {
        cleanObj[key] = value.toISOString();
      } catch {
        cleanObj[key] = value;
      }
    }
    // Recursively handle nested objects
    else if (typeof value === "object" && value !== null) {
      cleanObj[key] = cleanMongooseObject(value);
    }
    // Copy primitive values
    else {
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

// Helper function to clean API response data
const cleanApiResponse = (data: any): any => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(cleanMongooseObject);
  }

  return cleanMongooseObject(data);
};

// Helper function to clean location object specifically
const cleanLocationObject = (location: any): any => {
  if (!location) return null;

  const cleanLocation: any = {};

  // Only include the fields we need
  const locationFields = [
    "region",
    "province",
    "municipality",
    "barangay",
    "fullAddress",
  ];

  for (const field of locationFields) {
    if (location[field] !== undefined && location[field] !== null) {
      cleanLocation[field] = location[field];
    }
  }

  // Remove _id if it exists
  delete cleanLocation._id;
  delete cleanLocation.__v;

  return Object.keys(cleanLocation).length > 0 ? cleanLocation : null;
};

// Helper function to clean project images
const cleanProjectImages = (images: any[]): any[] => {
  if (!Array.isArray(images)) return [];

  return images.map((image) => {
    if (!image || typeof image !== "object") return image;

    const cleanImage: any = {};

    // Copy only the fields we need
    const imageFields = ["url", "title", "description", "uploadedAt"];

    for (const field of imageFields) {
      if (image[field] !== undefined && image[field] !== null) {
        if (field === "uploadedAt" && image[field]) {
          cleanImage[field] = new Date(image[field]).toISOString();
        } else {
          cleanImage[field] = image[field];
        }
      }
    }

    // Remove _id
    delete cleanImage._id;

    return cleanImage;
  });
};

// Helper function to clean project timeline
const cleanProjectTimeline = (timeline: any[]): any[] => {
  if (!Array.isArray(timeline)) return [];

  return timeline.map((item) => {
    if (!item || typeof item !== "object") return item;

    const cleanItem: any = {};

    // Copy only the fields we need
    const timelineFields = [
      "phase",
      "startDate",
      "endDate",
      "description",
      "status",
      "completedDate",
    ];

    for (const field of timelineFields) {
      if (item[field] !== undefined && item[field] !== null) {
        if (
          (field === "startDate" ||
            field === "endDate" ||
            field === "completedDate") &&
          item[field]
        ) {
          cleanItem[field] = new Date(item[field]).toISOString();
        } else {
          cleanItem[field] = item[field];
        }
      }
    }

    // Remove _id
    delete cleanItem._id;

    return cleanItem;
  });
};

// Get available project managers
export async function getProjectManagers(): Promise<ActionResponse> {
  await dbConnect();
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const projectManagers = await User.find(
      { role: "project_manager" },
      "user_id firstName lastName email contactNo address avatar"
    ).lean();

    const cleanedManagers = projectManagers.map((manager: any) => ({
      user_id: manager.user_id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      contactNo: manager.contactNo,
      address: manager.address,
      avatar: manager.avatar,
      fullName: `${manager.firstName} ${manager.lastName}`.trim(),
    }));

    return {
      success: true,
      data: cleanApiResponse(cleanedManagers),
    };
  } catch (error) {
    console.error("Error fetching project managers:", error);
    return { success: false, error: "Failed to fetch project managers" };
  }
}

// Search projects for assignment
export async function searchProjectsForAssignment(
  searchTerm: string
): Promise<ActionResponse> {
  await dbConnect();
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Find projects that are not completed
    const query = {
      $and: [
        {
          $or: [
            { project_id: { $regex: searchTerm, $options: "i" } },
            { name: { $regex: searchTerm, $options: "i" } },
            { "location.fullAddress": { $regex: searchTerm, $options: "i" } },
          ],
        },
        { status: { $in: ["pending", "active"] } },
      ],
    };

    const projects = await Project.find(query)
      .select(
        "project_id name status startDate endDate location userId totalCost"
      )
      .limit(20)
      .lean();

    if (projects.length === 0) {
      return { success: true, data: [] };
    }

    // Get assignment status for all projects
    const projectIds = projects.map((p: any) => p.project_id);
    const assignments = await ProjectAssignment.find({
      project_id: { $in: projectIds },
      status: "active",
    }).lean();

    const assignmentMap = new Map(
      assignments.map((a: any) => [a.project_id, a])
    );

    // Get project manager details for assigned projects
    const assignedManagerIds = assignments.map(
      (a: any) => a.project_manager_id
    );

    // Get admin details for assigned_by field
    const assignedByUserIds = assignments.map((a: any) => a.assigned_by);

    // Fetch user names for project managers and admins
    const managerNames = new Map<string, string>();
    const adminNames = new Map<string, string>();

    // Get unique user IDs (both managers and admins)
    const uniqueUserIds = [
      ...new Set([...assignedManagerIds, ...assignedByUserIds]),
    ];

    if (uniqueUserIds.length > 0) {
      const users = await User.find({
        user_id: { $in: uniqueUserIds },
      })
        .select("user_id firstName lastName email")
        .lean();

      // Create maps of user_id -> full name and email
      users.forEach((user: any) => {
        const fullName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim();
        if (assignedManagerIds.includes(user.user_id)) {
          managerNames.set(user.user_id, fullName || "Unknown");
        }
        if (assignedByUserIds.includes(user.user_id)) {
          adminNames.set(user.user_id, fullName || "Unknown");
        }
      });
    }

    const result = projects.map((project: any) => {
      const assignment = assignmentMap.get(project.project_id);
      const managerName = assignment
        ? managerNames.get(assignment.project_manager_id) || "Unknown"
        : null;
      const adminName = assignment
        ? adminNames.get(assignment.assigned_by) ||
          assignment.assigned_by ||
          "Unknown"
        : null;

      // Safe date conversion
      const safeDateToISO = (date: any): string | undefined => {
        if (!date) return undefined;
        try {
          const d = new Date(date);
          return isNaN(d.getTime()) ? undefined : d.toISOString();
        } catch {
          return undefined;
        }
      };

      return {
        project_id: project.project_id,
        name: project.name,
        status: project.status,
        startDate: safeDateToISO(project.startDate),
        endDate: safeDateToISO(project.endDate),
        location: cleanLocationObject(project.location),
        userId: project.userId,
        totalCost: project.totalCost,
        isAssigned: !!assignment,
        currentAssignment: assignment
          ? {
              assignment_id: assignment.assignment_id,
              project_manager_id: assignment.project_manager_id,
              project_manager_name: managerName,
              assigned_by_name: adminName,
              assigned_by: assignment.assigned_by,
              assignment_date: safeDateToISO(assignment.assignment_date),
            }
          : null,
      };
    });

    return { success: true, data: cleanApiResponse(result) };
  } catch (error) {
    console.error("Error searching projects:", error);
    return { success: false, error: "Failed to search projects" };
  }
}

// Search project managers
export async function searchProjectManagers(
  searchTerm: string
): Promise<ActionResponse> {
  await dbConnect();
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const query = {
      role: "project_manager",
      $or: [
        { user_id: { $regex: searchTerm, $options: "i" } },
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { contactNo: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const projectManagers = await User.find(query)
      .select("user_id firstName lastName email contactNo address avatar")
      .limit(20)
      .lean();

    const result = projectManagers.map((manager: any) => ({
      user_id: manager.user_id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      contactNo: manager.contactNo,
      address: manager.address,
      avatar: manager.avatar,
      fullName: `${manager.firstName} ${manager.lastName}`.trim(),
    }));

    return { success: true, data: cleanApiResponse(result) };
  } catch (error) {
    console.error("Error searching project managers:", error);
    return { success: false, error: "Failed to search project managers" };
  }
}

// Helper function to generate assignment ID
async function generateAssignmentId(): Promise<string> {
  try {
    const counterSchema = new mongoose.Schema({
      _id: { type: String, required: true },
      sequence_value: { type: Number, default: 0 },
    });

    const Counter =
      mongoose.models.Counter || mongoose.model("Counter", counterSchema);

    const result = await Counter.findOneAndUpdate(
      { _id: "assignment_id" },
      { $inc: { sequence_value: 1 } },
      {
        new: true,
        upsert: true,
        returnDocument: "after" as const,
      }
    );

    if (!result || typeof result.sequence_value !== "number") {
      throw new Error("Failed to generate assignment ID");
    }

    const sequenceNumber = result.sequence_value.toString().padStart(4, "0");
    return `assign-${sequenceNumber}`;
  } catch (error) {
    console.error("Error generating assignment ID:", error);
    // Fallback: use timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    return `assign-${timestamp}`;
  }
}

// Assign projects to project manager
export async function assignProjectsToManager(
  projectIds: string[],
  projectManagerId: string,
  notes?: string
): Promise<ActionResponse> {
  await dbConnect();
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    if (!projectIds || projectIds.length === 0) {
      return { success: false, error: "No projects selected" };
    }

    if (!projectManagerId) {
      return { success: false, error: "Project manager is required" };
    }

    // Check if project manager exists
    const projectManager = await User.findOne({
      user_id: projectManagerId,
      role: "project_manager",
    });

    if (!projectManager) {
      return { success: false, error: "Project manager not found" };
    }

    // Check if projects exist and are not completed
    const projects = await Project.find({
      project_id: { $in: projectIds },
      status: { $in: ["pending", "active"] },
    });

    if (projects.length !== projectIds.length) {
      return {
        success: false,
        error: "Some projects were not found or are completed",
      };
    }

    // Check for existing active assignments
    const existingAssignments = await ProjectAssignment.find({
      project_id: { $in: projectIds },
      status: "active",
    });

    if (existingAssignments.length > 0) {
      const assignedProjects = existingAssignments.map(
        (a: any) => a.project_id
      );
      return {
        success: false,
        error: `Projects ${assignedProjects.join(", ")} are already assigned`,
      };
    }

    // Create assignments one by one to ensure pre-save hooks are triggered
    const createdAssignments = [];
    const assignmentIds = [];

    // Generate all assignment IDs first
    for (let i = 0; i < projectIds.length; i++) {
      const assignmentId = await generateAssignmentId();
      assignmentIds.push(assignmentId);
    }

    // Now create assignments
    for (let i = 0; i < projectIds.length; i++) {
      const assignmentData = {
        assignment_id: assignmentIds[i],
        project_id: projectIds[i],
        project_manager_id: projectManagerId,
        assigned_by: session.userId || session.email || "admin",
        assignment_date: new Date(),
        status: "active" as const,
        notes,
      };

      const newAssignment = new ProjectAssignment(assignmentData);
      const savedAssignment = await newAssignment.save();
      createdAssignments.push(savedAssignment);
    }

    // Update project status if needed
    await Project.updateMany(
      { project_id: { $in: projectIds }, status: "pending" },
      { status: "active" }
    );

    revalidatePath("/admin/admin-project");
    revalidatePath("/manage-project");

    return {
      success: true,
      data: cleanApiResponse({
        count: createdAssignments.length,
        assignments: createdAssignments,
      }),
    };
  } catch (error: any) {
    console.error("Error assigning projects:", error);

    // Provide more specific error message
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return {
        success: false,
        error: `Validation failed: ${errors.join(", ")}`,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to assign projects",
    };
  }
}

// Get assigned projects for a project manager
export async function getAssignedProjectsForManager(
  projectManagerId: string
): Promise<ActionResponse> {
  await dbConnect();
  try {
    console.log("Fetching projects for manager ID:", projectManagerId);

    // First, verify the project manager exists
    const projectManager = await User.findOne({
      user_id: projectManagerId,
      role: "project_manager",
    });

    console.log("Found project manager:", projectManager ? "Yes" : "No");

    const assignments = await ProjectAssignment.find({
      project_manager_id: projectManagerId,
      status: "active",
    })
      .sort({ assignment_date: -1 })
      .lean();

    console.log("Found assignments:", assignments.length);

    if (assignments.length === 0) {
      return { success: true, data: [] };
    }

    // Get project details for each assignment
    const projectIds = assignments.map((a: any) => a.project_id);
    console.log("Project IDs to fetch:", projectIds);

    const projects = await Project.find({
      project_id: { $in: projectIds },
    }).lean();

    console.log("Found projects:", projects.length);

    const projectMap = new Map(projects.map((p: any) => [p.project_id, p]));

    const result = assignments
      .map((assignment: any) => {
        const project = projectMap.get(assignment.project_id);
        if (!project) {
          console.log(
            "Project not found for assignment:",
            assignment.project_id
          );
          return null;
        }

        return {
          assignment_id: assignment.assignment_id,
          project_id: assignment.project_id,
          project_manager_id: assignment.project_manager_id,
          assigned_by: assignment.assigned_by,
          assignment_date: assignment.assignment_date?.toISOString(),
          status: assignment.status,
          notes: assignment.notes,
          createdAt: assignment.createdAt?.toISOString(),
          updatedAt: assignment.updatedAt?.toISOString(),
          project: {
            project_id: project.project_id,
            name: project.name,
            status: project.status,
            startDate: project.startDate?.toISOString(),
            endDate: project.endDate?.toISOString(),
            totalCost: project.totalCost,
            location: cleanLocationObject(project.location),
            projectImages: cleanProjectImages(project.projectImages || []),
            timeline: cleanProjectTimeline(project.timeline || []),
          },
        };
      })
      .filter((item) => item !== null);

    console.log("Processed result count:", result.length);

    return { success: true, data: cleanApiResponse(result) };
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    return { success: false, error: "Failed to fetch assigned projects" };
  }
}

// Get current project manager's assigned projects
export async function getMyAssignedProjects(): Promise<ActionResponse> {
  await dbConnect();
  try {
    console.log("Getting session for my assigned projects...");
    const session = await verifySession();
    console.log("Session data:", JSON.stringify(session, null, 2));

    if (!session) {
      console.log("No session found");
      return { success: false, error: "Unauthorized - No session" };
    }

    if (session.role !== "project_manager") {
      console.log("Invalid role:", session.role);
      return { success: false, error: "Unauthorized or not a project manager" };
    }

    // CRITICAL FIX: Use user_id from session (GC-0029 from your token)
    const projectManagerId = session.user_id;

    console.log("Extracted manager ID from session.user_id:", projectManagerId);

    if (!projectManagerId) {
      console.log(
        "user_id not found in session. Session keys:",
        Object.keys(session)
      );
      return { success: false, error: "User ID not found in session" };
    }

    console.log(
      "Calling getAssignedProjectsForManager with user_id:",
      projectManagerId
    );
    return await getAssignedProjectsForManager(projectManagerId);
  } catch (error) {
    console.error("Error fetching my assigned projects:", error);
    return { success: false, error: "Failed to fetch assigned projects" };
  }
}

// Unassign/transfer project
export async function unassignProject(
  assignmentId: string,
  transferTo?: string,
  notes?: string
): Promise<ActionResponse> {
  await dbConnect();
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const assignment = await ProjectAssignment.findOne({
      assignment_id: assignmentId,
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (transferTo) {
      // Transfer to another project manager
      const newManager = await User.findOne({
        user_id: transferTo,
        role: "project_manager",
      });

      if (!newManager) {
        return { success: false, error: "New project manager not found" };
      }

      assignment.status = "transferred";
      assignment.transferred_to = transferTo;
      assignment.transferred_date = new Date();
      assignment.notes = notes
        ? `${assignment.notes || ""}\nTransferred: ${notes}`
        : assignment.notes;

      await assignment.save();

      // Generate new assignment ID for the transferred assignment
      const newAssignmentId = await generateAssignmentId();

      // Create new assignment for the new manager
      const newAssignment = new ProjectAssignment({
        assignment_id: newAssignmentId,
        project_id: assignment.project_id,
        project_manager_id: transferTo,
        assigned_by: session.userId || session.email || "admin",
        assignment_date: new Date(),
        status: "active",
        notes: `Transferred from ${assignment.project_manager_id}. ${notes || ""}`,
      });

      await newAssignment.save();
    } else {
      // Simply unassign (mark as completed)
      assignment.status = "completed";
      assignment.completed_at = new Date();
      assignment.notes = notes
        ? `${assignment.notes || ""}\nUnassigned: ${notes}`
        : assignment.notes;
      await assignment.save();
    }

    revalidatePath("/admin/admin-project");
    revalidatePath("/manage-project");

    return { success: true };
  } catch (error) {
    console.error("Error unassigning project:", error);
    return { success: false, error: "Failed to unassign project" };
  }
}

// Get all assignments (admin view)
export async function getAllAssignments(): Promise<ActionResponse> {
  await dbConnect();
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const assignments = await ProjectAssignment.find()
      .sort({ assignment_date: -1 })
      .lean();

    // Get project and manager details
    const projectIds = assignments.map((a: any) => a.project_id);
    const managerIds = assignments.map((a: any) => a.project_manager_id);

    const [projects, managers] = await Promise.all([
      Project.find({ project_id: { $in: projectIds } }).lean(),
      User.find({ user_id: { $in: managerIds } }).lean(),
    ]);

    const projectMap = new Map(projects.map((p: any) => [p.project_id, p]));
    const managerMap = new Map(managers.map((m: any) => [m.user_id, m]));

    const result = assignments.map((assignment: any) => {
      const project = projectMap.get(assignment.project_id);
      const manager = managerMap.get(assignment.project_manager_id);

      return {
        assignment_id: assignment.assignment_id,
        project_id: assignment.project_id,
        project_manager_id: assignment.project_manager_id,
        project_manager_name: manager
          ? `${manager.firstName} ${manager.lastName}`.trim()
          : "Unknown",
        assigned_by_name: "Admin", // You might want to fetch this from users table
        assigned_by: assignment.assigned_by,
        assignment_date: assignment.assignment_date?.toISOString(),
        status: assignment.status,
        notes: assignment.notes,
        transferred_date: assignment.transferred_date?.toISOString(),
        completed_at: assignment.completed_at?.toISOString(),
        createdAt: assignment.createdAt?.toISOString(),
        updatedAt: assignment.updatedAt?.toISOString(),
        __v: assignment.__v,
        project: project
          ? {
              project_id: project.project_id,
              name: project.name,
              status: project.status,
            }
          : null,
        project_manager: manager
          ? {
              user_id: manager.user_id,
              firstName: manager.firstName,
              lastName: manager.lastName,
              email: manager.email,
              fullName: `${manager.firstName} ${manager.lastName}`.trim(),
            }
          : null,
      };
    });

    return { success: true, data: cleanApiResponse(result) };
  } catch (error) {
    console.error("Error fetching all assignments:", error);
    return { success: false, error: "Failed to fetch assignments" };
  }
}
