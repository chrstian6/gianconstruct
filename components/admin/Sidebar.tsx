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
  BookOpen,
  Warehouse,
  UserCog,
  Settings,
  Boxes,
  Truck,
  ClipboardList,
  CalendarCheck,
  Receipt,
} from "lucide-react";
import { getAppointmentStats } from "@/action/appointments";

interface MenuItem {
  name: string;
  href?: string;
  onClick?: () => void;
  description?: string;
  isDropdown?: boolean;
  dropdownItems?: { name: string; href: string; description: string }[];
  icon: React.ReactNode;
  badgeCount?: number;
  showBadge?: boolean;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

interface AppointmentStats {
  pendingCount: number;
  upcomingCount: number;
  confirmedCount: number;
  cancelledCount: number;
  rescheduledCount: number;
  completedCount: number;
  totalCount: number;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    pendingCount: 0,
    upcomingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    rescheduledCount: 0,
    completedCount: 0,
    totalCount: 0,
  });
  const pathname = usePathname();
  const { user, loading, initialized, initialize } = useAuthStore();

  // Initialize auth only once when component mounts
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Fetch appointment stats
  const fetchAppointmentStats = async () => {
    try {
      const result = await getAppointmentStats();
      if (result.success && result.stats) {
        setAppointmentStats(result.stats);
      }
    } catch (error) {
      console.error("Failed to fetch appointment stats:", error);
    }
  };

  useEffect(() => {
    fetchAppointmentStats();

    // Set up interval to refresh stats every 30 seconds
    const interval = setInterval(fetchAppointmentStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const data = {
    navMain: [
      {
        section: "Main Navigation",
        items: [
          {
            name: "Dashboard",
            href: "/admin/admindashboard",
            description: "Overview and analytics",
            icon: <LayoutDashboard className="h-5 w-5" />, // Increased from h-4 w-4
          },
          {
            name: "Appointments",
            href: "/admin/appointments",
            description: "Manage client appointments and consultations",
            icon: <CalendarCheck className="h-5 w-5" />, // Increased from h-4 w-4
            badgeCount: appointmentStats.pendingCount,
            showBadge: appointmentStats.pendingCount > 0,
          },
          {
            name: "Transactions",
            href: "/admin/transaction",
            description: "Process client payments and generate receipts",
            icon: <Receipt className="h-5 w-5" />, // Increased from h-4 w-4
          },
          {
            name: "Projects",
            href: "/admin/admin-project",
            description: "Manage construction projects",
            icon: <Briefcase className="h-5 w-5" />, // Increased from h-4 w-4
          },
          {
            name: "Catalog",
            href: "/admin/catalog",
            description: "Design catalog management",
            icon: <BookOpen className="h-5 w-5" />, // Increased from h-4 w-4
          },
          {
            name: "Inventory",
            isDropdown: true,
            description: "Manage inventory items",
            icon: <Warehouse className="h-5 w-5" />, // Increased from h-4 w-4
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
            name: "User Management",
            href: "/admin/usermanagement",
            description: "Team and user administration",
            icon: <UserCog className="h-5 w-5" />, // Increased from h-4 w-4
          },
          {
            name: "Settings",
            href: "/admin/settings",
            description: "System configuration",
            icon: <Settings className="h-5 w-5" />, // Increased from h-4 w-4
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
      case "Materials":
        return <Boxes className="h-4 w-4" />; // Increased from h-3.5 w-3.5
      case "Client Inventory":
        return <ClipboardList className="h-4 w-4" />; // Increased from h-3.5 w-3.5
      case "Suppliers":
        return <Truck className="h-4 w-4" />; // Increased from h-3.5 w-3.5
      default:
        return <Boxes className="h-4 w-4" />; // Increased from h-3.5 w-3.5
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar {...props} className="border-b">
        <SidebarHeader className="border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full">
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-3">
                    {" "}
                    {/* Increased gap */}
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                      {" "}
                      {/* Increased from size-8 to size-10 */}
                      <span className="text-base font-medium">
                        {initial}
                      </span>{" "}
                      {/* Increased from text-sm */}
                    </div>
                    <div className="flex flex-col gap-1 leading-none">
                      {" "}
                      {/* Increased gap */}
                      <span className="font-bold text-base">{name}</span>{" "}
                      {/* Increased text size */}
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        {/* Increased from text-xs */}
                        {role}
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="text-sm font-medium text-900 p-4">
          {" "}
          {/* Increased from text-xs and pl-2 */}
          {data.navMain.map((item) => (
            <SidebarGroup key={item.section}>
              <SidebarGroupLabel className="text-sm font-semibold">
                {" "}
                {/* Increased from text-xs */}
                {item.section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.name} className="text-base">
                      {" "}
                      {/* Increased from text-md */}
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
                                    "text-base flex items-center justify-between w-full py-3", // Increased text size and padding
                                    isDropdownActive(subItem.dropdownItems) &&
                                      "text-gray-900 font-semibold tracking-relaxed"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    {" "}
                                    {/* Increased gap */}
                                    {subItem.icon}
                                    <span className="text-base">
                                      {subItem.name}
                                    </span>{" "}
                                    {/* Increased text size */}
                                    {subItem.showBadge && (
                                      <Badge
                                        variant="destructive"
                                        className="h-3 w-3 p-0 rounded-full min-w-0 ml-1" // Slightly larger badge
                                      />
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />{" "}
                                  {/* Increased from h-3 w-3 */}
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenu className="ml-5 border-l border-border pl-3 text-base">
                                  {" "}
                                  {/* Increased padding and text size */}
                                  {subItem.dropdownItems?.map(
                                    (dropdownItem) => (
                                      <SidebarMenuItem key={dropdownItem.name}>
                                        <SidebarMenuButton
                                          asChild
                                          isActive={isActive(dropdownItem.href)}
                                          className={cn(
                                            "text-base flex items-center gap-3 py-2.5", // Increased text size, gap, and padding
                                            isActive(dropdownItem.href) &&
                                              "bg-gray-300 text-gray-900 !font-semibold"
                                          )}
                                        >
                                          <a href={dropdownItem.href}>
                                            {getDropdownIcon(dropdownItem.name)}
                                            <span>{dropdownItem.name}</span>
                                          </a>
                                        </SidebarMenuButton>
                                      </SidebarMenuItem>
                                    )
                                  )}
                                </SidebarMenu>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(subItem.href)}
                              className={cn(
                                "flex items-center gap-3 text-base py-3", // Increased text size, gap, and padding
                                isActive(subItem.href) &&
                                  "bg-gray-300 text-gray-900 !font-semibold"
                              )}
                            >
                              <a href={subItem.href}>
                                {subItem.icon}
                                <span className="flex-1 text-base">
                                  {subItem.name}
                                </span>{" "}
                                {/* Increased text size */}
                                {subItem.badgeCount !== undefined &&
                                  subItem.badgeCount > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="ml-auto h-6 min-w-6 flex items-center justify-center px-1.5 text-sm" // Increased size
                                    >
                                      {subItem.badgeCount}
                                    </Badge>
                                  )}
                                {subItem.showBadge &&
                                  subItem.badgeCount === 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="h-3 w-3 p-0 rounded-full min-w-0 ml-auto" // Slightly larger badge
                                    />
                                  )}
                              </a>
                            </SidebarMenuButton>
                          )}
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-gray-800 text-white text-sm px-3 py-2 border-0" // Increased text size and padding
                          sideOffset={5}
                        >
                          <p className="font-medium">{subItem.name}</p>
                          {subItem.description && (
                            <p className="text-gray-300 mt-1">
                              {subItem.description}
                            </p>
                          )}
                          {subItem.badgeCount !== undefined &&
                            subItem.badgeCount > 0 && (
                              <p className="text-red-300 mt-1">
                                {subItem.badgeCount} new appointment
                                {subItem.badgeCount !== 1 ? "s" : ""}
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
      </Sidebar>
    </TooltipProvider>
  );
}
