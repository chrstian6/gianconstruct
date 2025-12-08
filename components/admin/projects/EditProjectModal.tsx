"use client";

import React, { useState, useEffect } from "react";
import { ProjectModalLayout } from "./ProjectModalLayout";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Info,
  AlertCircle,
  User as UserIcon,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { updateProject } from "@/action/project";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import { Project } from "@/types/project";

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
}

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  users: User[];
  onUpdate: (project: Project) => void;
  onBackToUserSelection: () => void;
}

interface LocationMapping {
  regionCode?: string;
  provinceCode?: string;
  cityCode?: string;
  barangayCode?: string;
}

export default function EditProjectModal({
  open,
  onOpenChange,
  project,
  users,
  onUpdate,
  onBackToUserSelection,
}: EditProjectModalProps) {
  const [editedProject, setEditedProject] = useState({
    name: "",
    status: "pending" as "pending" | "active" | "completed" | "cancelled",
    startDate: "",
    endDate: "",
    totalCost: "",
    userId: "",
    location: {
      region: "",
      province: "",
      municipality: "",
      barangay: "",
      fullAddress: "",
    },
  });

  const [regionList, setRegionList] = useState<Region[]>([]);
  const [provinceList, setProvinceList] = useState<Province[]>([]);
  const [cityList, setCityList] = useState<City[]>([]);
  const [barangayList, setBarangayList] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationMapping, setLocationMapping] = useState<LocationMapping>({});
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Fetch regions on mount
  useEffect(() => {
    if (open) {
      fetchRegions();
      setValidationErrors([]);
      setShowValidationDialog(false);
    }
  }, [open]);

  // Initialize editedProject with project data and find location codes
  useEffect(() => {
    if (project && open) {
      setIsFetchingLocation(true);

      // Set basic project data
      setEditedProject({
        name: project.name,
        status: project.status,
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "",
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().split("T")[0]
          : "",
        totalCost: project.totalCost ? project.totalCost.toString() : "0",
        userId: project.userId,
        location: {
          region: project.location?.region || "",
          province: project.location?.province || "",
          municipality: project.location?.municipality || "",
          barangay: project.location?.barangay || "",
          fullAddress: project.location?.fullAddress || "",
        },
      });

      // Find location codes after regions are loaded
      const findLocationCodes = async () => {
        try {
          const allRegions = await regions();
          if (!Array.isArray(allRegions)) return;

          setRegionList(allRegions);

          // Find region code
          const region = allRegions.find(
            (r: Region) => r.region_name === project.location?.region
          );

          if (region) {
            setLocationMapping((prev) => ({
              ...prev,
              regionCode: region.region_code,
            }));

            // Find province code
            const allProvinces = await provinces(region.region_code);
            if (Array.isArray(allProvinces)) {
              setProvinceList(allProvinces);
              const province = allProvinces.find(
                (p: Province) => p.province_name === project.location?.province
              );

              if (province) {
                setLocationMapping((prev) => ({
                  ...prev,
                  provinceCode: province.province_code,
                }));

                // Find city code
                const allCities = await cities(province.province_code);
                if (Array.isArray(allCities)) {
                  setCityList(allCities);
                  const city = allCities.find(
                    (c: City) => c.city_name === project.location?.municipality
                  );

                  if (city) {
                    setLocationMapping((prev) => ({
                      ...prev,
                      cityCode: city.city_code,
                    }));

                    // Find barangay code
                    const allBarangays = await barangays(city.city_code);
                    if (Array.isArray(allBarangays)) {
                      setBarangayList(allBarangays);
                      const barangay = allBarangays.find(
                        (b: Barangay) =>
                          b.brgy_name === project.location?.barangay
                      );

                      if (barangay) {
                        setLocationMapping((prev) => ({
                          ...prev,
                          barangayCode: barangay.brgy_code,
                        }));
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error finding location codes:", error);
        } finally {
          setIsFetchingLocation(false);
        }
      };

      findLocationCodes();
    }
  }, [project, open]);

  // Handle region selection
  useEffect(() => {
    const fetchRegionProvinces = async () => {
      if (locationMapping.regionCode) {
        try {
          const data = await provinces(locationMapping.regionCode);
          if (Array.isArray(data)) {
            setProvinceList(data);
            setCityList([]);
            setBarangayList([]);
          }
        } catch (error) {
          toast.error("Failed to fetch provinces");
          console.error("Error fetching provinces:", error);
        }
      }
    };

    fetchRegionProvinces();
  }, [locationMapping.regionCode]);

  // Handle province selection
  useEffect(() => {
    const fetchProvinceCities = async () => {
      if (locationMapping.provinceCode) {
        try {
          const data = await cities(locationMapping.provinceCode);
          if (Array.isArray(data)) {
            setCityList(data);
            setBarangayList([]);
          }
        } catch (error) {
          toast.error("Failed to fetch cities");
          console.error("Error fetching cities:", error);
        }
      }
    };

    fetchProvinceCities();
  }, [locationMapping.provinceCode]);

  // Handle city selection
  useEffect(() => {
    const fetchCityBarangays = async () => {
      if (locationMapping.cityCode) {
        try {
          const data = await barangays(locationMapping.cityCode);
          if (Array.isArray(data)) {
            setBarangayList(data);
          }
        } catch (error) {
          toast.error("Failed to fetch barangays");
          console.error("Error fetching barangays:", error);
        }
      }
    };

    fetchCityBarangays();
  }, [locationMapping.cityCode]);

  // Fetch regions
  const fetchRegions = async () => {
    try {
      const data = await regions();
      if (Array.isArray(data)) {
        setRegionList(data);
      } else {
        toast.error("Failed to fetch regions");
      }
    } catch (error) {
      toast.error("Failed to fetch regions");
      console.error("Error fetching regions:", error);
    }
  };

  // Handle region change
  const handleRegionChange = async (regionCode: string) => {
    setLocationMapping({ regionCode });
    setEditedProject((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        region:
          regionList.find((r) => r.region_code === regionCode)?.region_name ||
          "",
        province: "",
        municipality: "",
        barangay: "",
        fullAddress: "",
      },
    }));
  };

  // Handle province change
  const handleProvinceChange = async (provinceCode: string) => {
    setLocationMapping((prev) => ({ ...prev, provinceCode }));
    setEditedProject((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        province:
          provinceList.find((p) => p.province_code === provinceCode)
            ?.province_name || "",
        municipality: "",
        barangay: "",
        fullAddress: "",
      },
    }));
  };

  // Handle municipality/city change
  const handleMunicipalityChange = async (cityCode: string) => {
    setLocationMapping((prev) => ({ ...prev, cityCode }));
    setEditedProject((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        municipality:
          cityList.find((c) => c.city_code === cityCode)?.city_name || "",
        barangay: "",
        fullAddress: "",
      },
    }));
  };

  // Handle barangay change
  const handleBarangayChange = (barangayCode: string) => {
    setLocationMapping((prev) => ({ ...prev, barangayCode }));
    setEditedProject((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        barangay:
          barangayList.find((b) => b.brgy_code === barangayCode)?.brgy_name ||
          "",
        fullAddress: "",
      },
    }));
  };

  // Format total cost with commas
  const formatTotalCost = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // If empty, return empty
    if (!numericValue) return "";

    // Split into integer and decimal parts
    const [integerPart, decimalPart] = numericValue.split(".");

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Return formatted value with decimal part if it exists
    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  // Handle total cost input
  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatTotalCost(value);
    setEditedProject((prev) => ({
      ...prev,
      totalCost: formattedValue,
    }));
  };

  // Calculate the numeric value from formatted string
  const getNumericTotalCost = (value: string) => {
    return parseFloat(value.replace(/,/g, "")) || 0;
  };

  // Build full address from selected location
  const buildFullAddress = () => {
    const parts = [];

    if (editedProject.location.barangay) {
      parts.push(editedProject.location.barangay);
    }
    if (editedProject.location.municipality) {
      parts.push(editedProject.location.municipality);
    }
    if (editedProject.location.province) {
      parts.push(editedProject.location.province);
    }
    if (editedProject.location.region) {
      parts.push(editedProject.location.region);
    }

    return parts.join(", ");
  };

  // Validate form data
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!editedProject.name.trim()) {
      errors.push("- Ensure project title is provided");
    } else if (editedProject.name.length > 50) {
      errors.push("- Project title must be 50 characters or less");
    }

    if (!editedProject.startDate) {
      errors.push("- Verify start date");
    }

    if (!editedProject.totalCost) {
      errors.push("- Verify total cost is provided");
    } else {
      const parsedTotalCost = getNumericTotalCost(editedProject.totalCost);
      if (isNaN(parsedTotalCost)) {
        errors.push("- Total cost must be a valid number");
      } else if (parsedTotalCost <= 0) {
        errors.push("- Verify total cost is a positive number");
      } else if (editedProject.totalCost.replace(/,/g, "").length > 20) {
        errors.push("- Total cost must be 20 digits or less");
      }
    }

    if (!editedProject.userId) {
      errors.push("- Ensure user is selected");
    }

    if (editedProject.endDate && editedProject.startDate) {
      const startDate = new Date(editedProject.startDate);
      const endDate = new Date(editedProject.endDate);
      if (endDate < startDate) {
        errors.push("- Completion date cannot be before start date");
      }
    }

    return errors;
  };

  // Handle project update
  const handleSaveEdit = async () => {
    if (!project) {
      toast.error("No project selected");
      return;
    }

    const errors = validateForm();

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      // Build full address if location is provided
      let fullAddress = "";
      const hasLocation =
        editedProject.location.region ||
        editedProject.location.province ||
        editedProject.location.municipality ||
        editedProject.location.barangay;

      if (hasLocation) {
        fullAddress = buildFullAddress();
      }

      const numericTotalCost = getNumericTotalCost(editedProject.totalCost);

      const formData = new FormData();
      formData.append("name", editedProject.name.trim());
      formData.append("status", editedProject.status);
      formData.append("startDate", editedProject.startDate);
      formData.append("totalCost", numericTotalCost.toString());

      if (editedProject.endDate) {
        formData.append("endDate", editedProject.endDate);
      }

      formData.append("userId", editedProject.userId);

      if (hasLocation) {
        formData.append("location[region]", editedProject.location.region);
        formData.append("location[province]", editedProject.location.province);
        formData.append(
          "location[municipality]",
          editedProject.location.municipality
        );
        formData.append("location[barangay]", editedProject.location.barangay);
        formData.append("location[fullAddress]", fullAddress);
      }

      const result = await updateProject(project.project_id, formData);

      if (result.success && result.project) {
        toast.success("Project updated successfully");
        onOpenChange(false);
        setValidationErrors([]);
        setShowValidationDialog(false);
        onUpdate(result.project);
      } else {
        // Parse server-side errors
        const serverErrors: string[] = result.error
          ? result.error
              .split("\n")
              .filter((line) => line.startsWith("- "))
              .map((line) => line)
          : ["- Failed to update project"];
        setValidationErrors(serverErrors);
        setShowValidationDialog(true);
      }
    } catch (error) {
      console.error("Update error:", error);
      setValidationErrors(["- An error occurred while updating the project"]);
      setShowValidationDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Get selected user
  const selectedUser = users.find((u) => u.user_id === editedProject.userId);

  // Calculate duration
  const calculateDuration = () => {
    if (!editedProject.startDate || !editedProject.endDate) return 0;

    const start = new Date(editedProject.startDate);
    const end = new Date(editedProject.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!project) {
    return null;
  }

  return (
    <ProjectModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Construction Project"
      description="Update your construction project with timeline and specifications"
      footerActions={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            onClick={onBackToUserSelection}
            className="flex-1 py-3 border-border text-foreground hover:bg-muted rounded-full font-geist"
          >
            Back to Users
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={isLoading}
            className="flex-1 py-3 bg-foreground hover:bg-foreground/90 text-background rounded-full font-geist"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {showValidationDialog && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 font-geist">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">
                  Validation Errors
                </h4>
                <p className="text-sm text-foreground">
                  Unable to process your request.
                </p>
                <p className="text-sm text-foreground mb-3">
                  Please verify your project information and try again.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-foreground">
                      {error.replace(/^- /, "")}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValidationDialog(false)}
                  className="mt-3 hover:bg-destructive/10 text-destructive"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selected User Info */}
        {selectedUser && (
          <div className="bg-muted p-5 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground font-geist">
                  Assigned User:
                </p>
                <p className="text-sm text-foreground/80 font-geist">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-geist">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.contactNo && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-geist">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{selectedUser.contactNo}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-4 font-geist">
                  <span>ID: {selectedUser.user_id}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToUserSelection}
                className="text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10 font-geist"
              >
                Change
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Project Name */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="edit-name"
                className="text-sm font-medium text-foreground font-geist"
              >
                Project Title
              </Label>
              <span className="text-xs text-muted-foreground font-geist">
                {editedProject.name.length}/50 characters
              </span>
            </div>
            <Input
              id="edit-name"
              value={editedProject.name}
              onChange={(e) =>
                setEditedProject({ ...editedProject, name: e.target.value })
              }
              placeholder="e.g., Office Building Construction, Highway Expansion"
              className="py-3 px-4 border-border focus:ring-foreground font-geist"
              maxLength={50}
            />
          </div>

          {/* Total Cost */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="edit-totalCost"
                className="text-sm font-medium text-foreground font-geist"
              >
                Total Cost
              </Label>
              <span className="text-xs text-muted-foreground font-geist">
                {editedProject.totalCost.replace(/,/g, "").length}/20 characters
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-geist">
                ₱
              </span>
              <Input
                id="edit-totalCost"
                type="text"
                value={editedProject.totalCost}
                onChange={handleTotalCostChange}
                placeholder="e.g., 1,000,000"
                className="py-3 pl-10 pr-4 border-border focus:ring-foreground font-geist"
                maxLength={20}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label
              htmlFor="edit-status"
              className="text-sm font-medium text-foreground font-geist"
            >
              Status
            </Label>
            <Select
              value={editedProject.status}
              onValueChange={(
                value: "pending" | "active" | "completed" | "cancelled"
              ) => setEditedProject({ ...editedProject, status: value })}
            >
              <SelectTrigger
                id="edit-status"
                className="w-full border-border focus:ring-foreground font-geist py-3"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground font-geist">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border font-geist py-3",
                      !editedProject.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
                    {editedProject.startDate ? (
                      format(new Date(editedProject.startDate), "PPP")
                    ) : (
                      <span>Pick a start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      editedProject.startDate
                        ? new Date(editedProject.startDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setEditedProject({
                        ...editedProject,
                        startDate: date ? date.toISOString().split("T")[0] : "",
                      })
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground font-geist">
                Completion Date (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border font-geist py-3",
                      !editedProject.endDate && "text-muted-foreground"
                    )}
                    disabled={!editedProject.startDate}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
                    {editedProject.endDate ? (
                      format(new Date(editedProject.endDate), "PPP")
                    ) : (
                      <span>Pick a completion date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      editedProject.endDate
                        ? new Date(editedProject.endDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setEditedProject({
                        ...editedProject,
                        endDate: date ? date.toISOString().split("T")[0] : "",
                      })
                    }
                    disabled={(date) =>
                      !editedProject.startDate ||
                      date < new Date(editedProject.startDate)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-5">
          <h3 className="text-sm font-medium text-foreground font-geist">
            Project Location
          </h3>

          {isFetchingLocation ? (
            <div className="text-center py-4 border border-border rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground font-geist">
                Loading location data...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground font-geist">
                  Region
                </Label>
                <Select
                  value={locationMapping.regionCode || ""}
                  onValueChange={handleRegionChange}
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
                  value={locationMapping.provinceCode || ""}
                  onValueChange={handleProvinceChange}
                  disabled={!locationMapping.regionCode}
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
                  value={locationMapping.cityCode || ""}
                  onValueChange={handleMunicipalityChange}
                  disabled={!locationMapping.provinceCode}
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
                  value={locationMapping.barangayCode || ""}
                  onValueChange={handleBarangayChange}
                  disabled={!locationMapping.cityCode}
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
          )}

          {/* Display selected location */}
          {(editedProject.location.region ||
            editedProject.location.province ||
            editedProject.location.municipality ||
            editedProject.location.barangay) && (
            <div className="bg-muted p-4 rounded-lg border border-border">
              <h4 className="text-xs font-medium text-foreground mb-3 font-geist">
                Selected Location:
              </h4>
              <p className="text-sm text-foreground/90 font-geist">
                {[
                  editedProject.location.barangay,
                  editedProject.location.municipality,
                  editedProject.location.province,
                  editedProject.location.region,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Project Summary */}
        <div className="bg-muted p-5 rounded-lg border border-border">
          <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground font-geist">
            <AlertCircle className="h-4 w-4" />
            Construction Timeline
          </h4>
          <div className="grid grid-cols-2 gap-5 text-sm">
            {editedProject.startDate && editedProject.endDate && (
              <div className="space-y-1">
                <span className="text-foreground/70 font-geist">Duration:</span>
                <p className="font-medium text-foreground font-geist">
                  {calculateDuration()} working days
                </p>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-foreground/70 font-geist">Project ID:</span>
              <p className="font-mono font-medium text-foreground font-geist">
                {project.project_id}
              </p>
            </div>
            {editedProject.totalCost && (
              <div className="space-y-1 col-span-2">
                <span className="text-foreground/70 font-geist">
                  Estimated Cost:
                </span>
                <p className="font-medium text-foreground font-geist">
                  ₱{editedProject.totalCost}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-foreground/70 font-geist">
                Current Status:
              </span>
              <p className="font-medium text-foreground font-geist capitalize">
                {editedProject.status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProjectModalLayout>
  );
}
