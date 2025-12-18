"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ArrowUpRight,
  Wallet,
  CreditCard,
  ArrowDownRight,
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
import { TransactionHistory } from "@/components/admin/transaction/transaction-history";
import { PaymentDialog } from "@/components/admin/transaction/payment-dialog";
import { ManualPaymentDialog } from "@/components/admin/transaction/manual-payment-dialog";
import { UnifiedPaymentDialog } from "@/components/admin/transaction/unified-payment-dialog";

import {
  ProjectTransactionsSkeleton,
  ProjectDetailsSkeleton,
  LoadingSpinner,
} from "@/components/admin/transaction/skeleton/project-transactions-skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Cache implementation
class ProjectTransactionsCache {
  private static instance: ProjectTransactionsCache;
  private cache: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): ProjectTransactionsCache {
    if (!ProjectTransactionsCache.instance) {
      ProjectTransactionsCache.instance = new ProjectTransactionsCache();
    }
    return ProjectTransactionsCache.instance;
  }

  set(key: string, data: any) {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  get(key: string): any | null {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  has(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  delete(key: string) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  // Specific cache keys
  static getProjectsKey = "confirmed_projects";
  static getProjectTransactionsKey = (projectId: string) =>
    `project_transactions_${projectId}`;
  static getProjectMilestonesKey = (projectId: string) =>
    `project_milestones_${projectId}`;
  static getProjectProgressKey = "project_progress";
}

// Statistics Cards Component
interface ProjectStatsCardsProps {
  totalValue: number;
  totalPaid: number;
  totalBalance: number;
  averagePaymentProgress: number;
}

function ProjectStatsCards({
  totalValue,
  totalPaid,
  totalBalance,
  averagePaymentProgress,
}: ProjectStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatCurrencyWithDecimal = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b">
      {/* Total Projects Value */}
      <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Projects Value
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-400" />
                <p className="text-2xl font-semibold text-zinc-900">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Combined value of all projects
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Amount Paid */}
      <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Amount Paid
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-zinc-400" />
                <p className="text-2xl font-semibold text-zinc-900">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Received payments from clients
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Balance */}
      <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Remaining Balance
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <p className="text-2xl font-semibold text-zinc-900">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <p className="text-xs text-zinc-500">Pending client payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Payment Progress */}
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Avg Payment Progress
            </p>
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-zinc-400" />
                    <p className="text-2xl font-semibold text-zinc-900">
                      {averagePaymentProgress}%
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Average completion
                  </p>
                </div>
                <div className="h-8 w-px bg-zinc-200"></div>
                <div>
                  <p className="text-xs text-zinc-500">
                    {formatCurrencyWithDecimal(totalPaid)} /{" "}
                    {formatCurrencyWithDecimal(totalValue)}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Paid vs Total Value
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Project Status Cards Component
interface ProjectStatusCardsProps {
  ongoing: number;
  completed: number;
  pending: number;
  totalProjects: number;
}

function ProjectStatusCards({
  ongoing,
  completed,
  pending,
  totalProjects,
}: ProjectStatusCardsProps) {
  const calculatePercentage = (value: number) => {
    return totalProjects > 0 ? Math.round((value / totalProjects) * 100) : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border-b">
      {/* Active Projects */}
      <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Active Projects
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <p className="text-2xl font-semibold text-zinc-900">
                  {ongoing}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                {calculatePercentage(ongoing)}% of total projects
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Projects */}
      <Card className="rounded-none border-0 border-r border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Completed Projects
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <p className="text-2xl font-semibold text-zinc-900">
                  {completed}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                {calculatePercentage(completed)}% success rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Projects */}
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Pending Projects
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                <p className="text-2xl font-semibold text-zinc-900">
                  {pending}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                {calculatePercentage(pending)}% awaiting action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
  const [cache] = useState(() => ProjectTransactionsCache.getInstance());

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionIdSearch, setTransactionIdSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"project" | "transaction">(
    "project"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Transaction search result
  const [transactionSearchResult, setTransactionSearchResult] = useState<{
    project: ProjectTransaction | null;
    transaction: ProjectTransactionDetail | null;
  }>({ project: null, transaction: null });
  const [isSearchingTransaction, setIsSearchingTransaction] = useState(false);

  // Load data if not provided via props
  useEffect(() => {
    if (!initialTransactions) {
      loadConfirmedProjects();
    } else {
      setTransactions(initialTransactions);
      // Try to load cached progress
      const cachedProgress = cache.get(
        ProjectTransactionsCache.getProjectProgressKey
      );
      if (cachedProgress) {
        setProjectProgress(cachedProgress);
      } else {
        // Calculate initial progress
        const initialProgress = initialTransactions.reduce(
          (acc, project) => {
            acc[project.project_id] = project.totalPaid
              ? Math.round((project.totalPaid / project.totalValue) * 100)
              : 0;
            return acc;
          },
          {} as Record<string, number>
        );
        setProjectProgress(initialProgress);
      }
    }
  }, [initialTransactions]);

  const loadConfirmedProjects = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setSelectedProject(null);
    setTransactionSearchResult({ project: null, transaction: null });

    // Check cache first
    if (!forceRefresh && cache.has(ProjectTransactionsCache.getProjectsKey)) {
      const cachedData = cache.get(ProjectTransactionsCache.getProjectsKey);
      if (cachedData) {
        setTransactions(cachedData);
        setIsLoading(false);

        // Try to load cached progress
        const cachedProgress = cache.get(
          ProjectTransactionsCache.getProjectProgressKey
        );
        if (cachedProgress) {
          setProjectProgress(cachedProgress);
        } else {
          await loadAllProjectMilestones(cachedData);
        }
        return;
      }
    }

    try {
      const result = await getConfirmedProjects();

      if (result.success && result.data) {
        // Cache the data
        cache.set(ProjectTransactionsCache.getProjectsKey, result.data);

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
    const promises: Promise<void>[] = [];

    for (const project of projects) {
      const cacheKey = ProjectTransactionsCache.getProjectMilestonesKey(
        project.project_id
      );

      // Check cache for milestones
      if (cache.has(cacheKey)) {
        const cachedMilestones = cache.get(cacheKey);
        if (cachedMilestones && cachedMilestones.length > 0) {
          const totalProgress = cachedMilestones.reduce(
            (sum: number, milestone: Milestone) => {
              return sum + milestone.progress;
            },
            0
          );
          progressMap[project.project_id] = Math.round(
            totalProgress / cachedMilestones.length
          );
          continue;
        }
      }

      // If no cache, fetch from API
      promises.push(
        (async () => {
          try {
            const result = await getProjectMilestones(project.project_id);
            if (
              result.success &&
              result.milestones &&
              result.milestones.length > 0
            ) {
              // Cache the milestones
              cache.set(cacheKey, result.milestones);

              const totalProgress = result.milestones.reduce(
                (sum, milestone) => {
                  return sum + milestone.progress;
                },
                0
              );
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
        })()
      );
    }

    // Wait for all promises to complete
    await Promise.all(promises);

    // Cache the progress map
    cache.set(ProjectTransactionsCache.getProjectProgressKey, progressMap);

    setProjectProgress(progressMap);
  };

  const loadProjectMilestones = async (
    projectId: string,
    forceRefresh = false
  ) => {
    const cacheKey =
      ProjectTransactionsCache.getProjectMilestonesKey(projectId);

    // Check cache first
    if (!forceRefresh && cache.has(cacheKey)) {
      const cachedMilestones = cache.get(cacheKey);
      if (cachedMilestones) {
        setMilestones(cachedMilestones);
        return;
      }
    }

    setIsLoadingMilestones(true);
    try {
      const result = await getProjectMilestones(projectId);
      if (result.success && result.milestones) {
        // Cache the milestones
        cache.set(cacheKey, result.milestones);
        setMilestones(result.milestones);
      }
    } catch (error) {
      console.error("Error loading milestones:", error);
    } finally {
      setIsLoadingMilestones(false);
    }
  };

  const loadProjectTransactions = async (
    projectId: string,
    forceRefresh = false
  ) => {
    const cacheKey =
      ProjectTransactionsCache.getProjectTransactionsKey(projectId);

    // Check cache first
    if (!forceRefresh && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        setSelectedProject(cachedData);
        setTransactionSearchResult({ project: null, transaction: null });
        toast.success(
          `Loaded ${cachedData.transactions.length} transactions from cache`
        );

        // Load cached milestones
        await loadProjectMilestones(projectId, false);
        return;
      }
    }

    setIsLoadingTransactions(true);
    setMilestones([]);

    try {
      const result = await getProjectTransactions(projectId);

      if (result.success && result.data) {
        // Cache the data
        cache.set(cacheKey, result.data);

        setSelectedProject(result.data);
        setTransactionSearchResult({ project: null, transaction: null });
        toast.success(`Loaded ${result.data.transactions.length} transactions`);

        // Load milestones for this project
        await loadProjectMilestones(projectId, false);
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

  const handleRefresh = async (forceRefresh = false) => {
    if (selectedProject) {
      await loadProjectTransactions(
        selectedProject.project.project_id,
        forceRefresh
      );
    } else {
      await loadConfirmedProjects(forceRefresh);
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleForceRefresh = async () => {
    if (selectedProject) {
      // Clear cache for this project
      cache.delete(
        ProjectTransactionsCache.getProjectTransactionsKey(
          selectedProject.project.project_id
        )
      );
      cache.delete(
        ProjectTransactionsCache.getProjectMilestonesKey(
          selectedProject.project.project_id
        )
      );
    } else {
      // Clear all project caches
      cache.delete(ProjectTransactionsCache.getProjectsKey);
      cache.delete(ProjectTransactionsCache.getProjectProgressKey);

      // Also clear individual project caches
      transactions.forEach((project) => {
        cache.delete(
          ProjectTransactionsCache.getProjectTransactionsKey(project.project_id)
        );
        cache.delete(
          ProjectTransactionsCache.getProjectMilestonesKey(project.project_id)
        );
      });
    }

    await handleRefresh(true);
    toast.success("Cache cleared and data refreshed");
  };

  const handleProjectClick = async (project: ProjectTransaction) => {
    await loadProjectTransactions(project.project_id, false);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setMilestones([]);
    setTransactionSearchResult({ project: null, transaction: null });
    // Reset pagination and filters when going back
    setCurrentPage(1);
    setSearchTerm("");
    setTransactionIdSearch("");
    setStatusFilter("all");
    setProgressFilter("all");
    setSearchMode("project");
  };

  const searchTransactionById = async () => {
    if (!transactionIdSearch.trim()) {
      toast.error("Please enter a transaction ID");
      return;
    }

    setIsSearchingTransaction(true);
    setTransactionSearchResult({ project: null, transaction: null });

    try {
      let foundTransaction: ProjectTransactionDetail | null = null;
      let foundProject: ProjectTransaction | null = null;

      // Search through all projects for the transaction
      for (const project of transactions) {
        const cacheKey = ProjectTransactionsCache.getProjectTransactionsKey(
          project.project_id
        );

        // Try to get cached transactions first
        let projectTransactions: ProjectTransactionDetail[] = [];
        if (cache.has(cacheKey)) {
          const cachedData = cache.get(cacheKey);
          projectTransactions = cachedData?.transactions || [];
        } else {
          // Fetch transactions if not cached
          const result = await getProjectTransactions(project.project_id);
          if (result.success && result.data) {
            // Cache the data
            cache.set(cacheKey, result.data);
            projectTransactions = result.data.transactions || [];
          }
        }

        // Search for transaction in this project
        // Based on your model, we should search by transaction_id field
        const transaction = projectTransactions.find(
          (t) =>
            // Search by transaction_id (TXN000001 format)
            t.transaction_id?.toLowerCase() ===
              transactionIdSearch.trim().toLowerCase() ||
            // Check reference_number
            t.reference_number?.toLowerCase() ===
              transactionIdSearch.trim().toLowerCase()
        );

        if (transaction) {
          foundTransaction = transaction;
          foundProject = project;
          break;
        }
      }

      if (foundTransaction && foundProject) {
        setTransactionSearchResult({
          project: foundProject,
          transaction: foundTransaction,
        });

        // Load the full project details
        await loadProjectTransactions(foundProject.project_id, false);

        toast.success(
          `Found transaction ${foundTransaction.transaction_id} in project ${foundProject.project_id}`
        );
      } else {
        toast.error(
          `Transaction "${transactionIdSearch}" not found in any project`
        );
        setTransactionSearchResult({ project: null, transaction: null });
      }
    } catch (error) {
      console.error("Error searching for transaction:", error);
      toast.error("Failed to search for transaction");
      setTransactionSearchResult({ project: null, transaction: null });
    } finally {
      setIsSearchingTransaction(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "transaction") {
      searchTransactionById();
    }
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

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
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

  const getTransactionStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
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

  // Filter and search logic for projects
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        transaction.clientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.projectName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.userEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.project_id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.location?.fullAddress
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || transaction.status === statusFilter;

      // Progress filter
      const progress = projectProgress[transaction.project_id] || 0;
      const matchesProgress =
        progressFilter === "all" ||
        (progressFilter === "completed" && progress >= 100) ||
        (progressFilter === "in-progress" && progress > 0 && progress < 100) ||
        (progressFilter === "not-started" && progress === 0);

      return matchesSearch && matchesStatus && matchesProgress;
    });
  }, [transactions, searchTerm, statusFilter, progressFilter, projectProgress]);

  // Sort logic
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];

    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      case "value-high":
        return sorted.sort((a, b) => b.totalValue - a.totalValue);
      case "value-low":
        return sorted.sort((a, b) => a.totalValue - b.totalValue);
      case "name-asc":
        return sorted.sort((a, b) =>
          (a.clientName || "").localeCompare(b.clientName || "")
        );
      case "name-desc":
        return sorted.sort((a, b) =>
          (b.clientName || "").localeCompare(a.clientName || "")
        );
      default:
        return sorted;
    }
  }, [filteredTransactions, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTransactions.slice(startIndex, endIndex);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, progressFilter, sortBy]);

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

  // Show skeleton loading for initial load
  if (isLoading && !initialTransactions) {
    return <ProjectTransactionsSkeleton />;
  }

  // Show skeleton for loading project details
  if (selectedProject && isLoadingTransactions) {
    return <ProjectDetailsSkeleton />;
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
          <div className="flex gap-2">
            <Button
              onClick={() => handleForceRefresh()}
              variant="outline"
              className="flex items-center gap-2 border-gray-300"
            >
              <RefreshCw className="h-4 w-4" />
              Force Refresh
            </Button>
            <Button
              onClick={() => handleRefresh()}
              variant="outline"
              className="flex items-center gap-2 border-gray-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        <Card className="border-gray-300">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 font-geist mb-2">
              Failed to Load Projects
            </h3>
            <p className="text-gray-600 font-geist mb-4">{error}</p>
            <Button
              onClick={() => handleForceRefresh()}
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

  if (
    transactions.length === 0 &&
    !selectedProject &&
    !transactionSearchResult.transaction
  ) {
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
            onClick={() => handleForceRefresh()}
            variant="outline"
            className="flex items-center gap-2 border-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Force Refresh
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
              onClick={() => handleForceRefresh()}
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

  // If a transaction search result is found
  if (transactionSearchResult.transaction && !selectedProject) {
    const { project, transaction } = transactionSearchResult;

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
                Transaction Details
              </h2>
              <p className="text-gray-600 mt-1 text-sm font-geist">
                Transaction ID:{" "}
                {transaction.transaction_id ||
                  transaction.reference_number ||
                  "N/A"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setTransactionSearchResult({
                  project: null,
                  transaction: null,
                });
                setTransactionIdSearch("");
              }}
              variant="outline"
              className="flex items-center gap-2 border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Search
            </Button>
            {project && (
              <Button
                onClick={() => handleProjectClick(project)}
                variant="default"
                className="bg-gray-900 hover:bg-gray-800"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                View All Project Transactions
              </Button>
            )}
          </div>
        </div>

        {/* Transaction Details Card */}
        <Card className="border-gray-300 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">
                Transaction Information
              </CardTitle>
              {getTransactionStatusBadge(transaction.status)}
            </div>
            <CardDescription className="text-gray-600">
              Transaction found in project: {project?.project_id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Transaction Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Transaction ID:
                      </span>
                      <code className="font-mono text-sm font-semibold text-gray-900">
                        {transaction.transaction_id ||
                          transaction.reference_number ||
                          "N/A"}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyWithDecimal(transaction.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Payment Method:
                      </span>
                      <span className="font-medium text-gray-900 capitalize">
                        {transaction.payment_method?.replace("_", " ") || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {formatDateTime(transaction.created_at)}
                      </span>
                    </div>
                    {transaction.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Paid At:</span>
                        <span className="text-gray-900">
                          {formatDateTime(transaction.paid_at)}
                        </span>
                      </div>
                    )}
                    {transaction.due_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Due Date:</span>
                        <span className="text-gray-900">
                          {formatDate(transaction.due_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {transaction.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </h4>
                    <p className="text-sm text-gray-600">{transaction.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Project Information
                  </h4>
                  {project && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Project ID:
                        </span>
                        <code className="font-mono text-sm font-semibold text-gray-900">
                          {project.project_id}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Client:</span>
                        <span className="font-medium text-gray-900">
                          {project.clientName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Project Name:
                        </span>
                        <span className="font-medium text-gray-900">
                          {project.projectName || "Unnamed Project"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Project Value:
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrencyWithDecimal(project.totalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Project Status:
                        </span>
                        {getStatusBadge(project.status)}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Transaction Type
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 capitalize">
                        {transaction.type?.replace("_", " ") || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Amount:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyWithDecimal(transaction.total_amount)}
                      </span>
                    </div>
                    {transaction.payment_deadline && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Payment Deadline:
                        </span>
                        <span className="text-gray-900">
                          {formatDate(transaction.payment_deadline)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <PaymentDialog />

        {/* Manual Payment Dialog */}
        <ManualPaymentDialog />
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
          <div className="flex gap-2">
            <Button
              onClick={() => handleForceRefresh()}
              variant="outline"
              disabled={isLoadingTransactions}
              className="flex items-center gap-2 border-gray-300"
            >
              {isLoadingTransactions ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isLoadingTransactions ? "Loading..." : "Force Refresh"}
            </Button>
            <Button
              onClick={() => handleRefresh()}
              variant="outline"
              disabled={isLoadingTransactions}
              className="flex items-center gap-2 border-gray-300"
            >
              {isLoadingTransactions ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isLoadingTransactions ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Show loading spinner if transactions are loading */}
        {isLoadingTransactions ? (
          <LoadingSpinner text="Loading project transactions..." />
        ) : (
          <>
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
            <UnifiedPaymentDialog />
          </>
        )}
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
            Click on any project to view its transaction details. Data is cached
            for 5 minutes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleForceRefresh()}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2 border-gray-300"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? "Refreshing..." : "Force Refresh"}
          </Button>
          <Button
            onClick={() => handleRefresh()}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2 border-gray-300"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Cache status indicator */}
      <div className="mb-4 text-sm text-gray-500">
        {cache.has(ProjectTransactionsCache.getProjectsKey)
          ? "✓ Using cached data (5 min TTL)"
          : "Loading fresh data..."}
      </div>

      {/* Show loading state for stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-6 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-40"></div>
                </div>
                <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Project Stats Cards - NEW DESIGN */}
          <ProjectStatsCards
            totalValue={stats.totalValue}
            totalPaid={stats.totalPaid}
            totalBalance={stats.totalBalance}
            averagePaymentProgress={stats.averagePaymentProgress}
          />

          {/* Overall Payment Progress Bar */}
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

          {/* Project Status Cards - NEW DESIGN */}
          <ProjectStatusCards
            ongoing={stats.ongoing}
            completed={stats.completed}
            pending={stats.pending}
            totalProjects={stats.totalProjects}
          />
        </>
      )}

      {/* Search Tabs */}
      <Card className="border-gray-300 mb-6">
        <CardContent className="pt-6">
          <Tabs
            value={searchMode}
            onValueChange={(value) =>
              setSearchMode(value as "project" | "transaction")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">Search Projects</TabsTrigger>
              <TabsTrigger value="transaction">
                Search Transaction ID
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search Projects
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by client, project, email, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Progress
                  </label>
                  <Select
                    value={progressFilter}
                    onValueChange={setProgressFilter}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="All Progress" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Progress</SelectItem>
                      <SelectItem value="completed">
                        Completed (100%)
                      </SelectItem>
                      <SelectItem value="in-progress">
                        In Progress (1-99%)
                      </SelectItem>
                      <SelectItem value="not-started">
                        Not Started (0%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Newest First" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="value-high">
                        Value (High to Low)
                      </SelectItem>
                      <SelectItem value="value-low">
                        Value (Low to High)
                      </SelectItem>
                      <SelectItem value="name-asc">
                        Client Name (A-Z)
                      </SelectItem>
                      <SelectItem value="name-desc">
                        Client Name (Z-A)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transaction" className="space-y-4 pt-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Search Transaction ID
                    </label>
                    <div className="relative">
                      <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Enter transaction ID (e.g., TXN000001), reference number..."
                        value={transactionIdSearch}
                        onChange={(e) => setTransactionIdSearch(e.target.value)}
                        className="pl-10 border-gray-300"
                        disabled={isSearchingTransaction}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Search by transaction ID (TXN000001) or reference number
                    </p>
                  </div>

                  <div className="flex items-end space-y-2">
                    <Button
                      type="submit"
                      disabled={
                        isSearchingTransaction || !transactionIdSearch.trim()
                      }
                      className="w-full bg-gray-900 hover:bg-gray-800"
                    >
                      {isSearchingTransaction ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search Transaction
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Transaction search help text */}
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Search for transactions by:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Transaction ID (e.g., "TXN000001")</li>
                  <li>Reference Number (e.g., "REF123456")</li>
                  <li>Payment ID from payment gateways</li>
                  <li>Any unique transaction identifier</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* Items per page and clear filters - Only show for project search */}
          {searchMode === "project" && (
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">entries</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setProgressFilter("all");
                    setSortBy("newest");
                  }}
                  className="border-gray-300"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-600">
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                projects
                {searchTerm && (
                  <span className="ml-2 text-gray-500">
                    (filtered by "{searchTerm}")
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only show projects table if in project search mode */}
      {searchMode === "project" && (
        <>
          {/* Projects Table */}
          <Card className="border-gray-300 mb-6">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Confirmed Projects
              </CardTitle>
              <CardDescription className="text-gray-600">
                Click on any project to view its detailed transaction history.
                Data is cached for fast navigation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-pulse"
                      >
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-32"></div>
                          <div className="h-3 bg-gray-300 rounded w-48"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                          <div className="h-3 bg-gray-300 rounded w-20"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                          <div className="h-3 bg-gray-300 rounded w-20"></div>
                        </div>
                        <div className="h-6 bg-gray-300 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 font-geist mb-2">
                    No projects found
                  </h3>
                  <p className="text-gray-600 font-geist mb-4">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    progressFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "No projects available"}
                  </p>
                  {(searchTerm ||
                    statusFilter !== "all" ||
                    progressFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setProgressFilter("all");
                      }}
                      className="border-gray-300"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-gray-300">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-700">
                          Project Details
                        </TableHead>
                        <TableHead className="text-gray-700">Client</TableHead>
                        <TableHead className="text-gray-700">Value</TableHead>
                        <TableHead className="text-gray-700">
                          Timeline
                        </TableHead>
                        <TableHead className="text-gray-700">
                          Progress
                        </TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => {
                        const progress =
                          projectProgress[transaction.project_id] || 0;
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
                                  {formatCurrencyWithDecimal(
                                    transaction.totalValue
                                  )}
                                </span>
                                {transaction.totalPaid !== undefined && (
                                  <span className="text-sm text-gray-600">
                                    Paid:{" "}
                                    {formatCurrencyWithDecimal(
                                      transaction.totalPaid
                                    )}
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
                                        Start:{" "}
                                        {formatDate(transaction.startDate)}
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
                                      Started:{" "}
                                      {formatDate(transaction.startDate)}
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
                                    Confirmed:{" "}
                                    {formatDate(transaction.confirmedAt)}
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
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && !isLoading && (
            <Card className="border-gray-300">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredTransactions.length
                    )}{" "}
                    of {filteredTransactions.length} projects
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Items per page selector */}
                    <div className="flex items-center gap-2 mr-4">
                      <span className="text-sm text-gray-600">
                        Rows per page:
                      </span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pagination buttons */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum > totalPages) return null;

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`border-gray-300 ${
                                currentPage === pageNum
                                  ? "bg-gray-900 hover:bg-gray-800"
                                  : ""
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}

                      {/* Ellipsis for many pages */}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2 text-gray-400">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="border-gray-300"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Stats */}
          {!isLoading && filteredTransactions.length > 0 && (
            <div className="mt-6 text-sm text-gray-600">
              <p>
                Showing {filteredTransactions.length} filtered projects of{" "}
                {transactions.length} total. Click any project to view
                transactions.
              </p>
            </div>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <PaymentDialog />

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog />
    </div>
  );
};

export default ProjectTransactions;
