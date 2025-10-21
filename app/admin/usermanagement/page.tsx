// app/admin/usermanagement/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { UserManagementTable } from "@/components/admin/usermanagement/UserManagementTable";
import { UserForm } from "@/components/admin/usermanagement/UserForm";
import { EditUserModal } from "@/components/admin/usermanagement/EditUserModal";
import { CreateUserFormModal } from "@/components/admin/usermanagement/CreateUserFormModal";
import { getUsers } from "@/action/userManagement";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  X,
  Filter,
  Download,
  ChevronDown,
  Users,
  UserCheck,
  UserCog,
  UserX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useModalStore } from "@/lib/stores";
import NotFound from "@/components/admin/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

// Define the User type locally since it doesn't exist in types/user
interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "all" | "verified" | "unverified";
type RoleFilter = "all" | string;

// Skeleton component for the table
const TableSkeleton = () => {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border-b">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    user_id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    contactNo: true,
    verified: true,
    createdAt: true,
    actions: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { isCreateAccountOpen, setIsCreateAccountOpen, createAccountData } =
    useModalStore();

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const result = await getUsers();
        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          toast.error(result.error || "Failed to fetch users");
        }
      } catch (error) {
        toast.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Get unique roles for filtering
  const roles = useMemo(() => {
    const uniqueRoles = new Set<string>();
    users.forEach((user) => {
      if (user.role) {
        uniqueRoles.add(user.role);
      }
    });
    return Array.from(uniqueRoles).sort();
  }, [users]);

  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter with null checks
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const searchableFields = [
          user.firstName?.toLowerCase() || "",
          user.lastName?.toLowerCase() || "",
          user.email?.toLowerCase() || "",
          user.role?.toLowerCase() || "",
          user.contactNo || "",
          user.user_id?.toLowerCase() || "",
        ];

        const hasMatch = searchableFields.some((field) =>
          field.includes(query)
        );

        if (!hasMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "verified" && !user.verified) return false;
        if (statusFilter === "unverified" && user.verified) return false;
      }

      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, filteredUsers.length]);

  // Calculate user stats
  const userStats = useMemo(() => {
    const verified = filteredUsers.filter((user) => user.verified).length;
    const unverified = filteredUsers.filter((user) => !user.verified).length;
    const admins = filteredUsers.filter((user) => user.role === "admin").length;
    const usersCount = filteredUsers.filter(
      (user) => user.role === "user"
    ).length;

    return {
      verified,
      unverified,
      admins,
      users: usersCount,
      total: filteredUsers.length,
    };
  }, [filteredUsers]);

  const hasActiveFilters = useMemo(
    () => searchTerm || statusFilter !== "all" || roleFilter !== "all",
    [searchTerm, statusFilter, roleFilter]
  );

  // Handle user addition
  const handleAddUser = (user: User) => {
    setUsers([...users, user]);
    toast.success("User added successfully");
  };

  // Handle user update
  const handleUpdate = (updatedUser: User) => {
    setUsers(
      users.map((user) =>
        user.user_id === updatedUser.user_id ? updatedUser : user
      )
    );
    toast.success("User updated successfully");
  };

  // Handle user status toggle
  const handleToggleStatus = (userId: string, verified: boolean) => {
    setUsers(
      users.map((user) =>
        user.user_id === userId ? { ...user, verified } : user
      )
    );
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const formatDateForExport = (dateString: string): string => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return "";
      }
    };

    const headers = [
      columnVisibility.user_id && "User ID",
      columnVisibility.firstName && "First Name",
      columnVisibility.lastName && "Last Name",
      columnVisibility.email && "Email",
      columnVisibility.role && "Role",
      columnVisibility.contactNo && "Contact No",
      columnVisibility.verified && "Verified",
      columnVisibility.createdAt && "Created At",
      "Address",
    ].filter(Boolean) as string[];

    const rows = filteredUsers.map((user) => {
      return [
        columnVisibility.user_id && user.user_id,
        columnVisibility.firstName && user.firstName,
        columnVisibility.lastName && user.lastName,
        columnVisibility.email && user.email,
        columnVisibility.role && user.role,
        columnVisibility.contactNo && (user.contactNo || ""),
        columnVisibility.verified && (user.verified ? "Yes" : "No"),
        columnVisibility.createdAt && formatDateForExport(user.createdAt),
        user.address || "",
      ].filter((cell, index) => headers[index] !== undefined && cell !== false);
    });

    const exportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const customHeader = [
      "GIAN CONSTRUCTION & SUPPLIES",
      "JY Pereze Avenue, Kabankalan City",
      "USER MANAGEMENT REPORT",
      "",
      `Report Date: ${exportDate}`,
      `Total Users: ${filteredUsers.length}`,
      `Verified Users: ${userStats.verified}`,
      `Administrators: ${userStats.admins}`,
      "", // Empty line for spacing
    ];

    const csvContent = [
      ...customHeader.map((line) => `"${line}"`),
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Gian_Construction_User_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("User report exported to CSV");
  }, [filteredUsers, columnVisibility, userStats]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("all");
  }, []);

  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleAddUserClick = () => {
    setIsCreateAccountOpen(true);
  };

  const handleCancelAddUser = () => {
    setIsCreateAccountOpen(false);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push(-1); // -1 represents ellipsis
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push(-2); // -2 represents ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="p-6 max-w-7xl overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-secondary">
          User Management
        </h1>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="rounded-sm shadow-none border">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {userStats.total}
              </p>
              <p className="text-sm font-semibold text-gray-600">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-none border">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {userStats.verified}
              </p>
              <p className="text-sm font-semibold text-gray-600">Verified</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-none border">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {userStats.admins}
              </p>
              <p className="text-sm font-semibold text-gray-600">
                Administrators
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-none border">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {userStats.unverified}
              </p>
              <p className="text-sm font-semibold text-gray-600">Unverified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users by name, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 rounded-sm border-gray-200 border-1 border-b-0 font-geist h-8 text-sm"
              />
              {searchTerm && (
                <X
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>

            <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-sm gap-2 font-geist"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center bg-gray-900 text-white"
                    >
                      !
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white font-geist"
                align="start"
              >
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className={statusFilter === "all" ? "bg-gray-100" : ""}
                    onClick={() => setStatusFilter("all")}
                  >
                    All Users
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={statusFilter === "verified" ? "bg-gray-100" : ""}
                    onClick={() => setStatusFilter("verified")}
                  >
                    Verified
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={
                      statusFilter === "unverified" ? "bg-gray-100" : ""
                    }
                    onClick={() => setStatusFilter("unverified")}
                  >
                    Unverified
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {roles.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        className={roleFilter === "all" ? "bg-gray-100" : ""}
                        onClick={() => setRoleFilter("all")}
                      >
                        All Roles
                      </DropdownMenuItem>
                      {roles.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          className={roleFilter === role ? "bg-gray-100" : ""}
                          onClick={() => setRoleFilter(role)}
                        >
                          {role}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </>
                )}

                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilters}>
                      Clear Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-sm text-gray-600 hover:text-gray-900 font-geist"
              >
                Clear
                <X className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCSV}
              className="rounded-sm font-geist gap-2"
              disabled={filteredUsers.length === 0}
              title={filteredUsers.length === 0 ? "No users to export" : ""}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={handleAddUserClick}
              variant="default"
              size="sm"
              className="rounded-sm whitespace-nowrap font-geist"
            >
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </div>

        {/* User Table Content */}
        {isLoading ? (
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5">
                <div>
                  <CardTitle className="text-foreground-900 font-geist">
                    User Management
                  </CardTitle>
                  <CardDescription className="font-geist">
                    Loading users...
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton />
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          users.length === 0 ? (
            <NotFound
              title="No users found in the system"
              description="Get started by adding your first user to manage your construction team and clients."
            />
          ) : (
            <Card className="max-w-md mx-auto rounded-sm shadow-none border">
              <CardContent className="pt-2">
                <div className="text-center p-8">
                  <h3 className="text-xl font-semibold text-gray-900 font-geist">
                    No users found
                  </h3>
                  <p className="text-gray-600 mt-2 font-geist">
                    {hasActiveFilters
                      ? "Try adjusting your filters or search query."
                      : "No users match your current criteria."}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      variant="default"
                      size="sm"
                      className="mt-4 rounded-sm font-geist"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="w-full rounded-sm shadow-none border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5">
                <div>
                  <CardTitle className="text-foreground-900 font-geist">
                    User Management
                  </CardTitle>
                  <CardDescription className="font-geist">
                    View and manage all users in your system
                    {hasActiveFilters && " (filtered)"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-sm font-geist gap-2"
                    >
                      Columns <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.user_id}
                      onCheckedChange={() => toggleColumnVisibility("user_id")}
                    >
                      User ID
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.firstName}
                      onCheckedChange={() =>
                        toggleColumnVisibility("firstName")
                      }
                    >
                      First Name
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.lastName}
                      onCheckedChange={() => toggleColumnVisibility("lastName")}
                    >
                      Last Name
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.email}
                      onCheckedChange={() => toggleColumnVisibility("email")}
                    >
                      Email
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.role}
                      onCheckedChange={() => toggleColumnVisibility("role")}
                    >
                      Role
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.contactNo}
                      onCheckedChange={() =>
                        toggleColumnVisibility("contactNo")
                      }
                    >
                      Contact No
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.verified}
                      onCheckedChange={() => toggleColumnVisibility("verified")}
                    >
                      Verified
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.createdAt}
                      onCheckedChange={() =>
                        toggleColumnVisibility("createdAt")
                      }
                    >
                      Created At
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={columnVisibility.actions}
                      onCheckedChange={() => toggleColumnVisibility("actions")}
                    >
                      Actions
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full rounded-sm border">
                <UserManagementTable
                  users={currentUsers}
                  onUpdate={handleUpdate}
                  onToggleStatus={handleToggleStatus}
                  columnVisibility={columnVisibility}
                />
              </div>

              {/* Pagination - Always visible */}
              {filteredUsers.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <span>•</span>
                    <span>{filteredUsers.length} total users</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) =>
                        page === -1 || page === -2 ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-sm text-gray-500"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                            className={`h-8 w-8 p-0 text-xs ${
                              currentPage === page
                                ? "bg-gray-900 text-white"
                                : ""
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Items Per Page Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal onUpdate={handleUpdate} />

      {/* Create User Form Modal */}
      <CreateUserFormModal />
    </div>
  );
}
