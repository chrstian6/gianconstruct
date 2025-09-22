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
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/action/project";
import { getUsers } from "@/action/userManagement";
import { nanoid } from "nanoid";
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

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [step, setStep] = useState<"select-user" | "create-project">(
    "select-user"
  );
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
    setStep("create-project");
  };

  // Go back to user selection step
  const handleBackToUserSelection = () => {
    setSelectedUserId(null);
    setStep("select-user");
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
    try {
      const customProjectId = `constr-${nanoid(4)}`;

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

      const formData = new FormData();
      formData.append("name", projectTitle);
      formData.append("project_id", customProjectId);
      formData.append("startDate", startDate!.toISOString());
      formData.append(
        "totalCost",
        parseFloat(totalCost.replace(/,/g, "")).toString()
      );
      formData.append("status", "not-started");
      if (endDate) {
        formData.append("endDate", endDate.toISOString());
      }
      formData.append("userId", selectedUserId!);
      if (hasLocation) {
        formData.append("location[region]", regionName);
        formData.append("location[province]", provinceName);
        formData.append("location[municipality]", cityName);
        formData.append("location[barangay]", barangayName);
        formData.append("location[fullAddress]", fullAddress);
      }

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
    }
  };

  // Handle modal close
  const handleClose = () => {
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

  // Render project creation step
  return (
    <ProjectModalLayout
      open={isOpen}
      onOpenChange={handleClose}
      title="Create New Construction Project"
      description="Plan your construction project with timeline and specifications"
      footerActions={
        <>
          <Button
            variant="outline"
            onClick={handleBackToUserSelection}
            className="flex-1 min-w-[120px] order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full font-geist"
          >
            Back to Users
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={isLoading}
            className="flex-1 min-w-[120px] order-1 sm:order-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-geist"
          >
            {isLoading ? "Creating..." : "Create Project"}
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
              onClick={handleBackToUserSelection}
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
          className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
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
            className="py-2.5 pl-8 pr-3.5 bg-white border-gray-300 focus:ring-gray-500 font-geist"
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
      {(startDate || endDate || totalCost) && (
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
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
                constr-{nanoid(4)}
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
