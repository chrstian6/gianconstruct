"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Eye,
  MessageSquare,
  Upload,
  BarChart3,
  Home,
  Settings,
  LogOut,
  Bell,
  User,
  FileText,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMyAssignedProjects } from "@/action/project-assignment";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/stores";

// Import shadcn table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssignedProject {
  assignment_id: string;
  project_id: string;
  project_manager_id: string;
  assigned_by: string;
  assignment_date: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    project_id: string;
    name: string;
    status: "pending" | "active" | "completed" | "cancelled";
    startDate?: string;
    endDate?: string;
    totalCost: number;
    location?: {
      fullAddress: string;
      region?: string;
      province?: string;
      municipality?: string;
      barangay?: string;
    };
    projectImages: Array<{
      url: string;
      title: string;
      description?: string;
      uploadedAt: string;
    }>;
    timeline: Array<any>;
  };
}

export default function ProjectManagerDashboard() {
  const router = useRouter();
  const { clearUser } = useAuthStore();

  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>(
    []
  );
  const [filteredProjects, setFilteredProjects] = useState<AssignedProject[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [userData, setUserData] = useState({
    name: "Project Manager",
    email: "manager@example.com",
    role: "project_manager",
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingProjects: 0,
    completedProjects: 0,
    totalValue: 0,
    overdueProjects: 0,
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserData({
              name:
                `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() ||
                "Project Manager",
              email: data.user.email || "manager@example.com",
              role: data.user.role || "project_manager",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch assigned projects
  const fetchAssignedProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getMyAssignedProjects();
      if (response.success) {
        const projects = response.data || [];
        setAssignedProjects(projects);
        setFilteredProjects(projects);

        // Calculate stats
        calculateStats(projects);
      } else {
        toast.error(response.error || "Failed to load assigned projects");
        setAssignedProjects([]);
        setFilteredProjects([]);
        calculateStats([]);
      }
    } catch (error) {
      toast.error("Error loading projects");
      console.error(error);
      setAssignedProjects([]);
      setFilteredProjects([]);
      calculateStats([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((projects: AssignedProject[]) => {
    const now = new Date();

    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.project.status === "active"
    ).length;
    const pendingProjects = projects.filter(
      (p) => p.project.status === "pending"
    ).length;
    const completedProjects = projects.filter(
      (p) => p.project.status === "completed"
    ).length;

    const totalValue = projects.reduce(
      (sum, p) => sum + p.project.totalCost,
      0
    );

    const overdueProjects = projects.filter((p) => {
      if (p.project.status === "completed" || p.project.status === "cancelled")
        return false;
      if (!p.project.endDate) return false;
      const endDate = new Date(p.project.endDate);
      return endDate < now;
    }).length;

    setStats({
      totalProjects,
      activeProjects,
      pendingProjects,
      completedProjects,
      totalValue,
      overdueProjects,
    });
  }, []);

  useEffect(() => {
    fetchAssignedProjects();
  }, [fetchAssignedProjects]);

  // Filter projects based on search and status
  useEffect(() => {
    let filtered = assignedProjects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.project.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          assignment.project.project_id
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          assignment.project.location?.fullAddress
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (assignment) => assignment.project.status === statusFilter
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, statusFilter, assignedProjects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/project-manager/manage-project/${projectId}`);
  };

  const handleLogout = async () => {
    try {
      await clearUser();
      toast.success("Logged out successfully!");
      router.push("/authentication-login");
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLogoutModalOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleRefresh = () => {
    fetchAssignedProjects();
    toast.success("Projects refreshed");
  };

  // Mobile sidebar
  const Sidebar = () => (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 ease-in-out lg:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold">
                {userData.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-zinc-900">{userData.name}</p>
                <p className="text-sm text-zinc-500">Project Manager</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-zinc-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("projects");
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                activeTab === "projects"
                  ? "bg-zinc-900 text-white"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Projects</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("analytics");
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                activeTab === "analytics"
                  ? "bg-zinc-900 text-white"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                activeTab === "reports"
                  ? "bg-zinc-900 text-white"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Reports</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("messages");
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                activeTab === "messages"
                  ? "bg-zinc-900 text-white"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">Messages</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                activeTab === "settings"
                  ? "bg-zinc-900 text-white"
                  : "hover:bg-zinc-50 text-zinc-700"
              )}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-geist">
      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again
              to access your projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col lg:pl-64">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200">
          <div className="flex items-center justify-between p-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-zinc-100 rounded-lg lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg lg:text-xl text-zinc-900">
                  Project Manager Dashboard
                </h1>
                <p className="text-sm text-zinc-500">
                  Manage your assigned construction projects
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-zinc-100 rounded-lg"
                title="Refresh"
              >
                <svg
                  className="h-5 w-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <button className="p-2 hover:bg-zinc-100 rounded-lg relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-zinc-100 rounded-full">
                    <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold">
                      {userData.name.charAt(0)}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600"
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-2">
              Welcome back, {userData.name}!
            </h2>
            <p className="text-zinc-600">
              You have{" "}
              <span className="font-semibold text-zinc-900">
                {stats.totalProjects} projects
              </span>{" "}
              assigned to you.
              {stats.overdueProjects > 0 && (
                <span className="text-red-600 font-medium ml-2">
                  {stats.overdueProjects} overdue
                </span>
              )}
            </p>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold text-zinc-900">
                  {stats.totalProjects}
                </div>
                <p className="text-sm text-zinc-500 mt-1">Assigned to you</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold text-green-600">
                  {stats.activeProjects}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-zinc-500">Currently active</p>
                  {stats.activeProjects > 0 && stats.totalProjects > 0 && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {Math.round(
                        (stats.activeProjects / stats.totalProjects) * 100
                      )}
                      %
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl font-bold text-amber-600">
                  {stats.pendingProjects}
                </div>
                <p className="text-sm text-zinc-500 mt-1">Awaiting start</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg lg:text-xl font-bold text-zinc-900 truncate">
                  {formatCurrency(stats.totalValue)}
                </div>
                <p className="text-sm text-zinc-500 mt-1">
                  Combined project value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Projects Table Section */}
          <Card className="mb-6 lg:mb-8 bg-white border-zinc-200 shadow-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h3 className="text-lg lg:text-xl font-semibold text-zinc-900">
                    My Assigned Projects
                    <span className="text-sm font-normal text-zinc-500 ml-2">
                      ({filteredProjects.length} of {assignedProjects.length})
                    </span>
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="hidden sm:flex"
                  >
                    Refresh
                  </Button>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full"
                      >
                        <X className="h-3 w-3 text-zinc-500" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-40">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Active filters indicator */}
              {(searchQuery || statusFilter !== "all") && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 p-0.5 hover:bg-zinc-200 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 p-0.5 hover:bg-zinc-200 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Data Table - Now responsive for all screen sizes */}
              <div className="rounded-md border border-zinc-200 overflow-hidden">
                {isLoading ? (
                  <div className="space-y-4 p-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-zinc-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-8 lg:p-12 text-center">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900 mb-2">
                      {searchQuery || statusFilter !== "all"
                        ? "No Projects Found"
                        : "No Projects Assigned"}
                    </h3>
                    <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
                      {searchQuery || statusFilter !== "all"
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "You don't have any projects assigned to you yet. Check back later or contact your administrator."}
                    </p>
                    {searchQuery || statusFilter !== "all" ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <Button onClick={handleRefresh} variant="outline">
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px] md:min-w-full">
                      <Table>
                        <TableHeader className="bg-zinc-50">
                          <TableRow>
                            <TableHead className="font-semibold">
                              Project Name
                            </TableHead>
                            <TableHead className="font-semibold">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">
                              Location
                            </TableHead>
                            <TableHead className="font-semibold hidden lg:table-cell">
                              Timeline
                            </TableHead>
                            <TableHead className="font-semibold hidden lg:table-cell">
                              Budget
                            </TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">
                              Assigned Date
                            </TableHead>
                            <TableHead className="font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProjects.map((assignment) => {
                            const project = assignment.project;
                            const daysRemaining = getDaysRemaining(
                              project.endDate
                            );
                            const isOverdue =
                              daysRemaining !== null && daysRemaining < 0;

                            return (
                              <TableRow
                                key={assignment.assignment_id}
                                className="hover:bg-zinc-50 cursor-pointer"
                                onClick={() =>
                                  handleProjectClick(project.project_id)
                                }
                              >
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-zinc-900">
                                      {project.name}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {project.project_id}
                                    </span>
                                    <div className="md:hidden mt-1">
                                      <div className="text-xs text-zinc-600">
                                        <span className="font-medium">
                                          Location:{" "}
                                        </span>
                                        {project.location?.fullAddress?.split(
                                          ","
                                        )[0] || "Not specified"}
                                      </div>
                                      <div className="text-xs text-zinc-600 mt-0.5">
                                        <span className="font-medium">
                                          Budget:{" "}
                                        </span>
                                        {formatCurrency(project.totalCost)}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      "px-2 py-1 text-xs font-medium border",
                                      getStatusColor(project.status)
                                    )}
                                  >
                                    {project.status.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="max-w-[150px] lg:max-w-[200px]">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                                      <span className="text-sm text-zinc-600 truncate">
                                        {project.location?.fullAddress ||
                                          "Not specified"}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex flex-col gap-1">
                                    <div className="text-sm">
                                      {formatDate(project.startDate)} -{" "}
                                      {formatDate(project.endDate)}
                                    </div>
                                    {daysRemaining !== null && (
                                      <div className="flex items-center gap-1">
                                        {isOverdue ? (
                                          <>
                                            <AlertCircle className="h-3 w-3 text-red-500" />
                                            <span className="text-xs text-red-600">
                                              Overdue by{" "}
                                              {Math.abs(daysRemaining)} days
                                            </span>
                                          </>
                                        ) : daysRemaining <= 7 ? (
                                          <>
                                            <AlertCircle className="h-3 w-3 text-amber-500" />
                                            <span className="text-xs text-amber-600">
                                              {daysRemaining} days left
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                            <span className="text-xs text-green-600">
                                              {daysRemaining} days remaining
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="font-semibold text-zinc-900">
                                    {formatCurrency(project.totalCost)}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="text-sm text-zinc-600">
                                    {formatDate(assignment.assignment_date)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleProjectClick(project.project_id);
                                      }}
                                      className="h-8 w-8 p-0"
                                      title="View Project"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          `/project-manager/manage-project/${project.project_id}/update`
                                        );
                                      }}
                                      className="h-8 w-8 p-0"
                                      title="Update Progress"
                                    >
                                      <Upload className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-30 lg:hidden">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setActiveTab("projects")}
              className={cn(
                "flex flex-col items-center justify-center p-2 flex-1",
                activeTab === "projects" ? "text-zinc-900" : "text-zinc-500"
              )}
            >
              <Home className="h-5 w-5 mb-1" />
              <span className="text-xs">Projects</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "flex flex-col items-center justify-center p-2 flex-1",
                activeTab === "analytics" ? "text-zinc-900" : "text-zinc-500"
              )}
            >
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>

            <button
              onClick={() => router.push("/project-manager/support")}
              className="flex flex-col items-center justify-center p-2 flex-1 text-zinc-900"
            >
              <div className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center mb-1">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs">Support</span>
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={cn(
                "flex flex-col items-center justify-center p-2 flex-1",
                activeTab === "messages" ? "text-zinc-900" : "text-zinc-500"
              )}
            >
              <Bell className="h-5 w-5 mb-1" />
              <span className="text-xs">Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "flex flex-col items-center justify-center p-2 flex-1",
                activeTab === "settings" ? "text-zinc-900" : "text-zinc-500"
              )}
            >
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </nav>

        {/* Add padding for bottom nav on mobile */}
        <div className="h-16 lg:h-0" />
      </div>
    </div>
  );
}
