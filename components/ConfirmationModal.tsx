import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useModalStore } from "@/lib/stores";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
}

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText,
  cancelText,
}: ConfirmationModalProps) {
  const { setIsDeleteDesignOpen } = useModalStore();

  const handleCancel = () => {
    onCancel();
    setIsDeleteDesignOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsDeleteDesignOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex justify-end gap-3">
          <AlertDialogCancel
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
