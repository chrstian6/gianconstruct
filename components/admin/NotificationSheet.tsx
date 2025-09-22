"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/action/inquiries";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useRouter } from "next/navigation";

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

export function NotificationSheet({
  open,
  onOpenChange,
  isCollapsed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCollapsed: boolean;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [missingDesignId, setMissingDesignId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isDesignNotFoundOpen, setIsDesignNotFoundOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null); // State to track which notification's dropdown is open
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const result = await getNotifications();
        if (result.success) {
          setNotifications(result.notifications);
        } else {
          toast.error(result.error || "Failed to load notifications");
          setNotifications([]);
        }
      } catch (error) {
        toast.error("An error occurred while loading notifications");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    if (open) fetchNotifications();
  }, [open]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      toast.success("Notification marked as read");
    } else {
      toast.error(result.error || "Failed to mark notification as read");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (selectedNotification?._id === notificationId) {
        setSelectedNotification(null);
      }
      toast.success("Notification deleted");
    } else {
      toast.error(result.error || "Failed to delete notification");
    }
    setIsDeleteConfirmOpen(false);
    setDropdownOpen(null); // Close the dropdown after deletion
  };

  const handleClearAll = async () => {
    const result = await clearAllNotifications();
    if (result.success) {
      setNotifications([]);
      setSelectedNotification(null);
      toast.success("All notifications cleared");
    } else {
      toast.error(result.error || "Failed to clear notifications");
    }
    setIsClearAllConfirmOpen(false);
  };

  const handleViewDesign = async (designId: string) => {
    try {
      router.push(`/admin/catalog?designId=${designId}`);
      onOpenChange(false);
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

  const visibleNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              duration: 0.3,
            }}
            className={`fixed top-0 h-screen bg-white border-l shadow-lg z-50 ${
              isCollapsed ? "left-16" : "left-64"
            }`}
            style={{ width: "320px" }}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl tracking-tight font-bold text-gray-800">
                    Notifications ({notifications.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="mt-2 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsClearAllConfirmOpen(true)}
                    className="text-[var(--orange)] hover:bg-[var(--orange)]/10"
                    disabled={notifications.length === 0}
                  >
                    Clear All
                  </Button>
                  {notifications.length > 5 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="text-[var(--orange)] hover:underline"
                    >
                      {showAll ? "See Less" : "See More"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications available.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {visibleNotifications.map((notification) => (
                      <motion.div
                        key={notification._id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              notification.isGuest
                                ? "bg-red-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium ${
                                notification.isGuest
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {notification.inquiryDetails.name
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                New inquiry for {notification.design.name}
                              </h4>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              From: {notification.inquiryDetails.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {notification.inquiryDetails.message}
                            </p>
                            <div className="flex items-center mt-2 gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  notification.isGuest
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {notification.isGuest ? "Guest" : "User"}
                              </span>
                              {!notification.isRead && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDropdownOpen(
                                      dropdownOpen === notification._id
                                        ? null
                                        : notification._id
                                    );
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4zM4 10a2 2 0 100-4 2 2 0 000 4zM16 10a2 2 0 100-4 2 2 0 000 4z" />
                                  </svg>
                                </Button>
                                {dropdownOpen === notification._id && (
                                  <div className="absolute right-0 mt-2 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(notification._id);
                                        setIsDeleteConfirmOpen(true);
                                        setDropdownOpen(null); // Close dropdown after selecting delete
                                      }}
                                      className="w-full text-left text-[var(--orange)] hover:bg-[var(--orange)]/10"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                  className="hover:bg-gray-100"
                >
                  Close
                </Button>
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
