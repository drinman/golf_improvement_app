"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-blue-500">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
      <p className="mt-2 text-lg text-gray-600 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button className="bg-blue-500 hover:bg-blue-600">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}