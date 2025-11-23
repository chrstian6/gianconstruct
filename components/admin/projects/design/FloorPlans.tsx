"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Layout,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  ZoomIn,
} from "lucide-react";

interface FloorPlan {
  id: string;
  name: string;
  level: string;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  dimensions: string;
  scale: string;
  imageUrl: string;
}

interface FloorPlansProps {
  projectId: string;
}

export default function FloorPlans({ projectId }: FloorPlansProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);

  // Mock data for floor plans
  const floorPlans: FloorPlan[] = [
    {
      id: "1",
      name: "Ground Floor Plan",
      level: "ground",
      size: "3.8 MB",
      uploadedBy: "John Architect",
      uploadDate: "2024-01-15",
      dimensions: "2480x3508",
      scale: "1:100",
      imageUrl: "/api/placeholder/300/200",
    },
    {
      id: "2",
      name: "First Floor Plan",
      level: "first",
      size: "3.5 MB",
      uploadedBy: "John Architect",
      uploadDate: "2024-01-15",
      dimensions: "2480x3508",
      scale: "1:100",
      imageUrl: "/api/placeholder/300/200",
    },
    {
      id: "3",
      name: "Second Floor Plan",
      level: "second",
      size: "3.2 MB",
      uploadedBy: "John Architect",
      uploadDate: "2024-01-14",
      dimensions: "2480x3508",
      scale: "1:100",
      imageUrl: "/api/placeholder/300/200",
    },
    {
      id: "4",
      name: "Roof Plan",
      level: "roof",
      size: "2.9 MB",
      uploadedBy: "John Architect",
      uploadDate: "2024-01-13",
      dimensions: "2480x3508",
      scale: "1:100",
      imageUrl: "/api/placeholder/300/200",
    },
  ];

  const levels = Array.from(new Set(floorPlans.map((plan) => plan.level)));

  const filteredPlans = floorPlans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedLevel === "all" || plan.level === selectedLevel)
  );

  const getLevelColor = (level: string) => {
    const colors = {
      ground: "bg-green-100 text-green-800",
      first: "bg-blue-100 text-blue-800",
      second: "bg-purple-100 text-purple-800",
      roof: "bg-orange-100 text-orange-800",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search floor plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background"
          >
            <option value="all">All Levels</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)} Floor
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Floor Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className="border-border shadow-none hover:shadow-sm transition-shadow group"
          >
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={plan.imageUrl}
                  alt={plan.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Badge variant="secondary" className="text-xs">
                    {plan.scale}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 bg-white/90 hover:bg-white"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 bg-white/90 hover:bg-white"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 bg-white/90 hover:bg-white ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                    {plan.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getLevelColor(plan.level)}`}
                  >
                    {plan.level}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Dimensions</span>
                    <span>{plan.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span>{plan.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scale</span>
                    <span>{plan.scale}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-8">
          <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No floor plans found</p>
        </div>
      )}

      {/* Floor Plan Preview Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-6xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedPlan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Scale: {selectedPlan.scale} | Dimensions:{" "}
                  {selectedPlan.dimensions}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlan(null)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={selectedPlan.imageUrl}
                alt={selectedPlan.name}
                className="w-full h-auto rounded-lg border border-border"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <p className="font-medium capitalize">{selectedPlan.level}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scale</p>
                  <p className="font-medium">{selectedPlan.scale}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">File Size</p>
                  <p className="font-medium">{selectedPlan.size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded By</p>
                  <p className="font-medium">{selectedPlan.uploadedBy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
