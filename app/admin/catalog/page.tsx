// app/admin/catalog/page.tsx
import CatalogList from "@/components/admin/catalog/CatalogList";
import { Suspense } from "react";

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      }
    >
      <CatalogList />
    </Suspense>
  );
}
