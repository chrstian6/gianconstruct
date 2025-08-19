import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";
import { addDesign } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";

interface CatalogFormProps {
  onAddDesign: (design: Design) => void;
}

export default function CatalogForm({ onAddDesign }: CatalogFormProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [estimatedCost, setEstimatedCost] = useState<string>("");
  const [numberOfRooms, setNumberOfRooms] = useState<string>("");
  const [squareMeters, setSquareMeters] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoanOffer, setIsLoanOffer] = useState<boolean>(false);
  const [maxLoanTerm, setMaxLoanTerm] = useState<string>("");
  const [loanTermType, setLoanTermType] = useState<"months" | "years">("years");
  const [interestRate, setInterestRate] = useState<string>("");
  const [interestRateType, setInterestRateType] = useState<
    "monthly" | "yearly"
  >("yearly");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formatNumberWithCommas = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleEstimatedCostChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setEstimatedCost(formatNumberWithCommas(value));
  };

  const handleNumberOfRoomsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setNumberOfRooms(value);
  };

  const handleSquareMetersChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setSquareMeters(formatNumberWithCommas(value));
  };

  const handleMaxLoanTermChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    // Set appropriate max length based on term type
    const maxLength = loanTermType === "years" ? 2 : 3;
    setMaxLoanTerm(value.slice(0, maxLength));
  };

  const handleInterestRateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts[1] && parts[1].length > 2) return;
    setInterestRate(value);
  };

  const handleCategoryChange = (value: string): void => {
    setCategory(value);
    if (value !== "custom") {
      setCustomCategory("");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files: File[] = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    const newPreviews: string[] = files.map((file: File) =>
      URL.createObjectURL(file)
    );
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number): void => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalCategory =
      category === "custom" && customCategory
        ? `Custom:${customCategory}`
        : category;

    if (!finalCategory) {
      toast.error("Please select or enter a category");
      setIsSubmitting(false);
      return;
    }

    if (isLoanOffer && (!maxLoanTerm || !interestRate)) {
      toast.error("Please provide loan term and interest rate");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", estimatedCost.replace(/,/g, ""));
    formData.append("number_of_rooms", numberOfRooms);
    formData.append("square_meters", squareMeters.replace(/,/g, ""));
    formData.append("category", finalCategory);
    formData.append("isLoanOffer", isLoanOffer.toString());
    if (isLoanOffer) {
      formData.append("maxLoanTerm", maxLoanTerm);
      formData.append("loanTermType", loanTermType);
      formData.append("interestRate", interestRate);
      formData.append("interestRateType", interestRateType);
    }
    images.forEach((image: File) => formData.append("images", image));

    const result = await addDesign(formData);

    if (result.success && result.design) {
      onAddDesign(result.design);
      setName("");
      setDescription("");
      setEstimatedCost("");
      setNumberOfRooms("");
      setSquareMeters("");
      setCategory("");
      setCustomCategory("");
      setImages([]);
      setPreviews([]);
      setIsLoanOffer(false);
      setMaxLoanTerm("");
      setInterestRate("");
      setLoanTermType("years");
      setInterestRateType("yearly");
      toast.success("Design added successfully!");
    } else {
      toast.error(result.error || "Failed to add design");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="mb-8 w-full">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 bg-white z-10 py-4">
        Add New Design
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-4 bg-white rounded-lg shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter design name"
              className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category
            </Label>
            <Select onValueChange={handleCategoryChange} value={category}>
              <SelectTrigger className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md">
                <SelectValue placeholder="Select category" />
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
                id="custom_category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category"
                className="mt-2 w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
                required
              />
            )}
          </div>
          <div>
            <Label
              htmlFor="estimated_cost"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Estimated Cost (₱)
            </Label>
            <Input
              id="estimated_cost"
              type="text"
              value={estimatedCost ? `₱${estimatedCost}` : ""}
              onChange={handleEstimatedCostChange}
              placeholder="Enter estimated cost"
              className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="number_of_rooms"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Number of Rooms
            </Label>
            <Input
              id="number_of_rooms"
              type="text"
              value={numberOfRooms}
              onChange={handleNumberOfRoomsChange}
              placeholder="Enter number of rooms"
              className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
              maxLength={2}
              required
            />
          </div>
          <div>
            <Label
              htmlFor="square_meters"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Square Meters (sqm)
            </Label>
            <Input
              id="square_meters"
              type="text"
              value={squareMeters}
              onChange={handleSquareMetersChange}
              placeholder="Enter square meters"
              className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
              required
            />
          </div>
          <div className="flex items-center gap-4">
            <Label
              htmlFor="isLoanOffer"
              className="block text-sm font-medium text-gray-700 mb-2"
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
            <>
              <div className="flex items-center gap-4">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term Type
                </Label>
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
              <div>
                <Label
                  htmlFor="maxLoanTerm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Max Loan Term ({loanTermType})
                </Label>
                <Input
                  id="maxLoanTerm"
                  type="text"
                  value={maxLoanTerm}
                  onChange={handleMaxLoanTermChange}
                  placeholder={`Enter loan term in ${loanTermType}`}
                  className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
                  maxLength={loanTermType === "years" ? 2 : 3}
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="interestRate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Interest Rate
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="interestRate"
                    type="text"
                    value={interestRate}
                    onChange={handleInterestRateChange}
                    placeholder="Enter interest rate"
                    className="flex-1 border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
                    required
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
            </>
          )}
        </div>
        <div>
          <Label
            htmlFor="images"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Images
          </Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] rounded-md"
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {previews.map((preview: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="h-32 w-full object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 bg-[var(--orange)] text-white rounded-md hover:bg-[var(--orange)]/90"
        >
          {isSubmitting ? "Adding..." : "Add Design"}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
