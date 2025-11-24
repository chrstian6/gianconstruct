import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  Images,
  CheckCircle,
  User,
  HardHat,
  Gauge,
  ChevronRight,
  Circle,
  Activity,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Project, TimelineEntry } from "@/types/project";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectTimeline } from "@/action/project";
import { useModalStore } from "@/lib/stores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProjectTimelineProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export default function ProjectTimeline({
  project,
  onUpdate,
}: ProjectTimelineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { setIsAddTimelineUpdateOpen, timelineProject } = useModalStore();

  useEffect(() => {
    fetchTimeline();
  }, [project.project_id]);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      const response = await getProjectTimeline(project.project_id);
      if (response.success && response.timeline) {
        setTimeline(response.timeline);
      } else {
        toast.error(response.error || "Failed to fetch timeline");
      }
    } catch (error) {
      toast.error("Failed to fetch timeline");
      console.error("Error fetching timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDayDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimelineIcon = (type: TimelineEntry["type"]) => {
    switch (type) {
      case "project_created":
        return <HardHat className="h-4 w-4" />;
      case "project_confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "project_assigned":
        return <User className="h-4 w-4" />;
      case "photo_update":
        return <Images className="h-4 w-4" />;
      case "status_update":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTimelineTypeLabel = (type: TimelineEntry["type"]) => {
    switch (type) {
      case "project_created":
        return "Project Created";
      case "project_confirmed":
        return "Project Confirmed";
      case "project_assigned":
        return "Project Assigned";
      case "photo_update":
        return "Photo Update";
      case "status_update":
        return "Status Update";
      default:
        return "Update";
    }
  };

  // Simplified progress color - monochrome/zinc based
  const getProgressColor = (percentage: number) => {
    return "bg-zinc-900";
  };

  const getProgressLabel = (percentage: number) => {
    if (percentage === 0) return "Not Started";
    if (percentage === 100) return "Completed";
    if (percentage >= 75) return "Almost Done";
    if (percentage >= 50) return "In Progress";
    if (percentage >= 25) return "Getting Started";
    return "Just Started";
  };

  const timelineItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateAdded = () => {
    fetchTimeline();
    if (onUpdate) {
      onUpdate(project);
    }
  };

  const handleTimelineItemClick = (entry: TimelineEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const hasProgress = (entry: TimelineEntry) => {
    return (
      entry.progress !== undefined &&
      entry.progress !== null &&
      entry.progress > 0
    );
  };

  // Modern Skeleton
  const TimelineSkeleton = () => {
    return (
      <div className="w-full overflow-hidden">
        <div className="flex space-x-6 p-1">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <div className="flex-1 h-px bg-zinc-100" />
              </div>
              <div className="border border-zinc-100 rounded-xl bg-white p-4 space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-2 flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="border-none shadow-none bg-transparent w-full overflow-hidden">
        <CardHeader className="px-0 pt-0 pb-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Project Timeline
            </CardTitle>
          </div>
        </CardHeader>

        {/* Loading State */}
        {isLoading ? (
          <TimelineSkeleton />
        ) : (
          /* Actual Timeline Content */
          <div className="w-full h-full">
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent max-w-5xl"
              style={{ maxWidth: "100%", display: "block" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  minWidth: "100%",
                }}
                className="max-w-md"
              >
                <AnimatePresence>
                  {timeline.length > 0 ? (
                    <div className="flex space-x-6">
                      {timeline.map((entry, index) => {
                        const hasPhotos =
                          entry.photoUrls && entry.photoUrls.length > 0;
                        const firstImageUrl = entry.photoUrls?.[0] ?? null;
                        const isLastItem = index === timeline.length - 1;
                        const photoCount = entry.photoUrls
                          ? entry.photoUrls.length
                          : 0;
                        const showProgress = hasProgress(entry);

                        return (
                          <motion.div
                            key={entry._id}
                            className="flex-shrink-0 w-72 group"
                            variants={timelineItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <div className="flex flex-col w-full h-full">
                              {/* Timeline Header: Dot + Date + Line */}
                              <div className="flex items-center gap-3 mb-4">
                                <div className="relative z-10 flex items-center justify-center">
                                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 ring-4 ring-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-500 font-geist uppercase tracking-wide">
                                  {formatDayDate(entry.date)}
                                </span>
                                {!isLastItem && (
                                  <div className="flex-1 h-px bg-zinc-200" />
                                )}
                              </div>

                              {/* Card Content */}
                              <div
                                className="cursor-pointer rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all duration-200 overflow-hidden flex flex-col h-full min-h-[200px]"
                                onClick={() => handleTimelineItemClick(entry)}
                              >
                                {/* Image Section */}
                                {firstImageUrl && (
                                  <div className="h-32 relative overflow-hidden border-b border-zinc-100">
                                    <img
                                      src={firstImageUrl}
                                      alt={entry.title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                    {photoCount > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                        <Images className="h-3 w-3" /> +
                                        {photoCount - 1}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="p-4 flex flex-col flex-grow">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-tight">
                                      {entry.title}
                                    </h4>
                                  </div>

                                  {/* Progress Bar */}
                                  {showProgress && (
                                    <div className="mt-2 mb-4">
                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[10px] font-medium text-zinc-500 uppercase">
                                          Progress
                                        </span>
                                        <span className="text-xs font-bold text-zinc-900 font-mono">
                                          {entry.progress}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            getProgressColor(entry.progress!)
                                          )}
                                          style={{
                                            width: `${entry.progress}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-100 border-dashed">
                                    <div className="flex gap-2">
                                      {entry.status && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200 font-medium px-1.5 py-0 h-5"
                                        >
                                          {entry.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-medium">
                                      {formatTime(entry.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      className="flex flex-col items-center justify-center py-12 w-full text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="h-12 w-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center mb-3">
                        <Clock className="h-6 w-6 text-zinc-300" />
                      </div>
                      <p className="text-sm font-medium text-zinc-900">
                        Timeline is empty
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                        No updates have been recorded for this project yet.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white border-zinc-200 p-0 gap-0 overflow-hidden font-geist">
          {selectedEntry && (
            <>
              <DialogHeader className="p-6 border-b border-zinc-100">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant="outline"
                    className="bg-zinc-100 text-zinc-600 border-zinc-200 font-medium"
                  >
                    {getTimelineTypeLabel(selectedEntry.type)}
                  </Badge>
                  <span className="text-sm text-zinc-400 flex items-center gap-1">
                    <Circle className="h-1.5 w-1.5 fill-current" />
                    {formatDateTime(selectedEntry.date)}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-zinc-900">
                  {selectedEntry.title}
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {/* Progress Section in Modal */}
                {hasProgress(selectedEntry) && (
                  <div className="space-y-3 p-4 border border-zinc-100 rounded-xl bg-zinc-50/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        Reported Progress
                      </h4>
                      <span className="text-lg font-bold text-zinc-900 font-mono">
                        {selectedEntry.progress}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full bg-zinc-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                            selectedEntry.progress!
                          )}`}
                          style={{ width: `${selectedEntry.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500 font-medium">
                        <span>{getProgressLabel(selectedEntry.progress!)}</span>
                        <span>Goal: 100%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedEntry.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-900">
                      Description
                    </h4>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {selectedEntry.description}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                {selectedEntry.status && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-900">
                      Status Update
                    </h4>
                    <div className="flex">
                      <Badge
                        variant="outline"
                        className="text-sm px-3 py-1 bg-white text-zinc-700 border-zinc-200"
                      >
                        {selectedEntry.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Photos Grid */}
                {selectedEntry.photoUrls &&
                  selectedEntry.photoUrls.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                          <Images className="h-4 w-4" />
                          Attached Photos
                        </h4>
                        <span className="text-xs text-zinc-400">
                          {selectedEntry.photoUrls.length} items
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedEntry.photoUrls.map((url, index) => (
                          <div
                            key={index}
                            className="group relative aspect-video rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50"
                          >
                            <img
                              src={url}
                              alt={`Update photo ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-image.jpg"; // Fallback
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                >
                  Close Details <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
