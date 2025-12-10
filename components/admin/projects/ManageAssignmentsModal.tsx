// components/admin/projects/ManageAssignmentsModal.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  UserPlus,
  Filter,
  Loader2,
  ArrowRight,
  AlertCircle,
  Mail,
  Phone,
  Building,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchProjectsForAssignment,
  searchProjectManagers,
  assignProjectsToManager,
  unassignProject,
  getAllAssignments,
} from "@/action/project-assignment";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Simplified interfaces to avoid Mongoose objects
interface ProjectForAssignment {
  project_id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  location?: {
    fullAddress?: string;
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
  };
  userId: string;
  totalCost: number;
  isAssigned: boolean;
  currentAssignment?: {
    assignment_id: string;
    project_manager_id: string;
    project_manager_name: string;
    assigned_by_name: string;
    assigned_by: string;
    assignment_date: string;
  };
}

interface ProjectManager {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
  avatar?: string;
  fullName: string;
}

interface Assignment {
  assignment_id: string;
  project_id: string;
  project_manager_id: string;
  project_manager_name: string;
  assigned_by_name: string;
  assigned_by: string;
  assignment_date: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  project?: {
    project_id: string;
    name: string;
    status: string;
  };
  project_manager?: {
    user_id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  };
}

type TabType = "all" | "unassigned" | "assigned";

interface ManageAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentsManaged: () => void;
}

// Helper function to safely parse dates
const safeDateToISO = (date: any): string | undefined => {
  if (!date) return undefined;

  try {
    if (typeof date === "string") {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
    }

    if (date instanceof Date) {
      return date.toISOString();
    }

    if (date && typeof date.toJSON === "function") {
      return date.toJSON();
    }

    if (date && typeof date.toISOString === "function") {
      return date.toISOString();
    }

    return undefined;
  } catch (error) {
    console.error("Error converting date to ISO string:", error);
    return undefined;
  }
};

// Helper function to clean Mongoose objects for client components
const cleanObjectForClient = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;

  // Handle Mongoose documents
  if (obj.toJSON) {
    return cleanObjectForClient(obj.toJSON());
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForClient);
  }

  // Handle plain objects
  const cleanObj: any = {};
  for (const key in obj) {
    if (key.startsWith("_")) continue; // Skip private fields

    const value = obj[key];

    // Skip functions and undefined
    if (typeof value === "function" || value === undefined) continue;

    // Handle special cases
    if (key === "location") {
      // Clean location object
      const locationData = value || {};
      cleanObj[key] = {
        region: locationData.region,
        province: locationData.province,
        municipality: locationData.municipality,
        barangay: locationData.barangay,
        fullAddress: locationData.fullAddress,
      };
    } else if (
      key === "assignment_date" ||
      key === "createdAt" ||
      key === "updatedAt" ||
      key === "startDate" ||
      key === "endDate" ||
      key === "transferred_date" ||
      key === "completed_at"
    ) {
      // Convert dates to ISO strings
      cleanObj[key] = safeDateToISO(value);
    } else if (key === "_id" && value && value.buffer) {
      // Handle ObjectId
      cleanObj[key] = value.toString();
    } else if (typeof value === "object" && value !== null) {
      // Recursively clean nested objects
      cleanObj[key] = cleanObjectForClient(value);
    } else {
      // Copy primitive values
      cleanObj[key] = value;
    }
  }

  return cleanObj;
};

export default function ManageAssignmentsModal({
  isOpen,
  onClose,
  onAssignmentsManaged,
}: ManageAssignmentsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ProjectForAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [transferTo, setTransferTo] = useState<string>("");

  // Filter projects based on active tab
  const filteredProjects = useMemo(() => {
    if (activeTab === "unassigned") {
      return projects.filter((p) => !p.isAssigned);
    }
    if (activeTab === "assigned") {
      return projects.filter((p) => p.isAssigned);
    }
    return projects;
  }, [projects, activeTab]);

  // Filter assignments based on active tab
  const filteredAssignments = useMemo(() => {
    if (activeTab === "assigned") {
      return allAssignments.filter((a) => a.status === "active");
    }
    return allAssignments;
  }, [allAssignments, activeTab]);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clear previous data
      setProjects([]);
      setAllAssignments([]);

      if (activeTab === "all" || activeTab === "unassigned") {
        const projectsResponse = await searchProjectsForAssignment(searchQuery);
        if (projectsResponse.success) {
          const projectsData = cleanObjectForClient(
            projectsResponse.data || []
          );
          setProjects(projectsData);
        } else {
          toast.error(projectsResponse.error || "Failed to fetch projects");
        }
      }

      if (activeTab === "all" || activeTab === "assigned") {
        const assignmentsResponse = await getAllAssignments();
        if (assignmentsResponse.success) {
          const assignmentsData = cleanObjectForClient(
            assignmentsResponse.data || []
          );
          setAllAssignments(assignmentsData);
        } else {
          toast.error(
            assignmentsResponse.error || "Failed to fetch assignments"
          );
        }
      }

      // Fetch project managers
      const managersResponse = await searchProjectManagers("");
      if (managersResponse.success) {
        setProjectManagers(cleanObjectForClient(managersResponse.data || []));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Handle project selection
  const handleProjectSelect = useCallback(
    (projectId: string) => {
      const newSelected = new Set(selectedProjects);
      if (newSelected.has(projectId)) {
        newSelected.delete(projectId);
      } else {
        newSelected.add(projectId);
      }
      setSelectedProjects(newSelected);
    },
    [selectedProjects]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      const allProjectIds = filteredProjects.map((p) => p.project_id);
      setSelectedProjects(new Set(allProjectIds));
    }
  }, [filteredProjects, selectedProjects.size]);

  // Handle assign projects
  const handleAssignProjects = useCallback(async () => {
    if (selectedProjects.size === 0) {
      toast.error("Please select at least one project");
      return;
    }

    if (!selectedManager) {
      toast.error("Please select a project manager");
      return;
    }

    try {
      setIsAssigning(true);
      const projectIds = Array.from(selectedProjects);
      const response = await assignProjectsToManager(
        projectIds,
        selectedManager
      );

      if (response.success) {
        toast.success(
          `Successfully assigned ${projectIds.length} project${projectIds.length > 1 ? "s" : ""}`
        );
        setSelectedProjects(new Set());
        setSelectedManager("");
        await fetchData();
        onAssignmentsManaged();
      } else {
        toast.error(response.error || "Failed to assign projects");
      }
    } catch (error) {
      console.error("Error assigning projects:", error);
      toast.error("Failed to assign projects");
    } finally {
      setIsAssigning(false);
    }
  }, [selectedProjects, selectedManager, fetchData, onAssignmentsManaged]);

  // Handle unassign project
  const handleUnassignClick = useCallback((assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setTransferTo("");
    setIsUnassignModalOpen(true);
  }, []);

  const handleUnassignConfirm = useCallback(async () => {
    if (!selectedAssignment) return;

    try {
      setIsAssigning(true);
      const response = await unassignProject(
        selectedAssignment.assignment_id,
        transferTo || undefined
      );

      if (response.success) {
        toast.success(
          transferTo
            ? `Project transferred successfully`
            : "Project unassigned successfully"
        );
        await fetchData();
        onAssignmentsManaged();
        setIsUnassignModalOpen(false);
        setSelectedAssignment(null);
        setTransferTo("");
      } else {
        toast.error(response.error || "Failed to unassign project");
      }
    } catch (error) {
      console.error("Error unassigning project:", error);
      toast.error("Failed to unassign project");
    } finally {
      setIsAssigning(false);
    }
  }, [selectedAssignment, transferTo, fetchData, onAssignmentsManaged]);

  // Format date
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            Completed
          </Badge>
        );
      case "transferred":
        return (
          <Badge className="bg-violet-500/10 text-violet-700 border-violet-200 hover:bg-violet-500/20">
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Transferred
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            {status}
          </Badge>
        );
    }
  }, []);

  // Get assignment status badge
  const getAssignmentStatusBadge = useCallback((isAssigned: boolean) => {
    if (isAssigned) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20">
          <CheckCircle className="h-3 w-3 mr-1.5" />
          Assigned
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20">
        <Clock className="h-3 w-3 mr-1.5" />
        Unassigned
      </Badge>
    );
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Get initials for avatar
  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Handle modal close
  const handleClose = () => {
    setSelectedProjects(new Set());
    setSelectedManager("");
    setSelectedAssignment(null);
    onClose();
  };

  return (
    <>
      {/* Main Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <div className="flex flex-col">
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Project Assignments
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-1">
                    Manage project assignments to project managers
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            {/* Main Content */}
            <div className="flex flex-col px-6 pb-6">
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabType)}
                className="w-full"
              >
                <div className="border-b">
                  <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      All Projects
                    </TabsTrigger>
                    <TabsTrigger
                      value="unassigned"
                      className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Unassigned
                    </TabsTrigger>
                    <TabsTrigger
                      value="assigned"
                      className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none"
                    >
                      Assigned
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Search and Actions Bar */}
                <div className="py-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="relative w-full sm:flex-1 sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search projects..."
                      className="pl-10 bg-gray-50 border-gray-200 focus:bg-white w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    )}
                  </div>

                  {activeTab === "unassigned" && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                      <Select
                        value={selectedManager}
                        onValueChange={setSelectedManager}
                      >
                        <SelectTrigger className="w-full sm:w-[300px] bg-gray-50 border-gray-200">
                          <SelectValue placeholder="Select project manager" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {projectManagers.map((manager) => (
                            <SelectItem
                              key={manager.user_id}
                              value={manager.user_id}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarImage src={manager.avatar} />
                                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                    {getInitials(manager.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {manager.fullName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {manager.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleAssignProjects}
                        disabled={
                          selectedProjects.size === 0 ||
                          !selectedManager ||
                          isAssigning
                        }
                        className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm w-full sm:w-auto sm:min-w-[160px] shrink-0"
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign{" "}
                            {selectedProjects.size > 0 &&
                              `(${selectedProjects.size})`}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="py-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin"></div>
                      </div>
                      <p className="text-gray-500 mt-4">
                        Loading assignments...
                      </p>
                    </div>
                  ) : activeTab === "assigned" ? (
                    // Assignments Table
                    <div className="space-y-4">
                      {filteredAssignments.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 mx-auto">
                            <User className="h-6 w-6 text-gray-300" />
                          </div>
                          <p className="font-medium text-gray-500">
                            No assignments found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            No projects have been assigned yet
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px] rounded-lg border border-gray-200">
                          <div className="min-w-full">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-b bg-gray-50/50">
                                  <TableHead className="font-semibold text-gray-700">
                                    Project
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Project Manager
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Assigned By
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Assignment Date
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Status
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700 text-right">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredAssignments.map((assignment) => (
                                  <TableRow
                                    key={assignment.assignment_id}
                                    className="border-b hover:bg-gray-50/50"
                                  >
                                    <TableCell className="py-3">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {assignment.project?.name ||
                                            "Unnamed Project"}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                          {assignment.project_id}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="min-w-0">
                                          <div className="font-medium text-gray-900 truncate">
                                            {assignment.project_manager
                                              ?.fullName ||
                                              assignment.project_manager_id}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {assignment.project_manager?.email}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {assignment.assigned_by_name ||
                                            assignment.assigned_by}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatDate(
                                            assignment.assignment_date
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-700">
                                      {formatDate(assignment.assignment_date)}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {getStatusBadge(assignment.status)}
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleUnassignClick(assignment)
                                              }
                                              className="h-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                            >
                                              <XCircle className="h-4 w-4 mr-1.5" />
                                              <span className="sr-only sm:not-sr-only sm:inline">
                                                Unassign
                                              </span>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Unassign or transfer project</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  ) : (
                    // Projects Table (for All and Unassigned tabs)
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-3">
                            <span>
                              Found {filteredProjects.length} project
                              {filteredProjects.length !== 1 ? "s" : ""}
                            </span>
                            {activeTab === "all" && (
                              <>
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {
                                    filteredProjects.filter((p) => p.isAssigned)
                                      .length
                                  }{" "}
                                  assigned
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {
                                    filteredProjects.filter(
                                      (p) => !p.isAssigned
                                    ).length
                                  }{" "}
                                  unassigned
                                </Badge>
                              </>
                            )}
                            {activeTab === "unassigned" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {filteredProjects.length} available
                              </Badge>
                            )}
                          </div>
                        </div>
                        {activeTab === "unassigned" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="text-xs"
                            disabled={filteredProjects.length === 0}
                          >
                            {selectedProjects.size === filteredProjects.length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        )}
                      </div>

                      {filteredProjects.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 mx-auto">
                            <Filter className="h-6 w-6 text-gray-300" />
                          </div>
                          <p className="font-medium text-gray-500">
                            No projects found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {searchQuery
                              ? "Try a different search term"
                              : "No projects match the current filter"}
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[500px] rounded-lg border border-gray-200">
                          <div className="min-w-full">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-b bg-gray-50/50">
                                  {activeTab === "unassigned" && (
                                    <TableHead className="w-12">
                                      <Checkbox
                                        checked={
                                          selectedProjects.size ===
                                            filteredProjects.length &&
                                          filteredProjects.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                        className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                                      />
                                    </TableHead>
                                  )}
                                  <TableHead className="font-semibold text-gray-700">
                                    Project
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Status
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Timeline
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Location
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Cost
                                  </TableHead>
                                  <TableHead className="font-semibold text-gray-700">
                                    Assignment
                                  </TableHead>
                                  {activeTab === "all" && (
                                    <TableHead className="font-semibold text-gray-700">
                                      Assigned To
                                    </TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredProjects.map((project) => (
                                  <TableRow
                                    key={project.project_id}
                                    className="border-b hover:bg-gray-50/50"
                                  >
                                    {activeTab === "unassigned" && (
                                      <TableCell className="py-3">
                                        <Checkbox
                                          checked={selectedProjects.has(
                                            project.project_id
                                          )}
                                          onCheckedChange={() =>
                                            handleProjectSelect(
                                              project.project_id
                                            )
                                          }
                                          aria-label={`Select project ${project.name}`}
                                          className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell className="py-3">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {project.name}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                          {project.project_id}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "capitalize font-normal",
                                          project.status === "active" &&
                                            "bg-emerald-500/10 text-emerald-700 border-emerald-200",
                                          project.status === "pending" &&
                                            "bg-amber-500/10 text-amber-700 border-amber-200",
                                          project.status === "completed" &&
                                            "bg-blue-500/10 text-blue-700 border-blue-200"
                                        )}
                                      >
                                        {project.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="text-sm text-gray-700">
                                        <div className="flex items-center gap-1.5">
                                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                                          {formatDate(project.startDate)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          → {formatDate(project.endDate)}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="text-sm text-gray-700 truncate max-w-[200px] cursor-help">
                                              {project.location?.fullAddress ||
                                                "N/A"}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-[300px]">
                                            <p>
                                              {project.location?.fullAddress ||
                                                "No location specified"}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="font-medium text-gray-900">
                                        {formatCurrency(project.totalCost || 0)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {getAssignmentStatusBadge(
                                        project.isAssigned
                                      )}
                                    </TableCell>
                                    {activeTab === "all" && (
                                      <TableCell className="py-3">
                                        {project.isAssigned &&
                                        project.currentAssignment ? (
                                          <div className="text-sm">
                                            <div className="font-medium text-gray-900">
                                              {
                                                project.currentAssignment
                                                  .project_manager_name
                                              }
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Since{" "}
                                              {formatDate(
                                                project.currentAssignment
                                                  .assignment_date
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-sm">
                                            Not assigned
                                          </span>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unassign/Transfer Confirmation Modal */}
      <Dialog open={isUnassignModalOpen} onOpenChange={setIsUnassignModalOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {transferTo ? "Transfer Project" : "Unassign Project"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {transferTo
                ? "Select a new project manager to transfer this project to"
                : "Are you sure you want to unassign this project?"}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6">
            {transferTo ? (
              <div className="space-y-4">
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Select new project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectManagers
                      .filter(
                        (manager) =>
                          manager.user_id !==
                          selectedAssignment?.project_manager_id
                      )
                      .map((manager) => (
                        <SelectItem
                          key={manager.user_id}
                          value={manager.user_id}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={manager.avatar} />
                              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                {getInitials(manager.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {manager.fullName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {manager.email}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="border-gray-200 bg-gray-50/50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          Project
                        </div>
                        <div className="font-medium text-gray-900">
                          {selectedAssignment?.project?.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          Current Manager
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {selectedAssignment?.project_manager?.fullName}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">
                          Assigned Since
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatDate(selectedAssignment?.assignment_date)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                if (transferTo) {
                  setTransferTo("");
                } else {
                  setIsUnassignModalOpen(false);
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              {!transferTo && (
                <Button
                  variant="outline"
                  onClick={() => setTransferTo("transfer")}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Transfer Instead
                </Button>
              )}

              <Button
                onClick={handleUnassignConfirm}
                disabled={isAssigning || transferTo === "transfer"}
                className={cn(
                  "min-w-[100px]",
                  transferTo
                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : transferTo ? (
                  "Transfer"
                ) : (
                  "Unassign"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selection Summary Badge */}
      {activeTab === "unassigned" && selectedProjects.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Badge className="px-4 py-2 bg-gray-900 text-white shadow-lg">
            <CheckSquare className="h-4 w-4 mr-2" />
            {selectedProjects.size} project
            {selectedProjects.size !== 1 ? "s" : ""} selected
          </Badge>
        </div>
      )}
    </>
  );
}
