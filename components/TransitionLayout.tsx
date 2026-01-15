"use client";

import { useState, useEffect, ReactNode } from "react";
import PageTransition from "./PageTransition";
import { usePathname } from "next/navigation";

interface TransitionLayoutProps {
  children: ReactNode;
}

export default function TransitionLayout({ children }: TransitionLayoutProps) {
  const pathname = usePathname();
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Check if this is the first load (refresh or direct access)
  useEffect(() => {
    const navigationEntries = performance.getEntriesByType("navigation");
    const isHardNavigation = navigationEntries.some(
      (entry) => (entry as PerformanceNavigationTiming).type === "reload"
    );

    setIsInitialLoad(
      isHardNavigation || !sessionStorage.getItem("hasLoadedBefore")
    );

    // Mark that we've loaded before
    sessionStorage.setItem("hasLoadedBefore", "true");

    // Reset after animation
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <PageTransition key={pathname} initialLoad={isInitialLoad}>
      {children}
    </PageTransition>
  );
}
