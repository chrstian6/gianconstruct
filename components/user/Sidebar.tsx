"use client";

import * as React from "react";
import {
  Home,
  Search,
  Settings2,
  Folder,
  CheckCircle,
  Clock,
  WalletMinimal,
} from "lucide-react";
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
      url: "/user/userdashboard",
      icon: WalletMinimal,
    },
    {
      title: "Loan",
      url: "/user/userdashboard",
      icon: WalletMinimal,
    },
  ],
  projects: [
    {
      name: "Active Projects",
      url: "/user/projects/active",
      icon: Clock,
    },
    {
      name: "Completed Projects",
      url: "/user/projects/completed",
      icon: CheckCircle,
    },
  ],
};

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const pathname = usePathname();

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
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
                      className="text-foreground"
                      isActive={isActive(project.url)}
                    >
                      <a href={project.url}>
                        <project.icon className="text-foreground" />
                        <span>{project.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* Settings Dialog */}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
