"use client";
import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarProvider,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NotificationSheet } from "@/components/admin/NotificationSheet";
import { getNotifications } from "@/action/inquiries";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getNotifications();
        if (result.success) {
          const unread = result.notifications.filter(
            (n: any) => !n.isRead
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    };
    fetchUnreadCount();
  }, []);

  // Check if a menu item is active
  const isActive = (href?: string) => {
    if (!href) return false;

    // Exact match for dashboard
    if (href === "/admin/admindashboard") {
      return pathname === href;
    }

    // For other routes, check if the pathname starts with the href
    return pathname.startsWith(href);
  };

  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // This is your actual data with correct paths
  const data = {
    navMain: [
      {
        title: "Quick Actions",
        url: "#",
        items: [
          {
            title: "Set Appointment",
            url: "/admin/appointments",
            isActive: isActive("/admin/appointments"),
          },
        ],
      },
      {
        title: "Main Navigation",
        url: "#",
        items: [
          {
            title: "Dashboard",
            url: "/admin/admindashboard",
            isActive: isActive("/admin/admindashboard"),
          },
          {
            title: "Projects",
            url: "/admin/admin-project",
            isActive: isActive("/admin/admin-project"),
          },
          {
            title: "Meetings",
            url: "/admin/meetings",
            isActive: isActive("/admin/meetings"),
          },
          {
            title: "Schedules",
            url: "/admin/schedules",
            isActive: isActive("/admin/schedules"),
          },
          {
            title: "Catalog",
            url: "/admin/catalog",
            isActive: isActive("/admin/catalog"),
          },
          {
            title: "Notifications",
            url: "#",
            onClick: () => setIsNotificationSheetOpen(true),
            isActive: false,
          },
          {
            title: "User Management",
            url: "/admin/usermanagement",
            isActive: isActive("/admin/usermanagement"),
          },
          {
            title: "Settings",
            url: "/admin/settings",
            isActive: isActive("/admin/settings"),
          },
        ],
      },
    ],
  };

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full">
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-2">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <span className="text-sm font-medium">
                        {user?.firstName?.[0] || "A"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">
                        {user?.firstName || "Admin"}
                      </span>
                      <span className="">Administrator</span>
                    </div>
                  </div>
                </SidebarMenuButton>
                <SidebarMenuButton
                  onClick={toggleCollapse}
                  className="p-2"
                  size="sm"
                >
                  <GalleryVerticalEnd className="h-4 w-4" />
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <div className="font-medium text-sm py-1">{item.title}</div>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          {subItem.onClick ? (
                            <SidebarMenuSubButton
                              onClick={subItem.onClick}
                              isActive={subItem.isActive}
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                              {subItem.title === "Notifications" &&
                                unreadCount > 0 && (
                                  <Badge className="ml-auto bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </Badge>
                                )}
                            </SidebarMenuSubButton>
                          ) : (
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                            >
                              <Link
                                href={subItem.url}
                                className="flex items-center gap-2"
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* Notification Sheet */}
      <NotificationSheet
        open={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
        isCollapsed={isCollapsed}
      />
    </>
  );
}
