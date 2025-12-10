// components/admin/NotFound.tsx
import React from "react";

interface NotFoundProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function NotFound({
  title = "As flawless as fresh paint on a brand-new facade. Maybe too flawless?",
  description = "The page you're looking for seems to have vanished into thin air.",
}: NotFoundProps) {
  return (
    <div className="flex items-center justify-center px-4 font-geist">
      <div className="max-w-md w-full text-center">
        {/* Image */}
        <div className="mb-6">
          <img
            src="/images/notfound2.jpg"
            alt="Clean empty space"
            className="mx-auto w-48 h-48 object-contain"
          />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-lg font-medium text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 text-sm">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
