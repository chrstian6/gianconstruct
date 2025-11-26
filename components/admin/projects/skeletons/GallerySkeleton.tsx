// components/admin/projects/skeletons/GallerySkeleton.tsx
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GallerySkeleton = () => {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-32" /> {/* Title skeleton */}
        <Skeleton className="h-4 w-24" /> {/* Count skeleton */}
      </CardHeader>
      <CardContent>
        {/* Masonry Layout Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Generate 9 skeleton items (3 columns x 3 rows) */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <div
              key={item}
              className="group relative bg-transparent rounded-lg overflow-hidden"
            >
              <div className="relative bg-transparent overflow-hidden">
                {/* Image skeleton */}
                <Skeleton className="w-full aspect-square rounded-lg" />

                {/* Hover overlay skeleton - matches the real structure */}
                <div className="absolute inset-0 bg-transparent flex flex-col justify-between">
                  {/* Top actions skeleton */}
                  <div className="flex justify-between items-start p-3">
                    <Skeleton className="h-5 w-12 rounded-full" />{" "}
                    {/* Badge skeleton */}
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8 rounded" />{" "}
                      {/* Zoom button skeleton */}
                      <Skeleton className="h-8 w-8 rounded" />{" "}
                      {/* Delete button skeleton */}
                    </div>
                  </div>

                  {/* Bottom info skeleton */}
                  <div className="p-3">
                    <Skeleton className="h-4 w-3/4 mb-2 rounded" />{" "}
                    {/* Title skeleton */}
                    <Skeleton className="h-3 w-full mb-1 rounded" />{" "}
                    {/* Description skeleton */}
                    <Skeleton className="h-3 w-1/2 rounded" />{" "}
                    {/* Date skeleton */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded" />{" "}
            {/* Previous button skeleton */}
            <Skeleton className="h-9 w-9 rounded" /> {/* Page 1 skeleton */}
            <Skeleton className="h-9 w-9 rounded" /> {/* Page 2 skeleton */}
            <Skeleton className="h-9 w-9 rounded" /> {/* Page 3 skeleton */}
            <Skeleton className="h-9 w-9 rounded" />{" "}
            {/* Next button skeleton */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GallerySkeleton;
