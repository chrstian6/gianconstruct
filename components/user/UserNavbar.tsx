// components/user/UserNavbar.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface UserNavbarProps {
  breadcrumbItems?: {
    label: string;
    href?: string;
    isCurrent?: boolean;
  }[];
}

export function UserNavbar({ breadcrumbItems = [] }: UserNavbarProps) {
  const router = useRouter();
  const { clearUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await clearUser();
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const defaultBreadcrumb = [
    { label: "Dashboard", href: "/user", isCurrent: true },
  ];

  const items =
    breadcrumbItems.length > 0 ? breadcrumbItems : defaultBreadcrumb;

  return (
    <nav className="flex items-center justify-between h-16 px-6 border-b bg-background">
      {/* Breadcrumb */}
      <div className="flex items-center">
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => (
              <BreadcrumbItem key={index}>
                {item.href && !item.isCurrent ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
                {index < items.length - 1 && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Logout Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </nav>
  );
}
