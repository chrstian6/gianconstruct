"use client";

import { Heart } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useState, useEffect } from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuthStore();
  const [userInitial, setUserInitial] = useState("A");
  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState("Administrator");

  // Update user info from auth store
  useEffect(() => {
    if (user) {
      const initial = user.firstName?.[0] || "A";
      const name = user.firstName || "Admin";
      const role = user.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
        : "Administrator";

      setUserInitial(initial);
      setUserName(name);
      setUserRole(role);
    }
  }, [user]);

  // Get footer links based on sidebar menu
  const getFooterLinks = () => {
    const isCashier = user?.role === "cashier";

    if (isCashier) {
      return [
        { name: "Dashboard", href: "/admin/admindashboard" },
        { name: "Transactions", href: "/admin/transaction" },
      ];
    }

    return [
      { name: "Dashboard", href: "/admin/admindashboard" },
      { name: "Appointments", href: "/admin/appointments" },
      { name: "Transactions", href: "/admin/transaction" },
      { name: "Projects", href: "/admin/admin-project" },
      { name: "Catalog", href: "/admin/catalog" },
      { name: "Inventory", href: "/admin/inventory" },
      { name: "User Management", href: "/admin/usermanagement" },
      { name: "Settings", href: "/admin/settings" },
    ];
  };

  const footerLinks = getFooterLinks();

  return (
    <footer className="border-t border-border bg-background text-muted-foreground py-4">
      <div className="container mx-auto px-6">
        {/* Top section - Quick Links aligned with sidebar */}
        <div className="mb-4 pb-4 border-b border-border/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Quick Links - Horizontal layout matching sidebar categories */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {footerLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            {/* System status indicator - matching sidebar badge style */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-foreground">
                System Operational
              </span>
            </div>
          </div>
        </div>

        {/* Bottom section - Copyright and legal links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left side - Copyright */}
          <div className="text-center md:text-left">
            <p className="text-xs">
              © {currentYear} Dashboard Admin. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built with Nomka.
              <Heart className="inline-block h-3 w-3 text-red-500" />{" "}
            </p>
          </div>

          {/* Center - Legal Links */}
          <div className="flex items-center gap-4">
            <a
              href="/admin/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="/admin/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a
              href="/admin/support"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </a>
          </div>

          {/* Right side - Version Info */}
          <div className="text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-accent">
              <span className="text-xs font-medium text-foreground">
                v1.0.0
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
