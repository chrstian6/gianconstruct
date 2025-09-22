import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Loader2, Calendar, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { TimelineEntry, Project } from "@/types/project";
import {
  uploadProjectPhoto,
  editTimelineEntry,
  deleteTimelineEntry,
} from "@/action/project";
import { motion, AnimatePresence } from "framer-motion";
import UpdateProjectModal from "@/components/admin/projects/timeline/UpdateProjectModal";
import { format } from "date-fns";
import ConfirmationModal from "@/components/ConfirmationModal";

interface TimelineStep {
  title: string;
  date: Date;
  isEntry: boolean;
  entries: TimelineEntry[];
  entryCount: number;
  isCustomDate?: boolean;
  isStartDate?: boolean;
}

interface ProjectTimelineProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export default function ProjectTimeline({
  project,
  onUpdate,
}: ProjectTimelineProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<
    TimelineEntry[]
  >([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [photos, setPhotos] = useState<File[] | null>(null);
  const [caption, setCaption] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editPhotos, setEditPhotos] = useState<File[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [localProject, setLocalProject] = useState<Project>(project);
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [hasOverflow, setHasOverflow] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<TimelineEntry | null>(null);
  const [isDeleteFromModal, setIsDeleteFromModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update local project when prop changes
  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  useEffect(() => {
    if (selectedEntry) {
      setEditCaption(selectedEntry.caption || "");
      setEditPhotos(null);
      setIsEditing(false);
    }
  }, [selectedEntry, localProject.timeline]);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        setHasOverflow(
          scrollRef.current.scrollHeight > scrollRef.current.clientHeight
        );
      }
    };
    checkOverflow();
  }, [localProject.timeline]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDateInProjectRange = (date: Date) => {
    if (!localProject.startDate || !localProject.endDate) return true;

    const checkDate = new Date(date);
    const startDate = new Date(localProject.startDate);
    const endDate = new Date(localProject.endDate);

    checkDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
  };

  const getTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = localProject.startDate
      ? new Date(localProject.startDate)
      : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    const entriesByDate: { [key: string]: TimelineEntry[] } = {};

    if (localProject.timeline && localProject.timeline.length > 0) {
      localProject.timeline.forEach((entry) => {
        const entryDate = new Date(entry.date);
        const dateKey = entryDate.toDateString();
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
      });

      Object.keys(entriesByDate)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .forEach((dateKey) => {
          const entries = entriesByDate[dateKey];
          const entryDate = new Date(dateKey);
          const isCustomDate =
            entryDate.toDateString() !== today.toDateString() &&
            isDateInProjectRange(entryDate);
          const isStartDate = startDate
            ? entryDate.toDateString() === startDate.toDateString()
            : false;

          steps.push({
            title: formatDate(entryDate),
            date: entryDate,
            isEntry: true,
            entries,
            entryCount: entries.length,
            isCustomDate,
            isStartDate,
          });
        });
    }

    return steps;
  };

  const timelineSteps = getTimelineSteps();
  const hasEntries = localProject.timeline && localProject.timeline.length > 0;
  const totalSteps = timelineSteps.length;

  const handleEntryClick = (step: TimelineStep) => {
    if (step.entries.length > 1) {
      setSelectedDate(step.date);
      setSelectedDateEntries(step.entries);
    } else if (step.entries.length === 1) {
      setSelectedEntry(step.entries[0]);
    }
  };

  const validateFile = (file: File): string | null => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP, SVG).";
    }

    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return "File size too large. Please upload an image smaller than 50MB.";
    }

    return null;
  };

  const handleUpload = async () => {
    if (isSubmitting) return;

    if (!photos?.length && !caption.trim()) {
      toast.error("At least one photo or caption is required.");
      return;
    }

    if (photos) {
      for (const photo of photos) {
        const validationError = validateFile(photo);
        if (validationError) {
          toast.error(validationError);
          return;
        }
      }
    }

    if (customDate && !isDateInProjectRange(customDate)) {
      toast.error("Selected date is outside the project timeline.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (photos) {
        photos.forEach((photo) => formData.append("photos", photo));
      }
      if (caption.trim()) formData.append("caption", caption);
      const dateToUse = customDate || new Date();
      formData.append("date", dateToUse.toISOString());

      const result = await uploadProjectPhoto(
        localProject.project_id,
        formData
      );
      if (result.success && result.project) {
        toast.success("Update added successfully");
        setIsUploadOpen(false);
        setPhotos(null);
        setCaption("");
        setCustomDate(undefined);
        setLocalProject(result.project);
        if (onUpdate) onUpdate(result.project);
      } else {
        toast.error(result.error || "Failed to add update");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
      console.error("Upload error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (isEditingEntry) return;

    if (!editPhotos?.length && !editCaption.trim()) {
      toast.error("At least one photo or caption is required.");
      return;
    }

    if (editPhotos) {
      for (const photo of editPhotos) {
        const validationError = validateFile(photo);
        if (validationError) {
          toast.error(validationError);
          return;
        }
      }
    }

    setIsEditingEntry(true);

    try {
      const formData = new FormData();
      if (editPhotos) {
        editPhotos.forEach((photo) => formData.append("photos", photo));
      }
      formData.append("caption", editCaption);

      const result = await editTimelineEntry(
        localProject.project_id,
        selectedEntry!.date.toISOString(),
        formData
      );
      if (result.success && result.project) {
        toast.success("Entry updated successfully");
        setIsEditing(false);
        setEditPhotos(null);
        setSelectedEntry(null);
        setLocalProject(result.project);
        if (onUpdate) onUpdate(result.project);
      } else {
        toast.error(result.error || "Failed to update entry");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
      console.error("Edit error:", error);
    } finally {
      setIsEditingEntry(false);
    }
  };

  const handleDeleteFromModal = async (entry: TimelineEntry) => {
    setDeleteEntry(entry);
    setIsDeleteFromModal(true);
    setDeleteConfirmOpen(true);
    return Promise.resolve();
  };

  const handleConfirmDelete = async () => {
    if (isDeleting || !deleteEntry) return;

    setIsDeleting(true);

    try {
      const result = await deleteTimelineEntry(
        localProject.project_id,
        deleteEntry.date.toISOString()
      );
      if (result.success && result.project) {
        toast.success("Entry deleted successfully");
        if (isDeleteFromModal) {
          const updatedEntries = selectedDateEntries.filter(
            (e) => e !== deleteEntry
          );
          setSelectedDateEntries(updatedEntries);
          if (updatedEntries.length === 0) {
            setSelectedDate(null);
          }
        } else {
          setSelectedEntry(null);
        }
        setLocalProject(result.project);
        if (onUpdate) onUpdate(result.project);
      } else {
        toast.error(result.error || "Failed to delete entry");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteEntry(null);
      setIsDeleteFromModal(false);
    }
  };

  const triggerDeleteConfirmation = async (
    entry: TimelineEntry,
    fromModal: boolean
  ): Promise<void> => {
    setDeleteEntry(entry);
    setIsDeleteFromModal(fromModal);
    setDeleteConfirmOpen(true);
    return Promise.resolve();
  };

  const timelineItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const truncateCaption = (caption: string, length: number = 30) => {
    if (!caption) return "";
    return caption.length > length ? `${caption.slice(0, length)}...` : caption;
  };

  const getPhotoCount = (entries: TimelineEntry[]) => {
    return entries.reduce(
      (count, entry) => count + (entry.photoUrls?.length || 0),
      0
    );
  };

  return (
    <TooltipProvider>
      <Card className="border-border shadow-none rounded-none bg-background/95">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                <div className="p-2 bg-primary/5">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                Project Timeline
              </CardTitle>
              <Button
                onClick={() => setIsUploadOpen(true)}
                size="sm"
                variant="default"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                New Update
              </Button>
            </div>
            <Separator className="bg-border/50" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            className="relative max-h-[210px] overflow-y-auto scrollbar-thin transition-all duration-300"
            ref={scrollRef}
          >
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-primary/20" />
            <AnimatePresence>
              {getTimelineSteps().map((step, index) => {
                const hasMultipleEntries = step.entries.length > 1;
                const hasPhotos = step.entries.some(
                  (entry) => entry.photoUrls?.length
                );
                const photoCount = getPhotoCount(step.entries);
                const captionPreview = step.entries[0]?.caption
                  ? truncateCaption(step.entries[0].caption)
                  : "";

                return (
                  <motion.div
                    key={`${step.date.getTime()}-${index}-${step.entryCount}`}
                    className="relative pl-12 pb-6 last:pb-0 group"
                    variants={timelineItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="absolute left-5 top-2.5 transform -translate-x-1/2 z-10">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          step.isStartDate
                            ? "bg-green-500 ring-2 ring-green-500/30 animate-pulse"
                            : "bg-primary ring-2 ring-primary/20"
                        }`}
                      />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className="flex items-start cursor-pointer hover:bg-muted/20 p-3 -ml-3 -mr-3 transition-all duration-200 group-hover:bg-accent/10 border border-transparent group-hover:border-accent/10"
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleEntryClick(step)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base text-foreground">
                                {step.title}
                              </h4>
                              {step.isCustomDate && (
                                <Badge
                                  variant="outline"
                                  className="text-xs py-0.5 px-2 bg-amber-50 text-amber-700 border-amber-200 font-medium"
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Custom
                                </Badge>
                              )}
                              {hasPhotos && (
                                <Badge
                                  variant="outline"
                                  className="text-xs py-0.5 px-2 bg-primary/5 border-primary/10 text-primary font-medium"
                                >
                                  <Images className="h-3 w-3 mr-1" />
                                  {photoCount} Photo
                                  {photoCount !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {hasMultipleEntries && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs py-0.5 px-2 bg-primary/5 text-primary font-medium hover:bg-primary/10"
                                >
                                  {step.entryCount} update
                                  {step.entryCount !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 mt-1.5">
                              <p className="text-xs text-muted-foreground">
                                {step.entries.length} entr
                                {step.entries.length !== 1 ? "ies" : "y"}
                              </p>
                              {captionPreview && (
                                <p className="text-xs text-muted-foreground italic">
                                  {captionPreview}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-background border-border p-2">
                        <p className="text-sm font-medium">
                          {formatDate(step.date)} at {formatTime(step.date)}
                        </p>
                        {step.entries[0]?.caption && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.entries[0].caption}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    {index < getTimelineSteps().length - 1 && (
                      <div className="absolute left-5 top-5 bottom-0 w-0.5 bg-primary/20" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!hasEntries && (
              <motion.div
                className="text-center py-10 text-muted-foreground/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">
                  No timeline entries yet. Add your first update!
                </p>
                <Button
                  onClick={() => setIsUploadOpen(true)}
                  className="mt-4"
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Update
                </Button>
              </motion.div>
            )}
            {(totalSteps >= 3 || totalSteps === 1) && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
            )}
          </div>
        </CardContent>
      </Card>
      <UpdateProjectModal
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
        selectedEntry={selectedEntry}
        setSelectedEntry={setSelectedEntry}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDateEntries={selectedDateEntries}
        setSelectedDateEntries={setSelectedDateEntries}
        photos={photos}
        setPhotos={setPhotos}
        caption={caption}
        setCaption={setCaption}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editCaption={editCaption}
        setEditCaption={setEditCaption}
        editPhotos={editPhotos}
        setEditPhotos={setEditPhotos}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        isEditingEntry={isEditingEntry}
        setIsEditingEntry={setIsEditingEntry}
        customDate={customDate}
        setCustomDate={setCustomDate}
        localProject={localProject}
        onUpdate={onUpdate}
        handleUpload={handleUpload}
        handleEdit={handleEdit}
        handleDelete={async () =>
          triggerDeleteConfirmation(selectedEntry!, false)
        }
        handleDeleteFromModal={handleDeleteFromModal}
        isDateInProjectRange={isDateInProjectRange}
        formatDate={formatDate}
        formatTime={formatTime}
      />
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteEntry(null);
          setIsDeleteFromModal(false);
        }}
        title="Confirm Deletion"
        description="Are you sure you want to delete this timeline entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: oklch(0.75 0.1 270 / 0.3) transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: oklch(0.75 0.1 270 / 0.3);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: oklch(0.75 0.1 270 / 0.5);
        }
      `}</style>
    </TooltipProvider>
  );
}
