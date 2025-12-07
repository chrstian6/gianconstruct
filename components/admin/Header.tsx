// components/admin/Header.tsx - REDESIGNED NOTIFICATION UI
"use client";
import React, { useState, useEffect, useRef } from "react";
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
  feature: "appointments";
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
  actionUrl?: string;
  actionLabel?: string;

  // Appointment metadata for inquiries
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
};

// Map notification types to readable labels
const notificationTypeLabels: Record<string, string> = {
  appointment_confirmed: "Appointment Confirmed",
  appointment_cancelled: "Appointment Cancelled",
  appointment_rescheduled: "Appointment Rescheduled",
  appointment_completed: "Appointment Completed",
  inquiry_submitted: "New Inquiry",
};

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

  // Fetch inquiry notifications for admin
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const result = await getNotifications({
          currentUserRole: "admin",
          feature: "appointments", // Only fetch appointment notifications
          page: 1,
          limit: 50,
        });

        if (result.success) {
          const fetched = result.notifications || [];
          const typedNotifications = fetched as Notification[];
          setNotifications(typedNotifications);
          const unread =
            typedNotifications.filter((n) => !n.isRead).length || 0;
          setUnreadCount(unread);
        } else {
          console.error("Failed to fetch notifications:", result.error);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (isNotificationOpen) {
      fetchNotifications();
    }
  }, [isNotificationOpen]);

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

  // Get notification icon based on type (Monochrome Black/White Theme)
  const getNotificationIcon = (notification: Notification) => {
    const iconClass = "h-4 w-4";
    switch (notification.type) {
      case "appointment_confirmed":
        return <Calendar className={cn(iconClass, "text-gray-800")} />;
      case "appointment_cancelled":
        return <Calendar className={cn(iconClass, "text-gray-800")} />;
      case "appointment_rescheduled":
        return <Calendar className={cn(iconClass, "text-gray-800")} />;
      case "appointment_completed":
        return <Calendar className={cn(iconClass, "text-gray-800")} />;
      case "inquiry_submitted":
        return <MessageSquare className={cn(iconClass, "text-gray-800")} />;
      default:
        return <Calendar className={cn(iconClass, "text-gray-800")} />;
    }
  };

  // Get readable type label
  const getTypeLabel = (type: string | undefined) => {
    if (!type) return "Unknown Type";
    return notificationTypeLabels[type] || type;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId, "admin");
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead("admin", "admin");
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
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
    }
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationOpen(!isNotificationOpen);
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

      setIsNotificationOpen(false);
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
                </div>
                <span className="sr-only">Inquiry Notifications</span>
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
                            Inquiries
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {unreadCount} unread{" "}
                            {unreadCount === 1 ? "inquiry" : "inquiries"}
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
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mb-2" />
                          <p className="text-sm text-gray-500">
                            Loading inquiries...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Bell className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            No inquiry notifications
                          </p>
                          <p className="text-xs text-gray-500">
                            You're all caught up!
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
                                setSelectedNotification(notification)
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
                                      <span className="text-xs text-gray-400">
                                        {notification.timeAgo || "Recently"}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmId(notification._id);
                                          setIsDeleteConfirmOpen(true);
                                        }}
                                        className="h-5 w-5 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
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
                                      {getTypeLabel(notification.type)}
                                    </span>
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

                  {/* Appointment details */}
                  <div className="space-y-4">
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
              Are you sure you want to delete this inquiry notification? This
              action cannot be undone.
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
              Are you sure you want to clear all inquiry notifications? This
              action cannot be undone.
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
