// components/admin/projects/details/inventorytabs/TransactionTab.tsx
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  User,
  Filter,
  Search,
  Clock,
  Eye,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Hammer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
} from "lucide-react";
import { IInventory } from "@/types/Inventory";
import { ProjectInventoryRecord } from "@/types/project-inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface TransactionsTabProps {
  records: ProjectInventoryRecord[];
  inventoryItems: Map<string, IInventory>;
  recentActions: ProjectInventoryRecord[];
  setViewDetails: (record: ProjectInventoryRecord) => void;
  getActionConfig: (action: string) => any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}

export default function TransactionsTab({
  records,
  inventoryItems,
  recentActions,
  setViewDetails,
  getActionConfig,
  formatCurrency,
  formatDate,
  formatTime,
}: TransactionsTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter records based on search, action, and time filters
  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        const matchesSearch =
          searchQuery === "" ||
          (record.projectInventory_id &&
            record.projectInventory_id
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (record.product_id &&
            record.product_id
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (record.notes &&
            record.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (record.action_by.name &&
            record.action_by.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (record.project_id &&
            record.project_id
              .toLowerCase()
              .includes(searchQuery.toLowerCase()));

        const matchesAction =
          actionFilter === "all" || record.action === actionFilter;

        const matchesTime =
          timeFilter === "all" ||
          (() => {
            const recordDate = new Date(record.createdAt);
            const now = new Date();
            const diffHours =
              Math.abs(now.getTime() - recordDate.getTime()) / (1000 * 60 * 60);

            switch (timeFilter) {
              case "today":
                return recordDate.toDateString() === now.toDateString();
              case "week":
                return diffHours <= 168;
              case "month":
                return diffHours <= 720;
              default:
                return true;
            }
          })();

        return matchesSearch && matchesAction && matchesTime;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [records, searchQuery, actionFilter, timeFilter]);

  // Pagination calculations
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, timeFilter]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get action icon based on action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case "checked_out":
        return <ArrowDownToLine className="h-4 w-4" />;
      case "returned":
        return <ArrowUpFromLine className="h-4 w-4" />;
      case "adjusted":
        return <Hammer className="h-4 w-4" />;
      default:
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };

  // Get action badge styling
  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case "checked_out":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50";
      case "returned":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
      case "adjusted":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-50";
    }
  };

  // Get action label
  const getActionLabel = (action: string) => {
    switch (action) {
      case "checked_out":
        return "Transferred In";
      case "returned":
        return "Returned";
      case "adjusted":
        return "Used";
      default:
        return action;
    }
  };

  // Handle project click - navigate to project details
  const handleProjectClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click if needed
    if (projectId) {
      router.push(`/admin/admin-project/${projectId}`);
    }
  };

  // Calculate totals for stats
  const calculateStats = () => {
    const transferredIn = filteredRecords.filter(
      (r) => r.action === "checked_out"
    ).length;
    const returned = filteredRecords.filter(
      (r) => r.action === "returned"
    ).length;
    const used = filteredRecords.filter((r) => r.action === "adjusted").length;

    return { transferredIn, returned, used };
  };

  const stats = calculateStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-zinc-700" />
            <CardTitle className="text-lg font-semibold text-zinc-900">
              Transaction History
            </CardTitle>
            <Badge variant="outline" className="ml-2">
              {filteredRecords.length} records
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="checked_out">Transferred In</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="adjusted">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              No transactions found
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {searchQuery || actionFilter !== "all" || timeFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No inventory transfer transactions have been recorded yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-zinc-50">
                    <TableRow>
                      <TableHead className="w-[140px]">
                        Project Item ID
                      </TableHead>
                      <TableHead>Project ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                      <TableHead className="text-right w-[100px]">
                        Quantity
                      </TableHead>
                      <TableHead className="text-right w-[120px]">
                        Amount
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="w-[160px]">Date & Time</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => {
                      const item = inventoryItems.get(record.product_id);
                      const salePrice = record.salePrice || 0;
                      const totalCost = salePrice * record.quantity;

                      return (
                        <TableRow
                          key={record._id || record.projectInventory_id}
                          className="hover:bg-zinc-50"
                        >
                          <TableCell>
                            <div className="font-mono text-xs text-zinc-700">
                              {record.projectInventory_id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {record.project_id ? (
                                <button
                                  onClick={(e) =>
                                    handleProjectClick(record.project_id, e)
                                  }
                                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                  title={`Go to project ${record.project_id}`}
                                >
                                  <span className="font-mono">
                                    {record.project_id.substring(0, 8)}...
                                  </span>
                                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <span className="text-sm text-zinc-500 italic">
                                  No project
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm text-zinc-900">
                                {item?.name || record.product_id}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                {item?.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                )}
                                <span>•</span>
                                <span>{record.unit}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs flex items-center gap-1.5 w-fit ${getActionBadgeStyle(record.action)}`}
                            >
                              {getActionIcon(record.action)}
                              {getActionLabel(record.action)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{record.quantity}</div>
                            <div className="text-xs text-zinc-500">
                              {record.unit}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium text-zinc-900">
                              {formatCurrency(totalCost)}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {record.quantity} × {formatCurrency(salePrice)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-zinc-400" />
                              <div>
                                <div className="text-sm font-medium text-zinc-900">
                                  {record.action_by.name}
                                </div>
                                <div className="text-xs text-zinc-500 capitalize">
                                  {record.action_by.role}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                              <div>
                                <div className="text-sm font-medium text-zinc-900">
                                  {formatDate(record.createdAt)}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {formatTime(record.createdAt)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewDetails(record)}
                              className="h-8 w-8"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredRecords.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-zinc-200">
                {/* Items per page selector and info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600">Show:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue placeholder="10 per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 per page</SelectItem>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="20">20 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-zinc-600">
                    Showing{" "}
                    <span className="font-medium">
                      {startIndex + 1}-{endIndex}
                    </span>{" "}
                    of <span className="font-medium">{totalItems}</span>{" "}
                    transactions
                  </div>
                </div>

                {/* Pagination buttons */}
                <div className="flex items-center gap-2">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pageButtons = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(
                        1,
                        currentPage - Math.floor(maxVisiblePages / 2)
                      );
                      let endPage = Math.min(
                        totalPages,
                        startPage + maxVisiblePages - 1
                      );

                      // Adjust start page if we're near the end
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      // Add first page button if needed
                      if (startPage > 1) {
                        pageButtons.push(
                          <Button
                            key={1}
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(1)}
                            className="h-8 w-8"
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pageButtons.push(
                            <span key="dots1" className="px-2 text-zinc-400">
                              ...
                            </span>
                          );
                        }
                      }

                      // Add page number buttons
                      for (let i = startPage; i <= endPage; i++) {
                        pageButtons.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(i)}
                            className={`h-8 w-8 ${
                              currentPage === i
                                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                : ""
                            }`}
                          >
                            {i}
                          </Button>
                        );
                      }

                      // Add last page button if needed
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pageButtons.push(
                            <span key="dots2" className="px-2 text-zinc-400">
                              ...
                            </span>
                          );
                        }
                        pageButtons.push(
                          <Button
                            key={totalPages}
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            className="h-8 w-8"
                          >
                            {totalPages}
                          </Button>
                        );
                      }

                      return pageButtons;
                    })()}
                  </div>

                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>

                  {/* Go to page */}
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-zinc-600">Go to:</span>
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (!isNaN(page) && page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      onBlur={(e) => {
                        if (
                          e.target.value === "" ||
                          parseInt(e.target.value) < 1
                        ) {
                          handlePageChange(1);
                        } else if (parseInt(e.target.value) > totalPages) {
                          handlePageChange(totalPages);
                        }
                      }}
                      className="w-16 h-8 text-center"
                    />
                    <span className="text-sm text-zinc-600">
                      of {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Footer */}
            {filteredRecords.length > 0 && (
              <div className="mt-6 pt-4 border-t border-zinc-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-zinc-600">Transferred In</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.transferredIn}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-zinc-600">Returned</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.returned}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-zinc-600">Used</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.used}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-zinc-500">
                    Showing {filteredRecords.length} transactions total
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
