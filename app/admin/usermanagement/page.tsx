// app/admin/usermanagement/page.tsx
"use client";

import { UserManagementTable } from "@/components/admin/usermanagement/UserManagementTable";
import { CreateUserFormModal } from "@/components/admin/usermanagement/CreateUserFormModal";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";

export default function UserManagement() {
  const { setIsCreateAccountOpen } = useModalStore();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-[var(--orange)]">
        User Management
      </h1>
      <div className="mb-6">
        <Button
          onClick={() => setIsCreateAccountOpen(true)}
          className="bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90"
        >
          Create New User
        </Button>
      </div>
      <UserManagementTable />
      <CreateUserFormModal />
    </div>
  );
}
