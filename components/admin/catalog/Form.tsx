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
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { addDesign } from "@/action/designs";
import { toast } from "sonner";
import { Design } from "@/types/design";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CatalogFormProps {
  onAddDesign: (design: Design) => void;
}

// Image Modal Component (keep this the same)
const ImageModal = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 z-10 h-8 w-8 rounded-full"
              onClick={onPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 z-10 h-8 w-8 rounded-full"
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Image */}
        <img
          src={images[currentIndex]}
          alt={`Preview ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
};

export default function CatalogForm({ onAddDesign }: CatalogFormProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [estimatedCost, setEstimatedCost] = useState<string>("");
  const [estimatedDownpayment, setEstimatedDownpayment] = useState<string>(""); // NEW FIELD
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
  const [activeSection, setActiveSection] = useState<
    "basic" | "financial" | "media"
  >("basic");

  // Image modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

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

  // NEW: Handler for downpayment
  const handleEstimatedDownpaymentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setEstimatedDownpayment(formatNumberWithCommas(value));
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
    if (images.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
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

  // Image modal functions
  const openImageModal = (index: number): void => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeImageModal = (): void => {
    setIsModalOpen(false);
  };

  const goToNextImage = (): void => {
    setCurrentImageIndex((prev) => (prev + 1) % previews.length);
  };

  const goToPrevImage = (): void => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + previews.length) % previews.length
    );
  };

  // Handle keyboard navigation in modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (e.key === "Escape") {
        closeImageModal();
      } else if (e.key === "ArrowRight") {
        goToNextImage();
      } else if (e.key === "ArrowLeft") {
        goToPrevImage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, currentImageIndex, previews.length]);

  // Check if basic section is complete - UPDATED
  const isBasicSectionComplete = () => {
    return (
      name &&
      description &&
      estimatedCost &&
      estimatedDownpayment && // NEW: Check downpayment
      squareMeters &&
      category &&
      (category !== "custom" || customCategory)
    );
  };

  // Check if financial section is complete (if loan offer is enabled)
  const isFinancialSectionComplete = () => {
    if (!isLoanOffer) return true;
    return maxLoanTerm && interestRate;
  };

  const handleNext = () => {
    if (activeSection === "basic" && isBasicSectionComplete()) {
      setActiveSection("financial");
    } else if (activeSection === "financial" && isFinancialSectionComplete()) {
      setActiveSection("media");
    }
  };

  const handleBack = () => {
    if (activeSection === "financial") {
      setActiveSection("basic");
    } else if (activeSection === "media") {
      setActiveSection("financial");
    }
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
    formData.append(
      "estimated_downpayment",
      estimatedDownpayment.replace(/,/g, "")
    ); // NEW
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
      setEstimatedDownpayment(""); // NEW: Reset downpayment
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
      setActiveSection("basic");
    } else {
      toast.error(result.error || "Failed to add design");
    }

    setIsSubmitting(false);
  };

  const SectionNavigation = () => (
    <div className="flex justify-center border-b mb-6">
      <div className="flex gap-8">
        <button
          type="button"
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeSection === "basic"
              ? "border-blue-500 font-semibold text-gray-900"
              : "border-transparent text-gray-500"
          }`}
        >
          Basic Info
        </button>
        <button
          type="button"
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeSection === "financial"
              ? "border-blue-500 font-semibold text-gray-900"
              : "border-transparent text-gray-500"
          } ${!isBasicSectionComplete() ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Financial
        </button>
        <button
          type="button"
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeSection === "media"
              ? "border-blue-500 font-semibold text-gray-900"
              : "border-transparent text-gray-500"
          } ${!(isBasicSectionComplete() && isFinancialSectionComplete()) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Media
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header Card */}

      <SectionNavigation />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-5">
        {/* Form Content */}
        <div className="flex-1">
          {/* Basic Information Section */}
          {activeSection === "basic" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide the essential details about your design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Design Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Modern Family Home, Office Building Design"
                      required
                    />
                  </div>

                  {/* Category Field */}
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <Select
                      onValueChange={handleCategoryChange}
                      value={category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select design category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="office">Office Buildings</SelectItem>
                        <SelectItem value="custom">Custom Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {category === "custom" && (
                      <Input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter your custom category name"
                        required
                      />
                    )}
                  </div>

                  {/* Description Field */}
                  <div className="space-y-3 md:col-span-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the design features, materials, and unique aspects..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  {/* Specifications - UPDATED */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium mb-4">Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estimated_cost" className="text-sm">
                          Estimated Cost (₱) *
                        </Label>
                        <Input
                          id="estimated_cost"
                          type="text"
                          value={estimatedCost ? `₱${estimatedCost}` : ""}
                          onChange={handleEstimatedCostChange}
                          placeholder="Enter estimated cost"
                          required
                        />
                      </div>

                      {/* NEW: Estimated Downpayment Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="estimated_downpayment"
                          className="text-sm"
                        >
                          Estimated Downpayment (₱) *
                        </Label>
                        <Input
                          id="estimated_downpayment"
                          type="text"
                          value={
                            estimatedDownpayment
                              ? `₱${estimatedDownpayment}`
                              : ""
                          }
                          onChange={handleEstimatedDownpaymentChange}
                          placeholder="Enter downpayment amount"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="square_meters" className="text-sm">
                          Square Meters (sqm) *
                        </Label>
                        <Input
                          id="square_meters"
                          type="text"
                          value={squareMeters}
                          onChange={handleSquareMetersChange}
                          placeholder="Enter total area"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Section */}
          {activeSection === "financial" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Financial Options
                </CardTitle>
                <CardDescription>
                  Configure financing options for your design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label
                      htmlFor="isLoanOffer"
                      className="text-sm font-medium"
                    >
                      Offer Financing Options
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Enable this to offer loan/financing options
                    </p>
                  </div>
                  <Switch
                    id="isLoanOffer"
                    checked={isLoanOffer}
                    onCheckedChange={setIsLoanOffer}
                  />
                </div>

                {isLoanOffer && (
                  <div className="space-y-6 p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Loan Term</Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={maxLoanTerm}
                            onChange={handleMaxLoanTermChange}
                            placeholder={`Max term in ${loanTermType}`}
                            maxLength={loanTermType === "years" ? 2 : 3}
                            required
                          />
                          <Select
                            value={loanTermType}
                            onValueChange={(value: "months" | "years") =>
                              setLoanTermType(value)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="years">Years</SelectItem>
                              <SelectItem value="months">Months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Interest Rate
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={interestRate}
                            onChange={handleInterestRateChange}
                            placeholder="Enter rate"
                            required
                          />
                          <Select
                            value={interestRateType}
                            onValueChange={(value: "monthly" | "yearly") =>
                              setInterestRateType(value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yearly">% per year</SelectItem>
                              <SelectItem value="monthly">
                                % per month
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Media Section */}
          {activeSection === "media" && (
            <Card className="border-none">
              <CardHeader className="relative top-5">
                <CardTitle className="flex items-center gap-2 text-xl font-medium tracking-tight">
                  Design Images
                </CardTitle>
                <CardDescription className="relative top-[-10]">
                  Upload high-quality images of your design (Max 10 images)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 text-center" />
                  <Label
                    htmlFor="images"
                    className="cursor-pointer justify-center"
                  >
                    <div className="space-y-2 text-center">
                      <p className="text-lg font-medium">
                        Drop images here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {previews.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Image Previews ({previews.length}/10)
                      </Label>
                      <Badge variant="secondary">
                        {previews.length} images selected
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full object-cover rounded-lg border-2 border-gray-200 group-hover:border-gray-400 transition-colors cursor-pointer"
                            onClick={() => openImageModal(index)}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                            Image {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons - Fixed at the bottom */}
        <div className="mt-8 pt-6 border-t bg-white sticky bottom-0 pb-6">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={activeSection === "basic"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              Step{" "}
              {activeSection === "basic"
                ? 1
                : activeSection === "financial"
                  ? 2
                  : 3}{" "}
              of 3
            </div>

            {activeSection !== "media" ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (activeSection === "basic" && !isBasicSectionComplete()) ||
                  (activeSection === "financial" &&
                    !isFinancialSectionComplete())
                }
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || previews.length === 0}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Design...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Publish Design
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Image Modal */}
      {isModalOpen && previews.length > 0 && (
        <ImageModal
          images={previews}
          currentIndex={currentImageIndex}
          onClose={closeImageModal}
          onNext={goToNextImage}
          onPrev={goToPrevImage}
        />
      )}
    </div>
  );
}
