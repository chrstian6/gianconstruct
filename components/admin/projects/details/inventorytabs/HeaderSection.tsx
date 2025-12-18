// components/projects/inventory-components/HeaderSection.tsx
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  FileSpreadsheet,
  Package,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";

interface HeaderSectionProps {
  activeView: "transactions" | "current";
  setActiveView: (view: "transactions" | "current") => void;
  refreshData: () => void;
  refreshLoading: boolean;
  handleExportCSV: (type: "transactions" | "inventory" | "summary") => void;
}

export function HeaderSection({
  activeView,
  setActiveView,
  refreshData,
  refreshLoading,
  handleExportCSV,
}: HeaderSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Project Inventory</h2>
        <p className="text-sm text-zinc-500">
          Track and manage inventory transferred from main inventory to this
          project
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={refreshLoading}
          className="gap-2"
        >
          {refreshLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>

        <Select
          value="export"
          onValueChange={(v) => {
            if (v === "export-inventory") {
              handleExportCSV("inventory");
            } else if (v === "export-transactions") {
              handleExportCSV("transactions");
            } else if (v === "export-summary") {
              handleExportCSV("summary");
            }
          }}
        >
          <SelectTrigger className="w-[140px]">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Export" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="export-inventory">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Current Inventory
              </div>
            </SelectItem>
            <SelectItem value="export-transactions">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Transactions
              </div>
            </SelectItem>
            <SelectItem value="export-summary">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Category Summary
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
