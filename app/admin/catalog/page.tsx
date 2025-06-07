"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "sonner";
import CatalogForm from "@/components/admin/catalog/Form";
import CatalogList from "@/components/admin/catalog/CatalogList";
import { getDesigns } from "@/action/designs";
import { Design } from "@/types/design";
import { toast } from "sonner";

export default function CatalogPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [activeTab, setActiveTab] = useState<string>("list");

  // Fetch designs on mount
  useEffect(() => {
    async function fetchDesigns() {
      const result = await getDesigns();
      if (result.success && result.designs) {
        setDesigns(result.designs);
      } else {
        toast.error(result.error || "Failed to fetch designs");
      }
    }
    fetchDesigns();
  }, []);

  // Handle design addition
  const handleAddDesign = (design: Design) => {
    setDesigns([...designs, design]);
    setActiveTab("list"); // Switch to Catalog List after adding
  };

  // Handle design deletion
  const handleDelete = (id: string) => {
    setDesigns(designs.filter((design: Design) => design._id !== id));
  };

  return (
    <div className="p-6 max-w-7xl">
      <Toaster />
      <h1 className="text-2xl font-bold text-text-secondary mb-6">
        Design Catalog
      </h1>

      {/* Catalog Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="list">Catalog List</TabsTrigger>
          <TabsTrigger value="add">Add Catalog</TabsTrigger>
        </TabsList>
        <hr className="my-4 border-t border-gray-200" />
        <TabsContent value="list">
          <CatalogList
            designs={designs}
            onDelete={handleDelete}
            onAddTemplate={() => setActiveTab("add")}
          />
        </TabsContent>
        <TabsContent value="add">
          <div className="flex justify-start">
            <CatalogForm onAddDesign={handleAddDesign} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
