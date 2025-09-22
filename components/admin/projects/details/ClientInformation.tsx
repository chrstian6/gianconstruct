// components/admin/projects/ClientInformation.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, Phone, Mail, Building, Calendar } from "lucide-react";

interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
  createdAt?: string;
}

interface ClientInformationProps {
  user: User | null;
}

export default function ClientInformation({ user }: ClientInformationProps) {
  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="border-none shadow-none rounded-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            Client Information
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Primary Contact
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 rounded-none">
        {/* Client Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-none">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Client Name</span>
              </div>
              <p className="font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </div>
              <p className="font-medium text-foreground break-all">
                {user.email}
              </p>
            </div>

            {user.createdAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Member Since</span>
                </div>
                <p className="font-medium text-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            {user.contactNo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </div>
                <p className="font-medium text-foreground">{user.contactNo}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Address</span>
              </div>
              <p className="font-medium text-foreground leading-relaxed">
                {user.address || (
                  <span className="text-muted-foreground italic">
                    Not provided
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Send Email
          </Button>

          {user.contactNo && (
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" />
              Call Client
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
