import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModalStore } from "@/lib/stores";
import { SupplierFormData } from "@/types/supplier";

interface AddSupplierModalProps {
  onAdd: (supplier: SupplierFormData) => void;
}

export function AddSupplierModal({ onAdd }: AddSupplierModalProps) {
  // FIX: Use isCreateSupplierOpen instead of isCreateProjectOpen
  const { isCreateSupplierOpen, setIsCreateSupplierOpen } = useModalStore();
  const [formData, setFormData] = useState<SupplierFormData>({
    companyName: "",
    contactPerson: "",
    contact: "",
    email: "",
    location: "",
    status: "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate contact is exactly 11 digits
    if (!/^\d{11}$/.test(formData.contact)) {
      alert("Contact must be exactly 11 digits");
      return;
    }

    onAdd(formData);
    setFormData({
      companyName: "",
      contactPerson: "",
      contact: "",
      email: "",
      location: "",
      status: "active",
    });
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, contact: value });
  };

  // FIX: Use isCreateSupplierOpen and setIsCreateSupplierOpen
  return (
    <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new supplier to your system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact (11 digits) *</Label>
            <Input
              id="contact"
              type="tel"
              value={formData.contact}
              onChange={handleContactChange}
              placeholder="09123456789"
              pattern="\d{11}"
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be exactly 11 digits (e.g., 09123456789)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive" | "pending") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              // FIX: Use setIsCreateSupplierOpen
              onClick={() => setIsCreateSupplierOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Supplier</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
