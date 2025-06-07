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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle estimated cost input
  const handleEstimatedCostChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setEstimatedCost(formatNumberWithCommas(value));
  };

  // Handle number of rooms input (2 digits max)
  const handleNumberOfRoomsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setNumberOfRooms(value);
  };

  // Handle square meters input (integers only, commas)
  const handleSquareMetersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setSquareMeters(formatNumberWithCommas(value));
  };

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value !== "custom") {
      setCustomCategory("");
    }
    console.log("Category selected:", value);
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    const newPreviews: string[] = files.map((file: File) =>
      URL.createObjectURL(file)
    );
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalCategory =
      category === "custom" && customCategory
        ? `Custom: ${customCategory}`
        : category;
    console.log("Final category:", finalCategory);

    if (!finalCategory) {
      toast.error("Please select or enter a category");
      setIsSubmitting(false);
      return;
    }

    const formData: FormData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", estimatedCost.replace(/,/g, ""));
    formData.append("number_of_rooms", numberOfRooms);
    formData.append("square_meters", squareMeters.replace(/,/g, ""));
    formData.append("category", finalCategory);
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
      toast.success("Design added successfully!");
    } else {
      toast.error(result.error || "Failed to add design");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="mb-8 overflow-y-auto max-h-[calc(100vh-200px)] w-full">
      <h2 className="text-xl font-semibold text-text-secondary mb-6 sticky top-0 bg-white z-10 py-4">
        Add New Design
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white w-full">
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder="Enter design description"
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomCategory(e.target.value)
              }
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
            className="mb-4 rounded-none"
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {previews.map((preview: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="w-full h-32 object-cover rounded"
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
          className="bg-text-secondary text-white hover:bg-text-secondary/90 rounded-none"
        >
          {isSubmitting ? "Adding..." : "Add Design"}
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
