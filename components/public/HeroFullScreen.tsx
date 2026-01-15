"use client";

import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CachedDesign } from "@/action/designs-cache";
import { useState, useCallback, useEffect } from "react";
import VerticalCarousel from "@/components/public/VerticalCarousel";

interface HeroFullScreenProps {
  isFullScreen: boolean;
  fullScreenMode: "image" | "carousel" | "catalog";
  setFullScreenMode: (mode: "image" | "carousel" | "catalog") => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  designs: CachedDesign[];
  onClose: () => void;
}

export default function HeroFullScreen({
  isFullScreen,
  fullScreenMode,
  setFullScreenMode,
  currentIndex,
  setCurrentIndex,
  currentImageIndex,
  setCurrentImageIndex,
  designs,
  onClose,
}: HeroFullScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);

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

  const goToImage = useCallback(
    (dir: "next" | "prev") => {
      if (isAnimating || !currentDesign) return;
      setIsAnimating(true);

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
      } else {
        const newIndex =
          dir === "next"
            ? currentIndex === designs.length - 1
              ? 0
              : currentIndex + 1
            : currentIndex === 0
              ? designs.length - 1
              : currentIndex - 1;
        setCurrentIndex(newIndex);
        setCurrentImageIndex(0);
      }

      setTimeout(() => setIsAnimating(false), 300);
    },
    [
      isAnimating,
      currentDesign,
      currentImageIndex,
      currentIndex,
      designs.length,
      setCurrentImageIndex,
      setCurrentIndex,
    ]
  );

  // Handle keyboard events
  useEffect(() => {
    if (!isFullScreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (fullScreenMode === "image") {
        if (e.key === "ArrowRight" || e.key === " ") {
          goToImage("next");
        } else if (e.key === "ArrowLeft") {
          goToImage("prev");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, fullScreenMode, onClose, goToImage]);

  if (!isFullScreen || !currentDesign) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-orange-700">
      {/* Image Mode */}
      {fullScreenMode === "image" && (
        <div className="absolute inset-0">
          {/* Image */}
          <div className="relative w-full h-full">
            {currentImage && (
              <Image
                src={currentImage}
                alt={currentDesign.name || "Design image"}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
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
            <button
              onClick={() => setFullScreenMode("carousel")}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-white font-light tracking-wider backdrop-blur-sm"
            >
              VIEW CAROUSEL
            </button>
          </div>

          {/* Navigation Arrows */}
          {designs.length > 1 && (
            <>
              <button
                onClick={() => goToImage("prev")}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={() => goToImage("next")}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-6xl font-light text-white mb-4">
                    {currentDesign.name}
                  </h1>
                  <div className="flex items-center gap-6">
                    <div className="text-white/70 text-lg font-light">
                      {currentDesign.category}
                    </div>
                    <div className="text-2xl font-light text-white">
                      {formatPrice(currentDesign.price)}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/catalog/${currentDesign.design_id}`}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-white text-orange-700 hover:bg-white/90 transition-all duration-300 font-light tracking-wider"
                >
                  VIEW FULL DETAILS
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Mode */}
      {fullScreenMode === "carousel" && (
        <div className="absolute inset-0">
          <div className="h-full w-full flex items-center justify-center p-8">
            <div className="w-full max-w-5xl h-full">
              <VerticalCarousel
                designs={designs}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                isFullScreen={true}
              />
            </div>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setFullScreenMode("image")}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-white font-light tracking-wider backdrop-blur-sm"
            >
              BACK TO IMAGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
