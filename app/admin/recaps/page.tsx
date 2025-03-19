"use client";

import { useState } from "react";
import { useAuth } from "@/app/firebase/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminRecapsPage() {
  const { currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    // Default to previous month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleGenerateRecaps = async () => {
    if (!adminKey) {
      toast.error("Admin API key is required");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/generate-recaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminKey}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Recaps generated: ${data.recapsGenerated}`);
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating recaps:", error);
      toast.error("Failed to generate recaps");
    } finally {
      setIsGenerating(false);
    }
  };

  // Check for correct date format (YYYY-MM)
  const isValidMonthFormat = (value: string) => {
    return /^\d{4}-\d{2}$/.test(value);
  };

  // Admin only page
  if (!currentUser || !currentUser.email?.endsWith("@golfimprover.app")) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generate Monthly Recaps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Admin API Key
              </label>
              <Input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin API key"
                className="mb-1"
              />
              <p className="text-xs text-gray-500">
                This key is required to authenticate your request
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleGenerateRecaps}
                disabled={isGenerating || !adminKey}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {isGenerating ? "Generating..." : "Generate Recaps"}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will generate monthly recaps for all users who have practice logs in the previous month.
                Users will receive in-app notifications when their recaps are ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Notes for Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium">Firebase Cloud Function</h3>
              <p className="text-gray-600">
                The monthly recap generation is designed to run automatically on the 1st of each month
                via a Firebase Cloud Function, which is already implemented in the functions directory.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Manual Testing</h3>
              <p className="text-gray-600">
                This admin page is for testing purposes only. In production, recaps will be generated automatically.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Security</h3>
              <p className="text-gray-600">
                The API is protected with an API key, which should be set in your environment variables as ADMIN_API_KEY.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 