"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProjectModalLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  footerActions: React.ReactNode;
}

export function ProjectModalLayout({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerActions,
}: ProjectModalLayoutProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-white border-gray-300 p-0 overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2 text-gray-900 font-geist text-xl font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-geist text-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Fixed Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-gray-200 bg-white sticky bottom-0 z-10 gap-4 sm:gap-2 flex flex-col sm:flex-row justify-between">
          {footerActions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
