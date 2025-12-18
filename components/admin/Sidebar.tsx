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
import { getAppointmentStats } from "@/action/appointments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface MenuItem {
  name: string;
  href?: string;
  onClick?: () => void;
  description?: string;
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
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    pendingCount: 0,
    upcomingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    rescheduledCount: 0,
    completedCount: 0,
    totalCount: 0,
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, initialized, initialize, clearUser } = useAuthStore();

  // Initialize auth only once when component mounts
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Fetch appointment stats
  const fetchAppointmentStats = async () => {
    try {
      // Only fetch if user is NOT cashier
      if (user?.role !== "cashier") {
        const result = await getAppointmentStats();
        if (result.success && result.stats) {
          setAppointmentStats(result.stats);
        }
      }
    } catch (error) {
      console.error("Failed to fetch appointment stats:", error);
    }
  };

  useEffect(() => {
    fetchAppointmentStats();

    // Set up interval to refresh stats every 30 seconds only for non-cashier roles
    let interval: NodeJS.Timeout | null = null;
    if (user?.role !== "cashier") {
      interval = setInterval(fetchAppointmentStats, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.role]); // Re-run when user role changes

  const handleLogout = async () => {
    try {
      await clearUser();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  // Define menu items based on user role
  const getMenuItems = (): MenuSection[] => {
    const isCashier = user?.role === "cashier";

    if (isCashier) {
      // Cashier only sees Dashboard and Transactions
      return [
        {
          section: "Main Navigation",
          items: [
            {
              name: "Dashboard",
              href: "/admin/admindashboard",
              description: "Overview and analytics",
            },
            {
              name: "Transactions",
              href: "/admin/transaction",
              description: "Process client payments and generate receipts",
            },
          ],
        },
      ];
    }

    // For all other roles (admin, project_manager, etc.), show full menu
    return [
      {
        section: "Main Navigation",
        items: [
          {
            name: "Dashboard",
            href: "/admin/admindashboard",
            description: "Overview and analytics",
          },
          {
            name: "Appointments",
            href: "/admin/appointments",
            description: "Manage client appointments and consultations",
            badgeCount: appointmentStats.pendingCount,
            showBadge: appointmentStats.pendingCount > 0,
          },
          {
            name: "Transactions",
            href: "/admin/transaction",
            description: "Process client payments and generate receipts",
          },
          {
            name: "Projects",
            href: "/admin/admin-project",
            description: "Manage construction projects",
          },
          {
            name: "Catalog",
            href: "/admin/catalog",
            description: "Design catalog management",
          },
          {
            name: "Inventory",
            href: "/admin/inventory",
            description: "Manage inventory items and materials",
          },
          {
            name: "User Management",
            href: "/admin/usermanagement",
            description: "Team and user administration",
          },
          {
            name: "Settings",
            href: "/admin/settings",
            description: "System configuration",
          },
        ],
      },
    ];
  };

  const data = {
    navMain: getMenuItems(),
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

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar {...props} className="border-b">
        <SidebarHeader className="border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full">
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-3">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                      <span className="font-medium">{initial}</span>
                    </div>
                    <div className="flex flex-col gap-1 leading-none">
                      <span className="font-bold">{name}</span>
                      <span className="text-muted-foreground">{role}</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="font-medium">
          {data.navMain.map((item) => (
            <SidebarGroup key={item.section}>
              <SidebarGroupLabel className="font-semibold">
                {item.section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(subItem.href)}
                            className={cn(
                              "flex items-center gap-3 py-3",
                              isActive(subItem.href) &&
                                "bg-gray-300 text-gray-900 !font-semibold"
                            )}
                          >
                            <a href={subItem.href}>
                              <span className="flex-1">{subItem.name}</span>
                              {subItem.name === "Appointments" &&
                                subItem.showBadge && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500 ml-auto" />
                                )}
                            </a>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-gray-800 text-white px-3 py-2 border-0"
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
                              <p className="text-blue-300 mt-1">
                                {subItem.badgeCount} pending appointment
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

          {/* Logout Section */}
          <div className="mt-auto p-2 border-t border-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={handleLogoutClick}
                      className="flex items-center gap-3 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-gray-800 text-white px-3 py-2 border-0"
                    sideOffset={5}
                  >
                    <p className="font-medium">Sign Out</p>
                    <p className="text-gray-300 mt-1">
                      Log out of your account
                    </p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to log in again
              to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 mr-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
