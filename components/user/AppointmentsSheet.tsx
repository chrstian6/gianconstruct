"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/stores";
import { getUserInquiries, submitInquiry } from "@/action/inquiries";
import { getDesigns } from "@/action/designs";
import { Inquiry } from "@/types/inquiry";
import { Design } from "@/types/design";
import { parseISO, isAfter, isBefore, isToday } from "date-fns";
import { toast } from "sonner";

// Import tab components
import { ConfirmedTab } from "./userappointments/tabs/ConfirmedTab";
import { RequestsTab } from "./userappointments/tabs/RequestsTab";
import { HistoryTab } from "./userappointments/tabs/HistoryTab";
import { BookingTab } from "./userappointments/tabs/BookingTab";

// Import shared components
import { BookingForm } from "@/components/user/userappointments/BookingForm";

interface AppointmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentsSheet({
  open,
  onOpenChange,
}: AppointmentsSheetProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [activeTab, setActiveTab] = useState("confirmed");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  // Use auth store for user data
  const { user, initialized } = useAuthStore();

  // Debug auth store data
  useEffect(() => {
    console.log("🔐 APPOINTMENT SHEET AUTH DATA:", {
      user: user
        ? {
            user_id: user.user_id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            contactNo: user.contactNo,
            role: user.role,
          }
        : "NO USER",
      initialized,
      open,
    });
  }, [user, initialized, open]);

  useEffect(() => {
    if (open && user?.user_id && initialized) {
      console.log("🔄 Fetching data for user:", user.user_id);
      fetchUserInquiries();
      fetchDesigns();
    }
  }, [open, user?.user_id, initialized]);

  const fetchUserInquiries = async () => {
    if (!user?.user_id || !user?.email) return;

    setLoading(true);
    try {
      const result = await getUserInquiries(user.email, user.user_id);
      if (result.success && result.inquiries) {
        setInquiries(result.inquiries);
      } else {
        console.error("Failed to fetch inquiries:", result.error);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    setLoadingDesigns(true);
    try {
      const result = await getDesigns();
      if (result.success && result.designs) {
        setDesigns(result.designs);
      } else {
        console.error("Failed to fetch designs:", result.error);
        toast.error("Failed to load designs");
      }
    } catch (error) {
      console.error("Error fetching designs:", error);
      toast.error("Failed to load designs");
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Define active appointment statuses (user cannot book new appointments if they have these)
  const ACTIVE_STATUSES = ["pending", "confirmed", "rescheduled"];

  // Define completed/cancelled statuses (user CAN book new appointments if all are these)
  const COMPLETED_OR_CANCELLED_STATUSES = ["completed", "cancelled"];

  // Check if user has any active appointments
  const hasActiveAppointments = useMemo(() => {
    return inquiries.some((inquiry) =>
      ACTIVE_STATUSES.includes(inquiry.status)
    );
  }, [inquiries]);

  // Get completed or cancelled appointments
  const completedOrCancelledAppointments = useMemo(() => {
    return inquiries.filter((inquiry) =>
      COMPLETED_OR_CANCELLED_STATUSES.includes(inquiry.status)
    );
  }, [inquiries]);

  // Memoized filtered designs based on search query
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;

    const query = searchQuery.toLowerCase();
    return designs.filter(
      (design) =>
        design.name.toLowerCase().includes(query) ||
        design.description.toLowerCase().includes(query) ||
        design.category.toLowerCase().includes(query)
    );
  }, [designs, searchQuery]);

  // Filter inquiries based on status and date
  const getConfirmedAppointments = () => {
    const now = new Date();
    return inquiries
      .filter((inquiry) => {
        const appointmentDate = parseISO(inquiry.preferredDate);
        const isUpcoming =
          isAfter(appointmentDate, now) || isToday(appointmentDate);
        return inquiry.status === "confirmed" && isUpcoming;
      })
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getPendingRequests = () => {
    const now = new Date();
    return inquiries
      .filter((inquiry) => {
        const appointmentDate = parseISO(inquiry.preferredDate);
        const isUpcoming =
          isAfter(appointmentDate, now) || isToday(appointmentDate);
        return inquiry.status === "pending" && isUpcoming;
      })
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getPastAppointments = () => {
    const now = new Date();
    return inquiries
      .filter((inquiry) => {
        const appointmentDate = parseISO(inquiry.preferredDate);
        return isBefore(appointmentDate, now) && !isToday(appointmentDate);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const getCompletedOrCancelledAppointments = () => {
    return inquiries
      .filter((inquiry) =>
        COMPLETED_OR_CANCELLED_STATUSES.includes(inquiry.status)
      )
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const confirmedAppointments = getConfirmedAppointments();
  const pendingRequests = getPendingRequests();
  const pastAppointments = getPastAppointments();
  const completedCancelledAppointments = getCompletedOrCancelledAppointments();

  const handleBookingSuccess = () => {
    fetchUserInquiries(); // Refresh appointments
    setSelectedDesign(null); // Reset selected design
    setActiveTab("requests"); // Switch to requests tab
  };

  const handleBackToDesigns = () => {
    setSelectedDesign(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleDesignSelect = (design: Design) => {
    setSelectedDesign(design);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md lg:max-w-lg w-full p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>My Appointments</SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="px-6 pt-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="confirmed">
                Confirmed
                {confirmedAppointments.length > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-2"
                  >
                    {confirmedAppointments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-2"
                  >
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="booking">Book New</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Confirmed Appointments Tab */}
            <TabsContent value="confirmed" className="h-full m-0">
              <ConfirmedTab
                loading={loading}
                user={user}
                confirmedAppointments={confirmedAppointments}
              />
            </TabsContent>

            {/* Pending Requests Tab */}
            <TabsContent value="requests" className="h-full m-0">
              <RequestsTab
                loading={loading}
                user={user}
                pendingRequests={pendingRequests}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="h-full m-0">
              <HistoryTab
                loading={loading}
                user={user}
                pastAppointments={pastAppointments}
              />
            </TabsContent>

            {/* Booking Tab */}
            <TabsContent value="booking" className="h-full m-0">
              <BookingTab
                user={user}
                selectedDesign={selectedDesign}
                searchQuery={searchQuery}
                loadingDesigns={loadingDesigns}
                filteredDesigns={filteredDesigns}
                hasActiveAppointments={hasActiveAppointments}
                completedOrCancelledAppointments={
                  completedCancelledAppointments
                }
                onSearchChange={handleSearchChange}
                onDesignSelect={handleDesignSelect}
                onBookingSuccess={handleBookingSuccess}
                onBackToDesigns={handleBackToDesigns}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Refresh Button */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={fetchUserInquiries}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                Refreshing...
              </>
            ) : (
              "Refresh Appointments"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
