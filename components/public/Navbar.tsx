"use client";
import * as React from "react";
import Router from "next/router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo - Mobile & Desktop */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl md:text-3xl font-bold text-orange-500">
              GianConstruct®
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 px-8">
            <div className="flex items-center space-x-1">
              {adjustedNavItems.map((item, index) => (
                <React.Fragment key={item.name}>
                  <Link
                    href={item.href}
                    className="px-4 py-2 text-sm md:text-base font-medium text-gray-700 hover:text-orange-500 transition-colors duration-200 rounded-lg hover:bg-gray-50"
                    onClick={(e) => {
                      if (item.href.startsWith("/#") && pathname !== "/") {
                        e.preventDefault();
                        window.location.href = item.href;
                      }
                    }}
                  >
                    {item.name}
                  </Link>
                  {index < adjustedNavItems.length - 1 && (
                    <div className="w-px h-4 bg-gray-200" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/authentication-login">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 text-sm font-medium border-gray-300 hover:border-orange-500 hover:text-orange-500 transition-all duration-200 cursor-pointer"
              >
                Login
              </Button>
            </Link>
            <Link href="/authentication-login?signup=email">
              <Button
                size="lg"
                className="bg-orange-500 text-white rounded-full px-6 text-sm font-medium hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
              >
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-[320px] flex flex-col p-0 bg-white border-l border-gray-100"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <Link
                  href="/"
                  className="text-xl font-bold text-orange-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  GianConstruct®
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {adjustedNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-3 py-3 text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-lg transition-colors duration-200"
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
                </div>
              </nav>

              {/* Mobile Buttons */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="space-y-3">
                  <Link
                    href="/authentication-login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-lg py-3 text-base font-medium border-gray-300 hover:border-orange-500 hover:text-orange-500 transition-all duration-200"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/authentication-login?signup=email"
                    onClick={() => setIsMenuOpen(false)}
                    className="block"
                  >
                    <Button className="w-full bg-orange-500 text-white rounded-lg py-3 text-base font-medium hover:bg-orange-600 transition-all duration-200 shadow-sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
