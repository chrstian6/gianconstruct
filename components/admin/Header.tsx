// components/admin/Header.tsx - Add the imports and functionality
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
  clearAllNotifications,
  markNotificationAsRead,
} from "@/action/inquiries";
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
  userEmail: string;
  design: {
    id: string;
    name: string;
    price?: number;
    square_meters?: number;
    images?: string[];
    isLoanOffer?: boolean;
    maxLoanYears?: number;
    interestRate?: number;
  };
  designImage?: string;
  inquiryDetails: {
    name: string;
    email: string;
    phone: string;
    message: string;
  };
  isGuest: boolean;
  createdAt: string;
  isRead?: boolean;
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

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsCreateAccountOpen, setCreateAccountData } = useModalStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [missingDesignId, setMissingDesignId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isDesignNotFoundOpen, setIsDesignNotFoundOpen] = useState(false);
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

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await getNotifications();
        if (result.success) {
          setNotifications(result.notifications);
          const unread = result.notifications.filter(
            (n: Notification) => !n.isRead
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (isNotificationOpen) {
      fetchNotifications();
    }
  }, [isNotificationOpen]);

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (!pathname) return [];

    // Remove leading slash and split path into segments
    const segments = pathname.split("/").filter((segment) => segment !== "");

    // Create breadcrumb items
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

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
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
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification._id);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId);
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
      const result = await clearAllNotifications();
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

  const handleViewDesign = async (designId: string) => {
    try {
      router.push(`/admin/catalog?designId=${designId}`);
      setIsNotificationOpen(false);
      setSelectedNotification(null);
    } catch (error) {
      setMissingDesignId(designId);
      setIsDesignNotFoundOpen(true);
    }
  };

  const handleDesignNotFoundClose = () => {
    setIsDesignNotFoundOpen(false);
    setMissingDesignId(null);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Handle creating account from notification
  const handleCreateAccount = (notification: Notification) => {
    // Extract name parts from the notification
    const nameParts = notification.inquiryDetails.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Set the data for the create account form
    setCreateAccountData({
      firstName,
      lastName,
      email: notification.userEmail,
      phone: notification.inquiryDetails.phone || "",
    });

    // Close notification dropdown and detail dialog
    setIsNotificationOpen(false);
    setSelectedNotification(null);

    // Redirect to user management page
    router.push("/admin/usermanagement");

    // Open the create account modal
    setTimeout(() => {
      setIsCreateAccountOpen(true);
    }, 100);
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
                {/* Always show Admin as first breadcrumb */}
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin" className="text-black-200">
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {/* Dynamic breadcrumbs based on current path */}
                {breadcrumbs.slice(1).map((breadcrumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {breadcrumb.isLast ? (
                        <BreadcrumbPage className="text-black-200">
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={breadcrumb.href}
                          className="text-black-200 hover:text-black-400"
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
            {/* Notification Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative text-text-secondary hover:bg-text-secondary hover:text-text-secondary-foreground transition-all duration-200",
                  isNotificationOpen && "bg-accent text-accent-foreground"
                )}
                onClick={toggleNotificationDropdown}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 p-0 flex items-center justify-center min-w-0">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-96 bg-popover rounded-lg shadow-lg border border-border z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <div>
                        <h3 className="font-semibold text-popover-foreground">
                          Notifications
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {unreadCount} unread{" "}
                          {unreadCount === 1 ? "notification" : "notifications"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-primary hover:text-primary hover:bg-accent h-8 px-2"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all read
                          </Button>
                        )}
                        {notifications.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsClearAllConfirmOpen(true)}
                            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear all
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Bell className="h-8 w-8 mb-2 text-muted" />
                          <p className="text-sm">No notifications</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You're all caught up!
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notification) => (
                            <motion.div
                              key={notification._id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={cn(
                                "p-3 transition-colors hover:bg-accent/50 group cursor-pointer",
                                !notification.isRead &&
                                  "bg-accent hover:bg-accent"
                              )}
                              onClick={() =>
                                setSelectedNotification(notification)
                              }
                            >
                              <div className="flex gap-3">
                                {/* Avatar */}
                                <div
                                  className={cn(
                                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                                    notification.isGuest
                                      ? "bg-red-100 text-red-600"
                                      : "bg-blue-100 text-blue-600"
                                  )}
                                >
                                  {getInitials(
                                    notification.inquiryDetails.name
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h4
                                      className={cn(
                                        "text-sm font-medium line-clamp-1",
                                        !notification.isRead
                                          ? "text-popover-foreground"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      New inquiry for {notification.design.name}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(notification._id);
                                        setIsDeleteConfirmOpen(true);
                                      }}
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                    From: {notification.inquiryDetails.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {notification.inquiryDetails.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        {formatNotificationDate(
                                          notification.createdAt
                                        )}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-xs px-2 py-0.5 rounded-full",
                                          notification.isGuest
                                            ? "bg-red-100 text-red-800"
                                            : "bg-blue-100 text-blue-800"
                                        )}
                                      >
                                        {notification.isGuest
                                          ? "Guest"
                                          : "User"}
                                      </span>
                                      {!notification.isRead && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    {!notification.isRead && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(notification._id);
                                        }}
                                        className="text-xs text-primary hover:text-primary hover:bg-accent h-6 px-2"
                                      >
                                        Mark read
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
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
        <DialogContent className="sm:max-w-2xl bg-white rounded-lg shadow-xl">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[var(--orange)]">
                  Inquiry for {selectedNotification.design.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        From
                      </h4>
                      <p className="text-sm mt-1 text-[var(--orange)]">
                        {selectedNotification.inquiryDetails.name}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Email
                      </h4>
                      <p className="text-sm mt-1 text-[var(--orange)]">
                        {selectedNotification.userEmail}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Phone
                      </h4>
                      <p className="text-sm mt-1 text-[var(--orange)]">
                        {selectedNotification.inquiryDetails.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Date
                      </h4>
                      <p className="text-sm mt-1 text-[var(--orange)]">
                        {formatDate(selectedNotification.createdAt)} at{" "}
                        {formatTime(selectedNotification.createdAt)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Status
                      </h4>
                      <p className="text-sm mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedNotification.isGuest
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {selectedNotification.isGuest ? "Guest" : "User"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Design
                      </h4>
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          handleViewDesign(selectedNotification.design.id)
                        }
                      >
                        {selectedNotification.design.images &&
                        selectedNotification.design.images.length > 0 ? (
                          <div className="mt-2">
                            <img
                              src={selectedNotification.design.images[0]}
                              alt={selectedNotification.design.name}
                              className="rounded-md border border-gray-200 w-full h-auto max-h-48 object-contain hover:opacity-90 transition-opacity"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Design ID: {selectedNotification.design.id}
                            </p>
                          </div>
                        ) : selectedNotification.designImage ? (
                          <img
                            src={selectedNotification.designImage}
                            alt={selectedNotification.design.name}
                            className="mt-2 rounded-md border border-gray-200 w-full h-auto max-h-48 object-contain hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="mt-2 h-48 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-200 transition-colors">
                            No image available
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Design Details
                      </h4>
                      <div className="text-sm mt-1 space-y-1">
                        <p
                          className="text-[var(--orange)] hover:underline cursor-pointer"
                          onClick={() =>
                            handleViewDesign(selectedNotification.design.id)
                          }
                        >
                          {selectedNotification.design.name}
                        </p>
                        {selectedNotification.design.price && (
                          <p>
                            <span className="font-medium">Price:</span> ₱
                            {selectedNotification.design.price.toLocaleString()}
                          </p>
                        )}
                        {selectedNotification.design.square_meters && (
                          <p>
                            <span className="font-medium">Area:</span>{" "}
                            {selectedNotification.design.square_meters} sqm
                          </p>
                        )}
                        <p
                          className="text-[var(--orange)] hover:underline cursor-pointer"
                          onClick={() =>
                            handleViewDesign(selectedNotification.design.id)
                          }
                        >
                          <span className="font-medium">ID:</span>{" "}
                          {selectedNotification.design.id}
                        </p>
                      </div>
                      {selectedNotification.design.isLoanOffer && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-500">
                            Loan Breakdown
                          </h4>
                          <p className="text-sm mt-1">
                            Loan available with{" "}
                            {selectedNotification.design.interestRate}% interest
                            rate over {selectedNotification.design.maxLoanYears}{" "}
                            years.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Message</h4>
                  <p className="text-sm mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                    {selectedNotification.inquiryDetails.message}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                  className="hover:bg-gray-100"
                >
                  Close
                </Button>

                {/* Show Create Account button only for guest users */}
                {selectedNotification.isGuest && (
                  <Button
                    variant="default"
                    onClick={() => handleCreateAccount(selectedNotification)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account for Guest
                  </Button>
                )}

                <Button
                  variant="default"
                  onClick={async () => {
                    if (selectedNotification) {
                      await handleMarkAsRead(selectedNotification._id);
                      setSelectedNotification(null);
                    }
                  }}
                  className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
                >
                  Mark as Read
                </Button>
                <Button
                  variant="default"
                  onClick={() =>
                    handleViewDesign(selectedNotification.design.id)
                  }
                  className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
                >
                  View Design
                </Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="hover:bg-gray-100"
            >
              Cancel
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteNotification(deleteConfirmId);
                }
              }}
              className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Clear All</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all notifications? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsClearAllConfirmOpen(false)}
              className="hover:bg-gray-100"
            >
              Cancel
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Design Not Found Alert Dialog */}
      <AlertDialog
        open={isDesignNotFoundOpen}
        onOpenChange={setIsDesignNotFoundOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Design Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              The design with ID "{missingDesignId}" is no longer available. It
              may have been deleted or the ID might be incorrect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDesignNotFoundClose}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
