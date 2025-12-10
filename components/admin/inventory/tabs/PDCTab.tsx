// components/admin/inventory/tabs/PDCTab.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PDCWithItems } from "@/types/pdc";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Banknote,
  Clock,
  CheckSquare,
  XCircle,
  Eye,
  X,
  Calendar,
  Building,
  Package,
  DollarSign,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface PDCTabProps {
  pdcs: PDCWithItems[];
  pdcStats: any;
  pdcsLoading: boolean;
  pdcSearchTerm: string;
  setPdcSearchTerm: (term: string) => void;
  pdcStatusFilter: "all" | "pending" | "issued" | "cancelled";
  setPdcStatusFilter: (
    filter: "all" | "pending" | "issued" | "cancelled"
  ) => void;
  isPDCFilterOpen: boolean;
  setIsPDCFilterOpen: (open: boolean) => void;
  hasPDCActiveFilters: boolean;
  pdcCurrentPage: number;
  pdcItemsPerPage: number;
  filteredPDCs: PDCWithItems[];
  onViewPDCDetails: (pdc: PDCWithItems) => void;
  onMarkAsIssued: (pdc_id: string) => void;
  onPDCDeleteClick: (pdc: PDCWithItems) => void;
  onClearPDCFilters: () => void;
  setPdcCurrentPage: (page: number) => void;
}

export function PDCTab({
  pdcs,
  pdcStats,
  pdcsLoading,
  pdcSearchTerm,
  setPdcSearchTerm,
  pdcStatusFilter,
  setPdcStatusFilter,
  isPDCFilterOpen,
  setIsPDCFilterOpen,
  hasPDCActiveFilters,
  pdcCurrentPage,
  pdcItemsPerPage,
  filteredPDCs,
  onViewPDCDetails,
  onMarkAsIssued,
  onPDCDeleteClick,
  onClearPDCFilters,
  setPdcCurrentPage,
}: PDCTabProps) {
  // Get status information for PDC
  const getPDCStatusInfo = (pdc: PDCWithItems) => {
    switch (pdc.status) {
      case "pending":
        return {
          text: "Pending",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        };
      case "issued":
        return {
          text: "Issued",
          variant: "default" as const,
          icon: CheckSquare,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
        };
      case "cancelled":
        return {
          text: "Cancelled",
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-rose-600",
          bgColor: "bg-rose-50",
        };
      default:
        return {
          text: "Unknown",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  // Fixed pagination handlers
  const handlePreviousPage = () => {
    setPdcCurrentPage(Math.max(pdcCurrentPage - 1, 1));
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(filteredPDCs.length / pdcItemsPerPage);
    if (pdcCurrentPage < totalPages) {
      setPdcCurrentPage(pdcCurrentPage + 1);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredPDCs.length / pdcItemsPerPage);
  const startIndex = (pdcCurrentPage - 1) * pdcItemsPerPage;
  const endIndex = Math.min(startIndex + pdcItemsPerPage, filteredPDCs.length);
  const paginatedPDCs = filteredPDCs.slice(startIndex, endIndex);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            Post Dated Checks
          </h1>
          <p className="text-muted-foreground">
            Manage and track all post dated checks for inventory purchases
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
        </div>
      </div>

      {/* PDC Stats Cards - Matching OverviewDashboard Design */}
      {pdcStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total PDCs Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Total PDCs
                  </CardTitle>
                  <div className="text-2xl font-bold text-foreground mt-2">
                    {pdcStats.total}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All PDC records
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending PDCs Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Pending
                  </CardTitle>
                  <div className="text-2xl font-bold text-foreground mt-2">
                    {pdcStats.pending}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      12%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      from last month
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issued PDCs Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Issued
                  </CardTitle>
                  <div className="text-2xl font-bold text-foreground mt-2">
                    {pdcStats.issued}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      24%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      completion rate
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50">
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Card */}
          <Card className="border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground">
                    Total Amount
                  </CardTitle>
                  <div className="text-2xl font-bold text-emerald-700 mt-2">
                    ₱{pdcStats.totalAmount?.toLocaleString() || "0"}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      18%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      from last period
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDC Table Section */}
      <div className="space-y-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">PDC List</h2>
            <p className="text-sm text-muted-foreground">
              View and manage post dated checks
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search PDCs..."
                value={pdcSearchTerm}
                onChange={(e) => setPdcSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-background border-border"
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu
                open={isPDCFilterOpen}
                onOpenChange={setIsPDCFilterOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-border bg-background hover:bg-accent"
                  >
                    <Filter className="h-4 w-4" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => setPdcStatusFilter("all")}
                      className={pdcStatusFilter === "all" ? "bg-accent" : ""}
                    >
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPdcStatusFilter("pending")}
                      className={
                        pdcStatusFilter === "pending" ? "bg-accent" : ""
                      }
                    >
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPdcStatusFilter("issued")}
                      className={
                        pdcStatusFilter === "issued" ? "bg-accent" : ""
                      }
                    >
                      Issued
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPdcStatusFilter("cancelled")}
                      className={
                        pdcStatusFilter === "cancelled" ? "bg-accent" : ""
                      }
                    >
                      Cancelled
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {hasPDCActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearPDCFilters}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div>
          <div className="p-6">
            {pdcsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
                <p className="text-muted-foreground mt-3">Loading PDCs...</p>
              </div>
            ) : filteredPDCs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Banknote className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No PDCs Found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {hasPDCActiveFilters
                    ? "No PDCs match your current filters. Try adjusting your search criteria."
                    : "No post dated checks have been recorded yet."}
                </p>
                {hasPDCActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={onClearPDCFilters}
                    className="border-border hover:bg-accent"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Data Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-background">
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="w-16 font-semibold text-foreground">
                          #
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Check Details
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Supplier
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Items
                        </TableHead>
                        <TableHead className="font-semibold text-foreground text-right">
                          Amount
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPDCs.map((pdc, index) => {
                        const statusInfo = getPDCStatusInfo(pdc);
                        const StatusIcon = statusInfo.icon;
                        const itemCount = pdc.itemDetails?.length || 0;

                        return (
                          <TableRow
                            key={pdc.pdc_id}
                            className="hover:bg-accent/50 border-border"
                          >
                            <TableCell className="font-medium text-foreground">
                              {startIndex + index + 1}
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded bg-muted">
                                    <Banknote className="h-3.5 w-3.5 text-foreground" />
                                  </div>
                                  <span className="font-semibold text-sm text-foreground">
                                    {pdc.checkNumber || "—"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(pdc.checkDate),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-foreground truncate max-w-[150px]">
                                  {pdc.supplier}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-blue-50">
                                  <Package className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-foreground">
                                    {itemCount} items
                                  </span>
                                  {pdc.itemDetails &&
                                    pdc.itemDetails.length > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px] cursor-help">
                                              {pdc.itemDetails[0].name}
                                              {itemCount > 1 &&
                                                ` + ${itemCount - 1} more`}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-sm">
                                              {pdc.itemDetails
                                                .map((item) => item.name)
                                                .join(", ")}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="space-y-0.5">
                                <div className="text-base font-semibold text-emerald-700">
                                  ₱{pdc.totalAmount.toLocaleString()}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={statusInfo.variant}
                                className={`${statusInfo.bgColor} ${statusInfo.color} border-0 flex items-center gap-1.5`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusInfo.text}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onViewPDCDetails(pdc)}
                                        className="h-8 w-8 hover:bg-accent text-foreground"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {pdc.status === "pending" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            onMarkAsIssued(pdc.pdc_id)
                                          }
                                          className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                          <CheckSquare className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Mark as Issued</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-accent text-foreground"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => onViewPDCDetails(pdc)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {pdc.status === "pending" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onMarkAsIssued(pdc.pdc_id)
                                        }
                                      >
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        Mark as Issued
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => onPDCDeleteClick(pdc)}
                                      className="text-rose-600 focus:text-rose-600"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredPDCs.length > pdcItemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {endIndex} of{" "}
                      {filteredPDCs.length} PDCs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={pdcCurrentPage === 1}
                        className="flex items-center gap-1 h-9 border-border hover:bg-accent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pdcCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (pdcCurrentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = pdcCurrentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  pdcCurrentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setPdcCurrentPage(pageNum)}
                                className="h-9 w-9 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={pdcCurrentPage >= totalPages}
                        className="flex items-center gap-1 h-9 border-border hover:bg-accent"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
