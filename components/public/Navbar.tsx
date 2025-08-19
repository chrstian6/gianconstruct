"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Contacts", href: "#contact" },
    { name: "Design Catalog", href: "/catalog" },
    { name: "Admin", href: "/admin/admindashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-[var(--orange)]">
          GianConstruct®
        </Link>

        {/* Desktop Navigation */}
        <div className="flex-1 flex items-center justify-between">
          <nav className="hidden md:flex items-center justify-center space-x-6 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-orange hover:text-[var(--orange)] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <Button
            variant="outline"
            className="hidden md:block border-[var(--orange)] text-[var(--orange)] hover:bg-text-secondary hover:text-orange-foreground cursor-pointer"
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
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-foreground hover:text-text-secondary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-6 border-t pt-4">
              <Button
                variant="outline"
                className="border-text-secondary text-text-secondary hover:bg-[var(--orange)] hover:text-text-secondary-foreground w-full max-w-[200px] mx-auto"
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
