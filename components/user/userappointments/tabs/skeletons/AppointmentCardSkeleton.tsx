import { Card, CardContent } from "@/components/ui/card";

export function AppointmentCardSkeleton() {
  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-xl animate-pulse">
      <CardContent className="p-5">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Schedule Details Skeleton */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Alert Skeleton */}
        <div className="bg-gray-100 rounded-lg p-3 mb-3 border border-gray-200">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </CardContent>
    </Card>
  );
}
