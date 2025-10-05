// app/user/layout.tsx
import AppSidebar from "@/components/user/Sidebar";
import { UserNavbar } from "@/components/user/UserNavbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <UserNavbar />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
