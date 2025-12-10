// components/admin/Header.tsx - UPDATED TO FETCH ONLY ADMIN NOTIFICATIONS
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  GalleryVerticalEnd,
  Bell,
  Check,
  Trash2,
  UserPlus,
  Calendar,
  MessageSquare,
  FileText,
  DollarSign,
  AlertTriangle,
  Home,
  Building,
  Package,
  Users,
  Settings,
  Loader2,
  Clock,
  Phone,
  Video,
  MapPin,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useModalStore } from "@/lib/stores";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getNotifications,
  deleteNotification,
  clearAllUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/action/notification";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Notification {
  _id: string;
  userId?: string;
  userEmail?: string;
  feature:
    | "appointments"
    | "projects"
    | "inventory"
    | "suppliers"
    | "payments"
    | "system"
    | "general"
    | "pdc"; // Added pdc
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
  actionUrl?: string;
  actionLabel?: string;
  notificationType?: "admin" | "user"; // Added notificationType

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
    status?: string;
    milestone?: string;
    progress?: number;
  };
  inventoryMetadata?: {
    itemId?: string;
    itemName?: string;
    quantity?: number;
    reorderPoint?: number;
    category?: string;
  };
  pdcMetadata?: {
    pdcId?: string;
    checkNumber?: string;
    supplier?: string;
    amount?: number;
    status?: string;
  };
}

// Map path segments to readable labels
const pathLabels: Record<string, string> = {
  admin: "Admin",
  admindashboard: "Dashboard",
  "admin-project": "Projects",
  appointments: "Appointments",
  catalog: "Catalog",
  "main-inventory": "Main Inventory",
  "client-inventory": "Client Inventory",
  suppliers: "Suppliers",
  usermanagement: "User Management",
  settings: "Settings",
  pdc: "PDC Management", // Added PDC
};

// Map notification types to readable labels
const notificationTypeLabels: Record<string, string> = {
  // Appointment types
  appointment_confirmed: "Appointment Confirmed",
  appointment_cancelled: "Appointment Cancelled",
  appointment_rescheduled: "Appointment Rescheduled",
  appointment_completed: "Appointment Completed",
  inquiry_submitted: "New Inquiry",

  // Project types
  project_created: "Project Created",
  project_confirmed: "Project Confirmed",
  project_updated: "Project Updated",
  project_completed: "Project Completed",
  project_cancelled: "Project Cancelled",
  milestone_reached: "Milestone Reached",
  project_timeline_update: "Timeline Update",
  photo_timeline_update: "Photo Update",
  invoice_sent: "Invoice Sent",
  invoice_paid: "Invoice Paid",
  payment_received: "Payment Received",

  // Inventory types
  low_stock: "Low Stock Alert",
  out_of_stock: "Out of Stock",
  inventory_updated: "Inventory Updated",

  // PDC types
  pdc_created: "PDC Created",
  pdc_issued: "PDC Issued",
  pdc_cancelled: "PDC Cancelled",
  pdc_status_updated: "PDC Status Updated",
  pdc_stats_summary: "PDC Stats Summary",

  // Supplier types
  supplier_added: "Supplier Added",
  supplier_updated: "Supplier Updated",

  // System types
  system_alert: "System Alert",
  maintenance: "Maintenance",
};

// Cache for notifications
const notificationCache = new Map();

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsCreateAccountOpen, setCreateAccountData } = useModalStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch ONLY admin notifications for admin
  const fetchNotifications = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = "admin_notifications";
      const now = Date.now();
      const cacheExpiry = 2 * 60 * 1000; // 2 minutes cache

      // Check cache if not forcing refresh
      if (!forceRefresh && notificationCache.has(cacheKey)) {
        const cached = notificationCache.get(cacheKey);
        if (now - cached.timestamp < cacheExpiry) {
          console.log("📦 Using cached notifications for admin");
          setNotifications(cached.data);
          const unread = cached.data.filter(
            (n: Notification) => !n.isRead
          ).length;
          setUnreadCount(unread);
          return;
        }
      }

      // Set appropriate loading state
      if (isNotificationOpen) {
        setLoading(true);
      } else {
        setBackgroundLoading(true);
      }

      try {
        console.log("🔔 Fetching ONLY ADMIN notifications for admin");

        // CRITICAL FIX: Fetch ONLY admin notifications by passing correct parameters
        const result = await getNotifications({
          currentUserRole: "admin",
          currentUserId: "admin", // Pass admin ID if available
          currentUserEmail: "admin@gianconstruct.com", // Pass admin email
          notificationType: "admin", // Explicitly request admin notifications
          page: 1,
          limit: 100, // Increased limit to show more notifications
        });

        console.log("📊 Admin notification fetch result:", {
          success: result.success,
          count: result.notifications?.length,
          error: result.error,
        });

        if (result.success && result.notifications) {
          console.log(
            "✅ Admin notifications fetched successfully:",
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
              isRead: n.isRead || false,
              createdAt: n.createdAt || new Date().toISOString(),
              timeAgo: n.timeAgo || "Recently",
              actionUrl: n.actionUrl,
              actionLabel: n.actionLabel,
              notificationType: n.notificationType || "admin", // Ensure notificationType
              appointmentMetadata: n.appointmentMetadata,
              projectMetadata: n.projectMetadata,
              inventoryMetadata: n.inventoryMetadata,
              pdcMetadata: n.pdcMetadata || n.metadata,
            })
          );

          console.log(
            "📝 Processed ADMIN notifications for admin:",
            validNotifications.map((n) => ({
              id: n._id,
              type: n.type,
              feature: n.feature,
              notificationType: n.notificationType,
              isRead: n.isRead,
              title: n.title,
            }))
          );

          setNotifications(validNotifications);
          const unread = validNotifications.filter((n) => !n.isRead).length;
          setUnreadCount(unread);

          // Update cache
          notificationCache.set(cacheKey, {
            data: validNotifications,
            timestamp: now,
          });

          setLastFetchTime(now);
        } else {
          console.error("❌ Error fetching notifications:", result.error);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
        setBackgroundLoading(false);
      }
    },
    [isNotificationOpen]
  );

  // Initial fetch when component mounts
  useEffect(() => {
    console.log("🚀 Initial notification fetch for admin (ADMIN ONLY)");
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up periodic background refresh
  useEffect(() => {
    const interval = setInterval(
      () => {
        console.log("🔄 Background notification refresh for admin");
        fetchNotifications();
      },
      5 * 60 * 1000
    ); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch when dropdown opens (with potential cache)
  useEffect(() => {
    if (isNotificationOpen) {
      console.log(
        "📂 Notification dropdown opened, fetching ADMIN notifications"
      );
      // Use cached data immediately, then refresh in background
      const cacheKey = "admin_notifications";
      if (notificationCache.has(cacheKey)) {
        const cached = notificationCache.get(cacheKey);
        setNotifications(cached.data);
        const unread = cached.data.filter(
          (n: Notification) => !n.isRead
        ).length;
        setUnreadCount(unread);
      }
      fetchNotifications();
    }
  }, [isNotificationOpen, fetchNotifications]);

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (!pathname) return [];

    const segments = pathname.split("/").filter((segment) => segment !== "");
    const breadcrumbs = segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label =
        pathLabels[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === segments.length - 1;

      return {
        href: isLast ? undefined : href,
        label,
        isLast,
      };
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get notification icon based on feature and type (Monochrome Black/White Theme)
  const getNotificationIcon = (notification: Notification) => {
    const iconClass = "h-4 w-4";
    switch (notification.feature) {
      case "appointments":
        return <Calendar className={cn(iconClass, "text-gray-800")} />;
      case "projects":
        return <Home className={cn(iconClass, "text-gray-800")} />;
      case "inventory":
        return <Package className={cn(iconClass, "text-gray-800")} />;
      case "suppliers":
        return <Building className={cn(iconClass, "text-gray-800")} />;
      case "payments":
        return <DollarSign className={cn(iconClass, "text-gray-800")} />;
      case "system":
        return <AlertTriangle className={cn(iconClass, "text-gray-800")} />;
      case "general":
        return <MessageSquare className={cn(iconClass, "text-gray-800")} />;
      case "pdc":
        return <FileText className={cn(iconClass, "text-gray-800")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-800")} />;
    }
  };

  // Get readable type label
  const getTypeLabel = (type: string | undefined) => {
    if (!type) return "Unknown Type";
    return (
      notificationTypeLabels[type] || type.replace(/_/g, " ").toUpperCase()
    );
  };

  // Get meeting type icon (monochromatic)
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

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      const result = await markNotificationAsRead(notificationId, "admin");
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Update cache
        const cacheKey = "admin_notifications";
        if (notificationCache.has(cacheKey)) {
          const cached = notificationCache.get(cacheKey);
          const updatedData = cached.data.map((n: Notification) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          );
          notificationCache.set(cacheKey, {
            data: updatedData,
            timestamp: cached.timestamp,
          });
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead("admin", "admin");
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Update cache
        const cacheKey = "admin_notifications";
        if (notificationCache.has(cacheKey)) {
          const cached = notificationCache.get(cacheKey);
          const updatedData = cached.data.map((n: Notification) => ({
            ...n,
            isRead: true,
          }));
          notificationCache.set(cacheKey, {
            data: updatedData,
            timestamp: cached.timestamp,
          });
        }
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId, "admin");
      if (result.success) {
        const notificationToDelete = notifications.find(
          (n) => n._id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
        if (notificationToDelete && !notificationToDelete.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        if (selectedNotification?._id === notificationId) {
          setSelectedNotification(null);
        }

        // Update cache
        const cacheKey = "admin_notifications";
        if (notificationCache.has(cacheKey)) {
          const cached = notificationCache.get(cacheKey);
          const updatedData = cached.data.filter(
            (n: Notification) => n._id !== notificationId
          );
          notificationCache.set(cacheKey, {
            data: updatedData,
            timestamp: cached.timestamp,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleClearAll = async () => {
    try {
      const result = await clearAllUserNotifications("admin", "admin");
      if (result.success) {
        setNotifications([]);
        setSelectedNotification(null);
        setUnreadCount(0);

        // Clear cache
        notificationCache.delete("admin_notifications");
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
    setIsClearAllConfirmOpen(false);
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsNotificationOpen(false);
      setSelectedNotification(null);
    } else {
      // Default navigation based on feature
      switch (notification.feature) {
        case "appointments":
          router.push("/admin/appointments");
          break;
        case "projects":
          router.push("/admin/admin-project");
          break;
        case "inventory":
          router.push("/admin/main-inventory");
          break;
        case "suppliers":
          router.push("/admin/suppliers");
          break;
        case "payments":
          router.push("/admin/admindashboard?tab=payments");
          break;
        case "pdc":
          router.push("/admin/pdc");
          break;
        default:
          router.push("/admin/admindashboard");
      }
      setIsNotificationOpen(false);
      setSelectedNotification(null);
    }
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  // Handle notification item click
  const handleNotificationItemClick = (notification: Notification) => {
    console.log("🖱️ Notification clicked:", {
      id: notification._id,
      type: notification.type,
      feature: notification.feature,
      notificationType: notification.notificationType,
      isRead: notification.isRead,
    });

    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Open detail dialog
    setSelectedNotification(notification);
    setIsNotificationOpen(false);
  };

  // Handle creating account from notification (for guest inquiries)
  const handleCreateAccount = (notification: Notification) => {
    if (notification.appointmentMetadata?.inquiryId) {
      // Extract name from notification title or message
      const nameMatch =
        notification.title.match(/from (.+?) for/) ||
        notification.message.match(/from (.+?) for/);
      const name = nameMatch ? nameMatch[1] : "Guest User";
      const nameParts = name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setCreateAccountData({
        firstName,
        lastName,
        email: notification.userEmail || "",
        phone: "",
      });

      setSelectedNotification(null);

      router.push("/admin/usermanagement");

      setTimeout(() => {
        setIsCreateAccountOpen(true);
      }, 100);
    }
  };

  // Check if notification is from a guest user
  const isGuestNotification = (notification: Notification) => {
    return notification.type === "inquiry_submitted" && !notification.userId;
  };

  // Get feature label
  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case "appointments":
        return "Appointments";
      case "projects":
        return "Projects";
      case "inventory":
        return "Inventory";
      case "suppliers":
        return "Suppliers";
      case "payments":
        return "Payments";
      case "system":
        return "System";
      case "general":
        return "General";
      case "pdc":
        return "PDC Management";
      default:
        return feature.charAt(0).toUpperCase() + feature.slice(1);
    }
  };

  // Format currency for PDC notifications
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-none">
        <div className="w-full flex h-16 p-5 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="p-2">
              <GalleryVerticalEnd className="h-4 w-4" />
            </SidebarTrigger>
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin" className="text-foreground">
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {breadcrumbs.slice(1).map((breadcrumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {breadcrumb.isLast ? (
                        <BreadcrumbPage className="text-foreground">
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={breadcrumb.href}
                          className="text-foreground hover:text-foreground/80"
                        >
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Notification */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative p-2 hover:bg-transparent hover:text-gray-900",
                  isNotificationOpen && "text-gray-900"
                )}
                onClick={toggleNotificationDropdown}
                disabled={backgroundLoading}
              >
                {/* Bell Icon with Badge */}
                <div className="relative">
                  <Bell className="h-5 w-5 text-gray-700 hover:text-gray-900 transition-colors" />

                  {/* Unread Count Badge - Gray/Black Theme */}
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 min-w-0 p-0 flex items-center justify-center rounded-full bg-gray-900 border-2 border-background text-[10px] font-bold text-white shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}

                  {/* Background Loading Indicator */}
                  {backgroundLoading && (
                    <div className="absolute -bottom-1 -right-1">
                      <div className="h-2 w-2 bg-gray-900 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
                <span className="sr-only">Admin Notifications</span>
              </Button>

              {/* Dropdown Menu - Clean Minimalist */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-96 bg-background rounded-none border border-gray-200 shadow-lg z-50"
                  >
                    {/* Header - Clean Minimalist */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-base text-gray-900">
                            Admin Notifications
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {unreadCount} unread{" "}
                            {unreadCount === 1
                              ? "notification"
                              : "notifications"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {unreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleMarkAllAsRead}
                              className="h-7 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              disabled={loading}
                            >
                              <Check className="h-3 w-3 mr-1.5" />
                              Mark all read
                            </Button>
                          )}
                          {notifications.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsClearAllConfirmOpen(true)}
                              className="h-7 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              <Trash2 className="h-3 w-3 mr-1.5" />
                              Clear all
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notifications List - Clean Facebook-like Design */}
                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-800 mb-2" />
                          <p className="text-sm text-gray-500">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Bell className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            No admin notifications
                          </p>
                          <p className="text-xs text-gray-500">
                            You're all caught up! (Only admin notifications
                            shown)
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={cn(
                                "p-4 cursor-pointer transition-colors hover:bg-gray-50",
                                !notification.isRead && "bg-gray-50"
                              )}
                              onClick={() =>
                                handleNotificationItemClick(notification)
                              }
                            >
                              <div className="flex items-start gap-3 w-full">
                                {/* Icon Container - Square, No Border Radius */}
                                <div
                                  className={cn(
                                    "flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-200",
                                    !notification.isRead
                                      ? "bg-gray-100"
                                      : "bg-white"
                                  )}
                                >
                                  {getNotificationIcon(notification)}
                                </div>

                                {/* Content - Clean Minimalist */}
                                <div className="flex-1 min-w-0">
                                  {/* Title Row */}
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span
                                      className={cn(
                                        "text-sm font-semibold line-clamp-1",
                                        !notification.isRead
                                          ? "text-gray-900"
                                          : "text-gray-600"
                                      )}
                                    >
                                      {notification.title || "No Title"}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {markingAsRead === notification._id && (
                                        <Loader2 className="h-3 w-3 animate-spin text-gray-800" />
                                      )}
                                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
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
                                        ? "text-gray-700"
                                        : "text-gray-500"
                                    )}
                                  >
                                    {notification.message || "No message"}
                                  </p>

                                  {/* Metadata Tags - Minimalist */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                                      {getFeatureLabel(notification.feature)}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                                      {getTypeLabel(notification.type)}
                                    </span>
                                    {notification.notificationType && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                                        {notification.notificationType ===
                                        "admin"
                                          ? "Admin"
                                          : "User"}
                                      </span>
                                    )}
                                    {isGuestNotification(notification) && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                                        Guest
                                      </span>
                                    )}
                                    {!notification.isRead && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(notification._id);
                                        }}
                                        className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-6 px-2"
                                        disabled={
                                          markingAsRead === notification._id
                                        }
                                      >
                                        Mark read
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Unread Indicator - Minimal Dot */}
                                {!notification.isRead && (
                                  <div className="flex-shrink-0 mt-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gray-900" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="sm:max-w-2xl bg-background border-gray-200 rounded-none">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-900">
                  {getNotificationIcon(selectedNotification)}
                  {selectedNotification.title || "No Title"}
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  {selectedNotification.message || "No message"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Notification Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Type
                      </h4>
                      <span className="text-sm mt-1 text-gray-900 block px-2 py-1 bg-gray-100 border border-gray-200 w-fit">
                        {getTypeLabel(selectedNotification.type)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Feature
                      </h4>
                      <span className="text-sm mt-1 text-gray-900 block px-2 py-1 bg-gray-100 border border-gray-200 w-fit">
                        {getFeatureLabel(selectedNotification.feature)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Date
                      </h4>
                      <p className="text-sm mt-1 text-gray-900">
                        {selectedNotification.createdAt ? (
                          <>
                            {new Date(
                              selectedNotification.createdAt
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              selectedNotification.createdAt
                            ).toLocaleTimeString()}
                          </>
                        ) : (
                          "Unknown date"
                        )}
                      </p>
                    </div>
                    {selectedNotification.userEmail && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          User Email
                        </h4>
                        <p className="text-sm mt-1 text-gray-900">
                          {selectedNotification.userEmail}
                        </p>
                      </div>
                    )}
                    {selectedNotification.notificationType && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Notification Type
                        </h4>
                        <span className="text-sm mt-1 text-gray-900 block px-2 py-1 bg-gray-100 border border-gray-200 w-fit">
                          {selectedNotification.notificationType === "admin"
                            ? "Admin Notification"
                            : "User Notification"}
                        </span>
                      </div>
                    )}
                    {isGuestNotification(selectedNotification) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          User Type
                        </h4>
                        <span className="text-sm mt-1 text-gray-900 block px-2 py-1 bg-gray-100 border border-gray-200 w-fit">
                          Guest User
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feature-specific details */}
                  <div className="space-y-4">
                    {/* Appointment details */}
                    {selectedNotification.appointmentMetadata && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Appointment Details
                        </h4>
                        <div className="text-sm mt-1 space-y-1 text-gray-900">
                          {selectedNotification.appointmentMetadata
                            .meetingType && (
                            <p>
                              <span className="font-medium">Meeting Type:</span>{" "}
                              {
                                selectedNotification.appointmentMetadata
                                  .meetingType
                              }
                            </p>
                          )}
                          {selectedNotification.appointmentMetadata
                            .originalDate && (
                            <p>
                              <span className="font-medium">Date:</span>{" "}
                              {
                                selectedNotification.appointmentMetadata
                                  .originalDate
                              }
                            </p>
                          )}
                          {selectedNotification.appointmentMetadata
                            .originalTime && (
                            <p>
                              <span className="font-medium">Time:</span>{" "}
                              {
                                selectedNotification.appointmentMetadata
                                  .originalTime
                              }
                            </p>
                          )}
                          {selectedNotification.appointmentMetadata.reason && (
                            <p>
                              <span className="font-medium">Reason:</span>{" "}
                              {selectedNotification.appointmentMetadata.reason}
                            </p>
                          )}
                          {selectedNotification.appointmentMetadata
                            .inquiryId && (
                            <p>
                              <span className="font-medium">Inquiry ID:</span>{" "}
                              {
                                selectedNotification.appointmentMetadata
                                  .inquiryId
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Project details */}
                    {selectedNotification.projectMetadata && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Project Details
                        </h4>
                        <div className="text-sm mt-1 space-y-1 text-gray-900">
                          {selectedNotification.projectMetadata.projectName && (
                            <p>
                              <span className="font-medium">Project:</span>{" "}
                              {selectedNotification.projectMetadata.projectName}
                            </p>
                          )}
                          {selectedNotification.projectMetadata.projectId && (
                            <p>
                              <span className="font-medium">Project ID:</span>{" "}
                              {selectedNotification.projectMetadata.projectId}
                            </p>
                          )}
                          {selectedNotification.projectMetadata.status && (
                            <p>
                              <span className="font-medium">Status:</span>{" "}
                              {selectedNotification.projectMetadata.status}
                            </p>
                          )}
                          {selectedNotification.projectMetadata.progress && (
                            <p>
                              <span className="font-medium">Progress:</span>{" "}
                              {selectedNotification.projectMetadata.progress}%
                            </p>
                          )}
                          {selectedNotification.projectMetadata.milestone && (
                            <p>
                              <span className="font-medium">Milestone:</span>{" "}
                              {selectedNotification.projectMetadata.milestone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PDC details */}
                    {selectedNotification.pdcMetadata && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          PDC Details
                        </h4>
                        <div className="text-sm mt-1 space-y-1 text-gray-900">
                          {selectedNotification.pdcMetadata.checkNumber && (
                            <p>
                              <span className="font-medium">Check #:</span>{" "}
                              {selectedNotification.pdcMetadata.checkNumber}
                            </p>
                          )}
                          {selectedNotification.pdcMetadata.supplier && (
                            <p>
                              <span className="font-medium">Supplier:</span>{" "}
                              {selectedNotification.pdcMetadata.supplier}
                            </p>
                          )}
                          {selectedNotification.pdcMetadata.amount && (
                            <p>
                              <span className="font-medium">Amount:</span>{" "}
                              {formatCurrency(
                                selectedNotification.pdcMetadata.amount
                              )}
                            </p>
                          )}
                          {selectedNotification.pdcMetadata.status && (
                            <p>
                              <span className="font-medium">Status:</span>{" "}
                              {selectedNotification.pdcMetadata.status}
                            </p>
                          )}
                          {selectedNotification.pdcMetadata.pdcId && (
                            <p>
                              <span className="font-medium">PDC ID:</span>{" "}
                              {selectedNotification.pdcMetadata.pdcId}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inventory details */}
                    {selectedNotification.inventoryMetadata && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Inventory Details
                        </h4>
                        <div className="text-sm mt-1 space-y-1 text-gray-900">
                          {selectedNotification.inventoryMetadata.itemName && (
                            <p>
                              <span className="font-medium">Item:</span>{" "}
                              {selectedNotification.inventoryMetadata.itemName}
                            </p>
                          )}
                          {selectedNotification.inventoryMetadata.itemId && (
                            <p>
                              <span className="font-medium">Item ID:</span>{" "}
                              {selectedNotification.inventoryMetadata.itemId}
                            </p>
                          )}
                          {selectedNotification.inventoryMetadata.quantity && (
                            <p>
                              <span className="font-medium">Quantity:</span>{" "}
                              {selectedNotification.inventoryMetadata.quantity}
                            </p>
                          )}
                          {selectedNotification.inventoryMetadata
                            .reorderPoint && (
                            <p>
                              <span className="font-medium">
                                Reorder Point:
                              </span>{" "}
                              {
                                selectedNotification.inventoryMetadata
                                  .reorderPoint
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                  className="border-gray-300 hover:bg-gray-100 hover:text-gray-900 text-gray-700"
                >
                  Close
                </Button>

                {/* Show Create Account button for guest inquiries */}
                {isGuestNotification(selectedNotification) && (
                  <Button
                    variant="default"
                    onClick={() => handleCreateAccount(selectedNotification)}
                    className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-900"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account for Guest
                  </Button>
                )}

                {selectedNotification.actionUrl &&
                  selectedNotification.actionLabel && (
                    <Button
                      variant="default"
                      onClick={() =>
                        handleNotificationAction(selectedNotification)
                      }
                      className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-900"
                    >
                      {selectedNotification.actionLabel}
                    </Button>
                  )}

                {!selectedNotification.isRead && (
                  <Button
                    variant="default"
                    onClick={async () => {
                      await handleMarkAsRead(selectedNotification._id);
                      setSelectedNotification(null);
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-900"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent className="bg-background border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Cancel
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteNotification(deleteConfirmId);
                }
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-900"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog
        open={isClearAllConfirmOpen}
        onOpenChange={setIsClearAllConfirmOpen}
      >
        <AlertDialogContent className="bg-background border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">
              Confirm Clear All
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to clear all notifications? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsClearAllConfirmOpen(false)}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Cancel
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-900"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
