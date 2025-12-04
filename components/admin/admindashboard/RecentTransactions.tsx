"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getRecentTransactions,
  type RecentTransactionsRequest,
} from "@/action/reports";
import { ShoppingCart, Building2 } from "lucide-react";

interface RecentTransactionsProps {
  type: "inventory" | "project";
  title: string;
  description: string;
}

export function RecentTransactions({
  type,
  title,
  description,
}: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const fetchTransactions = async (pageNum: number) => {
    setLoading(true);
    try {
      const request: RecentTransactionsRequest = {
        page: pageNum,
        limit,
        type,
      };
      const response = await getRecentTransactions(request);
      setTransactions(response.transactions);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error(`Failed to fetch ${type} transactions:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page, type]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return "default";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">{title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">Total: {total}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <>
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {type === "inventory" ? (
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium text-foreground">
                            {transaction.transaction_id}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.items.length} items •{" "}
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          {formatCurrency(transaction.totalAmount)}
                        </div>
                        <Badge
                          variant={getStatusVariant(transaction.status)}
                          className={`mt-1 ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium text-foreground">
                            {transaction.transaction_id}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Project: {transaction.project_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.type.replace("_", " ")} • Due:{" "}
                          {new Date(transaction.due_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            variant={getStatusVariant(transaction.status)}
                            className={getStatusColor(transaction.status)}
                          >
                            {transaction.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-xs"
                          >
                            {transaction.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-border">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={
                            page === 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={page === pageNum}
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage(Math.min(totalPages, page + 1))
                          }
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
