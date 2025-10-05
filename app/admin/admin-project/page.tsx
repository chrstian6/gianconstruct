// app/admin/admin-project/page.tsx
import ProjectList from "@/components/admin/projects/ProjectList";

export default function AdminProjectsPage() {
  return <ProjectList />;
}

// This prevents the page from re-rendering unnecessarily
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour
