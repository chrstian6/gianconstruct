// components/ui/dot-loader.tsx
"use client";

import React from "react";
import { FourSquare } from "react-loading-indicators";

export default function DotLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6">
        <FourSquare color="#011201" size="small" text="" textColor="#000000" />
      </div>
    </div>
  );
}
