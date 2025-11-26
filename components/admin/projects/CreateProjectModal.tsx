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
  CalendarIcon,
  Upload,
  X,
  Image as ImageIcon,
  ArrowLeft,
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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

interface CustomDateInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
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

const CustomDateInput = React.forwardRef<
  HTMLButtonElement,
  CustomDateInputProps
>(({ value, onClick, placeholder, disabled }, ref) => (
  <Button
    variant="outline"
    onClick={onClick}
    ref={ref}
    disabled={disabled}
    className={cn(
      "w-full justify-start text-left font-normal border-gray-300 focus:ring-gray-500 font-geist",
      !value && "text-gray-500"
    )}
  >
    <CalendarIcon className="mr-2 h-4 w-4" />
    {value || placeholder}
  </Button>
));

CustomDateInput.displayName = "CustomDateInput";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 font-geist">
          Project Images
        </h3>
        <span className="text-xs text-gray-600 font-geist">
          {projectImages.length} image(s) added
        </span>
      </div>

      {/* Image Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          id="project-images"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label htmlFor="project-images" className="cursor-pointer block">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 font-geist">
            Click to upload images or drag and drop
          </p>
          <p className="text-xs text-gray-500 font-geist mt-1">
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
              className="border border-gray-200 rounded-lg p-4 space-y-3 bg-background"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={image.previewUrl}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label
                        htmlFor={`image-title-${index}`}
                        className="text-xs text-gray-600"
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
                    <div>
                      <Label
                        htmlFor={`image-description-${index}`}
                        className="text-xs text-gray-600"
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
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center text-xs text-gray-500 font-geist">
                <ImageIcon className="h-3 w-3 mr-1" />
                {image.file.name} • {(image.file.size / 1024 / 1024).toFixed(2)}{" "}
                MB
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 font-geist">
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

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.contactNo?.toLowerCase().includes(query) ||
        user.user_id.toLowerCase().includes(query)
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
            className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full"
          >
            Cancel
          </Button>
        }
      >
        <div className="space-y-2">
          <Label
            htmlFor="user-search"
            className="text-sm font-medium text-gray-900 font-geist"
          >
            Search Users
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="user-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="pl-10 pr-4 py-2 border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] font-geist"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900 font-geist">
            Available Users ({filteredUsers.length})
          </Label>
          <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-geist">
                {searchQuery ? "No users found" : "No users available"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => handleUserSelect(user.user_id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 font-geist"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.contactNo && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Phone className="h-3 w-3" />
                            <span>{user.contactNo}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          ID: {user.user_id} • Role: {user.role}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 flex items-start gap-1.5 font-geist">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            Click on a user to assign them to the project
          </p>
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
          <>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 min-w-[120px] order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full font-geist"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNextToImages}
              className="flex-1 min-w-[120px] order-1 sm:order-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-geist"
            >
              Continue to Images
            </Button>
          </>
        }
      >
        {showValidationDialog && (
          <Alert variant="destructive" className="mb-4 font-geist">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <p className="text-sm">Unable to process your request.</p>
              <p className="text-sm mb-2">
                Please verify your project information and try again.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    {error.message.replace(/^- /, "")}
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowValidationDialog(false)}
                className="mt-4 text-red-600 hover:text-red-800 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {selectedUser && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 font-geist">
                  Assigned User:
                </p>
                <p className="text-sm text-blue-700 font-geist">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-xs text-blue-600 font-geist">
                  {selectedUser.email}
                </p>
                {selectedUser.contactNo && (
                  <p className="text-xs text-blue-600 font-geist">
                    {selectedUser.contactNo}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 font-geist"
              >
                Change
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="projectTitle"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Project Title
            </Label>
            <span className="text-xs text-gray-600 font-geist">
              {projectTitle.length}/50 characters
            </span>
          </div>
          <Input
            id="projectTitle"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g., Office Building Construction, Highway Expansion"
            className="py-2.5 px-3.5 border-gray-300 focus:ring-gray-500 font-geist"
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="totalCost"
              className="text-sm font-medium text-gray-900 font-geist"
            >
              Total Cost
            </Label>
            <span className="text-xs text-gray-600 font-geist">
              {totalCost.replace(/,/g, "").length}/20 characters
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-geist">
              ₱
            </span>
            <Input
              id="totalCost"
              type="text"
              value={totalCost}
              onChange={handleTotalCostChange}
              placeholder="e.g., 1,000,000"
              className="py-2.5 pl-8 pr-3.5 border-gray-300 focus:ring-gray-500 font-geist"
              maxLength={20}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 font-geist">
              Start Date
            </Label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              minDate={new Date()}
              placeholderText="Pick a start date"
              customInput={<CustomDateInput />}
              className="w-full"
              popperClassName="react-datepicker-popper z-[1000]"
              wrapperClassName="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 font-geist">
              Completion Date (Optional)
            </Label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || new Date()}
              placeholderText="Pick a completion date"
              customInput={<CustomDateInput disabled={!startDate} />}
              className="w-full"
              popperClassName="react-datepicker-popper z-[1000]"
              wrapperClassName="w-full"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 font-geist">
            Project Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 font-geist">
                Region
              </Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500 font-geist">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 font-geist">
                Province
              </Label>
              <Select
                value={selectedProvince}
                onValueChange={setSelectedProvince}
                disabled={!selectedRegion}
              >
                <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500 font-geist">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 font-geist">
                Municipality/City
              </Label>
              <Select
                value={selectedMunicipality}
                onValueChange={setSelectedMunicipality}
                disabled={!selectedProvince}
              >
                <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500 font-geist">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 font-geist">
                Barangay
              </Label>
              <Select
                value={selectedBarangay}
                onValueChange={setSelectedBarangay}
                disabled={!selectedMunicipality}
              >
                <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500 font-geist">
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
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-2 font-geist">
                Selected Location:
              </h4>
              <p className="text-sm text-gray-900 font-geist">
                {[
                  barangayList.find((b) => b.brgy_code === selectedBarangay)
                    ?.brgy_name,
                  cityList.find((c) => c.city_code === selectedMunicipality)
                    ?.city_name,
                  provinceList.find((p) => p.province_code === selectedProvince)
                    ?.province_name,
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
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5 text-gray-900 font-geist">
              <AlertCircle className="h-4 w-4" />
              Construction Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {startDate && endDate && (
                <div>
                  <span className="text-gray-700 font-geist">Duration:</span>
                  <p className="font-medium text-gray-900 font-geist">
                    {calculateDuration(startDate, endDate)} working days
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-700 font-geist">Project ID:</span>
                <p className="font-mono font-medium text-gray-900 font-geist">
                  Will be generated automatically
                </p>
              </div>
              {totalCost && (
                <div>
                  <span className="text-gray-700 font-geist">
                    Estimated Cost:
                  </span>
                  <p className="font-medium text-gray-900 font-geist">
                    ₱{totalCost}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
        <>
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 min-w-[120px] order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full font-geist"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={isLoading || isUploading}
            className="flex-1 min-w-[120px] order-1 sm:order-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-geist"
          >
            {isLoading || isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {isUploading ? "Uploading..." : "Creating..."}
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </>
      }
    >
      {showValidationDialog && (
        <Alert variant="destructive" className="mb-4 font-geist">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <p className="text-sm">Unable to process your request.</p>
            <p className="text-sm mb-2">
              Please verify your project information and try again.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-600">
                  {error.message.replace(/^- /, "")}
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValidationDialog(false)}
              className="mt-4 text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Project Summary in Images Step */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h4 className="text-sm font-medium mb-3 text-gray-900 font-geist">
          Project Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-700 font-geist">Project Title:</span>
            <p className="font-medium text-gray-900 font-geist">
              {projectTitle || "Not provided"}
            </p>
          </div>
          <div>
            <span className="text-gray-700 font-geist">Assigned User:</span>
            <p className="font-medium text-gray-900 font-geist">
              {selectedUser
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : "Not assigned"}
            </p>
          </div>
          {totalCost && (
            <div>
              <span className="text-gray-700 font-geist">Estimated Cost:</span>
              <p className="font-medium text-gray-900 font-geist">
                ₱{totalCost}
              </p>
            </div>
          )}
          {startDate && (
            <div>
              <span className="text-gray-700 font-geist">Start Date:</span>
              <p className="font-medium text-gray-900 font-geist">
                {startDate.toLocaleDateString()}
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
    </ProjectModalLayout>
  );
}
