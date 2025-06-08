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
  const [createdBy, setCreatedBy] = useState<string>("Admin");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoanOffer, setIsLoanOffer] = useState<boolean>(false);
  const [maxLoanYears, setMaxLoanYears] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("");
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

  const handleMaxLoanYearsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setMaxLoanYears(value);
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

    if (isLoanOffer && (!maxLoanYears || !interestRate)) {
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
    formData.append("createdBy", createdBy);
    if (isLoanOffer) {
      formData.append("maxLoanYears", maxLoanYears);
      formData.append("interestRate", interestRate);
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
      setCreatedBy("Admin");
      setImages([]);
      setPreviews([]);
      setIsLoanOffer(false);
      setMaxLoanYears("");
      setInterestRate("");
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
      <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white">
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter design name"
            className="rounded-none"
            required
          />
        </div>
        <div>
          <Label htmlFor="description" className="mb-2 block">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="rounded-none"
            required
          />
        </div>
        <div>
          <Label htmlFor="createdBy" className="mb-2 block">
            Created By
          </Label>
          <Input
            id="createdBy"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Enter creator's name"
            className="rounded-none"
            required
          />
        </div>
        <div>
          <Label htmlFor="category" className="mb-2 block">
            Category
          </Label>
          <Select onValueChange={handleCategoryChange} value={category}>
            <SelectTrigger className="rounded-none">
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
              className="mt-2 rounded-none"
              required
            />
          )}
        </div>
        <div>
          <Label htmlFor="estimated_cost" className="mb-2 block">
            Estimated Cost (₱)
          </Label>
          <Input
            id="estimated_cost"
            type="text"
            value={estimatedCost ? `₱${estimatedCost}` : ""}
            onChange={handleEstimatedCostChange}
            placeholder="Enter estimated cost"
            className="rounded-none"
            required
          />
        </div>
        <div>
          <Label htmlFor="number_of_rooms" className="mb-2 block">
            Number of Rooms
          </Label>
          <Input
            id="number_of_rooms"
            type="text"
            value={numberOfRooms}
            onChange={handleNumberOfRoomsChange}
            placeholder="Enter number of rooms"
            className="rounded-none"
            maxLength={2}
            required
          />
        </div>
        <div>
          <Label htmlFor="square_meters" className="mb-2 block">
            Square Meters (sqm)
          </Label>
          <Input
            id="square_meters"
            type="text"
            value={squareMeters}
            onChange={handleSquareMetersChange}
            placeholder="Enter square meters"
            className="rounded-none"
            required
          />
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="isLoanOffer" className="mb-2 block">
            Offer Loan
          </Label>
          <Switch
            id="isLoanOffer"
            checked={isLoanOffer}
            onCheckedChange={setIsLoanOffer}
          />
        </div>
        {isLoanOffer && (
          <>
            <div>
              <Label htmlFor="maxLoanYears" className="mb-2 block">
                Max Loan Term (Years)
              </Label>
              <Input
                id="maxLoanYears"
                type="text"
                value={maxLoanYears}
                onChange={handleMaxLoanYearsChange}
                placeholder="Enter loan term (1-30)"
                className="rounded-none"
                maxLength={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="interestRate" className="mb-2 block">
                Interest Rate (% per year)
              </Label>
              <Input
                id="interestRate"
                type="text"
                value={interestRate}
                onChange={handleInterestRateChange}
                placeholder="Enter interest rate (e.g., 5.5)"
                className="rounded-none"
                required
              />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="images" className="mb-2 block">
            Images
          </Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="rounded-none"
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {previews.map((preview: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="h-32 w-full object-cover rounded"
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
          className="mt-6 bg-gray-800 text-white rounded-none hover:bg-gray-700"
        >
          {isSubmitting ? "Adding..." : "Add Design"}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
