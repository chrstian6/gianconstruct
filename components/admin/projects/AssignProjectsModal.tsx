"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  X,
  Users,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  searchProjectsForAssignment,
  searchProjectManagers,
  assignProjectsToManager,
} from "@/action/project-assignment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Update the Project interface in the modal:
interface Project {
  project_id: string;
  name: string;
  status: "pending" | "active" | "completed" | "cancelled";
  startDate?: string;
  endDate?: string;
  location?: {
    fullAddress: string;
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
    assigned_by_name: string; // Make sure this matches what the API returns
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

interface AssignProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectsAssigned: () => void;
}

type Step = "select-projects" | "select-manager" | "confirmation";

export default function AssignProjectsModal({
  isOpen,
  onClose,
  onProjectsAssigned,
}: AssignProjectsModalProps) {
  const [step, setStep] = useState<Step>("select-projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [searchManagerTerm, setSearchManagerTerm] = useState("");
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Load unassigned projects when modal opens
  useEffect(() => {
    if (isOpen && step === "select-projects") {
      loadUnassignedProjects();
    }
  }, [isOpen, step]);

  // Load unassigned projects
  const loadUnassignedProjects = async () => {
    setIsInitialLoading(true);
    try {
      // Search with empty string to get all projects
      const response = await searchProjectsForAssignment("");
      if (response.success) {
        const allProjects = response.data || [];
        setProjects(allProjects);
      } else {
        toast.error(response.error || "Failed to load projects");
        setProjects([]);
      }
    } catch (error) {
      toast.error("Error loading projects");
      console.error(error);
      setProjects([]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Search projects
  const handleSearchProjects = useCallback(async () => {
    if (!searchTerm.trim()) {
      // If search term is empty, load all projects
      loadUnassignedProjects();
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchProjectsForAssignment(searchTerm);
      if (response.success) {
        setProjects(response.data || []);
      } else {
        toast.error(response.error || "Failed to search projects");
        setProjects([]);
      }
    } catch (error) {
      toast.error("Error searching projects");
      console.error(error);
      setProjects([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm]);

  // Search project managers
  const handleSearchManagers = useCallback(async () => {
    if (!searchManagerTerm.trim()) {
      setProjectManagers([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchProjectManagers(searchManagerTerm);
      if (response.success) {
        setProjectManagers(response.data || []);
      } else {
        toast.error(response.error || "Failed to search project managers");
        setProjectManagers([]);
      }
    } catch (error) {
      toast.error("Error searching project managers");
      console.error(error);
      setProjectManagers([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchManagerTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (step === "select-projects") {
        handleSearchProjects();
      } else if (step === "select-manager") {
        handleSearchManagers();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [
    searchTerm,
    searchManagerTerm,
    step,
    handleSearchProjects,
    handleSearchManagers,
  ]);

  const toggleProjectSelection = (projectId: string) => {
    const project = projects.find((p) => p.project_id === projectId);
    if (project?.isAssigned) {
      toast.error(
        `This project is already assigned to ${project.currentAssignment?.project_manager_name || "a project manager"}`
      );
      return;
    }

    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const toggleSelectAllProjects = () => {
    // Only select unassigned projects
    const unassignedProjects = projects.filter((p) => !p.isAssigned);

    if (selectedProjects.size === unassignedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      const allUnassignedProjectIds = unassignedProjects.map(
        (p) => p.project_id
      );
      setSelectedProjects(new Set(allUnassignedProjectIds));
    }
  };

  const handleNextStep = () => {
    if (step === "select-projects") {
      if (selectedProjects.size === 0) {
        toast.error("Please select at least one project");
        return;
      }

      // Check if any selected project is already assigned
      const assignedProjects = Array.from(selectedProjects).filter(
        (projectId) => {
          const project = projects.find((p) => p.project_id === projectId);
          return project?.isAssigned;
        }
      );

      if (assignedProjects.length > 0) {
        const projectNames = assignedProjects
          .map((id) => {
            const project = projects.find((p) => p.project_id === id);
            return `${project?.name} (${id})`;
          })
          .join(", ");

        toast.error(
          `The following projects are already assigned: ${projectNames}. Please unselect them.`
        );
        return;
      }

      setStep("select-manager");
    } else if (step === "select-manager") {
      if (!selectedManager) {
        toast.error("Please select a project manager");
        return;
      }
      setStep("confirmation");
    }
  };

  const handlePrevStep = () => {
    if (step === "select-manager") {
      setStep("select-projects");
    } else if (step === "confirmation") {
      setStep("select-manager");
    }
  };

  const handleAssign = async () => {
    if (selectedProjects.size === 0 || !selectedManager) {
      toast.error("Missing required information");
      return;
    }

    setIsAssigning(true);
    try {
      const projectIds = Array.from(selectedProjects);
      const response = await assignProjectsToManager(
        projectIds,
        selectedManager,
        notes
      );

      if (response.success) {
        toast.success(
          `Successfully assigned ${projectIds.length} project${projectIds.length > 1 ? "s" : ""}`
        );
        onProjectsAssigned();
        resetAndClose();
      } else {
        toast.error(response.error || "Failed to assign projects");
      }
    } catch (error: any) {
      console.error("Error assigning projects:", error);
      toast.error(error.message || "Error assigning projects");
    } finally {
      setIsAssigning(false);
    }
  };

  const resetAndClose = () => {
    setStep("select-projects");
    setSearchTerm("");
    setProjects([]);
    setSelectedProjects(new Set());
    setSearchManagerTerm("");
    setProjectManagers([]);
    setSelectedManager("");
    setNotes("");
    onClose();
  };

  const getSelectedProjectCount = () => selectedProjects.size;

  const getSelectedProjectsDetails = () => {
    return projects.filter((p) => selectedProjects.has(p.project_id));
  };

  const getSelectedManagerDetails = () => {
    return projectManagers.find((m) => m.user_id === selectedManager);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUnassignedProjectsCount = () => {
    return projects.filter((p) => !p.isAssigned).length;
  };

  const getAssignedProjectsCount = () => {
    return projects.filter((p) => p.isAssigned).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Projects to Project Manager
          </DialogTitle>
          <DialogDescription>
            {step === "select-projects" &&
              "Select projects to assign (showing unassigned projects by default)"}
            {step === "select-manager" && "Search and select a project manager"}
            {step === "confirmation" && "Review and confirm assignment"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {["select-projects", "select-manager", "confirmation"].map(
            (s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === s
                      ? "bg-zinc-900 text-white"
                      : index <
                          [
                            "select-projects",
                            "select-manager",
                            "confirmation",
                          ].indexOf(step)
                        ? "bg-green-500 text-white"
                        : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="text-sm ml-2 font-medium">
                  {s === "select-projects" && "Select Projects"}
                  {s === "select-manager" && "Select Manager"}
                  {s === "confirmation" && "Confirm"}
                </div>
                {index < 2 && <div className="w-12 h-px bg-zinc-200 mx-4" />}
              </div>
            )
          )}
        </div>

        {/* Step 1: Select Projects */}
        {step === "select-projects" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="project-search">Search Projects</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="project-search"
                  placeholder="Search by project ID, name, or location..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full"
                  >
                    <X className="h-3 w-3 text-zinc-500" />
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                Showing unassigned projects by default. Search to find all
                projects.
              </p>
            </div>

            {isInitialLoading || isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-600">
                    <div className="flex items-center gap-3">
                      <span>
                        Found {projects.length} project
                        {projects.length !== 1 ? "s" : ""}
                      </span>
                      {getUnassignedProjectsCount() > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          {getUnassignedProjectsCount()} available
                        </Badge>
                      )}
                      {getAssignedProjectsCount() > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          {getAssignedProjectsCount()} already assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAllProjects}
                    className="text-xs"
                    disabled={getUnassignedProjectsCount() === 0}
                  >
                    {selectedProjects.size === getUnassignedProjectsCount()
                      ? "Deselect All"
                      : "Select All Available"}
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {projects.map((project) => (
                    <div
                      key={project.project_id}
                      className={`p-4 rounded-lg border ${
                        selectedProjects.has(project.project_id)
                          ? "border-zinc-900 bg-zinc-50"
                          : project.isAssigned
                            ? "border-amber-200 bg-amber-50"
                            : "border-zinc-200 hover:bg-zinc-50"
                      } ${project.isAssigned ? "cursor-not-allowed" : "cursor-pointer"}`}
                      onClick={() => toggleProjectSelection(project.project_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Checkbox
                            checked={selectedProjects.has(project.project_id)}
                            disabled={project.isAssigned}
                            onCheckedChange={() =>
                              toggleProjectSelection(project.project_id)
                            }
                            className="mt-1"
                          />
                          {project.isAssigned && (
                            <div className="absolute -top-1 -right-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-amber-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Already assigned to:{" "}
                                      {project.currentAssignment
                                        ?.project_manager_name || "Unknown"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-zinc-900">
                                {project.name}
                              </h4>
                              <p className="text-sm text-zinc-500">
                                ID: {project.project_id}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  project.status === "active"
                                    ? "default"
                                    : project.status === "pending"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {project.status}
                              </Badge>
                              {project.isAssigned && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 border-amber-300"
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  Assigned
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Assignment Info (if assigned) - UPDATED */}
                          {project.isAssigned && project.currentAssignment && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                              <div className="flex items-center gap-2 text-amber-800">
                                <UserCheck className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Currently assigned to:
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-amber-700 font-medium">
                                    Project Manager:
                                  </span>
                                  <p className="text-amber-800">
                                    {
                                      project.currentAssignment
                                        .project_manager_name
                                    }
                                  </p>
                                </div>
                                <div>
                                  <span className="text-amber-700 font-medium">
                                    Assigned on:
                                  </span>
                                  <p className="text-amber-800">
                                    {formatDate(
                                      project.currentAssignment.assignment_date
                                    )}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-amber-700 font-medium">
                                    Assigned by:
                                  </span>
                                  <p className="text-amber-800">
                                    {project.currentAssignment
                                      .assigned_by_name ||
                                      project.currentAssignment.assigned_by ||
                                      "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Project Details */}
                          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                            <div className="flex items-center gap-2 text-zinc-600">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {project.location?.fullAddress || "No location"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(project.startDate)} -{" "}
                                {formatDate(project.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600">
                              <Building className="h-3 w-3" />
                              <span>{formatCurrency(project.totalCost)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchTerm ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No projects found</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No projects found</p>
                <p className="text-sm text-zinc-400 mt-1">
                  All projects are currently assigned to project managers
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Project Manager */}
        {step === "select-manager" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="manager-search">Search Project Managers</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="manager-search"
                  placeholder="Search by name, email, or ID..."
                  className="pl-10"
                  value={searchManagerTerm}
                  onChange={(e) => setSearchManagerTerm(e.target.value)}
                />
                {searchManagerTerm && (
                  <button
                    onClick={() => setSearchManagerTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full"
                  >
                    <X className="h-3 w-3 text-zinc-500" />
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                Search for project managers by name, email, or user ID
              </p>
            </div>

            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : projectManagers.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {projectManagers.map((manager) => (
                  <div
                    key={manager.user_id}
                    className={`p-4 rounded-lg border cursor-pointer ${
                      selectedManager === manager.user_id
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                    onClick={() => setSelectedManager(manager.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={manager.avatar} />
                        <AvatarFallback>
                          {manager.firstName?.charAt(0)}
                          {manager.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-zinc-900">
                            {manager.fullName}
                          </h4>
                          {selectedManager === manager.user_id && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="flex items-center gap-2 text-zinc-600">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{manager.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-600">
                            <Phone className="h-3 w-3" />
                            <span>{manager.contactNo || "Not provided"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-600 col-span-2">
                            <User className="h-3 w-3" />
                            <span className="truncate">
                              ID: {manager.user_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchManagerTerm ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No project managers found</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">Search for project managers</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Enter a name, email, or user ID to start
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirmation" && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-zinc-900 mb-4">
                Assignment Summary
              </h4>

              {/* Selected Projects */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-zinc-700 mb-3">
                  Projects to Assign ({getSelectedProjectCount()})
                </h5>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {getSelectedProjectsDetails().map((project) => (
                    <div
                      key={project.project_id}
                      className="p-3 rounded-lg border border-zinc-200 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-zinc-900">
                            {project.name}
                          </p>
                          <p className="text-sm text-zinc-500">
                            ID: {project.project_id}
                          </p>
                        </div>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                      <p className="text-sm text-zinc-600 mt-2 truncate">
                        {project.location?.fullAddress}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Project Manager */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-zinc-700 mb-3">
                  Project Manager
                </h5>
                {getSelectedManagerDetails() && (
                  <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={getSelectedManagerDetails()?.avatar}
                        />
                        <AvatarFallback>
                          {getSelectedManagerDetails()?.firstName?.charAt(0)}
                          {getSelectedManagerDetails()?.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h6 className="font-medium text-zinc-900">
                          {getSelectedManagerDetails()?.fullName}
                        </h6>
                        <p className="text-sm text-zinc-500">
                          {getSelectedManagerDetails()?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="assignment-notes">Notes (Optional)</Label>
                <Textarea
                  id="assignment-notes"
                  placeholder="Add any notes about this assignment..."
                  className="mt-1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-zinc-500 mt-2">
                  These notes will be visible to the project manager
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step !== "select-projects" && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isAssigning}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            {step !== "confirmation" ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (step === "select-projects" && selectedProjects.size === 0) ||
                  (step === "select-manager" && !selectedManager)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleAssign}
                disabled={isAssigning || selectedProjects.size === 0}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Assignment
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>

        {/* Selection Summary */}
        {step === "select-projects" && selectedProjects.size > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <Badge className="px-4 py-2 bg-zinc-900 text-white">
              {selectedProjects.size} project
              {selectedProjects.size !== 1 ? "s" : ""} selected
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
