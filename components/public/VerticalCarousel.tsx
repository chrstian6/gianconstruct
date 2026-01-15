"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { CachedDesign } from "@/action/designs-cache";
import { useState, useRef, useEffect, useCallback } from "react";

interface VerticalCarouselProps {
  designs: CachedDesign[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isFullScreen?: boolean;
}

export default function VerticalCarousel({
  designs,
  currentIndex,
  onIndexChange,
  isFullScreen = false,
}: VerticalCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

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
    if (!isDragging || !carouselRef.current) return;
    setIsDragging(false);

    const scrollTop = carouselRef.current.scrollTop;
    const itemHeight = 200; // Approximate height
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

  // Scroll to current item
  useEffect(() => {
    if (!carouselRef.current) return;
    const itemHeight = 200;
    carouselRef.current.scrollTo({
      top: currentIndex * itemHeight,
      behavior: "smooth",
    });
  }, [currentIndex]);

  if (designs.length === 0) return null;

  return (
    <div
      ref={carouselRef}
      className="relative h-full overflow-hidden scrollbar-hide cursor-grab"
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
            className={`min-h-[200px] transition-all duration-300 ${
              index === currentIndex
                ? "opacity-100 scale-105"
                : "opacity-40 scale-95"
            }`}
          >
            <div
              className={`p-1 ${
                isFullScreen
                  ? "bg-white/10 backdrop-blur-sm border border-white/20"
                  : "bg-white/5 backdrop-blur-sm border border-white/10"
              } rounded-lg m-2`}
            >
              <div className="p-4 flex items-center">
                <div className="relative w-24 h-24 mr-4 flex-shrink-0">
                  {design?.images?.[0] && (
                    <Image
                      src={design.images[0]}
                      alt={design.name || "Design image"}
                      fill
                      className="object-cover rounded-md"
                      sizes="96px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={`font-light text-white ${isFullScreen ? "text-2xl" : "text-sm"}`}
                      >
                        {design?.name || "Untitled Design"}
                      </h4>
                      <p
                        className={`text-white/60 ${isFullScreen ? "text-lg" : "text-xs"}`}
                      >
                        {design?.category || "Uncategorized"}
                      </p>
                    </div>
                    <div
                      className={`font-mono tracking-wider ${isFullScreen ? "text-2xl" : "text-xs"}`}
                    >
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </div>
                  </div>

                  {isFullScreen && design?.description && (
                    <div className="mt-4">
                      <p className="text-white/80 font-light leading-relaxed line-clamp-2">
                        {design.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
