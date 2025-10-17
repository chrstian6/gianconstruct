"use client";
import * as React from "react";
import Router from "next/router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useModalStore } from "@/lib/stores";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { setIsLoginOpen, setIsCreateAccountOpen } = useModalStore();
  const [isEmailSignup, setIsEmailSignup] = useState(false);
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
    <header className="sticky top-0 z-50 bg-white flex-1 flex items-center">
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
          <Link href="/authentication-login?signup=email">
            <Button className="bg-orange-500 text-white rounded-full hover:bg-orange-600 cursor-pointer">
              Sign Up
            </Button>
          </Link>
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
          <div className="flex flex-col gap-3 mt-8">
            <Link
              href="/authentication-login"
              onClick={() => setIsMenuOpen(false)}
            >
              <Button
                variant="outline"
                className="w-full rounded-full text-regular cursor-pointer"
              >
                Login
              </Button>
            </Link>
            <Link
              href="/authentication-login?signup=email"
              onClick={() => setIsMenuOpen(false)}
            >
              <Button className="w-full bg-orange-500 text-white rounded-full hover:bg-orange-600 cursor-pointer">
                Sign Up
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
