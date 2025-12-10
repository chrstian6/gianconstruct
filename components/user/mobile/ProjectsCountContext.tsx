// components/user/ProjectsCountContext.tsx
"use client";

import * as React from "react";
import { getCurrentUserActiveProjectsCount } from "@/action/project";

interface ProjectsCountContextType {
  activeProjectsCount: number;
  isLoading: boolean;
  refreshCount: () => Promise<void>;
}

const ProjectsCountContext = React.createContext<ProjectsCountContextType>({
  activeProjectsCount: 0,
  isLoading: true,
  refreshCount: async () => {},
});

export function ProjectsCountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeProjectsCount, setActiveProjectsCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshCount = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCurrentUserActiveProjectsCount();
      if (result.success && result.count !== undefined) {
        setActiveProjectsCount(result.count);
      }
    } catch (error) {
      console.error("Error fetching active projects count:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    refreshCount();

    // Set up interval to refresh count every 30 seconds
    const intervalId = setInterval(refreshCount, 30000);

    // Refresh when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCount]);

  return (
    <ProjectsCountContext.Provider
      value={{ activeProjectsCount, isLoading, refreshCount }}
    >
      {children}
    </ProjectsCountContext.Provider>
  );
}

export function useProjectsCount() {
  return React.useContext(ProjectsCountContext);
}
