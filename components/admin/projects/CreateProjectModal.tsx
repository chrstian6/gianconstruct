"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Info,
  AlertCircle,
  User as UserIcon,
  Mail,
  Phone,
  Upload,
  X,
  Image as ImageIcon,
  ArrowLeft,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/action/project";
import { getUsers } from "@/action/userManagement";
import { cn } from "@/lib/utils";
import { ProjectModalLayout } from "./ProjectModalLayout";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface Region {
  region_code: string;
  region_name: string;
  psgc_code: string;
  id: string;
}

interface Province {
  province_code: string;
  province_name: string;
  psgc_code: string;
  region_code: string;
}

interface City {
  city_code: string;
  city_name: string;
  province_code: string;
  region_desc: string;
}

interface Barangay {
  brgy_code: string;
  brgy_name: string;
  province_code: string;
  region_code: string;
}

interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  role: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ProjectImage {
  file: File;
  title: string;
  description: string;
  previewUrl: string;
}

// Project Images Section Component
const ProjectImagesSection = ({
  projectImages,
  onImagesChange,
  onImageRemove,
  onImageUpdate,
  isUploading = false,
}: {
  projectImages: ProjectImage[];
  onImagesChange: (images: ProjectImage[]) => void;
  onImageRemove: (index: number) => void;
  onImageUpdate: (
    index: number,
    field: "title" | "description",
    value: string
  ) => void;
  isUploading?: boolean;
}) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ProjectImage[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        newImages.push({
          file,
          title: `Image ${projectImages.length + newImages.length + 1}`,
          description: "",
          previewUrl,
        });
      }
    });

    onImagesChange([...projectImages, ...newImages]);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground font-geist">
          Project Images
        </h3>
        <span className="text-xs text-muted-foreground font-geist">
          {projectImages.length} image(s) added
        </span>
      </div>

      {/* Image Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors bg-muted/20">
        <input
          type="file"
          id="project-images"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label htmlFor="project-images" className="cursor-pointer block">
          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground font-geist">
            Click to upload images or drag and drop
          </p>
          <p className="text-xs text-muted-foreground/70 font-geist mt-2">
            PNG, JPG, GIF up to 10MB each
          </p>
        </label>
      </div>

      {/* Image Preview and Details */}
      {projectImages.length > 0 && (
        <div className="space-y-4">
          {projectImages.map((image, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-5 space-y-4 bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={image.previewUrl}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`image-title-${index}`}
                        className="text-sm font-medium text-foreground"
                      >
                        Title
                      </Label>
                      <Input
                        id={`image-title-${index}`}
                        value={image.title}
                        onChange={(e) =>
                          onImageUpdate(index, "title", e.target.value)
                        }
                        placeholder="Image title"
                        className="font-medium font-geist"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`image-description-${index}`}
                        className="text-sm font-medium text-foreground"
                      >
                        Description (Optional)
                      </Label>
                      <Input
                        id={`image-description-${index}`}
                        value={image.description}
                        onChange={(e) =>
                          onImageUpdate(index, "description", e.target.value)
                        }
                        placeholder="Image description"
                        className="text-sm font-geist"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onImageRemove(index)}
                  className="text-muted-foreground hover:text-destructive ml-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center text-xs text-muted-foreground font-geist">
                <ImageIcon className="h-3 w-3 mr-2" />
                {image.file.name} • {(image.file.size / 1024 / 1024).toFixed(2)}{" "}
                MB
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <Alert className="bg-muted border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-geist">
            Uploading {projectImages.length} image(s)...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [step, setStep] = useState<
    "select-user" | "project-details" | "project-images"
  >("select-user");
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [regionList, setRegionList] = useState<Region[]>([]);
  const [provinceList, setProvinceList] = useState<Province[]>([]);
  const [cityList, setCityList] = useState<City[]>([]);
  const [barangayList, setBarangayList] = useState<Barangay[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Add state for calendar popovers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Fetch users and regions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchRegions();
      setValidationErrors([]);
      setShowValidationDialog(false);
    }
  }, [isOpen]);

  // Fetch users from server
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.success) {
        setUsers(response.users || []);
      } else {
        toast.error(response.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    }
  };

  // Fetch regions from select-philippines-address
  const fetchRegions = async () => {
    try {
      const data = await regions();
      if (Array.isArray(data)) {
        setRegionList(data);
      } else {
        toast.error("Failed to fetch regions: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch regions");
      console.error("Error fetching regions:", error);
    }
  };

  // Fetch provinces based on selected region
  const fetchProvinces = async (regionCode: string) => {
    try {
      const data = await provinces(regionCode);
      if (Array.isArray(data)) {
        setProvinceList(data);
        setSelectedProvince("");
        setCityList([]);
        setBarangayList([]);
      } else {
        toast.error("Failed to fetch provinces: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch provinces");
      console.error("Error fetching provinces:", error);
    }
  };

  // Fetch cities based on selected province
  const fetchCities = async (provinceCode: string) => {
    try {
      const data = await cities(provinceCode);
      if (Array.isArray(data)) {
        setCityList(data);
        setSelectedMunicipality("");
        setBarangayList([]);
      } else {
        toast.error("Failed to fetch cities: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch cities");
      console.error("Error fetching cities:", error);
    }
  };

  // Fetch barangays based on selected city
  const fetchBarangays = async (cityCode: string) => {
    try {
      const data = await barangays(cityCode);
      if (Array.isArray(data)) {
        setBarangayList(data);
        setSelectedBarangay("");
      } else {
        toast.error("Failed to fetch barangays: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch barangays");
      console.error("Error fetching barangays:", error);
    }
  };

  // Update province list when region changes
  useEffect(() => {
    if (selectedRegion) {
      fetchProvinces(selectedRegion);
    }
  }, [selectedRegion]);

  // Update city list when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
    }
  }, [selectedProvince]);

  // Update barangay list when city changes
  useEffect(() => {
    if (selectedMunicipality) {
      fetchBarangays(selectedMunicipality);
    }
  }, [selectedMunicipality]);

  // Fixed: Case-insensitive user search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.contactNo?.toLowerCase().includes(query) ||
        user.user_id?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Get selected user details
  const selectedUser = useMemo(() => {
    return users.find((user) => user.user_id === selectedUserId);
  }, [users, selectedUserId]);

  // Calculate project duration
  const calculateDuration = (start: Date | null, end: Date | null) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Format total cost with commas
  const formatTotalCost = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const [integerPart, decimalPart] = numericValue.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  // Handle total cost input
  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatTotalCost(value);
    setTotalCost(formattedValue);
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setStep("project-details");
  };

  // Go back to previous step
  const handleBack = () => {
    if (step === "project-images") {
      setStep("project-details");
    } else if (step === "project-details") {
      setStep("select-user");
    }
  };

  // Go to images step
  const handleNextToImages = () => {
    setStep("project-images");
  };

  // Handle image operations
  const handleImagesChange = (images: ProjectImage[]) => {
    setProjectImages(images);
  };

  const handleImageRemove = (index: number) => {
    setProjectImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl); // Clean up memory
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleImageUpdate = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    setProjectImages((prev) => {
      const newImages = [...prev];
      newImages[index][field] = value;
      return newImages;
    });
  };

  // Fixed: Date handling functions
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      setShowStartDatePicker(false); // Close popover on select
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      setShowEndDatePicker(false); // Close popover on select
    }
  };

  // Validate form data
  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!projectTitle.trim()) {
      errors.push({
        field: "projectTitle",
        message: "- Ensure project title is provided",
      });
    } else if (projectTitle.length > 50) {
      errors.push({
        field: "projectTitle",
        message: "- Project title must be 50 characters or less",
      });
    }

    if (!startDate) {
      errors.push({
        field: "startDate",
        message: "- Verify start date",
      });
    }

    if (!totalCost) {
      errors.push({
        field: "totalCost",
        message: "- Verify total cost is provided",
      });
    } else {
      const parsedTotalCost = parseFloat(totalCost.replace(/,/g, ""));
      if (isNaN(parsedTotalCost)) {
        errors.push({
          field: "totalCost",
          message: "- Total cost must be a valid number",
        });
      } else if (parsedTotalCost <= 0) {
        errors.push({
          field: "totalCost",
          message: "- Verify total cost is a positive number",
        });
      } else if (totalCost.replace(/,/g, "").length > 20) {
        errors.push({
          field: "totalCost",
          message: "- Total cost must be 20 digits or less",
        });
      }
    }

    if (!selectedUserId) {
      errors.push({ field: "user", message: "- Ensure user ID is provided" });
    }

    if (endDate && startDate && endDate < startDate) {
      errors.push({
        field: "endDate",
        message: "- Completion date cannot be before start date",
      });
    }

    // Validate location fields if any are provided
    const hasLocation =
      selectedRegion ||
      selectedProvince ||
      selectedMunicipality ||
      selectedBarangay;
    if (hasLocation) {
      if (!selectedRegion) {
        errors.push({
          field: "location.region",
          message: "- Ensure location region is provided",
        });
      }
      if (!selectedProvince) {
        errors.push({
          field: "location.province",
          message: "- Ensure location province is provided",
        });
      }
      if (!selectedMunicipality) {
        errors.push({
          field: "location.municipality",
          message: "- Ensure location municipality is provided",
        });
      }
      if (!selectedBarangay) {
        errors.push({
          field: "location.barangay",
          message: "- Ensure location barangay is provided",
        });
      }
    }

    // Validate images
    projectImages.forEach((image, index) => {
      if (!image.title.trim()) {
        errors.push({
          field: `projectImages[${index}].title`,
          message: `- Image ${index + 1} title is required`,
        });
      }
      if (image.title.length > 100) {
        errors.push({
          field: `projectImages[${index}].title`,
          message: `- Image ${index + 1} title must be 100 characters or less`,
        });
      }
      if (image.description && image.description.length > 500) {
        errors.push({
          field: `projectImages[${index}].description`,
          message: `- Image ${index + 1} description must be 500 characters or less`,
        });
      }
    });

    return errors;
  };

  // Handle project creation
  const handleCreateProject = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationDialog(true);
      return;
    }

    setIsLoading(true);
    setIsUploading(true);

    try {
      // Create FormData for the project creation
      const formData = new FormData();
      formData.append("name", projectTitle);
      formData.append("startDate", startDate!.toISOString());
      formData.append(
        "totalCost",
        parseFloat(totalCost.replace(/,/g, "")).toString()
      );
      // FIXED: Use "pending" instead of "not-started" to match server validation
      formData.append("status", "pending");
      if (endDate) {
        formData.append("endDate", endDate.toISOString());
      }
      formData.append("userId", selectedUserId!);

      // Add location data if provided
      const regionName =
        regionList.find((r) => r.region_code === selectedRegion)?.region_name ||
        "";
      const provinceName =
        provinceList.find((p) => p.province_code === selectedProvince)
          ?.province_name || "";
      const cityName =
        cityList.find((c) => c.city_code === selectedMunicipality)?.city_name ||
        "";
      const barangayName =
        barangayList.find((b) => b.brgy_code === selectedBarangay)?.brgy_name ||
        "";

      const hasLocation =
        selectedRegion ||
        selectedProvince ||
        selectedMunicipality ||
        selectedBarangay;
      const fullAddress = hasLocation
        ? `${barangayName}, ${cityName}, ${provinceName}, ${regionName}`
            .replace(/^,\s+/, "")
            .replace(/,\s+,/g, ",")
            .trim()
        : "";

      if (hasLocation) {
        formData.append("location[region]", regionName);
        formData.append("location[province]", provinceName);
        formData.append("location[municipality]", cityName);
        formData.append("location[barangay]", barangayName);
        formData.append("location[fullAddress]", fullAddress);
      }

      // Add project images as files and metadata
      projectImages.forEach((image, index) => {
        formData.append(`projectImages[${index}][file]`, image.file);
        formData.append(`projectImages[${index}][title]`, image.title);
        formData.append(
          `projectImages[${index}][description]`,
          image.description
        );
      });

      const response = await createProject(formData);
      if (response.success) {
        toast.success("Construction project created successfully");
        onClose();
        setStep("select-user");
        setProjectTitle("");
        setTotalCost("");
        setStartDate(null);
        setEndDate(null);
        setSelectedUserId(null);
        setSearchQuery("");
        setSelectedRegion("");
        setSelectedProvince("");
        setSelectedMunicipality("");
        setSelectedBarangay("");
        setProjectImages([]);
        setValidationErrors([]);
        setShowValidationDialog(false);
        onProjectCreated();
      } else {
        // Parse server-side errors
        const serverErrors: ValidationError[] = response.error
          ? response.error
              .split("\n")
              .filter((line) => line.startsWith("- "))
              .map((line) => ({
                field: "server",
                message: line,
              }))
          : [{ field: "server", message: "- Failed to create project" }];
        setValidationErrors(serverErrors);
        setShowValidationDialog(true);
      }
    } catch (error) {
      setValidationErrors([
        {
          field: "server",
          message: "- An error occurred while creating the project",
        },
      ]);
      setShowValidationDialog(true);
      console.error("Create project error:", error);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    // Clean up object URLs
    projectImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));

    onClose();
    setTimeout(() => {
      setStep("select-user");
      setProjectTitle("");
      setTotalCost("");
      setStartDate(null);
      setEndDate(null);
      setSelectedUserId(null);
      setSearchQuery("");
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedMunicipality("");
      setSelectedBarangay("");
      setProjectImages([]);
      setValidationErrors([]);
      setShowValidationDialog(false);
    }, 300);
  };

  // Render select-user step
  if (step === "select-user") {
    return (
      <ProjectModalLayout
        open={isOpen}
        onOpenChange={handleClose}
        title="Assign User to Project"
        description="Search and select a user to assign to the new construction project"
        footerActions={
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-border text-foreground hover:bg-muted rounded-full px-6 py-2.5"
          >
            Cancel
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Label
              htmlFor="user-search"
              className="text-sm font-medium text-foreground font-geist"
            >
              Search Users
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="pl-11 pr-4 py-3 border-border focus:border-foreground focus:ring-foreground font-geist"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground font-geist">
                Available Users
              </Label>
              <span className="text-xs text-muted-foreground font-geist">
                {filteredUsers.length} found
              </span>
            </div>
            <div className="border border-border rounded-lg max-h-80 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-geist">
                  {searchQuery ? "No users found" : "No users available"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleUserSelect(user.user_id)}
                      className="w-full p-5 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50 font-geist"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.contactNo && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{user.contactNo}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span>ID: {user.user_id}</span>
                            <span>•</span>
                            <span>Role: {user.role}</span>
                          </div>
                        </div>
                        <div className="ml-6">
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-2 pt-2 font-geist">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Click on a user to assign them to the project
            </p>
          </div>
        </div>
      </ProjectModalLayout>
    );
  }

  // Render project details step
  if (step === "project-details") {
    return (
      <ProjectModalLayout
        open={isOpen}
        onOpenChange={handleClose}
        title="Project Details"
        description="Enter the basic information for your construction project"
        footerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 py-3 border-border text-foreground hover:bg-muted rounded-full font-geist"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNextToImages}
              className="flex-1 py-3 bg-foreground hover:bg-foreground/90 text-background rounded-full font-geist"
            >
              Continue to Images
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {showValidationDialog && (
            <Alert variant="destructive" className="font-geist">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <p className="text-sm">Unable to process your request.</p>
                <p className="text-sm mb-3">
                  Please verify your project information and try again.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error.message.replace(/^- /, "")}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValidationDialog(false)}
                  className="mt-4 hover:bg-destructive/10"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {selectedUser && (
            <div className="bg-muted p-5 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-black font-geist bg-muted">
                    Assigned User:
                  </p>
                  <p className="text-sm text-foreground/80 font-geist bg-muted">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground font-geist bg-muted">
                    {selectedUser.email}
                  </p>
                  {selectedUser.contactNo && (
                    <p className="text-xs text-muted-foreground font-geist bg-muted">
                      {selectedUser.contactNo}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10 font-geist"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="projectTitle"
                  className="text-sm font-medium text-foreground font-geist"
                >
                  Project Title
                </Label>
                <span className="text-xs text-muted-foreground font-geist">
                  {projectTitle.length}/50 characters
                </span>
              </div>
              <Input
                id="projectTitle"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g., Office Building Construction, Highway Expansion"
                className="py-3 px-4 border-border focus:ring-foreground font-geist"
                maxLength={50}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="totalCost"
                  className="text-sm font-medium text-foreground font-geist"
                >
                  Total Cost
                </Label>
                <span className="text-xs text-muted-foreground font-geist">
                  {totalCost.replace(/,/g, "").length}/20 characters
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-geist">
                  ₱
                </span>
                <Input
                  id="totalCost"
                  type="text"
                  value={totalCost}
                  onChange={handleTotalCostChange}
                  placeholder="e.g., 1,000,000"
                  className="py-3 pl-10 pr-4 border-border focus:ring-foreground font-geist"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Start Date
                </Label>
                <Popover
                  open={showStartDatePicker}
                  onOpenChange={setShowStartDatePicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-border font-geist py-3",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      {startDate
                        ? format(startDate, "PPP")
                        : "Pick a start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="pointer-events-auto">
                      <Calendar
                        mode="single"
                        selected={startDate || undefined}
                        onSelect={handleStartDateSelect}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Completion Date (Optional)
                </Label>
                <Popover
                  open={showEndDatePicker}
                  onOpenChange={setShowEndDatePicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-border font-geist py-3",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={!startDate}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      {endDate
                        ? format(endDate, "PPP")
                        : "Pick a completion date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="pointer-events-auto">
                      <Calendar
                        mode="single"
                        selected={endDate || undefined}
                        onSelect={handleEndDateSelect}
                        initialFocus
                        disabled={(date) => !startDate || date < startDate}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-medium text-foreground font-geist">
              Project Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Region
                </Label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger className="w-full border-border focus:ring-foreground font-geist py-3">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {regionList.map((region: Region) => (
                      <SelectItem
                        key={region.region_code}
                        value={region.region_code}
                      >
                        {region.region_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Province
                </Label>
                <Select
                  value={selectedProvince}
                  onValueChange={setSelectedProvince}
                  disabled={!selectedRegion}
                >
                  <SelectTrigger className="w-full border-border focus:ring-foreground font-geist py-3">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {provinceList.map((province: Province) => (
                      <SelectItem
                        key={province.province_code}
                        value={province.province_code}
                      >
                        {province.province_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Municipality/City
                </Label>
                <Select
                  value={selectedMunicipality}
                  onValueChange={setSelectedMunicipality}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger className="w-full border-border focus:ring-foreground font-geist py-3">
                    <SelectValue placeholder="Select municipality/city" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {cityList.map((city: City) => (
                      <SelectItem key={city.city_code} value={city.city_code}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Barangay
                </Label>
                <Select
                  value={selectedBarangay}
                  onValueChange={setSelectedBarangay}
                  disabled={!selectedMunicipality}
                >
                  <SelectTrigger className="w-full border-border focus:ring-foreground font-geist py-3">
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {barangayList.map((barangay: Barangay) => (
                      <SelectItem
                        key={barangay.brgy_code}
                        value={barangay.brgy_code}
                      >
                        {barangay.brgy_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedRegion ||
              selectedProvince ||
              selectedMunicipality ||
              selectedBarangay) && (
              <div className="bg-muted p-4 rounded-lg border border-border mt-4">
                <h4 className="text-xs font-medium text-foreground mb-3 font-geist bg-muted">
                  Selected Location:
                </h4>
                <p className="text-sm text-foreground/90 font-geist bg-muted">
                  {[
                    barangayList.find((b) => b.brgy_code === selectedBarangay)
                      ?.brgy_name,
                    cityList.find((c) => c.city_code === selectedMunicipality)
                      ?.city_name,
                    provinceList.find(
                      (p) => p.province_code === selectedProvince
                    )?.province_name,
                    regionList.find((r) => r.region_code === selectedRegion)
                      ?.region_name,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Project Summary */}
          {(startDate || endDate || totalCost) && (
            <div className="bg-muted p-5 rounded-lg border border-border">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground font-geist bg-muted">
                <AlertCircle className="h-4 w-4" />
                Construction Timeline
              </h4>
              <div className="grid grid-cols-2 gap-5 text-sm">
                {startDate && endDate && (
                  <div className="space-y-1">
                    <span className="text-foreground/70 font-geist bg-muted">
                      Duration:
                    </span>
                    <p className="font-medium text-foreground font-geist bg-muted">
                      {calculateDuration(startDate, endDate)} working days
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-foreground/70 font-geist bg-muted">
                    Project ID:
                  </span>
                  <p className="font-mono font-medium text-foreground font-geist bg-muted">
                    Will be generated automatically
                  </p>
                </div>
                {totalCost && (
                  <div className="space-y-1">
                    <span className="text-foreground/70 font-geist bg-muted">
                      Estimated Cost:
                    </span>
                    <p className="font-medium text-foreground font-geist bg-muted">
                      ₱{totalCost}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ProjectModalLayout>
    );
  }

  // Render project images step
  return (
    <ProjectModalLayout
      open={isOpen}
      onOpenChange={handleClose}
      title="Project Images"
      description="Upload and manage images for your construction project"
      footerActions={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 py-3 border-border text-foreground hover:bg-muted rounded-full font-geist"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={isLoading || isUploading}
            className="flex-1 py-3 bg-foreground hover:bg-foreground/90 text-background rounded-full font-geist"
          >
            {isLoading || isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                {isUploading ? "Uploading..." : "Creating..."}
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {showValidationDialog && (
          <Alert variant="destructive" className="font-geist">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <p className="text-sm">Unable to process your request.</p>
              <p className="text-sm mb-3">
                Please verify your project information and try again.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error.message.replace(/^- /, "")}
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValidationDialog(false)}
                className="mt-4 hover:bg-destructive/10"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Project Summary in Images Step */}
        <div className="bg-muted p-5 rounded-lg border border-border">
          <h4 className="text-sm font-medium mb-4 text-foreground font-geist bg-muted">
            Project Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-1">
              <span className="text-foreground/70 font-geist bg-muted">
                Project Title:
              </span>
              <p className="font-medium text-foreground font-geist bg-muted">
                {projectTitle || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-foreground/70 font-geist bg-muted">
                Assigned User:
              </span>
              <p className="font-medium text-foreground font-geist bg-muted">
                {selectedUser
                  ? `${selectedUser.firstName} ${selectedUser.lastName}`
                  : "Not assigned"}
              </p>
            </div>
            {totalCost && (
              <div className="space-y-1">
                <span className="text-foreground/70 font-geist bg-muted">
                  Estimated Cost:
                </span>
                <p className="font-medium text-foreground font-geist bg-muted">
                  ₱{totalCost}
                </p>
              </div>
            )}
            {startDate && (
              <div className="space-y-1">
                <span className="text-foreground/70 font-geist bg-muted">
                  Start Date:
                </span>
                <p className="font-medium text-foreground font-geist bg-muted">
                  {format(startDate, "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Project Images Section */}
        <ProjectImagesSection
          projectImages={projectImages}
          onImagesChange={handleImagesChange}
          onImageRemove={handleImageRemove}
          onImageUpdate={handleImageUpdate}
          isUploading={isUploading}
        />
      </div>
    </ProjectModalLayout>
  );
}
