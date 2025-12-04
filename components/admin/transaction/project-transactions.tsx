"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Hash,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  RefreshCw,
  MapPin,
  CalendarDays,
  ArrowLeft,
  XCircle,
  TrendingUp,
  FileText,
  Users,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getConfirmedProjects,
  getProjectTransactions,
  ProjectTransactionDetail,
} from "@/action/confirmed-projects";
import { getProjectMilestones } from "@/action/milestone";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Import the TransactionHistory component
import { TransactionHistory } from "@/components/admin/transaction/transaction-history";
// Import the PaymentDialog component
import { PaymentDialog } from "@/components/admin/transaction/payment-dialog";
// Import the ManualPaymentDialog component
import { ManualPaymentDialog } from "@/components/admin/transaction/manual-payment-dialog";

// Define local interface that matches the server response
interface ProjectTransaction {
  id: string;
  project_id: string;
  projectName?: string;
  clientName: string;
  totalValue: number;
  startDate: string;
  endDate?: string;
  status: "ongoing" | "completed" | "pending";
  userId: string;
  userEmail?: string;
  userPhone?: string;
  location?: {
    fullAddress?: string;
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
  };
  confirmedAt?: string;
  totalPaid?: number;
  remainingBalance?: number;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  progress: number;
  target_date?: Date;
  completed: boolean;
  completed_at?: Date;
  order: number;
  created_at: Date;
  updated_at: Date;
}

interface ProjectWithTransactions {
  project: ProjectTransaction;
  transactions: ProjectTransactionDetail[];
  summary: {
    totalTransactions: number;
    totalPaid: number;
    totalPending: number;
    totalAmount: number;
    balance: number;
  };
}

interface ProjectTransactionsProps {
  transactions?: ProjectTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const ProjectTransactions: React.FC<ProjectTransactionsProps> = ({
  transactions: initialTransactions,
  isLoading: initialIsLoading = false,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState<ProjectTransaction[]>(
    initialTransactions || []
  );
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithTransactions | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);
  const [projectProgress, setProjectProgress] = useState<
    Record<string, number>
  >({});

  // Load data if not provided via props
  useEffect(() => {
    if (!initialTransactions) {
      loadConfirmedProjects();
    } else {
      setTransactions(initialTransactions);
    }
  }, [initialTransactions]);

  const loadConfirmedProjects = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedProject(null);
    setProjectProgress({});

    try {
      const result = await getConfirmedProjects();

      if (result.success && result.data) {
        setTransactions(result.data);

        // Load milestones for all projects to calculate progress
        await loadAllProjectMilestones(result.data);

        toast.success(`Loaded ${result.data.length} confirmed projects`);
      } else {
        setError(result.error || "Failed to load projects");
        toast.error(result.error || "Failed to load confirmed projects");
      }
    } catch (error) {
      console.error("Error loading confirmed projects:", error);
      setError("An unexpected error occurred");
      toast.error("Failed to load confirmed projects");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllProjectMilestones = async (projects: ProjectTransaction[]) => {
    const progressMap: Record<string, number> = {};

    for (const project of projects) {
      try {
        const result = await getProjectMilestones(project.project_id);
        if (
          result.success &&
          result.milestones &&
          result.milestones.length > 0
        ) {
          const totalProgress = result.milestones.reduce((sum, milestone) => {
            return sum + milestone.progress;
          }, 0);
          progressMap[project.project_id] = Math.round(
            totalProgress / result.milestones.length
          );
        } else {
          // If no milestones, show payment progress
          progressMap[project.project_id] = project.totalPaid
            ? Math.round((project.totalPaid / project.totalValue) * 100)
            : 0;
        }
      } catch (error) {
        console.error(
          `Error loading milestones for project ${project.project_id}:`,
          error
        );
        progressMap[project.project_id] = 0;
      }
    }

    setProjectProgress(progressMap);
  };

  const loadProjectMilestones = async (projectId: string) => {
    setIsLoadingMilestones(true);
    try {
      const result = await getProjectMilestones(projectId);
      if (result.success && result.milestones) {
        setMilestones(result.milestones);
      }
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setIsLoadingMilestones(false);
    }
  };

  const loadProjectTransactions = async (projectId: string) => {
    setIsLoadingTransactions(true);
    setMilestones([]);

    try {
      const result = await getProjectTransactions(projectId);

      if (result.success && result.data) {
        setSelectedProject(result.data);
        toast.success(`Loaded ${result.data.transactions.length} transactions`);

        // Load milestones for this project
        await loadProjectMilestones(projectId);
      } else {
        toast.error(result.error || "Failed to load project transactions");
      }
    } catch (error) {
      console.error("Error loading project transactions:", error);
      toast.error("Failed to load project transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedProject) {
      await loadProjectTransactions(selectedProject.project.project_id);
    } else {
      await loadConfirmedProjects();
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleProjectClick = async (project: ProjectTransaction) => {
    await loadProjectTransactions(project.project_id);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMilestones([]);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyWithDecimal = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Ongoing
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "paid":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  const getProjectDuration = (startDate: string, endDate?: string) => {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        const years = Math.floor(diffDays / 365);
        const remainingDays = diffDays % 365;
        return `${years}y ${remainingDays}d`;
      }
      return `${diffDays} days`;
    } catch (error) {
      return "N/A";
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalProjects = transactions.length;
    const totalValue = transactions.reduce((sum, t) => sum + t.totalValue, 0);
    const ongoing = transactions.filter((t) => t.status === "ongoing").length;
    const completed = transactions.filter(
      (t) => t.status === "completed"
    ).length;
    const pending = transactions.filter((t) => t.status === "pending").length;
    const averageValue = totalProjects > 0 ? totalValue / totalProjects : 0;

    // Calculate totalPaid from all projects
    const totalPaid = transactions.reduce((sum, t) => {
      const paid = t.totalPaid || 0;
      return sum + paid;
    }, 0);

    // Calculate total remaining balance
    const totalBalance = transactions.reduce((sum, t) => {
      const paid = t.totalPaid || 0;
      return sum + (t.totalValue - paid);
    }, 0);

    // Calculate average payment progress
    const totalPaymentProgress = transactions.reduce((sum, t) => {
      const progress = projectProgress[t.project_id] || 0;
      return sum + progress;
    }, 0);
    const averagePaymentProgress =
      totalProjects > 0 ? Math.round(totalPaymentProgress / totalProjects) : 0;

    // Count projects by payment completion
    const fullyPaidProjects = transactions.filter((t) => {
      const progress = projectProgress[t.project_id] || 0;
      return progress >= 100;
    }).length;

    const partiallyPaidProjects = transactions.filter((t) => {
      const progress = projectProgress[t.project_id] || 0;
      return progress > 0 && progress < 100;
    }).length;

    const notPaidProjects = transactions.filter((t) => {
      const progress = projectProgress[t.project_id] || 0;
      return progress === 0;
    }).length;

    return {
      totalProjects,
      totalValue,
      ongoing,
      completed,
      pending,
      averageValue,
      totalPaid,
      totalBalance,
      averagePaymentProgress,
      fullyPaidProjects,
      partiallyPaidProjects,
      notPaidProjects,
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-geist">
              Project Transactions
            </h2>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              View all confirmed projects with their transaction details
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2 border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading project transactions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-geist">
              Project Transactions
            </h2>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              View all confirmed projects with their transaction details
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card className="border-gray-300">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 font-geist mb-2">
              Failed to Load Projects
            </h3>
            <p className="text-gray-600 font-geist mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-gray-300"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (transactions.length === 0 && !selectedProject) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-geist">
              Project Transactions
            </h2>
            <p className="text-gray-600 mt-1 text-sm font-geist">
              View all confirmed projects with their transaction details
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2 border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 font-geist mb-2">
              No Confirmed Projects Found
            </h3>
            <p className="text-gray-600 font-geist mb-4">
              There are no confirmed projects to display. Projects will appear
              here once clients confirm their projects.
            </p>
            <Button
              onClick={handleRefresh}
              variant="default"
              className="bg-gray-900 hover:bg-gray-800"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a project is selected, show its transactions
  if (selectedProject) {
    const project = selectedProject.project;
    const transactions = selectedProject.transactions || [];

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackToProjects}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-geist">
                {project.clientName} - {project.projectName || "Project"}{" "}
                Transactions
              </h2>
              <p className="text-gray-600 mt-1 text-sm font-geist">
                ID: {project.project_id} • Value:{" "}
                {formatCurrencyWithDecimal(project.totalValue)}
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isLoadingTransactions}
            className="flex items-center gap-2 border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* REMOVED: Duplicate stats above TransactionHistory */}
        {/* The TransactionHistory component already shows its own stats */}

        {/* Transactions Table using separated component */}
        <TransactionHistory
          transactions={transactions}
          isLoading={isLoadingTransactions}
          projectId={project.project_id}
          clientEmail={project.userEmail}
          clientName={project.clientName}
          projectName={project.projectName}
          totalValue={project.totalValue}
          onRefresh={() => loadProjectTransactions(project.project_id)}
        />

        {/* Payment Dialog */}
        <PaymentDialog />

        {/* Manual Payment Dialog */}
        <ManualPaymentDialog />
      </div>
    );
  }

  // Show the main projects table
  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-geist">
            Project Transactions
          </h2>
          <p className="text-gray-600 mt-1 text-sm font-geist">
            Click on any project to view its transaction details
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards - REDESIGNED to match transaction-history */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700">
                Total Projects Value
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrencyWithDecimal(stats.totalValue)}
              </p>
              <p className="text-xs text-blue-600">
                {stats.totalProjects} projects
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700">
                Total Amount Paid
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrencyWithDecimal(stats.totalPaid)}
              </p>
              <p className="text-xs text-green-600">
                {stats.fullyPaidProjects} fully paid
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700">
                Remaining Balance
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrencyWithDecimal(stats.totalBalance)}
              </p>
              <p className="text-xs text-orange-600">
                {stats.partiallyPaidProjects + stats.notPaidProjects} with
                balance
              </p>
            </div>
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-700">
                Avg Payment Progress
              </p>
              <p className="text-lg font-bold text-gray-900">
                {stats.averagePaymentProgress}%
              </p>
              <p className="text-xs text-purple-600">
                {stats.fullyPaidProjects} completed •{" "}
                {stats.partiallyPaidProjects} in progress
              </p>
            </div>
            <Percent className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Progress Summary Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Payment Progress</span>
          <span className="font-medium text-gray-900">
            {stats.totalValue > 0
              ? Math.round((stats.totalPaid / stats.totalValue) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{
              width: `${stats.totalValue > 0 ? Math.min(100, (stats.totalPaid / stats.totalValue) * 100) : 0}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>₱0</span>
          <span>{formatCurrencyWithDecimal(stats.totalValue)}</span>
        </div>
      </div>

      {/* Project Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-700">
                Active Projects
              </p>
              <p className="text-lg font-bold text-gray-900">{stats.ongoing}</p>
              <p className="text-xs text-yellow-600">
                {Math.round((stats.ongoing / stats.totalProjects) * 100)}% of
                total
              </p>
            </div>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700">
                Completed Projects
              </p>
              <p className="text-lg font-bold text-gray-900">
                {stats.completed}
              </p>
              <p className="text-xs text-green-600">
                {Math.round((stats.completed / stats.totalProjects) * 100)}%
                success rate
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">
                Pending Projects
              </p>
              <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-600">
                {Math.round((stats.pending / stats.totalProjects) * 100)}%
                awaiting action
              </p>
            </div>
            <Users className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <Card className="border-gray-300">
        <CardHeader>
          <CardTitle className="text-gray-900">Confirmed Projects</CardTitle>
          <CardDescription className="text-gray-600">
            Click on any project to view its detailed transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-300">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700">
                    Project Details
                  </TableHead>
                  <TableHead className="text-gray-700">Client</TableHead>
                  <TableHead className="text-gray-700">Value</TableHead>
                  <TableHead className="text-gray-700">Timeline</TableHead>
                  <TableHead className="text-gray-700">Progress</TableHead>
                  <TableHead className="text-gray-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const progress = projectProgress[transaction.project_id] || 0;
                  return (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors border-gray-300"
                      onClick={() => handleProjectClick(transaction)}
                    >
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-gray-500" />
                            <code className="font-mono text-sm font-semibold text-gray-900">
                              {transaction.project_id}
                            </code>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.projectName || "Unnamed Project"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays className="h-3 w-3" />
                            <span>
                              Started: {formatDate(transaction.startDate)}
                            </span>
                          </div>
                          {transaction.location?.fullAddress && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">
                                {transaction.location.fullAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="font-medium text-gray-900">
                            {transaction.clientName}
                          </div>
                          {transaction.userEmail && (
                            <div className="text-sm text-gray-600 truncate max-w-[150px]">
                              {transaction.userEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="font-semibold text-gray-900">
                            {formatCurrencyWithDecimal(transaction.totalValue)}
                          </span>
                          {transaction.totalPaid !== undefined && (
                            <span className="text-sm text-gray-600">
                              Paid:{" "}
                              {formatCurrencyWithDecimal(transaction.totalPaid)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-2">
                          <div className="text-sm text-gray-700">
                            {transaction.endDate ? (
                              <>
                                <div>
                                  Start: {formatDate(transaction.startDate)}
                                </div>
                                <div>
                                  End: {formatDate(transaction.endDate)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getProjectDuration(
                                    transaction.startDate,
                                    transaction.endDate
                                  )}
                                </div>
                              </>
                            ) : (
                              <div>
                                Started: {formatDate(transaction.startDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-2">
                          <Progress
                            value={progress}
                            className="h-2 bg-gray-200"
                          />
                          <div className="text-sm font-medium text-right text-gray-900">
                            {progress}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start space-y-2">
                          {getStatusBadge(transaction.status)}
                          {transaction.confirmedAt && (
                            <div className="text-xs text-gray-500">
                              Confirmed: {formatDate(transaction.confirmedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Stats */}
      <div className="mt-6 text-sm text-gray-600">
        <p>
          Showing {transactions.length} projects. Click any project to view
          transactions.
        </p>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog />

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog />
    </div>
  );
};

export default ProjectTransactions;
