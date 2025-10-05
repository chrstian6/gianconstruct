"use client";

import { AppSidebar } from "@/components/admin/Sidebar"; // Corrected path and default import
import { Header } from "@/components/admin/Header";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
          <Header />
        <main>{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
