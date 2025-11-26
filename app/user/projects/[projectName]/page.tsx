import React from "react";
import { getProjectsByUserId } from "@/action/project";
import { getSession } from "@/action/auth";
import { notFound, redirect } from "next/navigation";
import UserProjectDetails from "@/components/user/projects/UserProjectDetails";

interface ProjectDetailsPageProps {
  params: Promise<{
    projectName: string;
  }>;
}

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  // Await the params Promise
  const resolvedParams = await params;
  const session = await getSession();

  console.log("🔐 Session in project details:", session);
  console.log("📋 URL params:", resolvedParams);

  if (!session || !session.user_id) {
    console.log("❌ No session or user_id found, redirecting to login");
    redirect("/auth/signin");
  }

  console.log(`👤 Fetching projects for user_id: "${session.user_id}"`);

  const result = await getProjectsByUserId(session.user_id);

  console.log("📦 Projects result in details:", {
    success: result.success,
    projectsCount: result.projects?.length || 0,
    error: result.error,
  });

  if (!result.success) {
    console.log("❌ Failed to fetch projects");
    return notFound();
  }

  // Decode the URL parameter and convert back to original format
  const decodedProjectName = decodeURIComponent(
    resolvedParams.projectName.replace(/-/g, " ")
  );

  console.log(`🔍 Looking for project: "${decodedProjectName}"`);

  // Find project by name (case-insensitive)
  const project = result.projects?.find(
    (p) => p.name.toLowerCase() === decodedProjectName.toLowerCase()
  );

  console.log(
    "🎯 Found project:",
    project
      ? {
          name: project.name,
          userId: project.userId,
          status: project.status,
        }
      : "No project found"
  );

  // Additional security check - ensure project belongs to logged-in user
  if (!project || project.userId !== session.user_id) {
    console.log(
      "🚫 Project access denied - user ID mismatch or project not found"
    );
    console.log(
      `Project userId: "${project?.userId}", Session user_id: "${session.user_id}"`
    );
    return notFound();
  }

  return <UserProjectDetails project={project} />;
}
