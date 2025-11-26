"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Ruler,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Specification {
  id: string;
  name: string;
  category: string;
  version: string;
  status: "approved" | "pending" | "draft" | "revision";
  lastUpdated: string;
  updatedBy: string;
  fileSize: string;
  sections: number;
}

interface DesignSpecificationsProps {
  projectId: string;
}

export default function DesignSpecifications({
  projectId,
}: DesignSpecificationsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Mock data for specifications
  const specifications: Specification[] = [
    {
      id: "1",
      name: "Architectural Specifications",
      category: "architectural",
      version: "2.1",
      status: "approved",
      lastUpdated: "2024-01-15",
      updatedBy: "John Architect",
      fileSize: "1.8 MB",
      sections: 24,
    },
    {
      id: "2",
      name: "Structural Specifications",
      category: "structural",
      version: "1.5",
      status: "approved",
      lastUpdated: "2024-01-14",
      updatedBy: "Sarah Engineer",
      fileSize: "2.3 MB",
      sections: 18,
    },
    {
      id: "3",
      name: "MEP Specifications",
      category: "mep",
      version: "0.9",
      status: "draft",
      lastUpdated: "2024-01-12",
      updatedBy: "Mike Engineer",
      fileSize: "3.1 MB",
      sections: 32,
    },
    {
      id: "4",
      name: "Finishes Schedule",
      category: "interior",
      version: "1.2",
      status: "pending",
      lastUpdated: "2024-01-10",
      updatedBy: "Sarah Designer",
      fileSize: "0.9 MB",
      sections: 12,
    },
  ];

  const categories = Array.from(
    new Set(specifications.map((spec) => spec.category))
  );
  const statuses = Array.from(
    new Set(specifications.map((spec) => spec.status))
  );

  const filteredSpecs = specifications.filter(
    (spec) =>
      spec.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "all" || spec.category === selectedCategory) &&
      (selectedStatus === "all" || spec.status === selectedStatus)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "draft":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "revision":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "draft":
        return "text-blue-600 bg-blue-100";
      case "revision":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      architectural: "bg-purple-100 text-purple-800",
      structural: "bg-blue-100 text-blue-800",
      mep: "bg-green-100 text-green-800",
      interior: "bg-pink-100 text-pink-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-border"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background"
          >
            <option value="all">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
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

      {/* Specifications List */}
      <div className="space-y-3">
        {filteredSpecs.map((spec) => (
          <Card
            key={spec.id}
            className="border-border shadow-none hover:shadow-sm transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg mt-1">
                    <Ruler className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                        {spec.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryColor(spec.category)}`}
                      >
                        {spec.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>v{spec.version}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{spec.sections} sections</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {spec.lastUpdated}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{spec.updatedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {getStatusIcon(spec.status)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(spec.status)}`}
                      >
                        {spec.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {spec.fileSize}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSpecs.length === 0 && (
        <div className="text-center py-8">
          <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No specifications found</p>
        </div>
      )}
    </div>
  );
}
