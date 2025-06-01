"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Navbar({ isMenuOpen, setIsMenuOpen }: NavbarProps) {
  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Contacts", href: "#contact" },
    { name: "Design Catalog", href: "/design-catalog" },
    { name: "Admin", href: "/admin/admindashboard" }, // Added Admin link
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <a href="/" className="text-xl font-bold text-text-secondary">
          GianConstruct®
        </a>

        {/* Desktop Navigation */}
        <div className="flex-1 flex items-center justify-between">
          <nav className="hidden md:flex items-center justify-center space-x-6 flex-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-text-secondary transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>
          <Button
            variant="outline"
            className="hidden md:block border-text-secondary text-text-secondary hover:bg-text-secondary hover:text-text-secondary-foreground"
          >
            Set a Meeting
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[240px] flex flex-col justify-between"
          >
            <nav className="flex flex-col gap-4 text-center">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-foreground hover:text-text-secondary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="mt-6 border-t pt-4">
              <Button
                variant="outline"
                className="border-text-secondary text-text-secondary hover:bg-text-secondary hover:text-text-secondary-foreground w-full max-w-[200px] mx-auto"
                onClick={() => setIsMenuOpen(false)}
              >
                Set a Meeting
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
