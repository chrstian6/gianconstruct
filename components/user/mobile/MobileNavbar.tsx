"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Calendar,
  Home,
  CheckCheck,
  Loader2,
  Clock,
  Phone,
  Video,
  MapPin,
  FileText,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Search,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/action/notification";
import { useAuthStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

interface MobileNavbarProps {
  breadcrumbItems?: {
    label: string;
    href?: string;
    isCurrent?: boolean;
  }[];
  onAppointmentsClick?: () => void;
  onSearchClick?: () => void;
  showSearch?: boolean;
  showMenu?: boolean;
}

// Proper Notification interface that matches the backend response
interface Notification {
  _id: string;
  userId?: string;
  userEmail?: string;
  feature:
    | "appointments"
    | "projects"
    | "payments"
    | "documents"
    | "system"
    | "general"
    | "invoices"
    | "pdc";
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
  actionUrl?: string;
  actionLabel?: string;
  notificationType?: "admin" | "user";
  targetUserRoles?: string[];

  // Feature-specific metadata
  appointmentMetadata?: {
    inquiryId?: string;
    appointmentId?: string;
    originalDate?: string;
    originalTime?: string;
    reason?: string;
    notes?: string;
    newDate?: string;
    newTime?: string;
    meetingType?: string;
  };
  projectMetadata?: {
    projectId?: string;
    projectName?: string;
    milestone?: string;
    progress?: number;
  };
  paymentMetadata?: {
    paymentId?: string;
    amount?: number;
    currency?: string;
    method?: string;
    status?: string;
  };
  pdcMetadata?: {
    checkNumber?: string;
    supplier?: string;
    amount?: number;
    status?: string;
  };
}

// Cache for notifications
const notificationCache = new Map();

export function MobileNavbar({
  breadcrumbItems = [],
  onAppointmentsClick,
  onSearchClick,
  showSearch = true,
  showMenu = true,
}: MobileNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user data from auth store
  const { user, clearUser } = useAuthStore();
  const userId = user?.user_id;
  const userEmail = user?.email;
  const userRole = "user" as const;
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email?.split("@")[0] || "User";

  // Fetch user notifications with caching
  const fetchNotifications = useCallback(
    async (forceRefresh = false) => {
      if (!userId || !userEmail) {
        console.log("❌ No user ID or email - user may not be logged in");
        setNotifications([]);
        return;
      }

      const cacheKey = `user_notifications_${userId}`;
      const now = Date.now();
      const cacheExpiry = 2 * 60 * 1000; // 2 minutes cache

      // Check cache if not forcing refresh
      if (!forceRefresh && notificationCache.has(cacheKey)) {
        const cached = notificationCache.get(cacheKey);
        if (now - cached.timestamp < cacheExpiry) {
          console.log("📦 Using cached notifications for user");
          setNotifications(cached.data);
          return;
        }
      }

      // Set appropriate loading state
      if (notificationsOpen) {
        setLoading(true);
      } else {
        setBackgroundLoading(true);
      }

      try {
        console.log("🔔 Fetching USER notifications for:", {
          userId,
          userEmail,
          userRole,
        });

        const result = await getNotifications({
          currentUserRole: userRole,
          currentUserId: userId,
          currentUserEmail: userEmail,
          page: 1,
          limit: 100,
        });

        console.log("📊 USER Notification fetch result:", {
          success: result.success,
          count: result.notifications?.length,
          error: result.error,
        });

        if (result.success && result.notifications) {
          console.log(
            "✅ USER Notifications fetched successfully:",
            result.notifications.length
          );

          // Type guard to ensure notifications match our interface
          const allNotifications: Notification[] = result.notifications.map(
            (n: any) => ({
              _id: n._id || n.id || "",
              userId: n.userId,
              userEmail: n.userEmail,
              feature: n.feature || "general",
              type: n.type || "general_message",
              title: n.title || "Notification",
              message: n.message || "",
              priority: n.priority || "medium",
              isRead: n.isRead || false,
              createdAt: n.createdAt || new Date().toISOString(),
              timeAgo: n.timeAgo || "Recently",
              actionUrl: n.actionUrl,
              actionLabel: n.actionLabel,
              notificationType: n.notificationType,
              targetUserRoles: n.targetUserRoles,
              appointmentMetadata: n.appointmentMetadata,
              projectMetadata: n.projectMetadata,
              paymentMetadata: n.paymentMetadata,
              pdcMetadata: n.pdcMetadata || n.metadata?.pdcMetadata,
            })
          );

          // Filter to show only user notifications (client-side filtering)
          const userNotifications = allNotifications.filter((n) => {
            if (n.notificationType === "user") {
              return true;
            }

            if (n.notificationType === "admin") {
              console.log("🚫 Skipping admin notification:", n._id, n.title);
              return false;
            }

            if (n.userId && n.userId === userId) {
              console.log(
                "✅ Found user notification by userId:",
                n._id,
                n.title
              );
              return true;
            }

            if (n.userEmail && n.userEmail === userEmail) {
              console.log(
                "✅ Found user notification by userEmail:",
                n._id,
                n.title
              );
              return true;
            }

            if (n.targetUserRoles && n.targetUserRoles.includes("admin")) {
              console.log(
                "🚫 Skipping admin-targeted notification:",
                n._id,
                n.title
              );
              return false;
            }

            if (!n.notificationType && (n.userId || n.userEmail)) {
              console.log(
                "⚠️ Notification missing notificationType, checking user match:",
                n._id
              );
              if (n.userId === userId || n.userEmail === userEmail) {
                return true;
              }
            }

            console.log(
              "🚫 Skipping unknown notification:",
              n._id,
              n.title,
              n.notificationType
            );
            return false;
          });

          console.log(
            "👤 USER-only notifications after filtering:",
            userNotifications.length,
            "out of",
            allNotifications.length
          );

          // Sort notifications: unread first, then by date (newest first)
          userNotifications.sort((a, b) => {
            if (!a.isRead && b.isRead) return -1;
            if (a.isRead && !b.isRead) return 1;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          setNotifications(userNotifications);

          // Update cache
          notificationCache.set(cacheKey, {
            data: userNotifications,
            timestamp: now,
          });

          setLastFetchTime(now);
        } else {
          console.error("❌ Error fetching USER notifications:", result.error);
          setNotifications([]);
        }
      } catch (error) {
        console.error("❌ Error fetching USER notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
        setBackgroundLoading(false);
      }
    },
    [userId, userEmail, notificationsOpen]
  );

  // Mark notification as read
  const handleNotificationClick = async (notificationId: string) => {
    if (!notificationId || !userId || !userEmail) return;

    setMarkingAsRead(notificationId);
    try {
      console.log("📝 Marking USER notification as read:", {
        notificationId,
        userId,
        userEmail,
      });

      const result = await markNotificationAsRead(
        notificationId,
        userRole,
        userId,
        userEmail
      );

      if (result.success) {
        console.log("✅ USER Notification marked as read successfully");

        const updatedNotifications = notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifications);

        const cacheKey = `user_notifications_${userId}`;
        if (notificationCache.has(cacheKey)) {
          notificationCache.set(cacheKey, {
            data: updatedNotifications,
            timestamp: lastFetchTime,
          });
        }
      } else {
        console.error(
          "❌ Failed to mark USER notification as read:",
          result.error
        );
      }
    } catch (error) {
      console.error("❌ Error marking USER notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!userId || !userEmail) {
      console.log("❌ No user ID or email - cannot mark notifications as read");
      return;
    }

    try {
      console.log("📝 Marking all USER notifications as read for:", {
        userId,
        userEmail,
      });

      const result = await markAllNotificationsAsRead(
        userId,
        userRole,
        userEmail
      );

      if (result.success) {
        console.log("✅ All USER notifications marked as read successfully");

        const updatedNotifications = notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        setNotifications(updatedNotifications);

        const cacheKey = `user_notifications_${userId}`;
        if (notificationCache.has(cacheKey)) {
          notificationCache.set(cacheKey, {
            data: updatedNotifications,
            timestamp: lastFetchTime,
          });
        }
      } else {
        console.error(
          "❌ Failed to mark all USER notifications as read:",
          result.error
        );
      }
    } catch (error) {
      console.error("❌ Error marking all USER notifications as read:", error);
    }
  };

  // Initial fetch when component mounts and user is available
  useEffect(() => {
    if (userId && userEmail) {
      console.log("🚀 Initial USER notification fetch:", { userId, userEmail });
      fetchNotifications();
    } else {
      console.log(
        "⚠️ No user credentials available, skipping notification fetch"
      );
      setNotifications([]);
    }
  }, [userId, userEmail, fetchNotifications]);

  // Set up periodic background refresh
  useEffect(() => {
    if (!userId || !userEmail) return;

    const interval = setInterval(
      () => {
        console.log("🔄 Background USER notification refresh");
        fetchNotifications();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [userId, userEmail, fetchNotifications]);

  // Fetch when dropdown opens
  useEffect(() => {
    if (notificationsOpen && userId && userEmail) {
      console.log(
        "📂 USER Notification dropdown opened, fetching notifications"
      );
      const cacheKey = `user_notifications_${userId}`;
      if (notificationCache.has(cacheKey)) {
        const cached = notificationCache.get(cacheKey);
        setNotifications(cached.data);
      }
      fetchNotifications();
    }
  }, [notificationsOpen, userId, userEmail, fetchNotifications]);

  // Clear cache when user changes
  useEffect(() => {
    if (userId) {
      const allKeys = Array.from(notificationCache.keys());
      allKeys.forEach((key) => {
        if (!key.includes(userId)) {
          notificationCache.delete(key);
        }
      });
    }
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Generate breadcrumb items based on current path
  const generateBreadcrumbItems = () => {
    if (breadcrumbItems.length > 0) {
      return breadcrumbItems;
    }

    const pathSegments = pathname.split("/").filter((segment) => segment);

    if (pathSegments.length === 0) {
      return [{ label: "Home", href: "/user/userdashboard", isCurrent: true }];
    }

    const items = [];

    // Always start with Home
    items.push({
      label: "Home",
      href: "/user/userdashboard",
      isCurrent: pathname === "/user/userdashboard",
    });

    // Add other segments based on path
    if (pathname.includes("/catalog")) {
      items.push({
        label: "Explore Catalog",
        href: "/user/catalog",
        isCurrent: pathname === "/user/catalog",
      });
    }

    if (pathname.includes("/projects/active")) {
      items.push({
        label: "Active Projects",
        href: "/user/projects/active",
        isCurrent: pathname === "/user/projects/active",
      });
    }

    if (pathname.includes("/projects/completed")) {
      items.push({
        label: "Completed Projects",
        href: "/user/projects/completed",
        isCurrent: pathname === "/user/projects/completed",
      });
    }

    return items;
  };

  // Get notification icon based on feature and type
  const getNotificationIcon = (notification: Notification) => {
    const iconClass = "h-4 w-4";

    switch (notification.feature) {
      case "appointments":
        return <Calendar className={cn(iconClass, "text-amber-600")} />;
      case "projects":
        return <FileText className={cn(iconClass, "text-amber-600")} />;
      case "payments":
        return <DollarSign className={cn(iconClass, "text-amber-600")} />;
      case "documents":
        return <FileText className={cn(iconClass, "text-amber-600")} />;
      case "system":
        return <AlertTriangle className={cn(iconClass, "text-amber-600")} />;
      case "general":
        return <MessageSquare className={cn(iconClass, "text-amber-600")} />;
      case "pdc":
        return <FileText className={cn(iconClass, "text-amber-600")} />;
      case "invoices":
        return <DollarSign className={cn(iconClass, "text-amber-600")} />;
      default:
        return <Bell className={cn(iconClass, "text-amber-600")} />;
    }
  };

  // Get meeting type icon
  const getMeetingTypeIcon = (meetingType?: string) => {
    if (!meetingType) return null;

    const iconClass = "h-3 w-3 text-gray-500";
    switch (meetingType) {
      case "phone":
        return <Phone className={iconClass} />;
      case "video":
        return <Video className={iconClass} />;
      case "onsite":
        return <MapPin className={iconClass} />;
      default:
        return <Phone className={iconClass} />;
    }
  };

  // Handle notification item click
  const handleNotificationItemClick = (notification: Notification) => {
    console.log("🖱️ USER Notification clicked:", {
      id: notification._id,
      type: notification.type,
      feature: notification.feature,
      notificationType: notification.notificationType,
      targetUserRoles: notification.targetUserRoles,
      isRead: notification.isRead,
    });

    if (!notification.isRead) {
      handleNotificationClick(notification._id);
    }

    if (notification.actionUrl) {
      console.log("📍 Navigating to action URL:", notification.actionUrl);
      router.push(notification.actionUrl);
    } else {
      switch (notification.feature) {
        case "appointments":
          console.log("📅 Navigating to appointments");
          // Open appointments section
          if (onAppointmentsClick) {
            onAppointmentsClick();
          } else {
            router.push("/user/userdashboard?tab=appointments");
          }
          break;
        case "projects":
          console.log("🏗️ Navigating to projects");
          router.push("/user/projects/active");
          break;
        case "payments":
        case "invoices":
          console.log("💰 Navigating to payments");
          router.push("/user/userdashboard?tab=payments");
          break;
        case "pdc":
          console.log(
            "🏢 Navigating to dashboard (PDC notifications are admin-only)"
          );
          router.push("/user/userdashboard");
          break;
        default:
          console.log("🏠 Navigating to dashboard");
          router.push("/user/userdashboard");
      }
    }

    setNotificationsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await clearUser();
      router.push("/authentication-login");
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = () => {
    if (onSearchClick) {
      onSearchClick();
    } else if (searchQuery.trim()) {
      router.push(`/user/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleDefaultAppointmentsClick = () => {
    if (onAppointmentsClick) {
      onAppointmentsClick();
    } else {
      router.push("/user/userdashboard?tab=appointments");
    }
  };

  const breadcrumbs = generateBreadcrumbItems();

  // Mobile menu content
  const MobileMenu = () => (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 ease-in-out lg:hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-zinc-900">{userName}</p>
                <p className="text-sm text-zinc-500">Customer</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-zinc-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            <button
              onClick={() => {
                router.push("/user/userdashboard");
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                pathname === "/user/userdashboard"
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                router.push("/user/catalog");
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                pathname.includes("/catalog")
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <Search className="h-5 w-5" />
              <span className="font-medium">Explore Catalog</span>
            </button>

            <button
              onClick={() => {
                router.push("/user/projects/active");
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                pathname.includes("/projects")
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <Building className="h-5 w-5" />
              <span className="font-medium">My Projects</span>
            </button>

            <button
              onClick={() => {
                router.push("/user/transaction");
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                pathname.includes("/transaction")
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Transactions</span>
            </button>

            <button
              onClick={() => {
                handleDefaultAppointmentsClick();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-zinc-50 text-zinc-700"
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Appointments</span>
            </button>

            <button
              onClick={() => {
                router.push("/user/documents");
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-zinc-50 text-zinc-700"
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Documents</span>
            </button>

            <button
              onClick={() => {
                router.push("/user/messages");
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-zinc-50 text-zinc-700"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">Messages</span>
            </button>

            <button
              onClick={() => {
                router.push("/user/settings");
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-zinc-50 text-zinc-700"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <MobileMenu />

      {/* Main Navigation Bar */}
      <nav className="flex items-center sticky border-b border-zinc-200 top-0 justify-between h-16 px-4 lg:px-6 bg-white z-30">
        {/* Left side - Menu button and Breadcrumb */}
        <div className="flex items-center gap-2">
          {showMenu && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-zinc-100 rounded-lg lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <SidebarTrigger className="hidden lg:inline-flex mr-4" />

          <Breadcrumb className="hidden lg:block">
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.href && !item.isCurrent ? (
                      <BreadcrumbLink href={item.href}>
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Mobile title */}
          <div className="lg:hidden">
            <h1 className="font-bold text-lg text-zinc-900">
              {breadcrumbs[breadcrumbs.length - 1]?.label ||
                "Gian Construction"}
            </h1>
            <p className="text-xs text-zinc-500 truncate">Customer Dashboard</p>
          </div>
        </div>

        {/* Center - Search (desktop) */}
        {showSearch && (
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search projects, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full"
                >
                  <X className="h-3 w-3 text-zinc-500" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          {showSearch && (
            <button
              onClick={
                onSearchClick ||
                (() => {
                  // Default search behavior
                  router.push("/user/search");
                })
              }
              className="p-2 hover:bg-zinc-100 rounded-lg lg:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Appointments Button - Desktop */}
          {onAppointmentsClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDefaultAppointmentsClick}
              className="hidden lg:flex items-center gap-2 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
            >
              <Calendar className="h-4 w-4" />
              <span>Appointments</span>
            </Button>
          )}

          {/* Notifications Dropdown */}
          <DropdownMenu
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 hover:bg-transparent"
                disabled={backgroundLoading}
              >
                <div className="relative">
                  <Bell className="h-5 w-5 text-zinc-700 hover:text-amber-600 transition-colors" />

                  {userId && unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 min-w-0 p-0 flex items-center justify-center rounded-full bg-amber-500 border-2 border-background text-[10px] font-bold text-white shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}

                  {backgroundLoading && (
                    <div className="absolute -bottom-1 -right-1">
                      <div className="h-2 w-2 bg-amber-500 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-96 max-h-[80vh] overflow-hidden rounded-none border border-zinc-200 shadow-lg"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-zinc-900">
                      Your Notifications
                    </h3>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {userId && userEmail
                        ? `${notifications.length} total • ${unreadCount} unread`
                        : "Please log in to view notifications"}
                      {backgroundLoading && " • Refreshing..."}
                    </p>
                  </div>
                  {userId && unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-7 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      disabled={loading}
                    >
                      <CheckCheck className="h-3 w-3 mr-1.5" />
                      Mark all as read
                    </Button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {!userId || !userEmail ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell className="h-12 w-12 text-zinc-300 mb-3" />
                    <p className="text-sm font-medium text-zinc-600 mb-1">
                      Please Log In
                    </p>
                    <p className="text-xs text-zinc-500">
                      Notifications are available for registered users with
                      active accounts.
                    </p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                    <p className="text-sm text-zinc-500">
                      Loading your notifications...
                    </p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-zinc-100">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification._id}
                        className={cn(
                          "p-4 cursor-pointer transition-colors focus:bg-zinc-50 focus:text-zinc-900",
                          !notification.isRead && "bg-zinc-50"
                        )}
                        onClick={() =>
                          handleNotificationItemClick(notification)
                        }
                        disabled={markingAsRead === notification._id}
                      >
                        <div className="flex items-start gap-3 w-full">
                          {/* Icon Container */}
                          <div
                            className={cn(
                              "flex-shrink-0 w-10 h-10 flex items-center justify-center",
                              !notification.isRead
                                ? "bg-amber-50 border border-amber-100"
                                : "bg-zinc-50 border border-zinc-100"
                            )}
                          >
                            {getNotificationIcon(notification)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span
                                className={cn(
                                  "text-sm font-semibold line-clamp-1",
                                  !notification.isRead
                                    ? "text-zinc-900"
                                    : "text-zinc-600"
                                )}
                              >
                                {notification.title}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {markingAsRead === notification._id && (
                                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                                )}
                                <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {notification.timeAgo}
                                </span>
                              </div>
                            </div>

                            {/* Message */}
                            <p
                              className={cn(
                                "text-sm leading-relaxed line-clamp-2 mb-2",
                                !notification.isRead
                                  ? "text-zinc-700"
                                  : "text-zinc-500"
                              )}
                            >
                              {notification.message}
                            </p>

                            {/* Metadata Tags */}
                            <div className="flex items-center gap-2">
                              {(notification.notificationType ||
                                notification.targetUserRoles) && (
                                <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600">
                                  {notification.notificationType === "admin"
                                    ? "Admin"
                                    : notification.targetUserRoles?.includes(
                                          "admin"
                                        )
                                      ? "Admin System"
                                      : "User"}
                                </span>
                              )}
                              {notification.appointmentMetadata
                                ?.meetingType && (
                                <div className="flex items-center gap-1 text-xs text-zinc-500">
                                  {getMeetingTypeIcon(
                                    notification.appointmentMetadata.meetingType
                                  )}
                                  <span className="capitalize">
                                    {
                                      notification.appointmentMetadata
                                        .meetingType
                                    }
                                  </span>
                                </div>
                              )}
                              {notification.projectMetadata?.projectName && (
                                <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600">
                                  {notification.projectMetadata.projectName}
                                </span>
                              )}
                              {notification.paymentMetadata?.amount && (
                                <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600">
                                  ₱
                                  {notification.paymentMetadata.amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="flex-shrink-0 mt-1.5">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                            </div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell className="h-12 w-12 text-zinc-300 mb-3" />
                    <p className="text-sm font-medium text-zinc-600 mb-1">
                      No notifications yet
                    </p>
                    <p className="text-xs text-zinc-500">
                      You're all caught up! New updates about your appointments
                      and projects will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Refresh Button */}
              {userId && notifications.length > 0 && (
                <div className="border-t border-zinc-100 p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                    onClick={() => fetchNotifications(true)}
                    disabled={loading || backgroundLoading}
                  >
                    {loading || backgroundLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                      <Bell className="h-3.5 w-3.5 mr-2" />
                    )}
                    Refresh Notifications
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden lg:flex items-center gap-3 p-2 hover:bg-zinc-100 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">
                    {userName}
                  </p>
                  <p className="text-xs text-zinc-500">Customer</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/user/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/user/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
}
