// app/user/layout.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import AppSidebar from "@/components/user/Sidebar";
import { MobileBottomNav } from "@/components/user/mobile/MobileBottomNav";
import { UserNavbar } from "@/components/user/UserNavbar";
import { AppointmentsSheet } from "@/components/user/AppointmentsSheet";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores";
import { ProjectsCountProvider } from "@/components/user/mobile/ProjectsCountContext";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const { initialize, initialized } = useAuthStore();

  // Memoize the UserNavbar to prevent re-renders
  const memoizedUserNavbar = useMemo(() => {
    return <UserNavbar onAppointmentsClick={() => setAppointmentsOpen(true)} />;
  }, []);

  // Initialize auth store
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <ProjectsCountProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {memoizedUserNavbar}
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav
            onAppointmentsClick={() => setAppointmentsOpen(true)}
          />
        </SidebarInset>

        {/* Appointments Sheet */}
        <AppointmentsSheet
          open={appointmentsOpen}
          onOpenChange={setAppointmentsOpen}
        />
      </SidebarProvider>
    </ProjectsCountProvider>
  );
}
