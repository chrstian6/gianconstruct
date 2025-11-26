// components/user/UserNavbar.tsx - FIXED NOTIFICATION FETCHING
"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/action/notification";
import { useAuthStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

interface UserNavbarProps {
  breadcrumbItems?: {
    label: string;
    href?: string;
    isCurrent?: boolean;
  }[];
  onAppointmentsClick?: () => void;
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
    | "general";
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
  actionUrl?: string;
  actionLabel?: string;

  // Feature-specific metadata (make optional)
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
}

// Cache for notifications
const notificationCache = new Map();

export function UserNavbar({
  breadcrumbItems = [],
  onAppointmentsClick,
}: UserNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Get user data from auth store
  const { user } = useAuthStore();
  const userId = user?.user_id;
  const userRole = "user" as const;

  // Fetch user notifications with caching - FIXED QUERY
  const fetchNotifications = useCallback(
    async (forceRefresh = false) => {
      if (!userId) {
        console.log("❌ No user ID provided - user may not be registered");
        setNotifications([]);
        return;
      }

      const cacheKey = `notifications_${userId}`;
      const now = Date.now();
      const cacheExpiry = 2 * 60 * 1000; // 2 minutes cache

      // Check cache if not forcing refresh
      if (!forceRefresh && notificationCache.has(cacheKey)) {
        const cached = notificationCache.get(cacheKey);
        if (now - cached.timestamp < cacheExpiry) {
          console.log("📦 Using cached notifications");
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
        console.log("🔔 Fetching notifications for user ID:", userId);

        // FIXED: Use proper query parameters that match the notification service
        const result = await getNotifications({
          currentUserRole: userRole,
          currentUserId: userId, // This is the key parameter for user-specific notifications
          page: 1,
          limit: 50,
        });

        console.log("📊 Notification fetch result:", {
          success: result.success,
          count: result.notifications?.length,
          error: result.error,
        });

        if (result.success && result.notifications) {
          console.log(
            "✅ Notifications fetched successfully:",
            result.notifications.length
          );

          // Type guard to ensure notifications match our interface
          const validNotifications: Notification[] = result.notifications.map(
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
              appointmentMetadata: n.appointmentMetadata,
              projectMetadata: n.projectMetadata,
              paymentMetadata: n.paymentMetadata,
            })
          );

          console.log(
            "📝 Processed notifications:",
            validNotifications.map((n) => ({
              id: n._id,
              type: n.type,
              feature: n.feature,
              isRead: n.isRead,
              title: n.title,
            }))
          );

          setNotifications(validNotifications);

          // Update cache
          notificationCache.set(cacheKey, {
            data: validNotifications,
            timestamp: now,
          });

          setLastFetchTime(now);
        } else {
          console.error("❌ Error fetching notifications:", result.error);
          setNotifications([]);
        }
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
        setBackgroundLoading(false);
      }
    },
    [userId, notificationsOpen, userRole]
  );

  // Mark notification as read - FIXED FUNCTION CALL
  const handleNotificationClick = async (notificationId: string) => {
    if (!notificationId || !userId) return;

    setMarkingAsRead(notificationId);
    try {
      console.log("📝 Marking notification as read:", notificationId);

      // FIXED: Call the correct function with proper parameters
      const result = await markNotificationAsRead(
        notificationId,
        userRole,
        userId
      );

      if (result.success) {
        console.log("✅ Notification marked as read successfully");

        // Update local state and cache
        const updatedNotifications = notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifications);

        // Update cache
        const cacheKey = `notifications_${userId}`;
        notificationCache.set(cacheKey, {
          data: updatedNotifications,
          timestamp: lastFetchTime,
        });
      } else {
        console.error("❌ Failed to mark notification as read:", result.error);
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Mark all notifications as read - FIXED FUNCTION CALL
  const handleMarkAllAsRead = async () => {
    if (!userId) {
      console.log("❌ No user ID - cannot mark notifications as read");
      return;
    }

    try {
      console.log("📝 Marking all notifications as read for user:", userId);

      // FIXED: Call the correct function with proper parameters
      const result = await markAllNotificationsAsRead(userId, userRole);

      if (result.success) {
        console.log("✅ All notifications marked as read successfully");

        // Update local state and cache
        const updatedNotifications = notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        setNotifications(updatedNotifications);

        // Update cache
        const cacheKey = `notifications_${userId}`;
        notificationCache.set(cacheKey, {
          data: updatedNotifications,
          timestamp: lastFetchTime,
        });
      } else {
        console.error(
          "❌ Failed to mark all notifications as read:",
          result.error
        );
      }
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
    }
  };

  // Initial fetch when component mounts and user is available
  useEffect(() => {
    if (userId) {
      console.log("🚀 Initial notification fetch for user:", userId);
      fetchNotifications();
    } else {
      console.log("⚠️ No user ID available, skipping notification fetch");
    }
  }, [userId, fetchNotifications]);

  // Set up periodic background refresh
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(
      () => {
        console.log("🔄 Background notification refresh");
        fetchNotifications();
      },
      5 * 60 * 1000
    ); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  // Fetch when dropdown opens (with potential cache)
  useEffect(() => {
    if (notificationsOpen && userId) {
      console.log("📂 Notification dropdown opened, fetching notifications");
      // Use cached data immediately, then refresh in background
      const cacheKey = `notifications_${userId}`;
      if (notificationCache.has(cacheKey)) {
        const cached = notificationCache.get(cacheKey);
        setNotifications(cached.data);
      }
      fetchNotifications();
    }
  }, [notificationsOpen, userId, fetchNotifications]);

  // Clear cache when user changes
  useEffect(() => {
    if (userId) {
      // Clear cache for previous user if any
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
    switch (notification.feature) {
      case "appointments":
        switch (notification.type) {
          case "appointment_confirmed":
            return <Calendar className="h-4 w-4 text-green-600" />;
          case "appointment_cancelled":
            return <Calendar className="h-4 w-4 text-red-600" />;
          case "appointment_rescheduled":
            return <Calendar className="h-4 w-4 text-amber-600" />;
          case "appointment_completed":
            return <Calendar className="h-4 w-4 text-blue-600" />;
          default:
            return <Calendar className="h-4 w-4 text-gray-600" />;
        }
      case "projects":
        switch (notification.type) {
          case "project_created":
            return <FileText className="h-4 w-4 text-blue-600" />;
          case "project_confirmed":
            return <FileText className="h-4 w-4 text-green-600" />;
          case "project_completed":
            return <FileText className="h-4 w-4 text-purple-600" />;
          case "project_cancelled":
            return <FileText className="h-4 w-4 text-red-600" />;
          case "milestone_reached":
            return <FileText className="h-4 w-4 text-amber-600" />;
          default:
            return <FileText className="h-4 w-4 text-blue-600" />;
        }
      case "payments":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "documents":
        return <FileText className="h-4 w-4 text-amber-600" />;
      case "system":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "general":
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get meeting type icon
  const getMeetingTypeIcon = (meetingType?: string) => {
    if (!meetingType)
      return <Phone className="h-3.5 w-3.5 text-muted-foreground" />;

    switch (meetingType) {
      case "phone":
        return <Phone className="h-3.5 w-3.5 text-muted-foreground" />;
      case "video":
        return <Video className="h-3.5 w-3.5 text-muted-foreground" />;
      case "onsite":
        return <MapPin className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return <Phone className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  // Handle notification item click
  const handleNotificationItemClick = (notification: Notification) => {
    console.log("🖱️ Notification clicked:", {
      id: notification._id,
      type: notification.type,
      feature: notification.feature,
      isRead: notification.isRead,
    });

    if (!notification.isRead) {
      handleNotificationClick(notification._id);
    }

    // Handle notification action if available
    if (notification.actionUrl) {
      console.log("📍 Navigating to action URL:", notification.actionUrl);
      router.push(notification.actionUrl);
    } else {
      // Default navigation based on feature
      switch (notification.feature) {
        case "appointments":
          console.log("📅 Navigating to appointments");
          router.push("/user/userdashboard?tab=appointments");
          break;
        case "projects":
          console.log("🏗️ Navigating to projects");
          router.push("/user/projects/active");
          break;
        case "payments":
          console.log("💰 Navigating to payments");
          router.push("/user/userdashboard?tab=payments");
          break;
        default:
          console.log("🏠 Navigating to dashboard");
          router.push("/user/userdashboard");
      }
    }

    setNotificationsOpen(false);
  };

  const breadcrumbs = generateBreadcrumbItems();

  return (
    <nav className="flex items-center sticky border-b top-0 justify-between h-16 px-6 bg-background z-40">
      {/* Breadcrumb */}
      <div className="flex items-center">
        <SidebarTrigger className="mr-4" />
        <Breadcrumb>
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
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <DropdownMenu
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              disabled={backgroundLoading}
            >
              <Bell className="h-5 w-5" />
              {userId && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
              {backgroundLoading && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-96 max-h-[80vh] overflow-hidden"
          >
            <DropdownMenuLabel className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-base">My Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {userId
                    ? `${notifications.length} total • ${unreadCount} unread`
                    : "Please log in to view notifications"}
                  {backgroundLoading && " • Refreshing..."}
                </p>
              </div>
              {userId && unreadCount > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 text-xs"
                    disabled={loading}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all
                  </Button>
                </div>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <div className="max-h-96 overflow-y-auto">
              {!userId ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Please Log In
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notifications are available for registered users with active
                    accounts.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading your notifications...
                  </p>
                </div>
              ) : notifications.length > 0 ? (
                <DropdownMenuGroup>
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification._id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors focus:bg-accent relative border-l-2",
                        !notification.isRead
                          ? "border-l-blue-500 bg-blue-50/50"
                          : "border-l-transparent"
                      )}
                      onClick={() => handleNotificationItemClick(notification)}
                      disabled={markingAsRead === notification._id}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "text-sm font-semibold line-clamp-1",
                                !notification.isRead
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {notification.title}
                            </span>
                            {markingAsRead === notification._id && (
                              <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />
                            )}
                          </div>

                          {/* Message */}
                          <p
                            className={cn(
                              "text-sm leading-relaxed line-clamp-2",
                              !notification.isRead
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {notification.message}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {notification.appointmentMetadata
                                ?.meetingType && (
                                <div className="flex items-center gap-1">
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
                                <Badge variant="outline" className="text-xs">
                                  {notification.projectMetadata.projectName}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{notification.timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    No notifications yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You're all caught up! New updates about your appointments
                    and projects will appear here.
                  </p>
                </div>
              )}
            </div>

            {userId && notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={() => fetchNotifications(true)}
                    disabled={loading || backgroundLoading}
                  >
                    {loading || backgroundLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : null}
                    Refresh Notifications
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Appointments Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onAppointmentsClick}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          <span>Appointments</span>
        </Button>
      </div>
    </nav>
  );
}
