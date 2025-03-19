"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { populateSixMonthsData } from "@/app/firebase/mock-data";
import { useAuth } from "@/app/firebase/auth-context";
import { toast } from "sonner";

export default function GenerateMockDataButton() {
  const { currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateData = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to generate mock data");
      return;
    }

    if (window.confirm("This will generate 6 months of mock data for your account. Continue?")) {
      setIsGenerating(true);
      try {
        // Generate the mock data
        const result = await populateSixMonthsData(currentUser.uid, true);
        
        if (result.success) {
          toast.success("Mock data generated successfully!");
          // Refresh the page to show the new data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error(result.message || "Failed to generate mock data");
        }
      } catch (error) {
        console.error("Error generating mock data:", error);
        toast.error("An error occurred while generating mock data");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  if (!currentUser) return null;

  return (
    <Button
      variant="outline"
      className="bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100"
      onClick={handleGenerateData}
      disabled={isGenerating}
    >
      {isGenerating ? "Generating Data..." : "Generate 6 Months of Mock Data"}
    </Button>
  );
} 