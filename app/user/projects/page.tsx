import React from "react";
import ProjectsClient from "@/components/user/projects/ProjectsClient";
import { getProjectsByUserId, getUserProjectCounts } from "@/action/project";
import { getSession } from "@/action/auth";

interface ProjectsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  // Await the searchParams Promise
  const resolvedSearchParams = await searchParams;
  const session = await getSession();
  const status = resolvedSearchParams.status || "all";
  const search = resolvedSearchParams.search || "";

  console.log("🔐 Full session data:", JSON.stringify(session, null, 2));
  console.log("📋 Search params:", { status, search });

  if (!session || !session.user_id) {
    console.log("❌ No session or user_id found");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your projects.</p>
        </div>
      </div>
    );
  }

  console.log(`👤 User ID from session: "${session.user_id}"`);

  try {
    const [projectsResult, countsResult] = await Promise.all([
      getProjectsByUserId(
        session.user_id,
        status === "all" ? undefined : status
      ),
      getUserProjectCounts(session.user_id),
    ]);

    console.log("📦 Projects result:", {
      success: projectsResult.success,
      projectsCount: projectsResult.projects?.length || 0,
      error: projectsResult.error,
    });
    console.log("📊 Counts result:", countsResult);

    // Debug: Log actual projects data
    if (projectsResult.success && projectsResult.projects) {
      console.log(
        "🏗️ Projects found:",
        projectsResult.projects.map((p) => ({
          id: p.project_id,
          name: p.name,
          status: p.status,
          userId: p.userId,
        }))
      );
    }

    return (
      <ProjectsClient
        initialProjects={
          projectsResult.success ? projectsResult.projects || [] : []
        }
        projectCounts={countsResult.success ? countsResult.counts : undefined}
        error={projectsResult.error || countsResult.error}
        userId={session.user_id}
        initialStatus={status}
        initialSearch={search}
      />
    );
  } catch (error) {
    console.error("❌ Error in ProjectsPage:", error);
    return (
      <ProjectsClient
        initialProjects={[]}
        error="Failed to load projects"
        userId={session.user_id}
        initialStatus={status}
        initialSearch={search}
      />
    );
  }
}
