"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project, ProjectImage } from "@/types/project";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Image as ImageIcon,
  Building,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UserProjectDetailsProps {
  project: Project;
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  active: {
    label: "Active",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

// Project Images Carousel Component
function ProjectImagesCarousel({ images }: { images: ProjectImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      {/* Main Carousel */}
      <div className="relative">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].title}
            className="w-full h-full object-contain cursor-pointer hover:opacity-95"
            onClick={() => setIsDialogOpen(true)}
          />

          {/* Zoom Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={() => setIsDialogOpen(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="mt-4">
        <h4 className="font-semibold text-gray-900">
          {images[currentIndex].title}
        </h4>
        {images[currentIndex].description && (
          <p className="text-sm text-gray-600 mt-1">
            {images[currentIndex].description}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Image {currentIndex + 1} of {images.length}
        </p>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">All Images:</p>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-orange-500"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full bg-white border-gray-200">
          <div className="relative">
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-gray-900 text-lg">
              {images[currentIndex].title}
            </h3>
            {images[currentIndex].description && (
              <p className="text-sm text-gray-600 mt-1">
                {images[currentIndex].description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Image {currentIndex + 1} of {images.length}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function UserProjectDetails({
  project,
}: UserProjectDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const status = statusConfig[project.status];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/user/projects")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              <Badge className={`${status.color} border-0 text-sm font-medium`}>
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center text-gray-600 mt-1">
              <Building className="h-4 w-4 mr-2" />
              <span className="font-mono text-sm">{project.project_id}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Site Visit
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Request Update
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["overview", "documents", "gallery"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Project Images Grid */}
              {project.projectImages && project.projectImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Project Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Carousel View */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                          Interactive View
                        </h3>
                        <ProjectImagesCarousel images={project.projectImages} />
                      </div>

                      {/* Grid View */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                          All Images
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {project.projectImages.map((image, index) => (
                            <div key={index} className="group relative">
                              <img
                                src={image.url}
                                alt={image.title}
                                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                onClick={() => window.open(image.url, "_blank")}
                              />
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {image.title}
                                </p>
                                {image.description && (
                                  <p className="text-sm text-gray-600">
                                    {image.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Basic Information
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Project ID</p>
                            <p className="font-medium">{project.project_id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Badge className={`${status.color} border-0 mt-1`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Start Date</p>
                            <p className="font-medium">
                              {formatDate(project.startDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Financial Information
                        </h4>
                        <div className="space-y-3">
                          {project.totalCost && project.totalCost > 0 && (
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Cost
                              </p>
                              <p className="font-medium">
                                {formatCurrency(project.totalCost)}
                              </p>
                            </div>
                          )}
                          {project.endDate && (
                            <div>
                              <p className="text-sm text-gray-600">
                                Estimated Completion
                              </p>
                              <p className="font-medium">
                                {formatDate(project.endDate)}
                              </p>
                            </div>
                          )}
                          {project.projectImages && (
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Images
                              </p>
                              <p className="font-medium">
                                {project.projectImages.length}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special message for pending projects */}
              {project.status === "pending" && (
                <Card className="border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 text-lg mb-2">
                          Awaiting Your Confirmation
                        </h4>
                        <p className="text-yellow-800">
                          This project is pending your confirmation. Please
                          review the project details and images carefully before
                          confirming to begin construction.
                        </p>
                        <div className="mt-3">
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => {
                              // This would typically open a confirmation modal
                              // For now, we'll just show a message
                              alert(
                                "Confirmation feature will be implemented here"
                              );
                            }}
                          >
                            Confirm Project Start
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeTab === "gallery" && (
            <Card>
              <CardHeader>
                <CardTitle>Project Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                {project.projectImages && project.projectImages.length > 0 ? (
                  <div className="space-y-6">
                    {/* Carousel View */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Interactive View
                      </h3>
                      <ProjectImagesCarousel images={project.projectImages} />
                    </div>

                    {/* Grid View */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        All Images
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.projectImages.map((image, index) => (
                          <div key={index} className="group relative">
                            <img
                              src={image.url}
                              alt={image.title}
                              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80"
                              onClick={() => window.open(image.url, "_blank")}
                            />
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-900">
                                {image.title}
                              </p>
                              {image.description && (
                                <p className="text-sm text-gray-600">
                                  {image.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>No project images available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "documents" && (
            <Card>
              <CardHeader>
                <CardTitle>Project Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>No documents available for this project.</p>
                  <p className="text-sm mt-2">
                    Documents will appear here once they are uploaded by the
                    admin team.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={`${status.color} border-0`}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Start Date</span>
                <span className="text-sm font-medium">
                  {formatDate(project.startDate)}
                </span>
              </div>
              {project.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">End Date</span>
                  <span className="text-sm font-medium">
                    {formatDate(project.endDate)}
                  </span>
                </div>
              )}
              {project.totalCost && project.totalCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Cost</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(project.totalCost)}
                  </span>
                </div>
              )}
              {project.projectImages && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Project Images</span>
                  <span className="text-sm font-medium">
                    {project.projectImages.length}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {project.location && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">
                      {project.location.fullAddress}
                    </p>
                    {project.location.barangay && (
                      <p>Barangay: {project.location.barangay}</p>
                    )}
                    {project.location.municipality && (
                      <p>Municipality: {project.location.municipality}</p>
                    )}
                    {project.location.province && (
                      <p>Province: {project.location.province}</p>
                    )}
                    {project.location.region && (
                      <p>Region: {project.location.region}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Project Manager
                </p>
                <p className="text-sm text-gray-600">
                  Contact the admin team for project inquiries
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Support</p>
                <p className="text-sm text-gray-600">admin@gianconstruct.com</p>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
