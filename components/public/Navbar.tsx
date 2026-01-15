"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import {
  MotionHighlight,
  MotionHighlightItem,
} from "@/components/ui/motion-highlight";

interface NavbarProps {
  isWhiteBackground?: boolean;
  introScrollProgress?: number;
}

export function Navbar({
  isWhiteBackground = false,
  introScrollProgress = 0,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial scroll position

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Calculate dynamic colors based on scroll progress
  const getColors = () => {
    if (introScrollProgress > 0) {
      // For gradual transition from dark to light
      const progress = introScrollProgress;

      // Text color: white (255,255,255) to black (0,0,0)
      const textR = Math.round(255 * (1 - progress) + 0 * progress);
      const textG = Math.round(255 * (1 - progress) + 0 * progress);
      const textB = Math.round(255 * (1 - progress) + 0 * progress);

      // Gray hover color with opacity - adapts to background
      // For dark background: rgba(128, 128, 128, 0.2)
      // For light background: rgba(128, 128, 128, 0.1)
      const grayOpacity = progress > 0.5 ? 0.1 : 0.2;

      return {
        textColor: `rgb(${textR}, ${textG}, ${textB})`,
        textColorMuted: `rgba(${textR}, ${textG}, ${textB}, 0.9)`,
        borderColor: `rgba(${textR}, ${textG}, ${textB}, 0.3)`,
        hoverBgColor: `rgba(128, 128, 128, ${grayOpacity})`,
        activeBgColor: `rgba(128, 128, 128, ${grayOpacity * 1.5})`,
      };
    }

    // Fallback to white or black based on isWhiteBackground
    return isWhiteBackground
      ? {
          textColor: "#000000",
          textColorMuted: "rgba(0, 0, 0, 0.9)",
          borderColor: "rgba(0, 0, 0, 0.3)",
          hoverBgColor: "rgba(128, 128, 128, 0.1)", // Lighter gray for light background
          activeBgColor: "rgba(128, 128, 128, 0.15)",
        }
      : {
          textColor: "#ffffff",
          textColorMuted: "rgba(255, 255, 255, 0.9)",
          borderColor: "rgba(255, 255, 255, 0.3)",
          hoverBgColor: "rgba(128, 128, 128, 0.2)", // Darker gray for dark background
          activeBgColor: "rgba(128, 128, 128, 0.3)",
        };
  };

  const colors = getColors();

  // Original nav items
  const navItems = [
    { name: "HOME", href: "/" },
    { name: "ABOUT", href: "#about" },
    { name: "SERVICES", href: "#services" },
    { name: "CONTACTS", href: "#contact" },
    { name: "CATALOG", href: "/catalog" },
  ];

  // Memoize adjusted nav items based on pathname
  const adjustedNavItems = useMemo(() => {
    return navItems.map((item) => {
      if (item.href.startsWith("#") && pathname !== "/") {
        return { ...item, href: `/#${item.href.substring(1)}` };
      }
      return item;
    });
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "py-1" : "py-4"
      }`}
    >
      <div className="w-full px-6 lg:px-8 xl:px-12">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "h-12 md:h-14" : "h-16 md:h-20"
          }`}
        >
          {/* Logo - Reduced size when scrolled */}
          <div className="flex-none">
            <Link href="/" className="flex items-center space-x-2">
              <div
                className={`font-light tracking-tight transition-all duration-300 ${
                  isScrolled ? "text-lg" : "text-xl md:text-2xl"
                }`}
                style={{ color: colors.textColor }}
              >
                GIAN<span className="font-normal">CONSTRUCT</span>
                <sup
                  className={`align-super tracking-wider ml-0.5 transition-all duration-300 ${
                    isScrolled ? "text-[7px]" : "text-[8px] md:text-[10px]"
                  }`}
                >
                  ®
                </sup>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Reduced size when scrolled */}
          <nav className="hidden md:flex items-center justify-center flex-1 px-8">
            <MotionHighlight
              mode="parent"
              hover
              className="bg-transparent"
              boundsOffset={{ top: -8, left: -16, width: 32, height: 16 }}
              containerClassName={`relative rounded-xl bg-transparent transition-all duration-300 ${
                isScrolled ? "p-1" : "p-2"
              }`}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              highlightStyle={{ backgroundColor: colors.hoverBgColor }}
            >
              <div className="flex items-center space-x-0">
                {adjustedNavItems.map((item) => (
                  <MotionHighlightItem
                    key={item.name}
                    value={item.name}
                    className={isScrolled ? "px-4 py-1.5" : "px-5 py-2.5"}
                    asChild
                  >
                    <Link
                      href={item.href}
                      className={`relative font-light tracking-wide transition-all duration-300 rounded-lg mr-10 transform hover:scale-105 hover:font-medium ${
                        isScrolled ? "text-sm" : "text-sm md:text-base"
                      }`}
                      style={{
                        color: colors.textColorMuted,
                      }}
                      onClick={(e) => {
                        if (item.href.startsWith("/#") && pathname !== "/") {
                          e.preventDefault();
                          window.location.href = item.href;
                        }
                      }}
                    >
                      {item.name}
                    </Link>
                  </MotionHighlightItem>
                ))}
              </div>
            </MotionHighlight>
          </nav>

          {/* Desktop Buttons - Reduced size when scrolled */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/authentication-login">
              <Button
                variant="outline"
                size={isScrolled ? "sm" : "lg"}
                className={`font-light tracking-wider transition-all duration-300 hover:scale-105 hover:font-medium ${
                  isScrolled
                    ? "rounded-full px-4 text-xs"
                    : "rounded-full px-6 text-sm"
                }`}
                style={{
                  color: colors.textColor,
                  borderColor: colors.borderColor,
                  backgroundColor: "transparent",
                }}
              >
                LOGIN
              </Button>
            </Link>
            <Link href="/authentication-login?signup=email">
              <Button
                size={isScrolled ? "sm" : "lg"}
                className={`font-light tracking-wider transition-all duration-300 hover:scale-105 hover:font-medium ${
                  isScrolled
                    ? "rounded-full px-4 text-xs shadow hover:shadow"
                    : "rounded-full px-6 text-sm shadow-lg hover:shadow-xl"
                }`}
                style={{
                  color:
                    isWhiteBackground || introScrollProgress > 0.5
                      ? "#ffffff"
                      : "#f97316",
                  backgroundColor:
                    isWhiteBackground || introScrollProgress > 0.5
                      ? "#f97316"
                      : "#ffffff",
                  border: "none",
                }}
              >
                SIGN UP
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button - Reduced size when scrolled */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="outline"
                size="icon"
                className={`p-0 rounded-lg hover:bg-opacity-10 transition-all duration-300 hover:scale-105 ${
                  isScrolled ? "h-8 w-8" : "h-10 w-10"
                }`}
                style={{
                  color: colors.textColor,
                  borderColor: colors.borderColor,
                  backgroundColor: "transparent",
                }}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className={isScrolled ? "h-4 w-4" : "h-5 w-5"} />
                ) : (
                  <Menu className={isScrolled ? "h-4 w-4" : "h-5 w-5"} />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-[320px] flex flex-col p-0"
              style={{
                backgroundColor:
                  isWhiteBackground || introScrollProgress > 0.5
                    ? "#ffffff"
                    : "#1f2937",
                borderColor: colors.borderColor,
              }}
            >
              {/* Mobile Menu Header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{
                  borderColor: colors.borderColor,
                }}
              >
                <Link
                  href="/"
                  className="text-xl font-light tracking-tight"
                  style={{
                    color:
                      isWhiteBackground || introScrollProgress > 0.5
                        ? "#000000"
                        : "#ffffff",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  GIAN<span className="font-normal">CONSTRUCT</span>
                  <sup className="text-[8px] align-super tracking-wider ml-0.5">
                    ®
                  </sup>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 hover:bg-opacity-10 rounded-lg hover:scale-105"
                  style={{
                    color:
                      isWhiteBackground || introScrollProgress > 0.5
                        ? "#000000"
                        : "#ffffff",
                    backgroundColor: "transparent",
                  }}
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <MotionHighlight
                    hover
                    className="p-2 rounded-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    highlightStyle={{
                      backgroundColor:
                        isWhiteBackground || introScrollProgress > 0.5
                          ? "rgba(128, 128, 128, 0.1)"
                          : "rgba(128, 128, 128, 0.2)",
                    }}
                  >
                    {adjustedNavItems.map((item) => (
                      <MotionHighlightItem
                        key={item.name}
                        value={item.name}
                        className="px-3 py-3"
                        asChild
                      >
                        <Link
                          href={item.href}
                          className="flex items-center text-base font-light tracking-wide rounded-lg transition-all duration-200 relative transform hover:scale-105 hover:font-medium"
                          style={{
                            color:
                              isWhiteBackground || introScrollProgress > 0.5
                                ? "#374151"
                                : "#e5e7eb",
                          }}
                          onClick={(e) => {
                            if (
                              item.href.startsWith("/#") &&
                              pathname !== "/"
                            ) {
                              e.preventDefault();
                              window.location.href = item.href;
                            }
                            setIsMenuOpen(false);
                          }}
                        >
                          {item.name}
                        </Link>
                      </MotionHighlightItem>
                    ))}
                  </MotionHighlight>
                </div>
              </nav>

              {/* Mobile Buttons */}
              <div
                className="p-4 border-t"
                style={{
                  borderColor: colors.borderColor,
                }}
              >
                <div className="space-y-3">
                  <Link
                    href="/authentication-login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-lg py-3 text-base font-light tracking-wider transition-all duration-200 transform hover:scale-105 hover:font-medium"
                      style={{
                        color:
                          isWhiteBackground || introScrollProgress > 0.5
                            ? "#374151"
                            : "#e5e7eb",
                        borderColor: colors.borderColor,
                        backgroundColor: "transparent",
                      }}
                    >
                      LOGIN
                    </Button>
                  </Link>
                  <Link
                    href="/authentication-login?signup=email"
                    onClick={() => setIsMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      className="w-full rounded-lg py-3 text-base font-light tracking-wider transition-all duration-200 shadow-sm transform hover:scale-105 hover:font-medium"
                      style={{
                        backgroundColor:
                          isWhiteBackground || introScrollProgress > 0.5
                            ? "#f97316"
                            : "#ffffff",
                        color:
                          isWhiteBackground || introScrollProgress > 0.5
                            ? "#ffffff"
                            : "#000000",
                        border: "none",
                      }}
                    >
                      SIGN UP
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
