"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react";

export function PaymentSummary() {
  // Mock data - replace with actual data from your API
  const summaryData = {
    totalRevenue: 1250000,
    todayPayments: 45000,
    pendingPayments: 180000,
    activeClients: 24,
  };

  const recentTransactions = [
    {
      id: 1,
      client: "John Doe",
      amount: 25000,
      type: "downpayment",
      date: "2024-01-15",
    },
    {
      id: 2,
      client: "Jane Smith",
      amount: 15000,
      type: "monthly",
      date: "2024-01-14",
    },
    {
      id: 3,
      client: "Mike Johnson",
      amount: 180000,
      type: "cash",
      date: "2024-01-14",
    },
    {
      id: 4,
      client: "Sarah Wilson",
      amount: 12000,
      type: "monthly",
      date: "2024-01-13",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold">
              ₱{summaryData.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <p className="text-2xl font-bold">
              ₱{summaryData.todayPayments.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">
              ₱{summaryData.pendingPayments.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Active Clients</span>
            </div>
            <p className="text-2xl font-bold">{summaryData.activeClients}</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="font-semibold mb-3">Recent Transactions</h4>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{transaction.client}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    ₱{transaction.amount.toLocaleString()}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      transaction.type === "downpayment"
                        ? "bg-blue-100 text-blue-800"
                        : transaction.type === "monthly"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                    }
                  >
                    {transaction.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
