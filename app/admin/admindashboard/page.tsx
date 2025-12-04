"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportGenerator from "@/components/admin/admindashboard/ReportGenerator";
import { OverviewDashboard } from "@/components/admin/admindashboard/OverviewDashboard";

export default function AdminDashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6 font-inter">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Reports
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-0">
          <OverviewDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="activity">
          <div className="border-border bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Recent Activity
            </h2>
            <p className="text-muted-foreground mb-4">
              User actions, system events, and project updates
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    Project "Residential Villa" Updated
                  </span>
                  <span className="text-xs text-muted-foreground">
                    2 hours ago
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Status changed from "Planning" to "In Progress"
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    New Inventory Sale
                  </span>
                  <span className="text-xs text-muted-foreground">
                    5 hours ago
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sold 15 units of "Concrete Blocks" for ₱45,000
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    User Login
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Yesterday
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Admin user logged in from IP 192.168.1.100
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    Report Generated
                  </span>
                  <span className="text-xs text-muted-foreground">
                    2 days ago
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Monthly revenue report generated for Q2 2025
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    Inventory Restocked
                  </span>
                  <span className="text-xs text-muted-foreground">
                    3 days ago
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  50 units of "Steel Beams" added to inventory
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
