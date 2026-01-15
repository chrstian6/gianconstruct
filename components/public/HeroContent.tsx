"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  MousePointer2,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CachedDesign } from "@/action/designs-cache";
import VerticalCarousel from "@/components/public/VerticalCarousel";
import { getHeroDesigns } from "@/action/designs-cache";

interface HeroContentProps {
  isFullScreen: boolean;
  isReadyForNextSection: boolean;
  setIsReadyForNextSection: (value: boolean) => void;
  showContinueHint: boolean;
  setShowContinueHint: (value: boolean) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  designs: CachedDesign[];
  setDesigns: (designs: CachedDesign[]) => void;
  onOpenFullScreen: () => void;
}

export default function HeroContent({
  isFullScreen,
  isReadyForNextSection,
  setIsReadyForNextSection,
  showContinueHint,
  setShowContinueHint,
  currentIndex,
  setCurrentIndex,
  currentImageIndex,
  setCurrentImageIndex,
  designs,
  setDesigns,
  onOpenFullScreen,
}: HeroContentProps) {
  const [loading, setLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasPerformedExtraScroll, setHasPerformedExtraScroll] = useState(false);
  const scrollAttemptCountRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);

  // Fetch designs
  useEffect(() => {
    async function fetchDesigns() {
      try {
        setLoading(true);
        const heroDesigns = await getHeroDesigns();
        setDesigns(heroDesigns);
      } catch (error) {
        console.error("Failed to fetch hero designs:", error);
        setDesigns([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDesigns();
  }, [setDesigns]);

  // Handle index change
  const handleIndexChange = useCallback(
    (index: number) => {
      if (isScrolling) return;
      setIsScrolling(true);
      setCurrentIndex(index);
      setCurrentImageIndex(0);
      if (index !== designs.length - 1) {
        setHasPerformedExtraScroll(false);
        scrollAttemptCountRef.current = 0;
      }
      setTimeout(() => setIsScrolling(false), 800);
    },
    [isScrolling, designs.length, setCurrentIndex, setCurrentImageIndex]
  );

  // Handle wheel events
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const heroSection = heroSectionRef.current;
      if (!heroSection || isFullScreen) return;

      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 300) return;
      lastWheelTimeRef.current = now;

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      wheelTimeoutRef.current = setTimeout(() => {
        // Handle scroll navigation
        if (Math.abs(e.deltaY) > 20) {
          if (e.deltaY > 0) {
            // Scroll down
            if (currentIndex < designs.length - 1) {
              const nextIndex = currentIndex + 1;
              handleIndexChange(nextIndex);
            } else if (!hasPerformedExtraScroll) {
              // First scroll at last design
              setHasPerformedExtraScroll(true);
              setShowContinueHint(true);
              setTimeout(() => setShowContinueHint(false), 3000);
            } else {
              // Second scroll at last design - trigger next section
              setIsReadyForNextSection(true);
              setShowContinueHint(false);
            }
          } else {
            // Scroll up
            const prevIndex = Math.max(0, currentIndex - 1);
            handleIndexChange(prevIndex);
          }
        }
      }, 50);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [
    currentIndex,
    designs.length,
    isFullScreen,
    handleIndexChange,
    hasPerformedExtraScroll,
    setIsReadyForNextSection,
    setShowContinueHint,
  ]);

  const currentDesign = designs[currentIndex] || null;
  const currentImage =
    currentDesign?.images?.[currentImageIndex] ||
    currentDesign?.images?.[0] ||
    "";

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const getNextIndex = (index: number) => {
    if (designs.length === 0) return 0;
    return index === designs.length - 1 ? 0 : index + 1;
  };

  const getPrevIndex = (index: number) => {
    if (designs.length === 0) return 0;
    return index === 0 ? designs.length - 1 : index - 1;
  };

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

  return (
    <section ref={heroSectionRef} className="relative w-full h-screen">
      {/* Continue hint */}
      {showContinueHint && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-pulse">
          <div className="bg-white/90 text-orange-700 px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="font-medium">Scroll down again to continue</span>
            <div className="w-4 h-4 border-b-2 borderr-2 border-orange-700 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Enhanced Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "120px 120px",
          }}
        />
      </div>

      {/* Main Content */}
      <div
        className={`relative h-screen w-full overflow-hidden ${isFullScreen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {/* Fixed Header */}
        <div className="absolute top-0 left-0 right-0 z-40 pt-24 pb-8 bg-gradient-to-b from-orange-700 to-transparent">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white mb-3 md:mb-4 tracking-tight">
                DREAM HOUSE DESIGNS
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-light max-w-3xl mx-auto tracking-wide">
                EXPLORE OUR COLLECTION OF HOME DESIGNS
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="container mx-auto h-full pt-48 pb-20 px-4">
          {loading ? (
            renderSkeletons()
          ) : designs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white">No designs available</p>
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
                        disabled={isScrolling}
                        className="p-2 hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleIndexChange(getNextIndex(currentIndex))
                        }
                        disabled={isScrolling}
                        className="p-2 hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
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
                  className="relative"
                  style={{ width: "500px", height: "500px" }}
                >
                  <div className="relative w-full h-full overflow-hidden">
                    {currentImage && (
                      <Image
                        src={currentImage}
                        alt={currentDesign?.name || "Design image"}
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
                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wider uppercase">
                        {currentDesign?.name || "Untitled Design"}
                      </h2>
                      <div className="mt-2 text-white/70 text-sm font-light tracking-widest uppercase">
                        {currentDesign?.category || "Uncategorized"}
                      </div>
                    </div>

                    {/* Design Description */}
                    {currentDesign?.description && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-light text-white/70 tracking-widest uppercase">
                          Description
                        </h3>
                        <p className="text-base sm:text-lg text-white/90 font-light leading-relaxed">
                          {currentDesign.description}
                        </p>
                      </div>
                    )}

                    {/* Estimated Price */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-light text-white/70 tracking-widest uppercase">
                        Est. Price
                      </h3>
                      <p className="text-2xl sm:text-3xl font-light tracking-wider">
                        {formatPrice(currentDesign?.price || 0)}
                      </p>
                    </div>

                    {/* View Details Button */}
                    <div className="pt-4">
                      <button
                        onClick={onOpenFullScreen}
                        className="inline-flex items-center gap-2 w-full px-6 py-4 border border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                      >
                        <span className="text-white/90 group-hover:text-white font-light tracking-wider text-lg">
                          VIEW DETAILS
                        </span>
                        <ArrowUpRight className="w-5 h-5 text-white/70 group-hover:text-white transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </div>
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
      </div>
    </section>
  );
}
