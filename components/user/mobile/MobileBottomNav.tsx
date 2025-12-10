// components/user/MobileBottomNav.tsx
"use client";

import * as React from "react";
import {
  Home,
  Search,
  Folder,
  Settings2,
  Bell,
  User,
  Calendar,
  Wallet,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/stores";
import { SettingsDialog } from "@/components/user/Settings";
import { useProjectsCount } from "@/components/user/mobile/ProjectsCountContext";

// Navigation items matching your sidebar
const navItems = [
  {
    title: "Home",
    url: "/user/userdashboard",
    icon: Home,
  },
  {
    title: "Catalog",
    url: "/user/catalog",
    icon: Search,
  },
  {
    title: "Transactions",
    url: "/user/transaction",
    icon: Wallet,
  },
  {
    title: "Profile",
    url: "/user/profile",
    icon: User,
  },
];

interface MobileBottomNavProps {
  activeProjectsCount?: number;
  isLoading?: boolean;
  onAppointmentsClick?: () => void;
}

export function MobileBottomNav({
  activeProjectsCount: propActiveProjectsCount,
  isLoading: propIsLoading,
  onAppointmentsClick,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const { user, clearUser } = useAuthStore();

  // Use context values, fallback to props if provided
  const {
    activeProjectsCount: contextActiveProjectsCount,
    isLoading: contextIsLoading,
  } = useProjectsCount();
  const activeProjectsCount =
    propActiveProjectsCount ?? contextActiveProjectsCount;
  const isLoading = propIsLoading ?? contextIsLoading;

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await clearUser();
      // Redirect to login page
      window.location.href = "/authentication-login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Format user initials
  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Handle appointments click
  const handleAppointmentsClick = () => {
    console.log("📱 Mobile bottom nav: Appointments button clicked");
    if (onAppointmentsClick) {
      onAppointmentsClick();
    } else {
      console.warn(
        "⚠️ onAppointmentsClick prop not provided to MobileBottomNav"
      );
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 lg:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {/* Home */}
          <Link
            href="/user/userdashboard"
            className={cn(
              "flex flex-col items-center justify-center p-2 flex-1 min-w-0",
              isActive("/user/userdashboard")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs truncate">Home</span>
          </Link>

          {/* Catalog */}
          <Link
            href="/user/catalog"
            className={cn(
              "flex flex-col items-center justify-center p-2 flex-1 min-w-0",
              isActive("/user/catalog")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs truncate">Catalog</span>
          </Link>

          {/* CENTER: Appointments Button - Raised with accent */}
          <div className="relative flex-1 min-w-0 flex justify-center">
            <div className="absolute -top-4">
              <button
                onClick={handleAppointmentsClick}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-full shadow-lg transition-all duration-200",
                  "bg-orange-500 hover:bg-primary/90 text-primary-foreground",
                  "h-14 w-14 flex items-center justify-center active:scale-95"
                )}
                aria-label="Appointments"
              >
                <Calendar className="h-6 w-6 mb-0.5" />
                <span className="text-[9px] font-medium mt-0.5">Book</span>
              </button>
            </div>
            {/* Invisible spacer for layout */}
            <div className="h-8 w-full" />
          </div>

          {/* Transactions */}
          <Link
            href="/user/transaction"
            className={cn(
              "flex flex-col items-center justify-center p-2 flex-1 min-w-0",
              isActive("/user/transaction")
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Wallet className="h-5 w-5 mb-1" />
            <span className="text-xs truncate">Transactions</span>
          </Link>

          {/* Profile Sheet */}
          <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center p-2 flex-1 min-w-0 text-muted-foreground">
                <div className="relative">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                    <span className="text-xs font-medium text-primary">
                      {getUserInitials()}
                    </span>
                  </div>
                </div>
                <span className="text-xs truncate">Profile</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[85vh] rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <SheetHeader className="mb-4 pt-2">
                <SheetTitle className="text-center text-xl">
                  Profile & Settings
                </SheetTitle>
              </SheetHeader>

              {/* Scrollable content container */}
              <div className="flex-1 overflow-y-auto px-1 pb-10">
                <div className="space-y-5">
                  {/* User Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                    <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-semibold text-primary">
                        {getUserInitials()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "User"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground px-3">
                      Quick Actions
                    </h4>

                    {/* Appointments Button */}
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 px-4"
                        onClick={handleAppointmentsClick}
                      >
                        <Calendar className="mr-3 h-5 w-5" />
                        <span className="text-sm">Book Appointment</span>
                      </Button>
                    </SheetClose>

                    {/* Projects with Badge */}
                    <SheetClose asChild>
                      <Link href="/user/projects" className="block">
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4 relative"
                        >
                          <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5" />
                            <span className="text-sm">My Projects</span>
                            {!isLoading && activeProjectsCount > 0 && (
                              <Badge className="h-5 min-w-5 p-0 flex items-center justify-center text-[10px] font-medium bg-orange-500 text-white border-0">
                                {activeProjectsCount > 99
                                  ? "99+"
                                  : activeProjectsCount}
                              </Badge>
                            )}
                          </div>
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>

                  {/* Settings */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground px-3">
                      Settings
                    </h4>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 px-4"
                        onClick={() => setIsSettingsOpen(true)}
                      >
                        <Settings2 className="mr-3 h-5 w-5" />
                        <span className="text-sm">Account Settings</span>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </div>

              {/* Fixed bottom section with logout button */}
              <div className="absolute bottom-0 left-0 right-0 bg-background border-t pt-4 pb-6 px-4">
                <Separator className="mb-4" />
                <Button
                  variant="destructive"
                  className="w-full h-12"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span className="text-sm font-medium">Logout</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Settings Dialog */}
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
