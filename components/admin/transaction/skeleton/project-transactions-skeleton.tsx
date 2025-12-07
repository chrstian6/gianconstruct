import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const ProjectTransactionsSkeleton = () => {
  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar Skeleton */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Status Summary Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-gray-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects Table Skeleton */}
      <Card className="border-gray-300">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="space-y-2">
                        {cellIndex === 0 && (
                          <>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-24" />
                          </>
                        )}
                        {cellIndex === 1 && (
                          <>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </>
                        )}
                        {cellIndex === 2 && (
                          <>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                          </>
                        )}
                        {cellIndex === 3 && (
                          <>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </>
                        )}
                        {cellIndex === 4 && (
                          <div className="space-y-1">
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </div>
                        )}
                        {cellIndex === 5 && (
                          <>
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-3 w-32" />
                          </>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer Skeleton */}
      <div className="mt-6">
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
};

export const ProjectDetailsSkeleton = () => {
  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header with back button skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Project summary skeleton */}
      <Card className="mb-8 border-gray-300">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions table skeleton */}
      <Card className="border-gray-300">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="space-y-1">
                        {cellIndex === 0 && <Skeleton className="h-4 w-32" />}
                        {cellIndex === 1 && <Skeleton className="h-4 w-40" />}
                        {cellIndex === 2 && <Skeleton className="h-4 w-28" />}
                        {cellIndex === 3 && <Skeleton className="h-4 w-24" />}
                        {cellIndex === 4 && <Skeleton className="h-4 w-20" />}
                        {cellIndex === 5 && <Skeleton className="h-6 w-24" />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-gray-300">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const StatsCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-gray-300 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-gray-300" />
                <Skeleton className="h-6 w-24 bg-gray-300" />
                <Skeleton className="h-3 w-40 bg-gray-300" />
              </div>
              <Skeleton className="h-5 w-5 rounded-full bg-gray-300" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const ProjectsTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <Card className="border-gray-300">
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: 6 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="space-y-2">
                      {cellIndex === 0 && (
                        <>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </>
                      )}
                      {cellIndex === 1 && (
                        <>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </>
                      )}
                      {cellIndex === 2 && (
                        <>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </>
                      )}
                      {cellIndex === 3 && (
                        <>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </>
                      )}
                      {cellIndex === 4 && (
                        <div className="space-y-1">
                          <Skeleton className="h-2 w-full" />
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </div>
                      )}
                      {cellIndex === 5 && (
                        <>
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-3 w-32" />
                        </>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600">{text}</p>
    </div>
  );
};

export default ProjectTransactionsSkeleton;
