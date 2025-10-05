import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Edit,
  Trash,
  Plus,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TimelineEntry, Project } from "@/types/project";
import { Images } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";

interface UpdateProjectModalProps {
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  selectedEntry: TimelineEntry | null;
  setSelectedEntry: (entry: TimelineEntry | null) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedDateEntries: TimelineEntry[];
  setSelectedDateEntries: (entries: TimelineEntry[]) => void;
  photos: File[] | null;
  setPhotos: React.Dispatch<React.SetStateAction<File[] | null>>;
  caption: string;
  setCaption: (caption: string) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  editCaption: string;
  setEditCaption: (caption: string) => void;
  editPhotos: File[] | null;
  setEditPhotos: React.Dispatch<React.SetStateAction<File[] | null>>;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  isDeleting: boolean;
  setIsDeleting: (isDeleting: boolean) => void;
  isEditingEntry: boolean;
  setIsEditingEntry: (isEditingEntry: boolean) => void;
  customDate: Date | undefined;
  setCustomDate: (date: Date | undefined) => void;
  localProject: Project;
  onUpdate?: (updatedProject: Project) => void;
  handleUpload: () => Promise<void>;
  handleEdit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleDeleteFromModal: (entry: TimelineEntry) => Promise<void>;
  isDateInProjectRange: (date: Date) => boolean;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
}

export default function UpdateProjectModal({
  isUploadOpen,
  setIsUploadOpen,
  selectedEntry,
  setSelectedEntry,
  selectedDate,
  setSelectedDate,
  selectedDateEntries,
  setSelectedDateEntries,
  photos,
  setPhotos,
  caption,
  setCaption,
  isEditing,
  setIsEditing,
  editCaption,
  setEditCaption,
  editPhotos,
  setEditPhotos,
  isSubmitting,
  setIsSubmitting,
  isDeleting,
  setIsDeleting,
  isEditingEntry,
  setIsEditingEntry,
  customDate,
  setCustomDate,
  localProject,
  handleUpload,
  handleEdit,
  handleDelete,
  handleDeleteFromModal,
  isDateInProjectRange,
  formatDate,
  formatTime,
}: UpdateProjectModalProps) {
  const [confirmType, setConfirmType] = useState<
    "delete-single" | "delete-multiple" | "edit" | null
  >(null);
  const [entryToConfirm, setEntryToConfirm] = useState<TimelineEntry | null>(
    null
  );
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState<string[]>([]);

  // Generate previews for uploaded photos
  useEffect(() => {
    if (photos) {
      const previews = photos.map((file) => URL.createObjectURL(file));
      setPhotoPreviews(previews);
      return () => previews.forEach((url) => URL.revokeObjectURL(url));
    } else {
      setPhotoPreviews([]);
    }
  }, [photos]);

  // Generate previews for edit photos
  useEffect(() => {
    if (editPhotos) {
      const previews = editPhotos.map((file) => URL.createObjectURL(file));
      setEditPhotoPreviews(previews);
      return () => previews.forEach((url) => URL.revokeObjectURL(url));
    } else {
      setEditPhotoPreviews([]);
    }
  }, [editPhotos]);

  const handleConfirm = async () => {
    if (confirmType === "edit") {
      await handleEdit();
    } else if (confirmType === "delete-single") {
      await handleDelete();
    } else if (confirmType === "delete-multiple" && entryToConfirm) {
      await handleDeleteFromModal(entryToConfirm);
    }
    setConfirmType(null);
    setEntryToConfirm(null);
  };

  const handleCancelConfirm = () => {
    setConfirmType(null);
    setEntryToConfirm(null);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (isEdit) {
      setEditPhotos(files.length > 0 ? files : null);
    } else {
      setPhotos(files.length > 0 ? files : null);
    }
  };

  const removePhoto = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditPhotos((prev: File[] | null) => {
        if (!prev) return null;
        const newPhotos = prev.filter((_, i) => i !== index);
        return newPhotos.length > 0 ? newPhotos : null;
      });
    } else {
      setPhotos((prev: File[] | null) => {
        if (!prev) return null;
        const newPhotos = prev.filter((_, i) => i !== index);
        return newPhotos.length > 0 ? newPhotos : null;
      });
    }
  };

  return (
    <>
      {/* Upload Modal */}
      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setIsUploadOpen(open);
            if (!open) {
              setPhotos(null);
              setCaption("");
              setCustomDate(undefined);
              setPhotoPreviews([]);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] bg-background border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Update
            </DialogTitle>
            <DialogDescription>
              Add photos and/or a caption for your project update. At least one
              is required. This will appear in the project timeline for{" "}
              {localProject.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-date">Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? (
                      format(customDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDate}
                    onSelect={setCustomDate}
                    disabled={(date) => !isDateInProjectRange(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {customDate && !isDateInProjectRange(customDate) ? (
                  <span className="text-destructive">
                    Date is outside the project timeline. Please select a date
                    between{" "}
                    {localProject.startDate
                      ? format(new Date(localProject.startDate), "MMM d, yyyy")
                      : "start"}{" "}
                    and{" "}
                    {localProject.endDate
                      ? format(new Date(localProject.endDate), "MMM d, yyyy")
                      : "end"}
                    .
                  </span>
                ) : (
                  "Leave blank to use today's date"
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-photos">Photos (optional)</Label>
              <Input
                id="upload-photos"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                multiple
                onChange={(e) => handleFileChange(e, false)}
                className="border-border py-2 px-3 rounded-lg text-sm"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, GIF, WEBP, SVG. Max size: 50MB per
                photo. Select multiple photos.
              </p>
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border cursor-pointer"
                        onClick={() => setFullImageUrl(preview)}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => removePhoto(index, false)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-caption">Caption (optional)</Label>
              <Textarea
                id="upload-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe the update in detail"
                className="py-2 px-3 bg-background border-border focus:ring-1 focus:ring-primary rounded-lg text-sm min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              className="flex-1 sm:flex-initial border-border text-foreground hover:bg-muted py-2 rounded-lg text-sm font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg text-sm font-medium"
              disabled={
                isSubmitting ||
                (!photos?.length && !caption.trim()) ||
                (customDate && !isDateInProjectRange(customDate))
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Entry Modal */}
      {selectedEntry && (
        <Dialog
          open={!!selectedEntry}
          onOpenChange={(open) => {
            if (!isEditingEntry && !isDeleting) {
              setSelectedEntry(open ? selectedEntry : null);
              setIsEditing(false);
              setEditPhotoPreviews([]);
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] bg-background border-border rounded-xl">
            {isEditing ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-primary" />
                    Edit Timeline Entry
                  </DialogTitle>
                  <DialogDescription>
                    Update the caption and/or replace photos for this entry in{" "}
                    {localProject.name}. At least one is required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-caption">Caption</Label>
                    <Textarea
                      id="edit-caption"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="py-2 px-3 bg-background border-border focus:ring-1 focus:ring-primary rounded-lg text-sm min-h-[100px]"
                      disabled={isEditingEntry}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-photos">
                      Replace Photos (optional)
                    </Label>
                    <Input
                      id="edit-photos"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      multiple
                      onChange={(e) => handleFileChange(e, true)}
                      className="border-border py-2 px-3 rounded-lg text-sm"
                      disabled={isEditingEntry}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPEG, PNG, GIF, WEBP, SVG. Max size:
                      50MB per photo. Current photos will be replaced if new
                      ones are uploaded.
                    </p>
                    {editPhotoPreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {editPhotoPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Edit preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-border cursor-pointer"
                              onClick={() => setFullImageUrl(preview)}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full"
                              onClick={() => removePhoto(index, true)}
                              disabled={isEditingEntry}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {editPhotoPreviews.length === 0 &&
                      selectedEntry.photoUrls && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {selectedEntry.photoUrls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Current photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-border cursor-pointer"
                              onClick={() => setFullImageUrl(url)}
                              onError={() =>
                                console.error("Failed to load image:", url)
                              }
                            />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
                <DialogFooter className="gap-2 flex flex-col sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 sm:flex-initial border-border text-foreground hover:bg-muted py-2 rounded-lg text-sm font-medium"
                    disabled={isEditingEntry}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setConfirmType("edit")}
                    className="flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg text-sm font-medium"
                    disabled={
                      isEditingEntry ||
                      (!editPhotos?.length && !editCaption.trim())
                    }
                  >
                    {isEditingEntry ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedEntry.photoUrls?.length ? (
                      <ImageIcon className="h-5 w-5 text-primary" />
                    ) : null}
                    {selectedEntry.caption || "Timeline Update"}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    {formatDate(new Date(selectedEntry.date))} at{" "}
                    {formatTime(new Date(selectedEntry.date))}
                    {new Date(selectedEntry.date).toDateString() !==
                      new Date().toDateString() && (
                      <span className="ml-2 inline-flex items-center text-amber-600">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Custom Date
                      </span>
                    )}
                    <span className="text-muted-foreground ml-2">
                      Project: {localProject.name}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                {selectedEntry.photoUrls?.length ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg overflow-hidden border border-border">
                    {selectedEntry.photoUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Timeline photo ${index + 1}`}
                        className="w-full h-24 object-cover cursor-pointer"
                        onClick={() => setFullImageUrl(url)}
                        onError={() =>
                          console.error("Failed to load image:", url)
                        }
                      />
                    ))}
                  </div>
                ) : null}
                {selectedEntry.caption && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedEntry.caption}
                    </p>
                  </div>
                )}
                <DialogFooter className="mt-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="py-2 text-sm rounded-lg"
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setConfirmType("delete-single");
                      setEntryToConfirm(selectedEntry);
                    }}
                    className="py-2 text-sm rounded-lg"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash className="h-4 w-4 mr-1" /> Delete
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Date Entries Modal (for multiple entries on same date) */}
      {selectedDate && selectedDateEntries.length > 0 && (
        <Dialog
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!isDeleting) {
              setSelectedDate(open ? selectedDate : null);
              if (!open) {
                setSelectedDateEntries([]);
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] bg-background border-border rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Images className="h-5 w-5 text-primary" />
                {selectedDateEntries.length} Update
                {selectedDateEntries.length !== 1 ? "s" : ""} on{" "}
                {formatDate(selectedDate)}
                {selectedDate.toDateString() !== new Date().toDateString() && (
                  <span className="ml-2 inline-flex items-center text-amber-600">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Custom Date
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                All updates from this date in {localProject.name}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-96 overflow-y-auto">
              {selectedDateEntries.map((entry, index) => (
                <div
                  key={index}
                  className="mb-6 pb-4 border-b border-border last:border-b-0 last:pb-0 last:mb-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatTime(new Date(entry.date))}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDate(null);
                          setSelectedDateEntries([]);
                          setSelectedEntry(entry);
                          setIsEditing(true);
                        }}
                        className="h-7 text-xs rounded-lg"
                        disabled={isDeleting}
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setConfirmType("delete-multiple");
                          setEntryToConfirm(entry);
                        }}
                        className="h-7 text-xs rounded-lg"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Trash className="h-3 w-3 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                  {entry.photoUrls?.length ? (
                    <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg overflow-hidden border border-border">
                      {entry.photoUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Timeline photo ${idx + 1}`}
                          className="w-full h-24 object-cover cursor-pointer"
                          onClick={() => setFullImageUrl(url)}
                          onError={() =>
                            console.error("Failed to load image:", url)
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  {entry.caption && (
                    <div className="p-3 bg-muted/30 rounded-lg border border-border">
                      <p className="text-sm whitespace-pre-wrap">
                        {entry.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Full Image View Modal */}
      {fullImageUrl && (
        <Dialog
          open={!!fullImageUrl}
          onOpenChange={() => setFullImageUrl(null)}
        >
          <DialogContent className="max-w-4xl bg-background border-border rounded-xl p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Full Size Image</DialogTitle>
            </DialogHeader>
            <img
              src={fullImageUrl}
              alt="Full-size image"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={() => setFullImageUrl(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmType}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        title={
          confirmType?.startsWith("delete")
            ? "Confirm Deletion"
            : "Confirm Update"
        }
        description={
          confirmType?.startsWith("delete")
            ? "Are you sure you want to delete this timeline entry? This action cannot be undone."
            : "Are you sure you want to save these changes to the timeline entry?"
        }
        confirmText={confirmType?.startsWith("delete") ? "Delete" : "Save"}
        cancelText="Cancel"
      />
    </>
  );
}
