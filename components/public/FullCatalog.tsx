"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExtendedCachedDesign } from "@/components/public/section/HeroSection";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  ArrowLeft,
} from "lucide-react";
import gsap from "gsap";

// Image cache for FullCatalog
const catalogImageCache = new Map<
  string,
  { url: string; timestamp: number; loading: boolean }
>();
const CATALOG_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Optimized Image Component for FullCatalog
const OptimizedCatalogImage = React.memo(function OptimizedCatalogImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
  width = 0,
  height = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!src) {
      setIsValid(false);
      return;
    }

    setIsLoaded(false);
    setIsValid(true);
    setError(false);

    // Check cache first
    const cached = catalogImageCache.get(src);
    const now = Date.now();

    if (
      cached &&
      !cached.loading &&
      now - cached.timestamp < CATALOG_CACHE_DURATION
    ) {
      setCurrentSrc(cached.url);
      setIsLoaded(true);
      return;
    }

    // Mark as loading in cache
    catalogImageCache.set(src, {
      url: src,
      timestamp: Date.now(),
      loading: true,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const img = new window.Image();

    img.onload = () => {
      clearTimeout(timeoutId);
      catalogImageCache.set(src, {
        url: src,
        timestamp: Date.now(),
        loading: false,
      });
      setCurrentSrc(src);
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setIsLoaded(true);
      setError(false);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      catalogImageCache.delete(src);
      console.error(`Failed to load image: ${src}`);
      setIsValid(false);
      setIsLoaded(true);
      setError(true);
    };

    img.src = src;

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [src]);

  if (!isLoaded || !isValid || !currentSrc || error) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-orange-200/20 to-orange-300/20 animate-pulse flex items-center justify-center`}
        style={{ width: "100%", height: "400px" }}
      >
        <span className="text-orange-900/30 text-sm">Loading...</span>
      </div>
    );
  }

  // If fill is true, use fill property
  if (fill) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes || "100vw"}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onError={() => {
          console.error(`Next.js Image failed to load: ${src}`);
          setIsValid(false);
          setError(true);
        }}
      />
    );
  }

  // If fill is false, provide width and height
  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={dimensions.width > 0 ? dimensions.width : 1200}
      height={dimensions.height > 0 ? dimensions.height : 800}
      className={className}
      sizes={sizes || "100vw"}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      onError={() => {
        console.error(`Next.js Image failed to load: ${src}`);
        setIsValid(false);
        setError(true);
      }}
    />
  );
});

interface FullCatalogProps {
  design: ExtendedCachedDesign;
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  onBackToCarousel?: () => void; // New prop for going back to carousel
}

export default function FullCatalog({
  design,
  currentImageIndex,
  onImageIndexChange,
  onBackToCarousel, // New prop
}: FullCatalogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerColumnRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAnimating = useRef(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [currentViewingIndex, setCurrentViewingIndex] =
    useState(currentImageIndex);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  // Sync currentViewingIndex with currentImageIndex when prop changes
  useEffect(() => {
    setCurrentViewingIndex(currentImageIndex);
  }, [currentImageIndex]);

  // Main entrance animation
  useEffect(() => {
    if (!design || !containerRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.8 },
      onStart: () => {
        setIsLoading(true);
        document.body.style.overflow = "hidden";
      },
      onComplete: () => {
        setIsLoading(false);
        // Start revealing animations after entrance
        revealContent();
      },
    });

    // Initial state - off screen at bottom
    gsap.set(containerRef.current, {
      y: "100vh",
      scale: 0.95,
      opacity: 0,
      rotationX: 5,
    });

    // Main entrance animation
    tl.to(containerRef.current, {
      y: 0,
      opacity: 1,
      scale: 1,
      rotationX: 0,
      duration: 1.2,
      ease: "power3.out",
    });

    // Background color animation
    tl.fromTo(
      containerRef.current,
      { backgroundColor: "rgba(254, 215, 170, 0)" }, // from-orange-100 transparent
      {
        backgroundColor: "rgba(254, 215, 170, 1)", // to-orange-100 solid
        duration: 0.8,
        ease: "power2.inOut",
      },
      "-=0.4"
    );

    return () => {
      document.body.style.overflow = "auto";
      if (tl) tl.kill();
    };
  }, [design]);

  // Reveal content after entrance
  const revealContent = () => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.6 },
    });

    // Reveal title
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1 },
        "+=0.2"
      );
    }

    // Reveal left column items with stagger
    if (leftColumnRef.current) {
      const leftItems = leftColumnRef.current.querySelectorAll(".info-item");
      tl.fromTo(
        leftItems,
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: "back.out(1.4)",
        },
        "-=0.3"
      );
    }

    // Reveal right column
    if (rightColumnRef.current) {
      tl.fromTo(
        rightColumnRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      );
    }

    // Reveal images with staggered animation
    if (imageRefs.current.length > 0) {
      tl.fromTo(
        imageRefs.current.filter((ref) => ref !== null),
        {
          y: 80,
          opacity: 0,
          scale: 0.9,
          rotationX: 10,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotationX: 0,
          stagger: 0.15,
          duration: 0.9,
          ease: "back.out(1.2)",
          onComplete: () => {
            setImagesLoaded(true);
          },
        },
        "-=0.2"
      );
    }

    // Add subtle float animation to images
    if (imageRefs.current.length > 0 && imagesLoaded) {
      imageRefs.current.forEach((ref, index) => {
        if (!ref) return;

        gsap.to(ref, {
          y: -10,
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: index * 0.1,
        });
      });
    }
  };

  // Handle back to carousel with exit animation
  const handleBackToCarousel = () => {
    if (isExiting || isAnimating.current) return;

    setIsExiting(true);
    isAnimating.current = true;

    const tl = gsap.timeline({
      defaults: { ease: "power3.in", duration: 0.8 },
      onComplete: () => {
        // Call the parent callback to go back to carousel
        if (onBackToCarousel) {
          onBackToCarousel();
        }
        isAnimating.current = false;
      },
    });

    // First, hide all content elements
    tl.to(
      [titleRef.current, leftColumnRef.current, rightColumnRef.current],
      {
        opacity: 0,
        y: 50,
        duration: 0.5,
        stagger: 0.1,
      },
      0
    );

    // Hide all images with staggered animation
    if (imageRefs.current.length > 0) {
      tl.to(
        imageRefs.current.filter((ref) => ref !== null),
        {
          y: 100,
          opacity: 0,
          scale: 0.8,
          rotationX: -10,
          stagger: 0.1,
          duration: 0.6,
        },
        0.2
      );
    }

    // Main container exit animation - slide down
    tl.to(
      containerRef.current,
      {
        y: "100vh",
        opacity: 0,
        scale: 0.95,
        rotationX: -5,
        duration: 1.2,
        ease: "power3.in",
      },
      0.4
    );

    // Background fade out
    tl.to(
      containerRef.current,
      {
        backgroundColor: "rgba(254, 215, 170, 0)",
        duration: 0.6,
        ease: "power2.inOut",
      },
      "-=0.8"
    );
  };

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      // Kill all GSAP animations
      gsap.killTweensOf(containerRef.current);
      gsap.killTweensOf(leftColumnRef.current);
      gsap.killTweensOf(rightColumnRef.current);
      gsap.killTweensOf(titleRef.current);
      imageRefs.current.forEach((ref) => ref && gsap.killTweensOf(ref));
    };
  }, []);

  // Handle image ref assignment
  const setImageRef = (el: HTMLDivElement | null, index: number) => {
    imageRefs.current[index] = el;
  };

  if (!design) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-orange-100 to-orange-200 z-[10000] flex items-center justify-center">
        <div className="text-orange-900 text-2xl">No design data available</div>
      </div>
    );
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Handle fullscreen image view with animation
  const handleViewImageFullscreen = (index: number) => {
    setCurrentViewingIndex(index);
    onImageIndexChange(index);

    // Animate the clicked image
    const clickedImage = imageRefs.current[index];
    if (clickedImage) {
      gsap.to(clickedImage, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          setIsFullscreenMode(true);
          document.body.style.overflow = "hidden";
        },
      });
    } else {
      setIsFullscreenMode(true);
      document.body.style.overflow = "hidden";
    }
  };

  // Enhanced fullscreen close with animation
  const handleCloseFullscreen = () => {
    // Animate fullscreen modal out
    const fullscreenModal = document.querySelector(".fullscreen-modal");
    if (fullscreenModal) {
      gsap.to(fullscreenModal, {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        ease: "power3.in",
        onComplete: () => {
          setIsFullscreenMode(false);
          document.body.style.overflow = "auto";
        },
      });
    } else {
      setIsFullscreenMode(false);
      document.body.style.overflow = "auto";
    }
  };

  // Animated fullscreen image navigation
  const handleNextFullscreenImage = () => {
    if (isAnimating.current || !design.images || design.images.length <= 1)
      return;

    isAnimating.current = true;
    const newIndex =
      currentViewingIndex === design.images.length - 1
        ? 0
        : currentViewingIndex + 1;

    // Animate current image out
    const currentImg = document.querySelector(".current-fullscreen-image");
    if (currentImg) {
      gsap.to(currentImg, {
        x: -100,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setCurrentViewingIndex(newIndex);
          onImageIndexChange(newIndex);

          // Animate new image in
          const newImg = document.querySelector(".current-fullscreen-image");
          if (newImg) {
            gsap.fromTo(
              newImg,
              { x: 100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
            );
          }

          setTimeout(() => {
            isAnimating.current = false;
          }, 300);
        },
      });
    } else {
      setCurrentViewingIndex(newIndex);
      onImageIndexChange(newIndex);
      setTimeout(() => {
        isAnimating.current = false;
      }, 300);
    }
  };

  const handlePrevFullscreenImage = () => {
    if (isAnimating.current || !design.images || design.images.length <= 1)
      return;

    isAnimating.current = true;
    const newIndex =
      currentViewingIndex === 0
        ? design.images.length - 1
        : currentViewingIndex - 1;

    // Animate current image out
    const currentImg = document.querySelector(".current-fullscreen-image");
    if (currentImg) {
      gsap.to(currentImg, {
        x: 100,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setCurrentViewingIndex(newIndex);
          onImageIndexChange(newIndex);

          // Animate new image in
          const newImg = document.querySelector(".current-fullscreen-image");
          if (newImg) {
            gsap.fromTo(
              newImg,
              { x: -100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
            );
          }

          setTimeout(() => {
            isAnimating.current = false;
          }, 300);
        },
      });
    } else {
      setCurrentViewingIndex(newIndex);
      onImageIndexChange(newIndex);
      setTimeout(() => {
        isAnimating.current = false;
      }, 300);
    }
  };

  // Animated dot click
  const handleDotClick = (index: number) => {
    if (!isAnimating.current && index !== currentViewingIndex) {
      isAnimating.current = true;

      // Animate the dot
      const dot = document.querySelector(`.dot-${index}`);
      if (dot) {
        gsap.to(dot, {
          scale: 1.5,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        });
      }

      setCurrentViewingIndex(index);
      onImageIndexChange(index);

      setTimeout(() => {
        isAnimating.current = false;
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden">
      {/* Main Catalog Container */}
      <div
        ref={containerRef}
        className="relative h-full w-full p-6 lg:p-8 flex items-center justify-center"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-300/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s infinite ease-in-out ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Back to Carousel Button - Top Left */}
        <button
          onClick={handleBackToCarousel}
          disabled={isExiting || isAnimating.current}
          className="absolute top-6 left-6 z-30 flex items-center gap-3 px-5 py-3 bg-white/90 hover:bg-white text-orange-900 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-light tracking-wider">BACK TO CAROUSEL</span>
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-5 w-full max-w-[1600px] h-full gap-4 lg:gap-6 relative z-10 pt-16">
          {/* LEFT COLUMN - Clean Design Info */}
          <div
            ref={leftColumnRef}
            className="col-span-1 h-full flex flex-col space-y-4 lg:space-y-6"
          >
            {/* Design Name */}
            <div className="space-y-2 info-item">
              <div className="text-orange-800/60 text-xs font-light uppercase tracking-wider">
                DESIGN NAME
              </div>
              <div className="text-orange-900 text-xl font-light">
                {design.name || "Untitled Design"}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2 info-item">
              <div className="text-orange-800/60 text-xs font-light uppercase tracking-wider">
                CATEGORY
              </div>
              <div className="text-orange-900 text-base font-light">
                {design.category || "Uncategorized"}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2 info-item">
              <div className="text-orange-800/60 text-xs font-light uppercase tracking-wider">
                ESTIMATED PRICE
              </div>
              <div className="text-orange-900 text-2xl font-light tracking-wider">
                {formatPrice(design.price || 0)}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN - Scrollable Images */}
          <div
            ref={centerColumnRef}
            className="col-span-3 h-full flex flex-col overflow-hidden"
          >
            {/* Main Title */}
            <div ref={titleRef} className="mb-4 text-center flex-shrink-0">
              <h1 className="text-3xl lg:text-4xl font-light text-orange-900 tracking-wider uppercase">
                {design.name || "Untitled Design"}
              </h1>
              <div className="mt-1 text-orange-800/70 text-sm font-light tracking-widest uppercase">
                Design Gallery
              </div>
            </div>

            {/* Vertical Image Feed - Scrollable */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(194, 65, 12, 0.3) transparent",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                  background: linear-gradient(
                    to bottom,
                    rgba(194, 65, 12, 0.4),
                    rgba(154, 52, 18, 0.6)
                  );
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(
                    to bottom,
                    rgba(194, 65, 12, 0.6),
                    rgba(154, 52, 18, 0.8)
                  );
                }

                @keyframes float {
                  0%,
                  100% {
                    transform: translateY(0px) rotate(0deg);
                  }
                  50% {
                    transform: translateY(-10px) rotate(180deg);
                  }
                }
              `}</style>

              {/* Image Feed */}
              <div className="space-y-8 pb-8">
                {design.images && design.images.length > 0 ? (
                  design.images.map((image: string, index: number) => (
                    <div
                      key={index}
                      ref={(el) => setImageRef(el, index)}
                      className="relative group transform-gpu"
                    >
                      {/* Image Container */}
                      <div className="relative w-full overflow-hidden rounded-xl shadow-2xl">
                        <div className="relative w-full h-auto min-h-[500px]">
                          <OptimizedCatalogImage
                            src={image}
                            alt={`${design.name} - Image ${index + 1}`}
                            fill={false}
                            className="w-full h-full object-cover rounded-xl"
                            sizes="100vw"
                            priority={index === 0}
                          />

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent rounded-xl" />

                          {/* Shine effect */}
                          <div className="absolute inset-0 overflow-hidden rounded-xl">
                            <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 animate-shine" />
                          </div>
                        </div>

                        {/* View Fullscreen Button */}
                        <button
                          onClick={() => handleViewImageFullscreen(index)}
                          className="absolute top-6 right-6 p-3 bg-white/90 hover:bg-white backdrop-blur-sm border border-orange-200 shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 rounded-full hover:scale-110"
                          aria-label="View fullscreen"
                        >
                          <Maximize2 className="w-5 h-5 text-orange-900" />
                        </button>

                        {/* Image Number Badge */}
                        <div className="absolute top-6 left-6 px-3 py-2 bg-white/90 backdrop-blur-sm border border-orange-200 shadow-lg rounded-lg transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="text-orange-900 font-mono tracking-wider text-sm font-bold">
                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                          </div>
                        </div>
                      </div>

                      {/* Image Label with animation */}
                      <div className="mt-4 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-orange-200/20 shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="flex items-center justify-between">
                          <div className="text-orange-900 font-light text-lg">
                            Image {index + 1}
                          </div>
                          <div className="text-orange-800/40 text-sm font-mono">
                            Click to view fullscreen
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full min-h-[500px] flex items-center justify-center">
                    <span className="text-orange-900/50 text-xl">
                      No Images Available
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Count */}
            {design.images && design.images.length > 0 && (
              <div className="mt-6 text-center flex-shrink-0 pt-4 border-t border-orange-200/30">
                <div className="text-orange-800/60 text-sm font-light">
                  {design.images.length} image
                  {design.images.length > 1 ? "s" : ""} available
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Clean Description */}
          <div ref={rightColumnRef} className="col-span-1 h-full flex flex-col">
            {/* Description Title */}
            <div className="mb-6">
              <div className="text-orange-800/60 text-xs font-light uppercase tracking-wider mb-3">
                DESCRIPTION
              </div>
            </div>

            {/* Description Content */}
            <div className="flex-1 overflow-y-auto pr-4">
              <div className="text-orange-900/80 font-light text-base leading-relaxed bg-white/20 backdrop-blur-sm p-6 rounded-xl border border-orange-200/20 shadow-lg">
                {design.description ||
                  "No description available for this design."}
              </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-8 pt-6 border-t border-orange-200/30">
              <div className="space-y-4">
                <div>
                  <div className="text-orange-800/60 text-xs font-light uppercase tracking-wider mb-2">
                    DESIGN ID
                  </div>
                  <div className="text-orange-900 text-sm font-light font-mono bg-white/10 p-3 rounded-lg">
                    {design.design_id || "N/A"}
                  </div>
                </div>

                {/* Scroll hint */}
                <div className="pt-4">
                  <div className="flex items-center justify-center gap-2 text-orange-800/40 text-xs">
                    <div className="w-16 h-px bg-orange-300/30" />
                    <span>Scroll to view more images</span>
                    <div className="w-16 h-px bg-orange-300/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/90 to-orange-200/90 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-300/30 border-t-orange-600 rounded-full animate-spin mb-4" />
                <div className="text-orange-900 text-xl font-light tracking-wider">
                  Loading Catalog...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exit Animation Overlay */}
        {isExiting && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/80 to-orange-200/80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-300/30 border-t-orange-600 rounded-full animate-spin mb-4" />
                <div className="text-orange-900 text-xl font-light tracking-wider">
                  Returning to Carousel...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal with enhanced animations */}
      {isFullscreenMode &&
        design.images &&
        design.images[currentViewingIndex] && (
          <div className="fullscreen-modal fixed inset-0 bg-black/95 z-[10001] flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Fullscreen Image */}
              <div className="relative w-full h-full">
                <div className="current-fullscreen-image absolute inset-0 flex items-center justify-center">
                  <Image
                    src={design.images[currentViewingIndex]}
                    alt={`${design.name} - Fullscreen View`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>

              {/* Close Button with animation */}
              <button
                onClick={handleCloseFullscreen}
                className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 rounded-full hover:scale-110"
                aria-label="Close fullscreen"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Navigation Arrows */}
              {design.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevFullscreenImage}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 rounded-full hover:scale-110 disabled:opacity-50"
                    aria-label="Previous image"
                    disabled={isAnimating.current}
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={handleNextFullscreenImage}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 rounded-full hover:scale-110 disabled:opacity-50"
                    aria-label="Next image"
                    disabled={isAnimating.current}
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {design.images.length > 1 && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
                  <div className="text-white font-mono tracking-wider text-lg">
                    <span className="text-white font-bold">
                      {currentViewingIndex + 1}
                    </span>
                    <span className="mx-2 text-white/60">/</span>
                    <span className="text-white/80">
                      {design.images.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Image Dots */}
              {design.images.length > 1 && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="flex justify-center gap-3">
                    {design.images.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`dot-${index} h-2 transition-all duration-300 rounded-full ${
                          index === currentViewingIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/30 hover:bg-white/50"
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Design Info */}
              <div className="absolute bottom-6 right-6 text-right bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                <h3 className="text-white text-xl font-light mb-1">
                  {design.name}
                </h3>
                <div className="text-white/70 text-sm font-light">
                  {design.category} • Image {currentViewingIndex + 1} of{" "}
                  {design.images.length}
                </div>
                <div className="mt-2 text-white/90 text-lg font-light">
                  {formatPrice(design.price || 0)}
                </div>
              </div>
            </div>
          </div>
        )}

     
    </div>
  );
}
