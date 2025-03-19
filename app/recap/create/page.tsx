"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateUserMonthlyRecap } from "@/app/firebase/recap";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateRecapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [month, setMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState<{label: string, value: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }

    // Get month from query params if available
    const monthParam = searchParams.get("month");
    if (monthParam) {
      setMonth(monthParam);
    }

    // Generate available months (last 6 months)
    const generateAvailableMonths = () => {
      const months = [];
      const now = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        months.push({ 
          label: monthName,
          value: monthStr
        });
      }
      
      setAvailableMonths(months);
      
      // Set default month if not already set
      if (!monthParam && !month) {
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        setMonth(currentMonth);
      }
    };
    
    generateAvailableMonths();
  }, [currentUser, router, searchParams, month]);
  
  const handleCreateRecap = () => {
    if (!month) {
      toast.error("Please select a month");
      return;
    }
    
    // Navigate to the manual form
    router.push(`/recap/create/manual?month=${month}`);
  };
  
  const handleGenerateRecap = async () => {
    if (!currentUser || !month) {
      toast.error("Please select a month");
      return;
    }
    
    setIsAutoGenerating(true);
    
    try {
      const result = await generateUserMonthlyRecap(currentUser.uid, month);
      
      if (result.success) {
        toast.success("Recap generated successfully!");
        router.push(`/recap/${month}`);
      } else {
        if (result.recapId) {
          toast.error(`${result.message}. Redirecting to existing recap.`);
          setTimeout(() => {
            router.push(`/recap/${month}`);
          }, 2000);
        } else {
          toast.error(result.message || "Failed to generate recap");
        }
      }
    } catch (error) {
      console.error("Error generating recap:", error);
      toast.error("An error occurred while generating the recap");
    } finally {
      setIsAutoGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Monthly Recap</h1>
          <p className="text-gray-600 mt-2">
            Track your golf improvement efforts and see how they correlate with your handicap progress.
          </p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <Select 
                  value={month} 
                  onValueChange={setMonth}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a month" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-3">Choose an option:</h3>
                
                <div className="flex flex-col gap-4">
                  <Card className="border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                          <h3 className="font-medium text-lg">Auto-Generate Recap</h3>
                          <p className="text-gray-600 text-sm">
                            Use your practice logs to automatically generate effort scores
                          </p>
                        </div>
                        <Button 
                          className="bg-blue-500 text-white hover:bg-blue-600 w-full md:w-auto"
                          onClick={handleGenerateRecap}
                          disabled={isAutoGenerating}
                        >
                          {isAutoGenerating ? "Generating..." : "Auto-Generate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                          <h3 className="font-medium text-lg">Manually Create Recap</h3>
                          <p className="text-gray-600 text-sm">
                            Set your own effort scores and notes for the month
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="border-blue-600 text-blue-700 hover:bg-blue-50 w-full md:w-auto"
                          onClick={handleCreateRecap}
                          disabled={isGenerating}
                        >
                          Create Manually
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Link href="/recap">
            <Button variant="outline">Back to Recaps</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 