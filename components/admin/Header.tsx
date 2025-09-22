// components/admin/Header.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,

} from "@/components/ui/breadcrumb";
import { LogOut, GalleryVerticalEnd } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Map path segments to readable labels
const pathLabels: Record<string, string> = {
  admin: "Admin",
  admindashboard: "Dashboard",
  "admin-project": "Projects",
  meetings: "Meetings",
  schedules: "Schedules",
  catalog: "Catalog",
  "main-inventory": "Main Inventory",
  "client-inventory": "Client Inventory",
  suppliers: "Suppliers",
  usermanagement: "User Management",
  settings: "Settings",
  appointments: "Appointments",
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { clearUser } = useAuthStore();

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

  const handleLogout = async () => {
    try {
      await clearUser();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        {/* Calendar and Sign-Out */}
        <div className="flex items-right gap-4">
          {/* Dynamic Island-like Calendar */}
          {/* Sign-Out Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:bg-text-secondary hover:text-text-secondary-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
