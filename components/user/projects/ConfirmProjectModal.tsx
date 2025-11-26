// components/user/projects/ConfirmProjectModal.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import { X, Loader2, Calendar, CheckCircle } from "lucide-react";
import ProposedDesignTab from "@/components/admin/projects/design/ProposedDesignTab";

interface ConfirmProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirm: (projectId: string) => void;
  isConfirming: boolean;
}

export default function ConfirmProjectModal({
  isOpen,
  onClose,
  project,
  onConfirm,
  isConfirming,
}: ConfirmProjectModalProps) {
  const handleConfirm = () => {
    if (project) {
      onConfirm(project.project_id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Early return after all hooks
  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-zinc-900">
                Confirm Project Start
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-500">
                Review project details before confirming
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Project Overview - Compact */}
          <Card className="border-zinc-200 shadow-none">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">
                      PROJECT ID
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono bg-zinc-50"
                    >
                      {project.project_id}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">
                      LOCATION
                    </div>
                    <div className="text-sm text-zinc-900 font-medium">
                      {project.location?.fullAddress || "Construction Site"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">
                      TIMELINE
                    </div>
                    <div className="text-sm text-zinc-900">
                      {formatDate(project.startDate)} →{" "}
                      {project.endDate ? formatDate(project.endDate) : "TBD"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">
                      BUDGET
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      ₱{(project.totalCost ?? 0).toLocaleString("en-PH")}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposed Design Images */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <ProposedDesignTab project={project} />
          </div>

          {/* Important Notice - Compact */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-blue-900 text-sm mb-2">
                    Confirmation Required
                  </h5>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    By confirming, you acknowledge reviewing all project details
                    and agree to proceed with construction. The project status
                    will change to "Active" and work will begin according to
                    schedule.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-3 p-6 border-t border-zinc-200 bg-zinc-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 h-10 text-sm font-medium border-zinc-300 text-zinc-700 hover:text-zinc-900"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 h-10 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
