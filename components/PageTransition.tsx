"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  initialLoad?: boolean;
}

export default function PageTransition({
  children,
  initialLoad = false,
}: PageTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Create a unique key based on route and search params
  const routeKey = `${pathname}${searchParams.toString()}`;

  // Animation variants
  const pageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  };

  // Handle initial load and refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setIsFirstLoad(false);
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  // Handle route changes
  useEffect(() => {
    if (!isFirstLoad) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isFirstLoad]);

  // Handle cursor change
  useEffect(() => {
    if (isAnimating) {
      document.body.style.cursor = "wait";
      document.body.classList.add("transitioning");
    } else {
      document.body.style.cursor = "default";
      document.body.classList.remove("transitioning");
    }

    return () => {
      document.body.style.cursor = "default";
      document.body.classList.remove("transitioning");
    };
  }, [isAnimating]);

  // If it's the first load, show initial animation
  if (isFirstLoad && initialLoad) {
    return (
      <motion.div
        key="initial-load"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={() => setIsAnimating(false)}
        className="page-transition-wrapper"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={routeKey}
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
          className="page-transition-wrapper"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
