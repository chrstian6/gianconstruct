"use client";

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

export function OverviewDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-36 mb-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-48 ml-1" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Skeleton */}
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col justify-end">
              <div className="flex-1 flex items-end">
                {Array.from({ length: 14 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 mx-0.5 flex flex-col items-center"
                  >
                    <Skeleton
                      className="w-full"
                      style={{
                        // Deterministic heights based on index
                        height: `${30 + (index % 5) * 15}%`,
                        backgroundColor: "hsl(0, 0%, 80%)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className="h-3 w-16" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Skeleton */}
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <Skeleton className="w-full h-full rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Skeleton className="h-6 w-16 mx-auto" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions Skeleton */}
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Performance Insights Skeleton */}
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Inventory Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            {/* Project Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            {/* Revenue Distribution */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-1.5 w-full" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-border">
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-full rounded-md" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
