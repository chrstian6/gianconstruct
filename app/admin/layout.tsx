"use client";

import { AppSidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { Footer } from "@/components/admin/Footer"; // Import the new Footer component
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
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header remains at top */}
        <Header />

        {/* Main content area - flex-grow to take available space */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">{children}</div>
        </main>

        {/* Footer at the bottom */}
        <Footer />
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
