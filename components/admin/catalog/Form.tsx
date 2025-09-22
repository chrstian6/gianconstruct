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
import {
  Upload,
  X,
  Info,
  Building,
  FileText,
  Tag,
  DollarSign,
  DoorOpen,
  Square,
  Landmark,
  Calendar,
  Percent,
  Image,
  HelpCircle,
} from "lucide-react";
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
      // Reset form
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
    } else {
      toast.error(result.error || "Failed to add design");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-900 mb-1">
              Design Information
            </h3>
            <p className="text-sm text-gray-600">
              Provide comprehensive details about your design. All fields are
              required unless marked optional. High-quality images and accurate
              specifications help clients make informed decisions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Building className="h-4 w-4" />
            Design Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Modern Family Home, Office Building Design"
            className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
            required
          />
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Choose a descriptive name that clearly identifies your design
          </p>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <FileText className="h-4 w-4" />
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the design features, materials, and unique aspects..."
            className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md min-h-[100px]"
            required
          />
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Include key features, target audience, and design philosophy
          </p>
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <Label
            htmlFor="category"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Tag className="h-4 w-4" />
            Category
          </Label>
          <Select onValueChange={handleCategoryChange} value={category}>
            <SelectTrigger className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md">
              <SelectValue placeholder="Select design category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="industrial">🏭 Industrial</SelectItem>
              <SelectItem value="residential">🏠 Residential</SelectItem>
              <SelectItem value="commercial">🏢 Commercial</SelectItem>
              <SelectItem value="office">💼 Office Buildings</SelectItem>
              <SelectItem value="custom">🎨 Customized Category</SelectItem>
            </SelectContent>
          </Select>
          {category === "custom" && (
            <div className="space-y-2">
              <Input
                id="custom_category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter your custom category name"
                className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
                required
              />
              <p className="text-xs text-gray-500">
                Create a specific category for unique design types
              </p>
            </div>
          )}
        </div>

        {/* Estimated Cost Field */}
        <div className="space-y-2">
          <Label
            htmlFor="estimated_cost"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <DollarSign className="h-4 w-4" />
            Estimated Cost (₱)
          </Label>
          <Input
            id="estimated_cost"
            type="text"
            value={estimatedCost ? `₱${estimatedCost}` : ""}
            onChange={handleEstimatedCostChange}
            placeholder="Enter estimated construction cost"
            className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
            required
          />
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Include material, labor, and construction expenses
          </p>
        </div>

        {/* Number of Rooms Field */}
        <div className="space-y-2">
          <Label
            htmlFor="number_of_rooms"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <DoorOpen className="h-4 w-4" />
            Number of Rooms
          </Label>
          <Input
            id="number_of_rooms"
            type="text"
            value={numberOfRooms}
            onChange={handleNumberOfRoomsChange}
            placeholder="Enter total number of rooms"
            className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
            maxLength={2}
            required
          />
          <p className="text-xs text-gray-500">
            Include all rooms: bedrooms, bathrooms, living areas, etc.
          </p>
        </div>

        {/* Square Meters Field */}
        <div className="space-y-2">
          <Label
            htmlFor="square_meters"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Square className="h-4 w-4" />
            Square Meters (sqm)
          </Label>
          <Input
            id="square_meters"
            type="text"
            value={squareMeters}
            onChange={handleSquareMetersChange}
            placeholder="Enter total area in square meters"
            className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
            required
          />
          <p className="text-xs text-gray-500">
            Total built-up area including all floors
          </p>
        </div>

        {/* Loan Offer Toggle */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="isLoanOffer"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Landmark className="h-4 w-4" />
              Offer Financing Options
            </Label>
            <Switch
              id="isLoanOffer"
              checked={isLoanOffer}
              onCheckedChange={setIsLoanOffer}
              className="focus:ring-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            Enable this to offer loan/financing options for this design
          </p>

          {isLoanOffer && (
            <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loan Term Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4" />
                    Loan Term Type
                  </Label>
                  <Select
                    value={loanTermType}
                    onValueChange={(value: "months" | "years") =>
                      setLoanTermType(value)
                    }
                  >
                    <SelectTrigger className="w-full border-gray-300">
                      <SelectValue placeholder="Select term type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Loan Term */}
                <div className="space-y-2">
                  <Label
                    htmlFor="maxLoanTerm"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Calendar className="h-4 w-4" />
                    Max Loan Term ({loanTermType})
                  </Label>
                  <Input
                    id="maxLoanTerm"
                    type="text"
                    value={maxLoanTerm}
                    onChange={handleMaxLoanTermChange}
                    placeholder={`Enter maximum term in ${loanTermType}`}
                    className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
                    maxLength={loanTermType === "years" ? 2 : 3}
                    required
                  />
                </div>

                {/* Interest Rate */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="interestRate"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Percent className="h-4 w-4" />
                    Interest Rate
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="interestRate"
                      type="text"
                      value={interestRate}
                      onChange={handleInterestRateChange}
                      placeholder="Enter annual interest rate"
                      className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
                      required
                    />
                    <Select
                      value={interestRateType}
                      onValueChange={(value: "monthly" | "yearly") =>
                        setInterestRateType(value)
                      }
                    >
                      <SelectTrigger className="w-[140px] border-gray-300">
                        <SelectValue placeholder="Rate type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yearly">% per year</SelectItem>
                        <SelectItem value="monthly">% per month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Specify the interest rate for financing this design
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-3">
        <Label
          htmlFor="images"
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <Image className="h-4 w-4" />
          Design Images
        </Label>
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md"
        />
        <p className="text-xs text-gray-500 flex items-start gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          Upload high-quality images showing different angles and features of
          your design. Maximum 10 images allowed. Recommended size: 1200x800px
          or larger.
        </p>

        {previews.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Image Previews ({previews.length}/10)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full object-cover rounded-md border border-gray-300 group-hover:opacity-75 transition-opacity"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full border-gray-300 bg-white hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3 text-gray-700" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    Image {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-200">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto bg-gray-900 text-white rounded-md hover:bg-gray-800 px-8 py-3"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Design...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Create Design Offer
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Your design will be reviewed before appearing in the catalog. Typical
          review time is 24-48 hours.
        </p>
      </div>
    </form>
  );
}
