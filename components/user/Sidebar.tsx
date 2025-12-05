"use client";

import * as React from "react";
import { Home, Search, Settings2, Folder, WalletMinimal } from "lucide-react";
import { usePathname } from "next/navigation";
import { TeamSwitcher } from "@/components/user/team-switcher";
import { SettingsDialog } from "@/components/user/Settings";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserActiveProjectsCount } from "@/action/project";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/user/userdashboard",
      icon: Home,
    },
    {
      title: "Explore Catalog",
      url: "/user/catalog",
      icon: Search,
    },
    {
      title: "Transactions",
      url: "/user/transaction",
      icon: WalletMinimal,
    },
  ],
  projects: [
    {
      name: "My Projects",
      url: "/user/projects",
      icon: Folder,
    },
  ],
};

// Orange spinner component
function OrangeSpinner() {
  return (
    <div className="ml-2 h-4 w-4 relative flex-shrink-0">
      <div className="h-4 w-4 rounded-full border-2 border-orange-200"></div>
      <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
    </div>
  );
}

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [activeProjectsCount, setActiveProjectsCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null);
  const pathname = usePathname();

  // Fetch active projects count
  const fetchActiveProjectsCount = React.useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Fetching active projects count...");

      const result = await getCurrentUserActiveProjectsCount();

      if (result.success && result.count !== undefined) {
        console.log("✅ Active projects count:", result.count);
        setActiveProjectsCount(result.count);
      } else {
        console.log("❌ Failed to get count, defaulting to 0");
        setActiveProjectsCount(0);
      }
    } catch (error) {
      console.error("❌ Error fetching active projects count:", error);
      setActiveProjectsCount(0);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  }, []);

  // Initial fetch and setup auto-refresh
  React.useEffect(() => {
    fetchActiveProjectsCount();

    // Set up interval to refresh count every 30 seconds
    const intervalId = setInterval(fetchActiveProjectsCount, 30000);

    // Refresh when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👀 Page visible, refreshing count...");
        fetchActiveProjectsCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchActiveProjectsCount]);

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  // Format last refreshed time
  const formatLastRefreshed = () => {
    if (!lastRefreshed) return "";
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 120) return "1 min ago";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    return lastRefreshed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border" {...props}>
        <SidebarHeader>
          <TeamSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-orange-400">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className="text-foreground-500"
                    >
                      <a href={item.url}>
                        <item.icon className="text-foreground-500" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {/* Settings Menu Item */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-foreground-500 cursor-pointer"
                  >
                    <Settings2 className="text-foreground-500" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-orange-400">
              Projects
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.projects.map((project) => (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton
                      asChild
                      className="text-foreground relative group"
                      isActive={isActive(project.url)}
                    >
                      <a
                        href={project.url}
                        className="flex items-center justify-between w-full group-hover:bg-accent/50 transition-colors"
                        title={`My Projects${!isLoading ? ` (${activeProjectsCount} active)` : ""}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <project.icon className="text-foreground flex-shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </div>

                        {/* Active Projects Badge */}
                        <div className="ml-2 flex items-center gap-1 flex-shrink-0">
                          {isLoading ? (
                            // Show orange spinner while loading
                            <OrangeSpinner />
                          ) : activeProjectsCount > 0 ? (
                            <Badge
                              className="h-5 min-w-5 px-1 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 text-xs font-medium transition-colors border-orange-600"
                              title={`${activeProjectsCount} active project${activeProjectsCount !== 1 ? "s" : ""}`}
                            >
                              {activeProjectsCount > 99
                                ? "99+"
                                : activeProjectsCount}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="h-5 min-w-5 px-1 flex items-center justify-center border-orange-300 text-orange-500 text-xs font-medium transition-colors"
                              title="No active projects"
                            >
                              0
                            </Badge>
                          )}
                        </div>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          <div className="text-xs text-muted-foreground text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-1">
                <OrangeSpinner />
                <span>Loading...</span>
              </div>
            ) : lastRefreshed ? (
              <span>Updated {formatLastRefreshed()}</span>
            ) : null}
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Settings Dialog */}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
