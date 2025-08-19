"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    setActiveTab("list");
  };

  // Handle design deletion
  const handleDelete = (id: string) => {
    setDesigns(designs.filter((design: Design) => design.design_id !== id)); // Changed from _id to design_id
  };

  // Handle design update
  const handleUpdate = (updatedDesign: Design) => {
    setDesigns(
      designs.map(
        (design) =>
          design.design_id === updatedDesign.design_id ? updatedDesign : design // Changed from _id to design_id
      )
    );
  };

  return (
    <div className="p-6 max-w-7xl overflow-y-auto">
      <h1 className="text-2xl font-bold text-text-secondary mb-6">
        Design Catalog
      </h1>

      {/* Catalog Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Catalog List</TabsTrigger>
          <TabsTrigger value="add">Add Catalog</TabsTrigger>
        </TabsList>
        <hr className="my-4 border-t border-gray-200" />
        <TabsContent value="list">
          <CatalogList
            designs={designs}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
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
