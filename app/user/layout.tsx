// app/user/layout.tsx
"use client";

import { useState, useEffect } from "react";
import AppSidebar from "@/components/user/Sidebar";
import { UserNavbar } from "@/components/user/UserNavbar";
import { AppointmentsSheet } from "@/components/user/AppointmentsSheet";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const { initialize, initialized } = useAuthStore();

  // Initialize auth store
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <UserNavbar onAppointmentsClick={() => setAppointmentsOpen(true)} />
        <main className="flex-1">{children}</main>
      </SidebarInset>

      {/* Appointments Sheet */}
      <AppointmentsSheet
        open={appointmentsOpen}
        onOpenChange={setAppointmentsOpen}
      />
    </SidebarProvider>
  );
}
