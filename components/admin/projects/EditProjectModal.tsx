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
import { CalendarIcon, Info, AlertCircle, HardHat } from "lucide-react";
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
  address: string;
}

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  users: User[];
  onUpdate: (project: Project) => void;
  onBackToUserSelection: () => void;
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
    status: "active" as
      | "not-started"
      | "pending"
      | "active"
      | "completed"
      | "cancelled",
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

  // Initialize editedProject with project data
  useEffect(() => {
    if (project) {
      setEditedProject({
        name: project.name,
        status: project.status,
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "",
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().split("T")[0]
          : "",
        totalCost: project.totalCost
          ? project.totalCost.toLocaleString("en-PH")
          : "",
        userId: project.userId,
        location: {
          region: project.location?.region || "",
          province: project.location?.province || "",
          municipality: project.location?.municipality || "",
          barangay: project.location?.barangay || "",
          fullAddress: project.location?.fullAddress || "",
        },
      });
      fetchRegions();
    }
  }, [project]);

  // Fetch provinces when region changes
  useEffect(() => {
    if (editedProject.location.region) {
      fetchProvinces(editedProject.location.region);
    }
  }, [editedProject.location.region]);

  // Fetch cities when province changes
  useEffect(() => {
    if (editedProject.location.province) {
      fetchCities(editedProject.location.province);
    }
  }, [editedProject.location.province]);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (editedProject.location.municipality) {
      fetchBarangays(editedProject.location.municipality);
    }
  }, [editedProject.location.municipality]);

  // Fetch regions
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

  // Fetch provinces
  const fetchProvinces = async (regionCode: string) => {
    try {
      const data = await provinces(regionCode);
      if (Array.isArray(data)) {
        setProvinceList(data);
        setEditedProject((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            province: "",
            municipality: "",
            barangay: "",
          },
        }));
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

  // Fetch cities
  const fetchCities = async (provinceCode: string) => {
    try {
      const data = await cities(provinceCode);
      if (Array.isArray(data)) {
        setCityList(data);
        setEditedProject((prev) => ({
          ...prev,
          location: { ...prev.location, municipality: "", barangay: "" },
        }));
        setBarangayList([]);
      } else {
        toast.error("Failed to fetch cities: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch cities");
      console.error("Error fetching cities:", error);
    }
  };

  // Fetch barangays
  const fetchBarangays = async (cityCode: string) => {
    try {
      const data = await barangays(cityCode);
      if (Array.isArray(data)) {
        setBarangayList(data);
        setEditedProject((prev) => ({
          ...prev,
          location: { ...prev.location, barangay: "" },
        }));
      } else {
        toast.error("Failed to fetch barangays: " + data);
      }
    } catch (error) {
      toast.error("Failed to fetch barangays");
      console.error("Error fetching barangays:", error);
    }
  };

  // Format total cost with commas
  const formatTotalCost = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
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

  // Handle project update
  const handleSaveEdit = async () => {
    if (!project) return;

    // Validate required fields
    if (
      !editedProject.name.trim() ||
      !editedProject.startDate ||
      !editedProject.totalCost ||
      !editedProject.userId
    ) {
      toast.error(
        "Project name, start date, total cost, and user are required"
      );
      return;
    }

    // Validate end date if provided
    if (
      editedProject.endDate &&
      editedProject.endDate < editedProject.startDate
    ) {
      toast.error("End date cannot be before start date");
      return;
    }

    // Validate total cost
    const parsedTotalCost = parseFloat(
      editedProject.totalCost.replace(/,/g, "")
    );
    if (isNaN(parsedTotalCost) || parsedTotalCost <= 0) {
      toast.error("Total cost must be a positive number");
      return;
    }

    try {
      const regionName =
        regionList.find((r) => r.region_code === editedProject.location.region)
          ?.region_name || "";
      const provinceName =
        provinceList.find(
          (p) => p.province_code === editedProject.location.province
        )?.province_name || "";
      const cityName =
        cityList.find(
          (c) => c.city_code === editedProject.location.municipality
        )?.city_name || "";
      const barangayName =
        barangayList.find(
          (b) => b.brgy_code === editedProject.location.barangay
        )?.brgy_name || "";

      // Create full address only if any location field is selected
      const hasLocation =
        editedProject.location.region ||
        editedProject.location.province ||
        editedProject.location.municipality ||
        editedProject.location.barangay;
      const fullAddress = hasLocation
        ? `${barangayName}, ${cityName}, ${provinceName}, ${regionName}`
            .replace(/^,\s+/, "")
            .replace(/,\s+,/g, ",")
            .trim()
        : "";

      const formData = new FormData();
      formData.append("name", editedProject.name);
      formData.append("status", editedProject.status);
      formData.append("startDate", editedProject.startDate);
      formData.append("totalCost", parsedTotalCost.toString());
      if (editedProject.endDate) {
        formData.append("endDate", editedProject.endDate);
      }
      formData.append("userId", editedProject.userId);
      if (hasLocation) {
        formData.append("location[region]", regionName);
        formData.append("location[province]", provinceName);
        formData.append("location[municipality]", cityName);
        formData.append("location[barangay]", barangayName);
        formData.append("location[fullAddress]", fullAddress);
      }

      const result = await updateProject(project.project_id, formData);

      if (result.success && result.project) {
        toast.success("Project updated successfully");
        onOpenChange(false);
        onUpdate(result.project);
      } else {
        toast.error(result.error || "Failed to update project");
      }
    } catch (error) {
      toast.error("An error occurred while updating the project");
      console.error("Update error:", error);
    }
  };

  const assignedUser = users.find((u) => u.user_id === editedProject.userId);

  return (
    <ProjectModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Construction Project"
      description="Update your construction project with timeline and specifications"
      footerActions={
        <>
          <Button
            variant="outline"
            onClick={onBackToUserSelection}
            className="flex-1 min-w-[120px] order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full"
          >
            Back to Users
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={
              !editedProject.name.trim() ||
              !editedProject.startDate ||
              !editedProject.totalCost ||
              !editedProject.userId
            }
            className="flex-1 min-w-[120px] order-1 sm:order-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full"
          >
            Save Changes
          </Button>
        </>
      }
    >
      {assignedUser && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Assigned User:
              </p>
              <p className="text-sm text-blue-700">
                {assignedUser.firstName} {assignedUser.lastName}
              </p>
              <p className="text-xs text-blue-600">{assignedUser.email}</p>
              {assignedUser.contactNo && (
                <p className="text-xs text-blue-600">
                  {assignedUser.contactNo}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToUserSelection}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              Change
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="edit-name"
            className="text-sm font-medium text-gray-900"
          >
            Project Name
          </Label>
          <span className="text-xs text-gray-600">
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
          className="py-2.5 px-3.5 bg-white border-gray-300 focus:ring-gray-500"
          maxLength={50}
        />
        <p className="text-xs text-gray-600 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> Update the
          project name
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="edit-totalCost"
            className="text-sm font-medium text-gray-900"
          >
            Total Cost
          </Label>
          <span className="text-xs text-gray-600">
            {editedProject.totalCost.replace(/,/g, "").length}/20 characters
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
            ₱
          </span>
          <Input
            id="edit-totalCost"
            type="text"
            value={editedProject.totalCost}
            onChange={handleTotalCostChange}
            placeholder="e.g., 1,000,000"
            className="py-2.5 pl-8 pr-3.5 bg-white border-gray-300 focus:ring-gray-500"
            maxLength={20}
          />
        </div>
        <p className="text-xs text-gray-600 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          Update the total cost in PHP
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="edit-status"
          className="text-sm font-medium text-gray-900"
        >
          Status
        </Label>
        <Select
          value={editedProject.status}
          onValueChange={(
            value:
              | "not-started"
              | "pending"
              | "active"
              | "completed"
              | "cancelled"
          ) => setEditedProject({ ...editedProject, status: value })}
        >
          <SelectTrigger
            id="edit-status"
            className="w-full border-gray-300 focus:ring-gray-500"
          >
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            Start Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !editedProject.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editedProject.startDate ? (
                  format(new Date(editedProject.startDate), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            Completion Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !editedProject.endDate && "text-muted-foreground"
                )}
                disabled={!editedProject.startDate}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editedProject.endDate ? (
                  format(new Date(editedProject.endDate), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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
                  date < new Date() ||
                  (editedProject.startDate
                    ? date < new Date(editedProject.startDate)
                    : false)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">
          Project Location (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Region</Label>
            <Select
              value={editedProject.location.region}
              onValueChange={(value) =>
                setEditedProject((prev) => ({
                  ...prev,
                  location: { ...prev.location, region: value },
                }))
              }
            >
              <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
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
            <Label className="text-sm font-medium text-gray-900">
              Province
            </Label>
            <Select
              value={editedProject.location.province}
              onValueChange={(value) =>
                setEditedProject((prev) => ({
                  ...prev,
                  location: { ...prev.location, province: value },
                }))
              }
              disabled={!editedProject.location.region}
            >
              <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
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
            <Label className="text-sm font-medium text-gray-900">
              Municipality/City
            </Label>
            <Select
              value={editedProject.location.municipality}
              onValueChange={(value) =>
                setEditedProject((prev) => ({
                  ...prev,
                  location: { ...prev.location, municipality: value },
                }))
              }
              disabled={!editedProject.location.province}
            >
              <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500">
                <SelectValue placeholder="Select municipality/city" />
              </SelectTrigger>
              <SelectContent>
                {cityList.map((city: City) => (
                  <SelectItem key={city.city_code} value={city.city_code}>
                    {city.city_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">
              Barangay
            </Label>
            <Select
              value={editedProject.location.barangay}
              onValueChange={(value) =>
                setEditedProject((prev) => ({
                  ...prev,
                  location: { ...prev.location, barangay: value },
                }))
              }
              disabled={!editedProject.location.municipality}
            >
              <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500">
                <SelectValue placeholder="Select barangay" />
              </SelectTrigger>
              <SelectContent>
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
        {(editedProject.location.region ||
          editedProject.location.province ||
          editedProject.location.municipality ||
          editedProject.location.barangay) && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Selected Location:
            </h4>
            <p className="text-sm text-gray-900">
              {[
                barangayList.find(
                  (b) => b.brgy_code === editedProject.location.barangay
                )?.brgy_name,
                cityList.find(
                  (c) => c.city_code === editedProject.location.municipality
                )?.city_name,
                provinceList.find(
                  (p) => p.province_code === editedProject.location.province
                )?.province_name,
                regionList.find(
                  (r) => r.region_code === editedProject.location.region
                )?.region_name,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}
      </div>

      {(editedProject.startDate ||
        editedProject.endDate ||
        editedProject.totalCost) && (
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5 text-gray-900">
            <AlertCircle className="h-4 w-4" /> Construction Timeline
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {editedProject.startDate && editedProject.endDate && (
              <div>
                <span className="text-gray-700">Duration:</span>
                <p className="font-medium text-gray-900">
                  {Math.ceil(
                    (new Date(editedProject.endDate).getTime() -
                      new Date(editedProject.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  working days
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-700">Project ID:</span>
              <p className="font-mono font-medium text-gray-900">
                {project?.project_id || ""}
              </p>
            </div>
            {editedProject.totalCost && (
              <div>
                <span className="text-gray-700">Estimated Cost:</span>
                <p className="font-medium text-gray-900">
                  ₱{editedProject.totalCost}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </ProjectModalLayout>
  );
}
