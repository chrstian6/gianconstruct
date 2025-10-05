"use client";
import * as React from "react";
import Router from "next/router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useModalStore } from "@/lib/stores";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { setIsLoginOpen, setIsCreateAccountOpen } = useModalStore();
  const pathname = usePathname();

  // Original nav items
  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Contacts", href: "#contact" },
    { name: "Design Catalog", href: "/catalog" },
    { name: "Admin", href: "/admin/admindashboard" },
  ];

  // Memoize adjusted nav items based on pathname
  const adjustedNavItems = useMemo(() => {
    return navItems.map((item) => {
      if (item.href.startsWith("#") && pathname !== "/") {
        return { ...item, href: `/#${item.href.substring(1)}` };
      }
      return item;
    });
  }, [pathname]); // Only recompute when pathname changes

  return (
    <header className="sticky top-0 z-50 bg-white backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="flex-1 flex items-center justify-between">
        <div className="container mx-auto flex h-16 items-center px-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-orange-500">
            GianConstruct®
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center space-x-6 flex-1">
            {adjustedNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-black hover:text-orange-500 transition-colors"
                onClick={(e) => {
                  if (item.href.startsWith("/#") && pathname !== "/") {
                    e.preventDefault(); // Prevent default anchor behavior
                    window.location.href = item.href; // Force navigation
                  }
                }}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/authentication-login">
              <Button
                variant="outline"
                className="rounded-full text-regular cursor-pointer"
              >
                Login
              </Button>
            </Link>
            <Button
              className="bg-orange-500 text-white rounded-full hover:bg-orange-600 cursor-pointer"
              onClick={() => setIsCreateAccountOpen(true)}
            >
              Sign Up
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
              <Menu className="h-6 w-6 text-black" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[240px] flex flex-col justify-between bg-white"
          >
            <nav className="flex flex-col gap-4 text-center">
              {adjustedNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-black hover:text-orange-500 transition-colors"
                  onClick={(e) => {
                    if (item.href.startsWith("/#") && pathname !== "/") {
                      e.preventDefault();
                      window.location.href = item.href;
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Buttons */}
            <div className="mt-6 border-t border-gray-200 pt-4 space-y-3">
              <Link href="/authentication-login">
                <Button
                  variant="outline"
                  className="rounded-full text-regular cursor-pointer"
                >
                  Login
                </Button>
              </Link>
              <Button
                className="bg-orange-500 text-white rounded-full hover:bg-orange-600 w-full"
                onClick={() => {
                  setIsCreateAccountOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Sign Up
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
