import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { updateDesign } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";

interface EditingCatalogProps {
  design: Design;
  onCancel: () => void;
  onUpdate: (updatedDesign: Design) => void;
}

export default function EditingCatalog({
  design,
  onCancel,
  onUpdate,
}: EditingCatalogProps) {
  const [isLoanOffer, setIsLoanOffer] = useState(design.isLoanOffer);
  const [price, setPrice] = useState(
    design.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
  const [squareMeters, setSquareMeters] = useState(
    design.square_meters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
  const [category, setCategory] = useState(
    design.category.startsWith("Custom:") ? "custom" : design.category
  );
  const [customCategory, setCustomCategory] = useState(
    design.category.startsWith("Custom:")
      ? design.category.replace("Custom:", "")
      : ""
  );
  const [maxLoanTerm, setMaxLoanTerm] = useState(
    design.maxLoanTerm ? design.maxLoanTerm.toString() : ""
  );
  const [loanTermType, setLoanTermType] = useState<"months" | "years">(
    design.loanTermType || "years"
  );
  const [interestRate, setInterestRate] = useState(
    design.interestRate ? design.interestRate.toString() : ""
  );
  const [interestRateType, setInterestRateType] = useState<
    "monthly" | "yearly"
  >(design.interestRateType || "yearly");

  useEffect(() => {
    setIsLoanOffer(design.isLoanOffer);
    setPrice(design.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    setSquareMeters(
      design.square_meters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    );
    setCategory(
      design.category.startsWith("Custom:") ? "custom" : design.category
    );
    setCustomCategory(
      design.category.startsWith("Custom:")
        ? design.category.replace("Custom:", "")
        : ""
    );
    setMaxLoanTerm(design.maxLoanTerm ? design.maxLoanTerm.toString() : "");
    setLoanTermType(design.loanTermType || "years");
    setInterestRate(design.interestRate ? design.interestRate.toString() : "");
    setInterestRateType(design.interestRateType || "yearly");
  }, [design]);

  const handleDeleteImage = (index: number) => {
    const newImages = design.images.filter((_, i) => i !== index);
    onUpdate({ ...design, images: newImages });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value !== "custom") {
      setCustomCategory("");
    }
  };

  const handleMaxLoanTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const maxLength = loanTermType === "years" ? 2 : 3;
    setMaxLoanTerm(value.slice(0, maxLength));
  };

  const handleInterestRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts[1] && parts[1].length > 2) return;
    setInterestRate(value);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    formData.append("existingImages", JSON.stringify(design.images));
    formData.set("createdBy", design.createdBy || "Admin");

    // Handle category
    const finalCategory =
      category === "custom" && customCategory
        ? `Custom:${customCategory}`
        : category;
    formData.set("category", finalCategory);

    // Handle isLoanOffer explicitly
    formData.set("isLoanOffer", isLoanOffer.toString());

    // Handle loan fields
    if (isLoanOffer) {
      // Convert loan term based on type (years to months if needed)
      let loanTermValue = parseInt(maxLoanTerm);
      if (loanTermType === "years") {
        loanTermValue = loanTermValue * 12; // Convert years to months
      }
      formData.set("maxLoanTerm", loanTermValue.toString());
      formData.set("loanTermType", loanTermType);
      formData.set("interestRate", interestRate);
      formData.set("interestRateType", interestRateType);
    } else {
      formData.set("maxLoanTerm", "null");
      formData.set("loanTermType", "null");
      formData.set("interestRate", "null");
      formData.set("interestRateType", "null");
    }

    // Handle images as an array of File objects
    const fileInput = e.currentTarget.querySelector<HTMLInputElement>(
      'input[name="images"]'
    );
    if (fileInput && fileInput.files) {
      const files = Array.from(fileInput.files).filter(
        (file): file is File => file instanceof File
      );
      if (files.length > 0) {
        files.forEach((file) => formData.append("images", file));
      } else {
        formData.delete("images"); // Remove any default empty value
      }
    }

    // Set parsed numeric values for price and square_meters
    formData.set("price", price.replace(/[^0-9.]/g, ""));
    formData.set("square_meters", squareMeters.replace(/[^0-9.]/g, ""));

    const result = await updateDesign(design.design_id, formData);
    if (result.success && result.design) {
      onUpdate(result.design);
      onCancel();
      toast.success("Design updated successfully!");
    } else {
      toast.error(result.error || "Failed to update design");
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (/^\d*\.?\d*$/.test(value)) {
      setPrice(value.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    }
  };

  const handleSquareMetersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (/^\d*\.?\d*$/.test(value)) {
      setSquareMeters(value.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="flex items-center gap-2 text-[var(--orange)] hover:bg-orange-50"
        >
          <X className="h-4 w-4" />
          Back to Catalog
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">
          Edit Design:{" "}
          {design.name.charAt(0).toUpperCase() + design.name.slice(1)}
        </h2>
        <div className="w-10"></div>
      </div>

      <form
        onSubmit={handleEditSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={
                design.name.charAt(0).toUpperCase() + design.name.slice(1)
              }
              className="w-full"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </Label>
            <Input
              id="description"
              name="description"
              defaultValue={design.description}
              className="w-full"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price (₱)
            </Label>
            <Input
              id="price"
              name="price"
              value={price}
              onChange={handlePriceChange}
              className="w-full"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="square_meters"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Area (sqm)
            </Label>
            <Input
              id="square_meters"
              name="square_meters"
              value={squareMeters}
              onChange={handleSquareMetersChange}
              className="w-full"
              placeholder="0"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="office">Office Buildings</SelectItem>
                <SelectItem value="custom">Customized Category</SelectItem>
              </SelectContent>
            </Select>
            {category === "custom" && (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category"
                className="mt-2 w-full"
                required
              />
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <Label
              htmlFor="isLoanOffer"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Offer Loan
            </Label>
            <Switch
              id="isLoanOffer"
              checked={isLoanOffer}
              onCheckedChange={setIsLoanOffer}
              className="focus:ring-[var(--orange)]"
            />
          </div>
          {isLoanOffer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="maxLoanTerm"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Max Loan Term
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="maxLoanTerm"
                    value={maxLoanTerm}
                    onChange={handleMaxLoanTermChange}
                    placeholder={`Enter loan term in ${loanTermType}`}
                    className="flex-1"
                    maxLength={loanTermType === "years" ? 2 : 3}
                  />
                  <Select
                    value={loanTermType}
                    onValueChange={(value: "months" | "years") =>
                      setLoanTermType(value)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Term type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="interestRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Interest Rate
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="interestRate"
                    value={interestRate}
                    onChange={handleInterestRateChange}
                    placeholder="Enter interest rate"
                    className="flex-1"
                  />
                  <Select
                    value={interestRateType}
                    onValueChange={(value: "monthly" | "yearly") =>
                      setInterestRateType(value)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Rate type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">% per year</SelectItem>
                      <SelectItem value="monthly">% per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <Input
            type="hidden"
            id="createdBy"
            name="createdBy"
            value={design.createdBy || "Admin"}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <Label className="block text-sm font-medium text-gray-700">
            Current Images
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {design.images.map((url: string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Current image ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label
            htmlFor="images"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Upload New Images
          </Label>
          <Input
            id="images"
            name="images"
            type="file"
            multiple
            accept="image/*"
            className="w-full"
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
