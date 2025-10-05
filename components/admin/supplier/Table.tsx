import { ISupplier } from "@/types/supplier";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  MapPin,
  Phone,
  Mail,
  Building,
  User,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

interface SupplierTableProps {
  suppliers: ISupplier[];
  loading: boolean;
  onDelete: (supplier: ISupplier) => void;
  onEdit?: (supplier: ISupplier) => void;
  onView?: (supplier: ISupplier) => void;
}

export function SupplierTable({
  suppliers,
  loading,
  onDelete,
  onEdit,
  onView,
}: SupplierTableProps) {
  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-sm border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-3">ID</TableHead>
                <TableHead className="px-3">Company</TableHead>
                <TableHead className="px-3">Contact Person</TableHead>
                <TableHead className="px-3">Contact</TableHead>
                <TableHead className="px-3">Email</TableHead>
                <TableHead className="px-3">Location</TableHead>
                <TableHead className="px-3">Status</TableHead>
                <TableHead className="px-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <TableCell
                      key={`skeleton-cell-${index}-${cellIndex}`}
                      className="px-3"
                    >
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
        <div className="text-muted-foreground mb-4">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No suppliers found
        </h3>
        <p className="text-sm text-muted-foreground">
          Get started by adding your first supplier.
        </p>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatContact = (contact: string | undefined | null) => {
    if (!contact) return "N/A";

    // Remove any non-digit characters first
    const digitsOnly = contact.replace(/\D/g, "");

    // Format as XXX-XXX-XXXX if we have 11 digits
    if (digitsOnly.length === 11) {
      return digitsOnly.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");
    }

    // Return as is if not exactly 11 digits
    return contact;
  };

  return (
    <div className="w-full overflow-hidden rounded-sm border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3">ID</TableHead>
              <TableHead className="px-3">Company</TableHead>
              <TableHead className="px-3">Contact Person</TableHead>
              <TableHead className="px-3">Contact</TableHead>
              <TableHead className="px-3">Email</TableHead>
              <TableHead className="px-3">Location</TableHead>
              <TableHead className="px-3">Status</TableHead>
              <TableHead className="px-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <React.Fragment key={supplier.supplier_id}>
                <TableRow className="group hover:bg-gray-50">
                  <TableCell className="px-3 py-2 font-mono text-xs">
                    {supplier.supplier_id}
                  </TableCell>

                  <TableCell className="px-3 py-2 font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[120px]">
                        {supplier.companyName}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-2 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[120px]">
                        {supplier.contactPerson}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-2 font-mono text-xs">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{formatContact(supplier.contact)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Contact: {formatContact(supplier.contact)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    {supplier.email ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[120px]">
                                {supplier.email}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Email: {supplier.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[120px]">
                              {supplier.location}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Location: {supplier.location}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <Badge
                      variant={getStatusVariant(supplier.status)}
                      className="text-xs capitalize"
                    >
                      {supplier.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {onView && (
                          <DropdownMenuItem
                            onClick={() => onView(supplier)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(supplier)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit supplier
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDelete(supplier)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete supplier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
