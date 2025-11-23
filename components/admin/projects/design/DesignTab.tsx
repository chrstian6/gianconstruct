"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FloorPlans from "@/components/admin/projects/design/FloorPlans";
import DesignSpecifications from "@/components/admin/projects/design/DesignSpecifications";
import { Project } from "@/types/project";

interface DesignTabProps {
  project: Project;
  onNavigateToTab?: (tabId: string) => void;
}

export default function DesignTab({
  project,
  onNavigateToTab,
}: DesignTabProps) {
  const [activeDesignTab, setActiveDesignTab] = useState("floorplans");

  // Mock data for design stats
  const designStats = {
    totalDocuments: 12,
    totalImages: 24,
    floorPlans: 5,
    specifications: 8,
  };

  const designTabs = [
    { id: "floorplans", label: "Floor Plans" },
    { id: "specifications", label: "Specifications" },
  ];

  return (
    <div className="space-y-6">
      {/* Design Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Documents Card - Links to Documents Tab */}
        <Card
          className="border-border shadow-none cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20 group"
          onClick={() => onNavigateToTab?.("documents")}
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Design Documents
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {designStats.totalDocuments}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-primary font-medium">
                  View in Documents Tab →
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Card - Links to Gallery Tab */}
        <Card
          className="border-border shadow-none cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20 group"
          onClick={() => onNavigateToTab?.("gallery")}
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Gallery Images
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {designStats.totalImages}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-primary font-medium">
                  View in Gallery Tab →
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floor Plans Card */}
        <Card className="border-border shadow-none hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Floor Plans
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {designStats.floorPlans}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200 font-medium"
                >
                  Architectural
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specifications Card */}
        <Card className="border-border shadow-none hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Specifications
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {designStats.specifications}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200 font-medium"
                >
                  Technical
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Content Tabs */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-foreground font-geist">
                Design Resources
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage and organize all design-related documents and
                specifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground h-9"
              >
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground h-9"
              >
                Export All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={activeDesignTab}
            onValueChange={setActiveDesignTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
              {designTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent px-6 py-4 text-sm font-semibold cursor-pointer font-geist hover:text-foreground/80 transition-all duration-200"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="floorplans" className="p-6">
              <FloorPlans projectId={project.project_id} />
            </TabsContent>

            <TabsContent value="specifications" className="p-6">
              <DesignSpecifications projectId={project.project_id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
