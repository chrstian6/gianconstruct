// components/projects/inventory-components/DetailsDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, User, Calendar, Hash, FileText } from "lucide-react";
import { ProjectInventoryRecord } from "@/types/project-inventory";

interface DetailsDialogProps {
  viewDetails: ProjectInventoryRecord | null;
  setViewDetails: (record: ProjectInventoryRecord | null) => void;
  getActionConfig: (action: string) => any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export function DetailsDialog({
  viewDetails,
  setViewDetails,
  getActionConfig,
  formatCurrency,
  formatDate,
}: DetailsDialogProps) {
  if (!viewDetails) return null;

  const config = getActionConfig(viewDetails.action);

  return (
    <Dialog open={!!viewDetails} onOpenChange={() => setViewDetails(null)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-600" />
            <DialogTitle>Transaction Details</DialogTitle>
          </div>
          <DialogDescription>
            Detailed view of inventory transfer transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Transaction ID & Product ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">
                Transaction ID
              </p>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div className="font-mono text-sm bg-zinc-50 p-2 rounded border border-zinc-200 flex-1">
                  {viewDetails.projectInventory_id}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">
                Product ID
              </p>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div className="font-mono text-sm bg-zinc-50 p-2 rounded border border-zinc-200 flex-1">
                  {viewDetails.product_id}
                </div>
              </div>
            </div>
          </div>

          {/* Action Type */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">
              Action Type
            </p>
            <div className="space-y-1">
              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>
              <p className="text-xs text-zinc-500">{config.description}</p>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Quantity</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">
                {viewDetails.quantity}
              </span>
              <span className="text-lg text-zinc-600">{viewDetails.unit}</span>
            </div>
          </div>

          {/* Supplier */}
          {viewDetails.supplier && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Supplier</p>
              <div className="text-sm font-medium text-zinc-900 p-2 bg-zinc-50 rounded border border-zinc-200">
                {viewDetails.supplier}
              </div>
            </div>
          )}

          {/* Action By */}
          <div className="border-t border-zinc-200 pt-4">
            <p className="text-xs font-medium text-zinc-500 mb-2">ACTION BY</p>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-white rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900">
                  {viewDetails.action_by.name}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-600 capitalize">
                    {viewDetails.action_by.role}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-500 text-xs">
                    ID: {viewDetails.action_by.user_id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">
              Date & Time
            </p>
            <div className="text-sm text-zinc-900 flex items-center gap-2 p-2 bg-zinc-50 rounded border border-zinc-200">
              <Calendar className="h-4 w-4 text-zinc-400" />
              {formatDate(viewDetails.createdAt)}
            </div>
          </div>

          {/* Notes */}
          {viewDetails.notes && (
            <div className="border-t border-zinc-200 pt-4">
              <p className="text-xs font-medium text-zinc-500 mb-2">NOTES</p>
              <div className="flex items-start gap-2 p-3 bg-zinc-50 rounded border border-zinc-200">
                <FileText className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{viewDetails.notes}</span>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="border-t border-zinc-200 pt-4">
            <p className="text-xs font-medium text-zinc-500 mb-2">
              ADDITIONAL INFORMATION
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <p className="font-medium">
                    {formatDate(viewDetails.updatedAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-zinc-500">Transaction Type</p>
                <div className="font-medium capitalize">
                  {viewDetails.action.replace("_", " ")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
