"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NotificationSheet } from "@/components/admin/NotificationSheet";
import { getNotifications } from "@/action/inquiries";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  CalendarDays,
  BookOpen,
  Warehouse,
  Bell,
  Settings,
  UserCog,
  Boxes,
  Truck,
  ClipboardList,
  Clock,
  Building,
} from "lucide-react";

interface MenuItem {
  name: string;
  href?: string;
  onClick?: () => void;
  description?: string;
  isDropdown?: boolean;
  dropdownItems?: { name: string; href: string; description: string }[];
  icon: React.ReactNode;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, initialized, initialize } = useAuthStore();

  // Initialize auth only once when component mounts
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

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

  const data = {
    navMain: [
      {
        section: "Quick Actions",
        items: [
          {
            name: "Set Appointment",
            href: "/admin/appointments",
            description: "Schedule client meetings",
            icon: <Calendar className="h-4 w-4" />,
          },
        ],
      },
      {
        section: "Main Navigation",
        items: [
          {
            name: "Dashboard",
            href: "/admin/admindashboard",
            description: "Overview and analytics",
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            name: "Projects",
            href: "/admin/admin-project",
            description: "Manage construction projects",
            icon: <Briefcase className="h-4 w-4" />,
          },
          {
            name: "Meetings",
            href: "/admin/meetings",
            description: "Client meetings and discussions",
            icon: <Users className="h-4 w-4" />,
          },
          {
            name: "Schedules",
            href: "/admin/schedules",
            description: "Timeline and calendar",
            icon: <CalendarDays className="h-4 w-4" />,
          },
          {
            name: "Catalog",
            href: "/admin/catalog",
            description: "Design catalog management",
            icon: <BookOpen className="h-4 w-4" />,
          },
          {
            name: "Inventory",
            isDropdown: true,
            description: "Manage inventory items",
            icon: <Warehouse className="h-4 w-4" />,
            dropdownItems: [
              {
                name: "Materials",
                href: "/admin/main-inventory",
                description: "Manage company inventory",
              },
              {
                name: "Client Inventory",
                href: "/admin/client-inventory",
                description: "View client inventory",
              },
              {
                name: "Suppliers",
                href: "/admin/suppliers",
                description: "Manage suppliers",
              },
            ],
          },
          {
            name: "Notifications",
            onClick: () => setIsNotificationSheetOpen(true),
            description: "View alerts and messages",
            icon: <Bell className="h-4 w-4" />,
          },
          {
            name: "User Management",
            href: "/admin/usermanagement",
            description: "Team and user administration",
            icon: <UserCog className="h-4 w-4" />,
          },
          {
            name: "Settings",
            href: "/admin/settings",
            description: "System configuration",
            icon: <Settings className="h-4 w-4" />,
          },
        ],
      },
    ],
  };

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

  // Check if any dropdown item is active
  const isDropdownActive = (dropdownItems: { href: string }[] = []) => {
    return dropdownItems.some((item) => isActive(item.href));
  };

  // Get user display information
  const getUserDisplayInfo = () => {
    if (loading && !initialized) {
      return { initial: "L", name: "Loading...", role: "Loading..." };
    }

    if (!user) {
      return { initial: "A", name: "Admin", role: "Administrator" };
    }

    const initial = user.firstName?.[0] || "A";
    const name = user.firstName || "Admin";
    const role = user.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "Administrator";

    return { initial, name, role };
  };

  const { initial, name, role } = getUserDisplayInfo();

  // Icons for dropdown items
  const getDropdownIcon = (name: string) => {
    switch (name) {
      case "Main Inventory":
        return <Boxes className="h-3.5 w-3.5" />;
      case "Client Inventory":
        return <ClipboardList className="h-3.5 w-3.5" />;
      case "Suppliers":
        return <Truck className="h-3.5 w-3.5" />;
      default:
        return <Boxes className="h-3.5 w-3.5" />;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar {...props} className="border-none">
        <SidebarHeader className="border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full">
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-2">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <span className="text-sm font-medium">{initial}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-bold">{name}</span>
                      <span className="text-xs text-muted-foreground">
                        {role}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="text-xs font-medium text-900 pl-2">
          {data.navMain.map((item) => (
            <SidebarGroup key={item.section}>
              <SidebarGroupLabel className="text-xs">
                {item.section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.name} className="text-md">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {subItem.isDropdown ? (
                            <Collapsible
                              open={isInventoryOpen}
                              onOpenChange={setIsInventoryOpen}
                              className="w-full"
                            >
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                  isActive={isDropdownActive(
                                    subItem.dropdownItems
                                  )}
                                  className={cn(
                                    "text-md flex items-center justify-between w-full",
                                    isDropdownActive(subItem.dropdownItems) &&
                                      "text-gray-900 font-semibold tracking-relaxed"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {subItem.icon}
                                    <span>{subItem.name}</span>
                                  </div>
                                  <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenu className="ml-4 border-l border-border pl-2 text-md">
                                  {subItem.dropdownItems?.map(
                                    (dropdownItem) => (
                                      <SidebarMenuItem key={dropdownItem.name}>
                                        <SidebarMenuButton
                                          asChild
                                          isActive={isActive(dropdownItem.href)}
                                          className={cn(
                                            "text-md flex items-center gap-2",
                                            isActive(dropdownItem.href) &&
                                              "bg-gray-300 text-gray-900 !font-semibold"
                                          )}
                                        >
                                          <a href={dropdownItem.href}>
                                            {getDropdownIcon(dropdownItem.name)}
                                            {dropdownItem.name}
                                          </a>
                                        </SidebarMenuButton>
                                      </SidebarMenuItem>
                                    )
                                  )}
                                </SidebarMenu>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : subItem.onClick ? (
                            <SidebarMenuButton
                              onClick={subItem.onClick}
                              isActive={isActive(subItem.href)}
                              className={cn(
                                "text-md flex items-center gap-2",
                                isActive(subItem.href) &&
                                  "bg-gray-300 text-gray-900 font-semibold"
                              )}
                            >
                              {subItem.icon}
                              <span>{subItem.name}</span>
                              {subItem.name === "Notifications" &&
                                unreadCount > 0 && (
                                  <Badge className="ml-auto bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </Badge>
                                )}
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(subItem.href)}
                              className={cn(
                                "flex items-center gap-2 text-md",
                                isActive(subItem.href) &&
                                  "bg-gray-300 text-gray-900 !font-semibold"
                              )}
                            >
                              <a href={subItem.href}>
                                {subItem.icon}
                                {subItem.name}
                              </a>
                            </SidebarMenuButton>
                          )}
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-gray-800 text-white text-xs px-2 py-1 border-0"
                          sideOffset={5}
                        >
                          <p className="font-medium">{subItem.name}</p>
                          {subItem.description && (
                            <p className="text-gray-300 mt-1">
                              {subItem.description}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
        <NotificationSheet
          open={isNotificationSheetOpen}
          onOpenChange={setIsNotificationSheetOpen}
          isCollapsed={false}
        />
      </Sidebar>
    </TooltipProvider>
  );
}
