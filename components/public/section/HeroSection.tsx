"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CachedDesign, getHeroDesigns } from "@/action/designs-cache";
import { useEffect, useState, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import gsap from "gsap";
import FullCatalog from "@/components/public/FullCatalog";
import Lenis from "lenis";

// Extended CachedDesign type with description
interface ExtendedCachedDesign extends CachedDesign {}

// Export ExtendedCachedDesign for use in FullCatalog
export type { ExtendedCachedDesign };

// Custom Vertical Carousel Component with Snap Behavior
interface VerticalCarouselProps {
  designs: ExtendedCachedDesign[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isFullScreen?: boolean;
}

const VerticalCarousel: React.FC<VerticalCarouselProps> = ({
  designs,
  currentIndex,
  onIndexChange,
  isFullScreen = false,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWheelTimeRef = useRef(0);

  // Handle wheel scroll with debouncing
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 300) return;
      lastWheelTimeRef.current = now;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      wheelTimeoutRef.current = setTimeout(() => {
        if (e.deltaY > 20) {
          const nextIndex =
            currentIndex === designs.length - 1
              ? designs.length - 1
              : currentIndex + 1;
          onIndexChange(nextIndex);
        } else if (e.deltaY < -20) {
          const prevIndex = currentIndex === 0 ? 0 : currentIndex - 1;
          onIndexChange(prevIndex);
        }
      }, 50);
    },
    [currentIndex, designs.length, onIndexChange]
  );

  // Handle touch/mouse drag with snap behavior
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      setIsDragging(true);
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      setStartY(y);
      setScrollPosition(carouselRef.current?.scrollTop || 0);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging || !carouselRef.current) return;

      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaY = startY - y;

      carouselRef.current.scrollTop = scrollPosition + deltaY;
    },
    [isDragging, startY, scrollPosition]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !carouselRef.current || !itemRefs.current[currentIndex])
      return;

    setIsDragging(false);

    const scrollTop = carouselRef.current.scrollTop;
    const itemHeight = itemRefs.current[0]?.offsetHeight || 0;
    const nearestIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(
      0,
      Math.min(nearestIndex, designs.length - 1)
    );

    if (clampedIndex !== currentIndex) {
      onIndexChange(clampedIndex);
    }

    carouselRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: "smooth",
    });
  }, [isDragging, currentIndex, designs.length, onIndexChange]);

  // Scroll to current item with snap
  useEffect(() => {
    if (!carouselRef.current || !itemRefs.current[currentIndex]) return;

    const itemHeight = itemRefs.current[0]?.offsetHeight || 0;
    carouselRef.current.scrollTo({
      top: currentIndex * itemHeight,
      behavior: "smooth",
    });
  }, [currentIndex]);

  // Add wheel event listener
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (carousel) {
        carousel.removeEventListener("wheel", handleWheel);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [handleWheel]);

  if (designs.length === 0) return null;

  return (
    <div
      ref={carouselRef}
      className="relative h-full overflow-hidden scrollbar-hide cursor-grab snap-y snap-mandatory"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className="flex flex-col">
        {designs.map((design, index) => (
          <div
            key={design.design_id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`flex-shrink-0 snap-start ${
              isFullScreen ? "min-h-[400px]" : "min-h-[200px]"
            }`}
            data-index={index}
          >
            <div
              className={`p-1 transition-all duration-300 ${
                index === currentIndex
                  ? isFullScreen
                    ? "opacity-100 scale-100 border-l-4 border-white"
                    : "opacity-100 scale-105"
                  : "opacity-40 scale-95"
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-lg ${
                  isFullScreen
                    ? "bg-white/10 backdrop-blur-sm border border-white/20"
                    : "bg-white/5 backdrop-blur-sm border border-white/10"
                }`}
              >
                <div className={`${isFullScreen ? "p-6" : "p-4"}`}>
                  <div className="flex items-center">
                    <div
                      className={`relative flex-shrink-0 ${
                        isFullScreen ? "w-32 h-32 mr-6" : "w-24 h-24 mr-4"
                      }`}
                    >
                      {design?.images && design.images.length > 0 && (
                        <Image
                          src={design.images[0]}
                          alt={design.name || "Design image"}
                          fill
                          className="object-cover rounded-md"
                          sizes={isFullScreen ? "128px" : "96px"}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4
                            className={`font-light text-white ${
                              isFullScreen
                                ? "text-2xl mb-2"
                                : "text-sm truncate"
                            }`}
                          >
                            {design?.name || "Untitled Design"}
                          </h4>
                          <p
                            className={`text-white/60 ${
                              isFullScreen ? "text-lg mb-3" : "text-xs truncate"
                            }`}
                          >
                            {design?.category || "Uncategorized"}
                          </p>
                        </div>
                        <div
                          className={`font-mono tracking-wider ${
                            isFullScreen ? "text-2xl" : "text-xs"
                          }`}
                        >
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </div>
                      </div>

                      {isFullScreen && design?.description && (
                        <div className="mt-4">
                          <p className="text-white/80 font-light leading-relaxed line-clamp-3">
                            {design.description}
                          </p>
                          <div className="mt-3">
                            <div className="text-xl font-light text-white">
                              {new Intl.NumberFormat("en-PH", {
                                style: "currency",
                                currency: "PHP",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(design.price || 0)}
                            </div>
                          </div>
                          <div className="mt-4">
                            <Link
                              href={`/catalog/${design.design_id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-all duration-300 text-white text-sm font-light tracking-wider rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>VIEW FULL DETAILS</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Rolling Text Character Component for Full Screen
function RollingCharacter({
  char,
  index,
  totalLength,
  shouldAnimate,
  direction = "down",
  isNewText = false,
  animationStartDelay = 0,
  animationSpeed = 1.0,
  syncOffset = 0,
}: {
  char: string;
  index: number;
  totalLength: number;
  shouldAnimate: boolean;
  direction?: "up" | "down";
  isNewText?: boolean;
  animationStartDelay?: number;
  animationSpeed?: number;
  syncOffset?: number;
}) {
  const displayChar = char === " " ? "\u00A0" : char;

  const getAnimationParams = () => {
    const charDuration = 0.3 * animationSpeed;
    const charDelay = 0.025 * animationSpeed;
    const totalStagger = 0.3 * animationSpeed;
    const startOffset = 0.1;

    return {
      charDuration,
      charDelay,
      totalStagger,
      startOffset,
    };
  };

  const params = getAnimationParams();
  const delayPosition = direction === "up" ? totalLength - 1 - index : index;
  const staggerDelay =
    (delayPosition / Math.max(1, totalLength - 1)) * params.totalStagger;

  const exitDelay =
    animationStartDelay + params.startOffset + staggerDelay + syncOffset;
  const entryDelay =
    animationStartDelay +
    params.startOffset +
    staggerDelay +
    params.charDelay * 2 +
    syncOffset;

  return (
    <span
      className="relative inline-block"
      style={{ perspective: "1000px" } as any}
    >
      {!isNewText && (
        <motion.span
          className="absolute inline-block backface-hidden"
          style={
            {
              transformStyle: "preserve-3d",
              transformOrigin: direction === "down" ? "50% 100%" : "50% 0%",
            } as any
          }
          initial={{ rotateX: 0 }}
          animate={
            shouldAnimate
              ? {
                  rotateX: direction === "down" ? -90 : 90,
                  opacity: 0,
                }
              : {
                  rotateX: 0,
                  opacity: 1,
                }
          }
          transition={{
            duration: params.charDuration,
            delay: exitDelay,
            ease: "easeInOut",
          }}
        >
          {displayChar}
        </motion.span>
      )}

      {isNewText && (
        <motion.span
          className="absolute inline-block backface-hidden"
          style={
            {
              transformStyle: "preserve-3d",
              transformOrigin: direction === "down" ? "50% 0%" : "50% 100%",
            } as any
          }
          initial={{
            rotateX: direction === "down" ? 90 : -90,
            opacity: 0,
          }}
          animate={
            shouldAnimate
              ? {
                  rotateX: 0,
                  opacity: 1,
                }
              : {
                  rotateX: direction === "down" ? 90 : -90,
                  opacity: 0,
                }
          }
          transition={{
            duration: params.charDuration,
            delay: entryDelay,
            ease: "easeInOut",
          }}
        >
          {displayChar}
        </motion.span>
      )}

      <span className="invisible">{displayChar}</span>
    </span>
  );
}

export default function HeroSection() {
  const [designs, setDesigns] = useState<ExtendedCachedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState<
    "image" | "carousel" | "catalog"
  >("image");
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimatingToFullScreen, setIsAnimatingToFullScreen] = useState(false);
  const [isReadyForNextSection, setIsReadyForNextSection] = useState(false);
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [atLastDesign, setAtLastDesign] = useState(false);
  const [hasPerformedExtraScroll, setHasPerformedExtraScroll] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const mainLayoutContainerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const lastInteractionTime = useRef(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startY = useRef(0);
  const carouselScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageCloneRef = useRef<HTMLDivElement | null>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const fullScreenContentRef = useRef<HTMLDivElement>(null);
  const autoSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const continueHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lenisRafId = useRef<number | null>(null);
  const lastWheelTimeRef = useRef(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef(0);
  const lastScrollAttemptRef = useRef(0);
  const isProcessingScroll = useRef(false);
  const scrollAttemptCountRef = useRef(0);

  // Initialize Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    setLenisInstance(lenis);

    function raf(time: number) {
      lenis.raf(time);
      lenisRafId.current = requestAnimationFrame(raf);
    }

    lenisRafId.current = requestAnimationFrame(raf);

    return () => {
      if (lenisRafId.current) {
        cancelAnimationFrame(lenisRafId.current);
      }
      lenis.destroy();
    };
  }, []);

  // Track when we reach the last design
  useEffect(() => {
    if (designs.length > 0) {
      const isLastDesign = currentIndex === designs.length - 1;
      setAtLastDesign(isLastDesign);

      if (isLastDesign && !hasPerformedExtraScroll) {
        setShowContinueHint(true);

        // Auto hide continue hint after 5 seconds
        if (continueHintTimeoutRef.current) {
          clearTimeout(continueHintTimeoutRef.current);
        }
        continueHintTimeoutRef.current = setTimeout(() => {
          setShowContinueHint(false);
        }, 5000);

        // Reset scroll attempt count when reaching last design
        scrollAttemptCountRef.current = 0;
      }
    }
  }, [currentIndex, designs.length, hasPerformedExtraScroll]);

  // Handle index change with smooth transition
  const handleIndexChange = useCallback(
    (index: number) => {
      if (isScrolling || designs.length === 0 || isFullScreen) return;

      setIsScrolling(true);
      setCurrentIndex(index);

      // Reset extra scroll flag when navigating away from last design
      if (index !== designs.length - 1) {
        setHasPerformedExtraScroll(false);
        scrollAttemptCountRef.current = 0;
      }

      setTimeout(() => setIsScrolling(false), 800);
    },
    [isScrolling, designs.length, isFullScreen]
  );

  // Handle global wheel events for entire hero section
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const heroSection = heroSectionRef.current;
      if (!heroSection || isFullScreen || isProcessingScroll.current) return;

      const rect = heroSection.getBoundingClientRect();
      const isInHeroSection =
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right;

      if (isInHeroSection) {
        e.preventDefault();

        // Debounce wheel events
        const now = Date.now();
        if (now - lastWheelTimeRef.current < 300) return;
        lastWheelTimeRef.current = now;

        // If at last design
        if (atLastDesign && !isReadyForNextSection) {
          // Increment scroll attempt count
          scrollAttemptCountRef.current++;

          // First scroll attempt at last design - just show hint
          if (scrollAttemptCountRef.current === 1 && e.deltaY > 0) {
            setHasPerformedExtraScroll(true);
            setShowContinueHint(true);

            // Reset hint after delay
            if (continueHintTimeoutRef.current) {
              clearTimeout(continueHintTimeoutRef.current);
            }
            continueHintTimeoutRef.current = setTimeout(() => {
              setShowContinueHint(false);
            }, 3000);

            return;
          }

          // Second scroll attempt at last design - trigger next section
          if (scrollAttemptCountRef.current >= 2 && e.deltaY > 0) {
            isProcessingScroll.current = true;

            // Mark that we're ready to show next section
            setIsReadyForNextSection(true);
            setShowContinueHint(false);

            // Start Lenis scrolling
            if (lenisInstance) {
              lenisInstance.start();
            }
            document.body.style.overflow = "auto";

            // Use Lenis to smoothly scroll to just past hero section
            const heroHeight = heroSection.offsetHeight;
            if (lenisInstance) {
              lenisInstance.scrollTo(heroHeight + 10, {
                duration: 1.0,
                easing: (t) => t,
              });
            }

            // Reset processing flag after a delay
            setTimeout(() => {
              isProcessingScroll.current = false;
            }, 1000);

            return;
          }

          // If scrolling up at last design, reset counter
          if (e.deltaY < 0) {
            scrollAttemptCountRef.current = 0;
            setHasPerformedExtraScroll(false);
            // Allow normal navigation
          }
        }

        // Normal carousel navigation (when not at last design or scrolling up)
        if (!isReadyForNextSection && !isFullScreen) {
          // Clear any existing timeout
          if (wheelTimeoutRef.current) {
            clearTimeout(wheelTimeoutRef.current);
          }

          wheelTimeoutRef.current = setTimeout(() => {
            // Handle wheel to navigate carousel
            if (Math.abs(e.deltaY) > 20) {
              if (e.deltaY > 0) {
                // Scroll down - go to next design
                if (currentIndex < designs.length - 1) {
                  const nextIndex = currentIndex + 1;
                  handleIndexChange(nextIndex);
                }
              } else {
                // Scroll up - go to previous design
                const prevIndex = Math.max(0, currentIndex - 1);
                handleIndexChange(prevIndex);
              }
            }
          }, 50);
        }
      }
    };

    // Add wheel event listener with passive false to allow preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [
    atLastDesign,
    isReadyForNextSection,
    isFullScreen,
    currentIndex,
    designs.length,
    handleIndexChange,
    lenisInstance,
  ]);

  // Handle global touch events for mobile
  useEffect(() => {
    const heroSection = heroSectionRef.current;
    if (!heroSection || isFullScreen) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isReadyForNextSection && !isFullScreen) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const heroSection = heroSectionRef.current;
      if (!heroSection || isProcessingScroll.current) return;

      const rect = heroSection.getBoundingClientRect();
      const touch = e.touches[0];
      const isInHeroSection =
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom &&
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right;

      if (isInHeroSection && !isReadyForNextSection && !isFullScreen) {
        e.preventDefault();

        const currentY = e.touches[0].clientY;
        const deltaY = touchStartYRef.current - currentY;

        // If at last design
        if (atLastDesign && !isReadyForNextSection) {
          // Check for significant swipe down
          if (deltaY > 50) {
            // Swipe down threshold
            scrollAttemptCountRef.current++;

            // First swipe at last design
            if (scrollAttemptCountRef.current === 1) {
              setHasPerformedExtraScroll(true);
              setShowContinueHint(true);

              // Reset hint after delay
              if (continueHintTimeoutRef.current) {
                clearTimeout(continueHintTimeoutRef.current);
              }
              continueHintTimeoutRef.current = setTimeout(() => {
                setShowContinueHint(false);
              }, 3000);

              touchStartYRef.current = currentY;
              return;
            }

            // Second swipe at last design - trigger next section
            if (scrollAttemptCountRef.current >= 2) {
              isProcessingScroll.current = true;

              // Mark that we're ready to show next section
              setIsReadyForNextSection(true);
              setShowContinueHint(false);

              // Start Lenis scrolling
              if (lenisInstance) {
                lenisInstance.start();
              }
              document.body.style.overflow = "auto";

              // Use Lenis to smoothly scroll to just past hero section
              const heroHeight = heroSection.offsetHeight;
              if (lenisInstance) {
                lenisInstance.scrollTo(heroHeight + 10, {
                  duration: 1.0,
                  easing: (t) => t,
                });
              }

              // Reset processing flag after a delay
              setTimeout(() => {
                isProcessingScroll.current = false;
              }, 1000);

              return;
            }
          }

          // If swiping up at last design, reset counter
          if (deltaY < -50) {
            scrollAttemptCountRef.current = 0;
            setHasPerformedExtraScroll(false);
            // Allow normal navigation
          }
        }

        // Normal carousel navigation
        if (Math.abs(deltaY) > 50) {
          if (deltaY > 0) {
            // Swipe down - go to next design
            if (currentIndex < designs.length - 1) {
              const nextIndex = currentIndex + 1;
              handleIndexChange(nextIndex);
            }
          } else {
            // Swipe up - go to previous design
            const prevIndex = Math.max(0, currentIndex - 1);
            handleIndexChange(prevIndex);
          }

          touchStartYRef.current = currentY;
        }
      }
    };

    if (!isReadyForNextSection && !isFullScreen) {
      heroSection.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      heroSection.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
    }

    return () => {
      heroSection.removeEventListener("touchstart", handleTouchStart);
      heroSection.removeEventListener("touchmove", handleTouchMove);
    };
  }, [
    atLastDesign,
    isReadyForNextSection,
    isFullScreen,
    currentIndex,
    designs.length,
    handleIndexChange,
    lenisInstance,
  ]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const heroSection = heroSectionRef.current;
      if (!heroSection || isFullScreen) return;

      if (!isReadyForNextSection && !isFullScreen) {
        if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
          e.preventDefault();

          // If at last design
          if (atLastDesign && !isReadyForNextSection) {
            scrollAttemptCountRef.current++;

            // First key press at last design
            if (scrollAttemptCountRef.current === 1) {
              setHasPerformedExtraScroll(true);
              setShowContinueHint(true);

              // Reset hint after delay
              if (continueHintTimeoutRef.current) {
                clearTimeout(continueHintTimeoutRef.current);
              }
              continueHintTimeoutRef.current = setTimeout(() => {
                setShowContinueHint(false);
              }, 3000);
              return;
            }

            // Second key press at last design - trigger next section
            if (scrollAttemptCountRef.current >= 2) {
              setIsReadyForNextSection(true);
              setShowContinueHint(false);

              // Start Lenis scrolling
              if (lenisInstance) {
                lenisInstance.start();
              }
              document.body.style.overflow = "auto";

              // Use Lenis to smoothly scroll to just past hero section
              const heroHeight = heroSection.offsetHeight;
              if (lenisInstance) {
                lenisInstance.scrollTo(heroHeight + 10, {
                  duration: 1.0,
                  easing: (t) => t,
                });
              }
              return;
            }
          } else if (currentIndex < designs.length - 1) {
            // Navigate to next design
            const nextIndex = currentIndex + 1;
            handleIndexChange(nextIndex);
          }
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
          e.preventDefault();
          // Reset scroll attempt count when going up
          if (atLastDesign) {
            scrollAttemptCountRef.current = 0;
            setHasPerformedExtraScroll(false);
          }
          const prevIndex = Math.max(0, currentIndex - 1);
          handleIndexChange(prevIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    atLastDesign,
    isReadyForNextSection,
    isFullScreen,
    currentIndex,
    designs.length,
    handleIndexChange,
    lenisInstance,
  ]);

  // Control Lenis scroll and body overflow
  useEffect(() => {
    if (lenisInstance) {
      if (!isReadyForNextSection && !isFullScreen) {
        // Stop Lenis scrolling when carousel is not completed
        lenisInstance.stop();
        // Lock body scroll
        document.body.style.overflow = "hidden";
      } else if (isReadyForNextSection) {
        // Start Lenis scrolling when ready for next section
        lenisInstance.start();
        document.body.style.overflow = "auto";
      }
    }
  }, [lenisInstance, isReadyForNextSection, isFullScreen]);

  // Initialize body overflow
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // NEW: Trigger services overlay when hero section is complete
  useEffect(() => {
    if (isReadyForNextSection) {
      // Dispatch event to trigger services overlay
      window.dispatchEvent(new CustomEvent("heroComplete"));
    }
  }, [isReadyForNextSection]);
  // Fetch designs from Redis cache
  useEffect(() => {
    async function fetchDesigns() {
      try {
        setLoading(true);
        const heroDesigns = await getHeroDesigns();
        const extendedDesigns = heroDesigns.map((design) => ({
          ...design,
          description: design.description || "",
        })) as ExtendedCachedDesign[];
        setDesigns(extendedDesigns);
      } catch (error) {
        console.error("Failed to fetch hero designs:", error);
        setDesigns([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDesigns();
  }, []);

  // Show continue hint when at last design
  useEffect(() => {
    if (atLastDesign && !hasPerformedExtraScroll) {
      setShowContinueHint(true);

      const timeoutId = setTimeout(() => {
        setShowContinueHint(false);
      }, 5000);
      continueHintTimeoutRef.current = timeoutId;
    }

    return () => {
      if (continueHintTimeoutRef.current) {
        clearTimeout(continueHintTimeoutRef.current);
      }
    };
  }, [atLastDesign, hasPerformedExtraScroll]);

  // Reset image index when design changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);

  // Synchronized animation for opening full screen
  const handleViewDetails = useCallback(async () => {
    if (
      designs.length === 0 ||
      isFullScreen ||
      !designs[currentIndex] ||
      isAnimatingToFullScreen
    )
      return;

    const currentDesign = designs[currentIndex];
    setIsAnimatingToFullScreen(true);

    // Reset full screen mode to image for fresh start
    setFullScreenMode("image");

    // Get the main image element
    const mainImage = mainImageRef.current;
    if (!mainImage) {
      setIsAnimatingToFullScreen(false);
      return;
    }

    // Get image position and dimensions
    const rect = mainImage.getBoundingClientRect();

    // Create a clone of the image for the animation
    const clone = mainImage.cloneNode(true) as HTMLDivElement;
    clone.style.position = "fixed";
    clone.style.zIndex = "9998";
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.margin = "0";
    clone.style.opacity = "1";
    clone.style.borderRadius = "0";
    clone.style.overflow = "hidden";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);
    imageCloneRef.current = clone;

    // Hide original image during animation
    mainImage.style.opacity = "0";

    // Make sure full screen container is visible but transparent
    if (fullScreenContainerRef.current) {
      fullScreenContainerRef.current.style.opacity = "0";
      fullScreenContainerRef.current.style.display = "block";
      const uiElements = fullScreenContainerRef.current.querySelectorAll(
        ".fullscreen-ui-element"
      );
      uiElements.forEach((el) => {
        (el as HTMLElement).style.opacity = "0";
      });
    }

    // Create synchronized animation timeline
    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onStart: () => {
        setIsFullScreen(true);
      },
      onComplete: () => {
        if (imageCloneRef.current && document.body.contains(clone)) {
          document.body.removeChild(clone);
          imageCloneRef.current = null;
        }

        mainImage.style.opacity = "1";

        if (fullScreenContainerRef.current) {
          fullScreenContainerRef.current.style.opacity = "1";
        }

        document.body.style.overflow = "hidden";
        setIsAnimatingToFullScreen(false);

        if (autoSwitchTimeoutRef.current) {
          clearTimeout(autoSwitchTimeoutRef.current);
        }

        autoSwitchTimeoutRef.current = setTimeout(() => {
          if (isFullScreen && fullScreenMode === "image") {
            setFullScreenMode("carousel");
          }
        }, 1200);
      },
    });

    timeline.to(clone, {
      duration: 1.0,
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      ease: "power3.inOut",
    });

    timeline.to(
      fullScreenContainerRef.current,
      {
        duration: 0.6,
        opacity: 1,
        ease: "power2.out",
      },
      "-=0.4"
    );

    timeline.to(
      ".fullscreen-ui-element",
      {
        duration: 0.5,
        opacity: 1,
        stagger: 0.1,
        ease: "power2.out",
      },
      "-=0.3"
    );

    transitionTimelineRef.current = timeline;
  }, [
    designs,
    currentIndex,
    isFullScreen,
    fullScreenMode,
    isAnimatingToFullScreen,
  ]);

  // Handle close full screen with synchronized animation and content reveal
  const handleCloseFullScreen = useCallback(() => {
    if (!isFullScreen || isAnimatingToFullScreen) return;

    setIsAnimatingToFullScreen(true);

    if (autoSwitchTimeoutRef.current) {
      clearTimeout(autoSwitchTimeoutRef.current);
      autoSwitchTimeoutRef.current = null;
    }

    const fullScreenImage = document.querySelector(
      ".fullscreen-image-container"
    ) as HTMLElement;

    if (!fullScreenImage || !mainImageRef.current) {
      if (fullScreenContainerRef.current) {
        gsap.to(fullScreenContainerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            setIsFullScreen(false);
            setFullScreenMode("image");
            setShouldAnimate(false);
            setCurrentImageIndex(0);
            // Re-enable body scroll only if ready for next section
            if (isReadyForNextSection) {
              document.body.style.overflow = "auto";
            } else {
              document.body.style.overflow = "hidden";
            }
            setIsAnimatingToFullScreen(false);
            if (fullScreenContainerRef.current) {
              fullScreenContainerRef.current.style.display = "none";
            }
          },
        });
      }
      return;
    }

    const fullScreenRect = fullScreenImage.getBoundingClientRect();
    const mainImage = mainImageRef.current;
    const targetRect = mainImage.getBoundingClientRect();

    const mainLayoutContainer = mainLayoutContainerRef.current;

    if (mainLayoutContainer) {
      mainLayoutContainer.style.opacity = "0";
      mainLayoutContainer.style.pointerEvents = "none";
      mainLayoutContainer.style.display = "block";
    }

    const clone = fullScreenImage.cloneNode(true) as HTMLDivElement;
    clone.style.position = "fixed";
    clone.style.zIndex = "9998";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.width = "100vw";
    clone.style.height = "100vh";
    clone.style.margin = "0";
    clone.style.opacity = "1";
    clone.style.borderRadius = "0";
    clone.style.overflow = "hidden";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    if (fullScreenContainerRef.current) {
      fullScreenContainerRef.current.style.opacity = "0";
    }

    mainImage.style.opacity = "0";

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }

        mainImage.style.opacity = "1";

        setIsFullScreen(false);
        setFullScreenMode("image");
        setShouldAnimate(false);
        setCurrentImageIndex(0);

        // Only re-enable body scroll if ready for next section
        if (isReadyForNextSection) {
          document.body.style.overflow = "auto";
        } else {
          document.body.style.overflow = "hidden";
        }

        setIsAnimatingToFullScreen(false);

        if (fullScreenContainerRef.current) {
          fullScreenContainerRef.current.style.display = "none";
        }

        if (mainLayoutContainer) {
          mainLayoutContainer.style.opacity = "1";
          mainLayoutContainer.style.pointerEvents = "auto";
        }
      },
    });

    timeline.to(
      ".fullscreen-ui-element",
      {
        duration: 0.2,
        opacity: 0,
        ease: "power2.in",
      },
      0
    );

    timeline.to(
      clone,
      {
        duration: 0.8,
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        ease: "power3.inOut",
      },
      0.1
    );

    timeline.to(
      mainLayoutContainer,
      {
        duration: 0.6,
        opacity: 1,
        ease: "power2.out",
        onStart: () => {
          if (mainLayoutContainer) {
            mainLayoutContainer.style.pointerEvents = "auto";
          }
        },
      },
      0.4
    );

    if (mainLayoutContainer) {
      const leftColumn = mainLayoutContainer.querySelector(
        ".lg\\:col-span-1:first-child"
      );
      const centerColumn = mainLayoutContainer.querySelector(
        ".lg\\:col-span-1:nth-child(2)"
      );
      const rightColumn = mainLayoutContainer.querySelector(
        ".lg\\:col-span-1:last-child"
      );

      if (leftColumn) {
        gsap.set(leftColumn, { opacity: 0, y: 20 });
      }
      if (centerColumn) {
        gsap.set(centerColumn, { opacity: 0, scale: 0.95 });
      }
      if (rightColumn) {
        gsap.set(rightColumn, { opacity: 0, x: 30 });
      }

      timeline.to(
        leftColumn,
        {
          duration: 0.5,
          opacity: 1,
          y: 0,
          ease: "power2.out",
        },
        0.7
      );

      timeline.to(
        centerColumn,
        {
          duration: 0.6,
          opacity: 1,
          scale: 1,
          ease: "back.out(1.7)",
        },
        0.8
      );

      timeline.to(
        rightColumn,
        {
          duration: 0.7,
          opacity: 1,
          x: 0,
          ease: "power3.out",
        },
        0.9
      );

      if (rightColumn) {
        const detailElements = rightColumn.querySelectorAll(".detail-element");
        timeline.fromTo(
          detailElements,
          {
            opacity: 0,
            y: 15,
          },
          {
            duration: 0.4,
            opacity: 1,
            y: 0,
            stagger: 0.08,
            ease: "power2.out",
          },
          1.0
        );
      }

      const carouselControls = mainLayoutContainer.querySelector(
        ".flex.items-center.justify-between.text-white\\/50"
      );
      if (carouselControls) {
        timeline.fromTo(
          carouselControls,
          {
            opacity: 0,
            y: 10,
          },
          {
            duration: 0.4,
            opacity: 1,
            y: 0,
            ease: "power2.out",
          },
          1.2
        );
      }

      const scrollInstruction = mainLayoutContainer.querySelector(
        ".absolute.bottom-8.right-8"
      );
      if (scrollInstruction) {
        timeline.fromTo(
          scrollInstruction,
          {
            opacity: 0,
            y: 20,
          },
          {
            duration: 0.5,
            opacity: 1,
            y: 0,
            ease: "power2.out",
          },
          1.3
        );
      }
    }

    transitionTimelineRef.current = timeline;
  }, [
    isFullScreen,
    isAnimatingToFullScreen,
    currentIndex,
    designs,
    isReadyForNextSection,
  ]);

  // Toggle between full screen modes
  const toggleFullScreenMode = useCallback(() => {
    if (fullScreenMode === "image") {
      setFullScreenMode("carousel");
    } else if (fullScreenMode === "carousel") {
      setFullScreenMode("catalog");
    } else {
      setFullScreenMode("image");
    }
  }, [fullScreenMode]);

  // Navigate between images with snap behavior
  const goToImage = useCallback(
    (dir: "next" | "prev") => {
      if (!isFullScreen || fullScreenMode !== "image" || isAnimating.current)
        return;

      const now = Date.now();
      if (now - lastInteractionTime.current < 600) return;

      lastInteractionTime.current = now;
      isAnimating.current = true;

      const currentDesign = designs[currentIndex];
      if (!currentDesign) return;

      const designImages = currentDesign.images || [];
      if (designImages.length > 1) {
        let newImageIndex;
        if (dir === "next") {
          newImageIndex =
            currentImageIndex === designImages.length - 1
              ? 0
              : currentImageIndex + 1;
        } else {
          newImageIndex =
            currentImageIndex === 0
              ? designImages.length - 1
              : currentImageIndex - 1;
        }

        setCurrentImageIndex(newImageIndex);

        setTimeout(() => {
          isAnimating.current = false;
        }, 300);
        return;
      }

      let newIndex;
      if (dir === "next") {
        newIndex = currentIndex === designs.length - 1 ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex === 0 ? designs.length - 1 : currentIndex - 1;
      }

      setPreviousIndex(currentIndex);
      setDirection(dir === "next" ? "down" : "up");
      setAnimationSpeed(1.0);
      setCurrentImageIndex(0);

      setTimeout(() => {
        setShouldAnimate(true);
        setSyncProgress(0);
      }, 0);

      setTimeout(() => {
        setCurrentIndex(newIndex);
      }, 150);

      setTimeout(() => {
        setShouldAnimate(false);
        isAnimating.current = false;
      }, 1000);
    },
    [
      isFullScreen,
      fullScreenMode,
      currentIndex,
      designs,
      currentImageIndex,
      designs.length,
    ]
  );

  // Navigate in full screen carousel mode with snap behavior
  const handleFullScreenCarouselIndexChange = useCallback(
    (index: number) => {
      if (!isFullScreen || fullScreenMode !== "carousel" || isAnimating.current)
        return;

      const now = Date.now();
      if (now - lastInteractionTime.current < 600) return;

      lastInteractionTime.current = now;
      isAnimating.current = true;

      if (carouselScrollTimeoutRef.current) {
        clearTimeout(carouselScrollTimeoutRef.current);
      }

      carouselScrollTimeoutRef.current = setTimeout(() => {
        setPreviousIndex(currentIndex);
        setCurrentIndex(index);
        setCurrentImageIndex(0);

        setTimeout(() => {
          isAnimating.current = false;
        }, 300);
      }, 50);
    },
    [isFullScreen, fullScreenMode, currentIndex]
  );

  // Synchronization effect
  useEffect(() => {
    if (shouldAnimate) {
      let startTime = Date.now();
      const duration = 1000;

      syncIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setSyncProgress(progress);

        if (progress >= 1) {
          if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
          }
          setSyncProgress(0);
        }
      }, 16);
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      setSyncProgress(0);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [shouldAnimate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (transitionTimelineRef.current) {
        transitionTimelineRef.current.kill();
      }
      if (
        imageCloneRef.current &&
        document.body.contains(imageCloneRef.current)
      ) {
        document.body.removeChild(imageCloneRef.current);
      }
      if (autoSwitchTimeoutRef.current) {
        clearTimeout(autoSwitchTimeoutRef.current);
      }
      if (carouselScrollTimeoutRef.current) {
        clearTimeout(carouselScrollTimeoutRef.current);
      }
      if (continueHintTimeoutRef.current) {
        clearTimeout(continueHintTimeoutRef.current);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      document.body.style.overflow = "auto";
    };
  }, []);

  // Reset full screen mode when closing
  useEffect(() => {
    if (!isFullScreen) {
      setFullScreenMode("image");
    }
  }, [isFullScreen]);

  // Full screen event handlers
  useEffect(() => {
    if (!isFullScreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseFullScreen();
      } else if (
        fullScreenMode === "image" &&
        (e.key === "ArrowRight" || e.key === " ")
      ) {
        goToImage("next");
      } else if (fullScreenMode === "image" && e.key === "ArrowLeft") {
        goToImage("prev");
      } else if (e.key === "Tab") {
        e.preventDefault();
        toggleFullScreenMode();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (fullScreenMode !== "image") return;
      e.preventDefault();

      if (Date.now() - lastInteractionTime.current < 800) return;
      if (Math.abs(e.deltaY) < 50) return;

      goToImage(e.deltaY > 0 ? "next" : "prev");
    };

    window.addEventListener("keydown", handleKeyDown);
    if (fullScreenMode === "image") {
      window.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      if (carouselScrollTimeoutRef.current) {
        clearTimeout(carouselScrollTimeoutRef.current);
      }
    };
  }, [
    isFullScreen,
    fullScreenMode,
    goToImage,
    handleCloseFullScreen,
    toggleFullScreenMode,
  ]);

  // Format price to currency
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  // Get next design index
  const getNextIndex = (index: number) => {
    if (designs.length === 0) return 0;
    return index === designs.length - 1 ? 0 : index + 1;
  };

  // Get previous design index
  const getPrevIndex = (index: number) => {
    if (designs.length === 0) return 0;
    return index === 0 ? designs.length - 1 : index - 1;
  };

  // Get current design safely
  const getCurrentDesign = () => {
    return designs[currentIndex] || null;
  };

  // Get current image URL safely
  const getCurrentImage = () => {
    const design = designs[currentIndex];
    if (!design || !design.images || design.images.length === 0) {
      return "";
    }
    return design.images[currentImageIndex] || design.images[0];
  };

  // Skeleton loader
  const renderSkeletons = () => (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col items-center gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-96 w-96 bg-white/10" />
            <Skeleton className="h-5 w-3/4 mt-4 bg-white/10" />
            <Skeleton className="h-4 w-1/2 mt-2 bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );

  // Empty state
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center h-screen pt-20">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          No Designs Available
        </h3>
        <p className="text-white/80 mb-6">
          Check back soon for our latest designs.
        </p>
      </div>
    </div>
  );

  const currentDesign = getCurrentDesign();
  const currentImage = getCurrentImage();

  return (
    <section
      ref={heroSectionRef}
      className="relative w-full h-screen bg-transparent overflow-hidden mb-20 pb-20"
      style={{
        touchAction: !isReadyForNextSection && !isFullScreen ? "none" : "auto",
        overscrollBehavior:
          !isReadyForNextSection && !isFullScreen ? "none" : "auto",
      }}
    >
      {/* Scroll blocker overlay when carousel not completed */}
      {!isReadyForNextSection && !isFullScreen && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-700/50 to-transparent"></div>
        </div>
      )}

      {/* Enhanced Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "120px 120px",
          }}
        />
      </div>

      {/* Main Content Layout - Hidden when in full screen */}
      <div
        ref={mainLayoutContainerRef}
        className={`relative h-screen w-full overflow-hidden ${
          isFullScreen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Fixed Header */}

        {/* Content Grid */}
        <div className="container mx-auto h-full pt-38 px-4">
          {loading ? (
            renderSkeletons()
          ) : designs.length === 0 ? (
            renderEmpty()
          ) : !currentDesign ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white">No design data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-8 lg:gap-12">
              {/* Left Column - Vertical Carousel */}
              <div className="lg:col-span-1 h-full">
                <div className="h-full max-h-[600px] flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-white/70 text-sm font-light tracking-widest uppercase">
                      Designs Collection
                    </h3>
                    <div className="text-white/50 text-xs mt-2 font-light flex items-center gap-2">
                      <span>Scroll through all {designs.length} designs</span>
                      {atLastDesign && (
                        <span className="text-green-300">✓ Last Design</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <VerticalCarousel
                      designs={designs}
                      currentIndex={currentIndex}
                      onIndexChange={handleIndexChange}
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between text-white/50 text-sm">
                    <div className="font-mono tracking-wider">
                      <span className="text-white">
                        {String(currentIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="mx-1">/</span>
                      <span>{String(designs.length).padStart(2, "0")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleIndexChange(getPrevIndex(currentIndex))
                        }
                        disabled={
                          isScrolling || isFullScreen || isAnimatingToFullScreen
                        }
                        className={`p-2 hover:bg-white/5 rounded-md transition-colors ${
                          isScrolling || isFullScreen || isAnimatingToFullScreen
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleIndexChange(getNextIndex(currentIndex))
                        }
                        disabled={
                          isScrolling || isFullScreen || isAnimatingToFullScreen
                        }
                        className={`p-2 hover:bg-white/5 rounded-md transition-colors ${
                          isScrolling || isFullScreen || isAnimatingToFullScreen
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column - Main Image */}
              <div className="lg:col-span-1 flex items-center justify-center">
                <motion.div
                  key={`${currentIndex}-${currentImageIndex}`}
                  ref={mainImageRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="relative transition-opacity duration-300"
                  style={{
                    width: "500px",
                    height: "500px",
                  }}
                >
                  <div className="relative w-full h-full overflow-hidden">
                    {currentImage && (
                      <Image
                        src={currentImage}
                        alt={currentDesign.name || "Design image"}
                        fill
                        className="object-cover"
                        sizes="500px"
                        priority
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Design Details */}
              <div className="lg:col-span-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`details-${currentIndex}`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-white space-y-8"
                  >
                    {/* Design Name */}
                    <div className="space-y-1 detail-element">
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wider uppercase">
                          {currentDesign?.name || "Untitled Design"}
                        </h2>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <div className="mt-2 text-white/70 text-sm font-light tracking-widest uppercase">
                          {currentDesign?.category || "Uncategorized"}
                        </div>
                      </motion.div>
                    </div>

                    {/* Design Description */}
                    {currentDesign?.description &&
                      currentDesign.description.trim() !== "" && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          className="space-y-2 detail-element"
                        >
                          <h3 className="text-sm font-light text-white/70 tracking-widest uppercase">
                            Description
                          </h3>
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-base sm:text-lg text-white/90 font-light leading-relaxed"
                          >
                            {currentDesign.description}
                          </motion.p>
                        </motion.div>
                      )}

                    {/* Estimated Price */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: currentDesign?.description ? 0.5 : 0.3,
                      }}
                      className="space-y-2 detail-element"
                    >
                      <h3 className="text-sm font-light text-white/70 tracking-widest uppercase">
                        Est. Price
                      </h3>
                      <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: currentDesign?.description ? 0.6 : 0.4,
                        }}
                        className="text-2xl sm:text-3xl font-light tracking-wider"
                      >
                        {formatPrice(currentDesign?.price || 0)}
                      </motion.p>
                    </motion.div>

                    {/* View Details Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: currentDesign?.description ? 0.7 : 0.5,
                      }}
                      className="pt-4 detail-element"
                    >
                      <button
                        onClick={handleViewDetails}
                        disabled={
                          isFullScreen ||
                          !currentDesign ||
                          isAnimatingToFullScreen
                        }
                        className={`inline-flex items-center gap-2 w-full px-6 py-4 border border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 transition-all duration-300 group ${
                          isFullScreen || isAnimatingToFullScreen
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span className="text-white/90 group-hover:text-white font-light tracking-wider text-lg">
                          {isAnimatingToFullScreen
                            ? "OPENING..."
                            : "VIEW DETAILS"}
                        </span>
                        <ArrowUpRight className="w-5 h-5 text-white/70 group-hover:text-white transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Scroll Instruction */}
        <div className="absolute bottom-8 right-8 z-30">
          <div className="flex flex-col items-center text-white/50 text-xs tracking-wider">
            <div className="flex items-center gap-1 mb-1">
              <MousePointer2 className="w-3 h-3" />
              <span>SCROLL OR DRAG</span>
            </div>
            <div className="w-px h-8 bg-white/30" />
          </div>
        </div>

        {/* Grid Coordinates */}
        <div className="absolute top-8 left-8 text-white/20 text-xs font-mono tracking-wider">
          <div>X: 0</div>
          <div>Y: 0</div>
        </div>
        <div className="absolute top-8 right-8 text-white/20 text-xs font-mono tracking-wider">
          <div>X: 100%</div>
          <div>Y: 0</div>
        </div>
      </div>

      {/* Full Screen Mode - Covers entire page */}
      <div
        ref={fullScreenContainerRef}
        className={`fixed inset-0 z-[9999] transition-opacity duration-500 ${
          isFullScreen ? "opacity-100" : "opacity-0 pointer-events-none hidden"
        }`}
        style={{ backgroundColor: "#7c2d12" }}
      >
        {/* Noise Overlay only for full screen */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: "120px 120px",
            }}
          />
        </div>

        {/* Full Screen Image Mode - Shows briefly then auto-switches to carousel */}
        {fullScreenMode === "image" && currentDesign && (
          <div className="absolute inset-0 fullscreen-image-container">
            {/* Full Screen Image Container */}
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                {currentImage && (
                  <Image
                    src={currentImage}
                    alt={currentDesign.name || "Design image"}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Overlay UI Elements with initial opacity 0 for animation */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-auto">
                <button
                  onClick={handleCloseFullScreen}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm fullscreen-ui-element opacity-0"
                  aria-label="Close full screen"
                  disabled={isAnimatingToFullScreen}
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="text-white font-mono tracking-wider text-lg fullscreen-ui-element opacity-0">
                  <span className="text-white">
                    {String(currentIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-2">/</span>
                  <span>{String(designs.length).padStart(2, "0")}</span>
                </div>
                <div className="flex items-center gap-4 fullscreen-ui-element opacity-0">
                  <div className="text-white font-light tracking-wider text-xl">
                    {formatPrice(currentDesign?.price || 0)}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              {designs.length > 1 && (
                <>
                  <button
                    onClick={() => goToImage("prev")}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 pointer-events-auto backdrop-blur-sm fullscreen-ui-element opacity-0"
                    aria-label="Previous image"
                    disabled={isAnimating.current || isAnimatingToFullScreen}
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={() => goToImage("next")}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 pointer-events-auto backdrop-blur-sm fullscreen-ui-element opacity-0"
                    aria-label="Next image"
                    disabled={isAnimating.current || isAnimatingToFullScreen}
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                </>
              )}

              {/* Bottom Overlay with Design Info */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none">
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                    {/* Design Info */}
                    <div className="flex-1 fullscreen-ui-element opacity-0">
                      <div className="mb-4">
                        {shouldAnimate ? (
                          <>
                            {/* Old Title */}
                            <div className="absolute">
                              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white whitespace-nowrap">
                                {designs[previousIndex]?.name
                                  .split("")
                                  .map((char, idx) => (
                                    <RollingCharacter
                                      key={`old-${idx}`}
                                      char={char}
                                      index={idx}
                                      totalLength={
                                        designs[previousIndex]?.name.length || 0
                                      }
                                      shouldAnimate={shouldAnimate}
                                      direction={direction}
                                      isNewText={false}
                                      animationStartDelay={0.2}
                                      animationSpeed={animationSpeed}
                                      syncOffset={syncProgress * 0.3}
                                    />
                                  ))}
                              </h1>
                            </div>
                            {/* New Title */}
                            <div>
                              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white whitespace-nowrap">
                                {currentDesign.name
                                  .split("")
                                  .map((char, idx) => (
                                    <RollingCharacter
                                      key={`new-${idx}`}
                                      char={char}
                                      index={idx}
                                      totalLength={currentDesign.name.length}
                                      shouldAnimate={shouldAnimate}
                                      direction={direction}
                                      isNewText={true}
                                      animationStartDelay={0.2}
                                      animationSpeed={animationSpeed}
                                      syncOffset={syncProgress * 0.3}
                                    />
                                  ))}
                              </h1>
                            </div>
                          </>
                        ) : (
                          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white whitespace-nowrap">
                            {currentDesign.name.split("").map((char, idx) => (
                              <span key={idx}>
                                {char === " " ? "\u00A0" : char}
                              </span>
                            ))}
                          </h1>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-white/70 text-lg font-light">
                          {currentDesign.category}
                        </div>
                        {currentDesign.description && (
                          <div className="text-white/80 font-light max-w-2xl">
                            {currentDesign.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Dots for Design Images */}
              {currentDesign.images && currentDesign.images.length > 1 && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto fullscreen-ui-element opacity-0">
                  <div className="flex justify-center gap-3">
                    {currentDesign.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!isAnimating.current) {
                            setCurrentImageIndex(index);
                          }
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          index === currentImageIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/30 hover:bg-white/50"
                        } ${isAnimating.current ? "cursor-not-allowed" : ""}`}
                        aria-label={`Go to image ${index + 1}`}
                        disabled={
                          isAnimating.current || isAnimatingToFullScreen
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Screen Carousel Mode - Main mode after expansion */}
        {fullScreenMode === "carousel" && (
          <div className="absolute inset-0 bg-orange-700">
            {/* Vertical Carousel covering entire screen with Snap behavior */}
            <div className="h-full w-full flex items-center justify-center p-8">
              <div
                className="w-full max-w-5xl h-full"
                ref={carouselContainerRef}
              >
                <VerticalCarousel
                  designs={designs}
                  currentIndex={currentIndex}
                  onIndexChange={handleFullScreenCarouselIndexChange}
                  isFullScreen={true}
                />
              </div>
            </div>

            {/* Overlay UI Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-auto">
                <button
                  onClick={handleCloseFullScreen}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
                  aria-label="Close full screen"
                  disabled={isAnimatingToFullScreen}
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="text-white font-mono tracking-wider text-lg">
                  <span className="text-white">
                    {String(currentIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-2">/</span>
                  <span>{String(designs.length).padStart(2, "0")}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setFullScreenMode("image")}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-white font-light tracking-wider backdrop-blur-sm"
                    disabled={isAnimatingToFullScreen}
                  >
                    VIEW IMAGE
                  </button>
                </div>
              </div>

              {/* Current Design Details */}
              {currentDesign && (
                <div className="absolute bottom-8 left-8 right-8 pointer-events-auto">
                  <div className="max-w-6xl mx-auto">
                    <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                          <h2 className="text-3xl font-light text-white mb-4">
                            {currentDesign.name}
                          </h2>
                          <div className="text-white/70 text-lg font-light">
                            {currentDesign.category}
                          </div>
                        </div>
                        <div className="lg:col-span-2">
                          {currentDesign.description && (
                            <p className="text-white/80 font-light leading-relaxed mb-6">
                              {currentDesign.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-light text-white">
                              {formatPrice(currentDesign.price)}
                            </div>
                            <Link
                              href={`/catalog/${currentDesign.design_id}`}
                              onClick={handleCloseFullScreen}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-700 hover:bg-white/90 transition-all duration-300 font-light tracking-wider"
                            >
                              EXPLORE FULL CATALOG
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Screen Catalog Mode */}
        {fullScreenMode === "catalog" && currentDesign && (
          <div className="absolute inset-0">
            <FullCatalog
              design={currentDesign}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={(index) => {
                if (!isAnimating.current) {
                  setCurrentImageIndex(index);
                }
              }}
            />

            {/* Close and Mode Toggle Buttons */}
            <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
              <button
                onClick={handleCloseFullScreen}
                className="p-3 bg-white/90 hover:bg-white rounded-full transition-all duration-300 shadow-lg"
                aria-label="Close full screen"
                disabled={isAnimatingToFullScreen}
              >
                <X className="w-6 h-6 text-orange-700" />
              </button>
              <button
                onClick={() => setFullScreenMode("image")}
                className="px-6 py-3 bg-white/90 hover:bg-white rounded-full transition-all duration-300 text-orange-700 font-light tracking-wider shadow-lg"
                disabled={isAnimatingToFullScreen}
              >
                BACK TO IMAGE
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
