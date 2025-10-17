// components/user/UserNavbar.tsx
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
  Search,
  CheckCheck,
  Loader2,
  Clock,
  Phone,
  Video,
  MapPin,
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
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/action/appointments";
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

// Cache for notifications
const notificationCache = new Map();

export function UserNavbar({
  breadcrumbItems = [],
  onAppointmentsClick,
}: UserNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Get user data from auth store
  const { user } = useAuthStore();
  const userId = user?.user_id;
  const userEmail = user?.email;

  // Fetch user notifications with caching - ONLY for registered users with userId
  const fetchNotifications = useCallback(
    async (forceRefresh = false) => {
      if (!userId) {
        console.log("No user ID provided - user may not be registered");
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
          console.log("Using cached notifications");
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
        console.log("Fetching notifications for user ID:", userId);
        const result = await getUserNotifications(userId);
        if (result.success) {
          console.log(
            "Notifications fetched successfully:",
            result.notifications?.length
          );
          const newNotifications = result.notifications || [];
          setNotifications(newNotifications);

          // Update cache
          notificationCache.set(cacheKey, {
            data: newNotifications,
            timestamp: now,
          });

          setLastFetchTime(now);
        } else {
          console.error("Error fetching notifications:", result.error);
          setNotifications([]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
        setBackgroundLoading(false);
      }
    },
    [userId, notificationsOpen]
  );

  // Mark notification as read
  const handleNotificationClick = async (notificationId: string) => {
    if (!notificationId) return;

    setMarkingAsRead(notificationId);
    try {
      console.log("Marking notification as read:", notificationId);
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        // Update local state and cache
        const updatedNotifications = notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifications);

        // Update cache
        if (userId) {
          const cacheKey = `notifications_${userId}`;
          notificationCache.set(cacheKey, {
            data: updatedNotifications,
            timestamp: lastFetchTime,
          });
        }

        console.log("Notification marked as read successfully");
      } else {
        console.error("Failed to mark notification as read:", result.error);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Mark all notifications as read - ONLY for registered users with userId
  const handleMarkAllAsRead = async () => {
    if (!userId) {
      console.log("No user ID - cannot mark notifications as read");
      return;
    }

    try {
      console.log("Marking all notifications as read for user:", userId);
      const result = await markAllNotificationsAsRead(userId);
      if (result.success) {
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

        console.log("All notifications marked as read successfully");
      } else {
        console.error(
          "Failed to mark all notifications as read:",
          result.error
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Initial fetch when component mounts and user is available
  useEffect(() => {
    if (userId) {
      console.log("Initial notification fetch for user:", userId);
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Set up periodic background refresh
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(
      () => {
        console.log("Background notification refresh");
        fetchNotifications();
      },
      5 * 60 * 1000
    ); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  // Fetch when dropdown opens (with potential cache)
  useEffect(() => {
    if (notificationsOpen && userId) {
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

  // Format notification time for display
  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return "Recently";
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment_confirmed":
        return <CheckCheck className="h-4 w-4 text-green-600" />;
      case "appointment_cancelled":
        return <Clock className="h-4 w-4 text-red-600" />;
      case "appointment_rescheduled":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "appointment_completed":
        return <CheckCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get meeting type icon
  const getMeetingTypeIcon = (meetingType: string) => {
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
  const handleNotificationItemClick = (notification: any) => {
    if (!notification.isRead) {
      handleNotificationClick(notification.id);
    }
    setNotificationsOpen(false);

    // Optional: Add navigation based on notification type
    if (
      notification.type === "appointment_confirmed" ||
      notification.type === "appointment_rescheduled" ||
      notification.type === "appointment_cancelled"
    ) {
      router.push("/user/userdashboard?tab=appointments");
    }
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
                  {unreadCount}
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
                <h3 className="font-semibold text-base">Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {userId
                    ? `${notifications.length} total`
                    : "Registered users only"}
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
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount}
                  </Badge>
                </div>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <div className="max-h-96 overflow-y-auto">
              {!userId ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Registered Users Only
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
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length > 0 ? (
                <DropdownMenuGroup>
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors focus:bg-accent relative",
                        !notification.isRead && "bg-accent/50"
                      )}
                      onClick={() => handleNotificationItemClick(notification)}
                      disabled={markingAsRead === notification.id}
                    >
                      {/* Blue dot for unread notifications */}
                      {!notification.isRead && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full" />
                      )}

                      <div className="flex items-start gap-3 w-full">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
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
                            {markingAsRead === notification.id && (
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
                            {notification.inquiryDetails?.meetingType && (
                              <div className="flex items-center gap-1.5">
                                {getMeetingTypeIcon(
                                  notification.inquiryDetails.meetingType
                                )}
                                <span className="font-semibold text-sm capitalize">
                                  {notification.inquiryDetails.meetingType}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-sm">
                                {formatNotificationTime(notification.createdAt)}
                              </span>
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
                    No notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You're all caught up! New updates will appear here.
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
