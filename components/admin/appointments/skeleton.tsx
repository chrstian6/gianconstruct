import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const AppointmentCardSkeleton = ({ index = 0 }: { index?: number }) => {
  const stackAnimation = {
    transform: `translateY(${index * 2}px)`,
    zIndex: 100 - index,
    opacity: 1 - index * 0.02,
  };

  return (
    <Card
      className="hover:shadow-md transition-all duration-300 border-l-4 border-l-gray-300 rounded-none"
      style={stackAnimation}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Left Column - Date Skeleton */}
          <div className="w-32 border-r border-gray-200 flex flex-col items-center justify-center p-3">
            <div className="text-center w-full">
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-3 animate-pulse"></div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right Column - Content Skeleton */}
          <div className="flex-1 p-3">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="text-gray-400 mx-1">•</div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>

            {/* Design Info Skeleton */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="flex items-start gap-1 mt-1">
                <div className="h-3 w-3 bg-gray-200 rounded mt-0.5 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>

            {/* Contact Info Skeleton */}
            <div className="flex items-center gap-3 text-xs mb-3">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <div className="h-7 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-7 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-7 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CalendarSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </CardTitle>
        <CardDescription>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AvailabilitySkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            </CardTitle>
            <CardDescription>
              <div className="h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
            </CardDescription>
          </div>
          <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
