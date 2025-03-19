"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-4xl font-bold text-red-500">Something went wrong!</h1>
      <p className="mt-4 text-lg text-gray-600 max-w-md">
        We're sorry, but something went wrong. Please try again or contact support if the problem persists.
      </p>
      <div className="mt-8 flex gap-4">
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
        <Link href="/">
          <Button className="bg-blue-500 hover:bg-blue-600">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}