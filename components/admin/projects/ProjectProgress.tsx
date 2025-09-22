// components/admin/projects/ProjectProgress.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, Clock } from "lucide-react";

interface ProjectProgressProps {
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "overdue";
}

export default function ProjectProgress({
  startDate,
  endDate,
  status,
}: ProjectProgressProps) {
  const calculateProgress = (startDate: Date, endDate: Date | undefined) => {
    if (!endDate) return 0;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    const totalDuration = end - start;
    const elapsed = now - start;

    return Math.min(
      100,
      Math.max(0, Math.round((elapsed / totalDuration) * 100))
    );
  };

  const getDaysRemaining = (endDate: Date | undefined) => {
    if (!endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 0;
    if (diffDays === 0) return 0;
    return diffDays;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const progress = calculateProgress(startDate, endDate);
  const daysRemaining = getDaysRemaining(endDate);
  const isOverdue = status === "overdue";

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          Project Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="p-3 bg-white rounded-full w-16 h-16 mx-auto mb-3 shadow-sm">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Start Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(startDate)}
            </p>
          </div>

          <div className="text-center p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="p-3 bg-white rounded-full w-16 h-16 mx-auto mb-3 shadow-sm">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">End Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {endDate ? formatDate(endDate) : "Not set"}
            </p>
          </div>

          <div className="text-center p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <div className="p-3 bg-white rounded-full w-16 h-16 mx-auto mb-3 shadow-sm">
              <Clock className="h-8 w-8 text-amber-600 mx-auto" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {isOverdue
                ? "Overdue"
                : daysRemaining === 0
                  ? "Ends today"
                  : `${daysRemaining} days remaining`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Completion Progress
            </span>
            <span className="text-lg font-bold text-gray-900">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Start</span>
            <span>Complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
