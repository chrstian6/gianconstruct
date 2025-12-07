// components/admin/admindashboard/components/RecentTransactions.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface RecentTransactionsProps {
  overviewData: any;
}

interface TransactionItem {
  id: number;
  type: string;
  amount: string;
  description: string;
  date: string;
  status: string;
}

export function RecentTransactions({ overviewData }: RecentTransactionsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare recent transactions
  const getRecentTransactions = (): TransactionItem[] => {
    if (
      !overviewData?.recentTransactions ||
      !Array.isArray(overviewData.recentTransactions) ||
      overviewData.recentTransactions.length === 0
    ) {
      return [];
    }
    return overviewData.recentTransactions.slice(0, 5).map((tx: any) => ({
      id: tx.id || 0,
      type: tx.type || "Unknown",
      amount: formatCurrency(tx.amount || 0),
      description: tx.description || "No description",
      date: tx.date
        ? format(new Date(tx.date), "MMM dd, yyyy")
        : "Unknown date",
      status: tx.status || "pending",
    }));
  };

  const recentTransactions = getRecentTransactions();

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Transactions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest financial activities
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground">Description</TableHead>
              <TableHead className="text-foreground">Type</TableHead>
              <TableHead className="text-foreground">Amount</TableHead>
              <TableHead className="text-foreground">Date</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx: TransactionItem) => (
                <TableRow key={tx.id} className="hover:bg-accent/50">
                  <TableCell className="font-medium text-foreground">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${tx.type === "sale" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {tx.amount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === "completed" ? "default" : "secondary"
                      }
                      className={
                        tx.status === "completed"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No recent transactions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
