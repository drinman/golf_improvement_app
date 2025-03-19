"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getUserProfile, saveMonthlyRecap, generateAutoSuggestedScores } from "@/app/firebase/db";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { EffortScores, effortCategories } from "@/app/types/recap";

// Type for user profile
interface UserProfile {
  id: string;
  handicap?: number;
  [key: string]: any;
}

// Wrapper component that uses searchParams
function ManualRecapContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingScores, setIsSuggestingScores] = useState(false);
  
  // Form state
  const [month, setMonth] = useState("");
  const [handicapStart, setHandicapStart] = useState("");
  const [handicapEnd, setHandicapEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [effortScores, setEffortScores] = useState<EffortScores>({
    practiceSessions: 1,
    mentalGame: 1,
    strengthTraining: 1,
    mobilityExercises: 1,
    fullSwingWork: 1,
    shortGameWork: 1,
    puttingWork: 1
  });
  const [suggestedScores, setSuggestedScores] = useState<Partial<EffortScores>>({});

  // Initialize with provided month and user handicap
  useEffect(() => {
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }
    
    // Get month from search params
    const monthParam = searchParams.get("month");
    if (monthParam) {
      setMonth(monthParam);
      // Also try to generate suggestions for this month
      generateSuggestedScores(monthParam);
    } else {
      // Set current month in YYYY-MM format if no month provided
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setMonth(currentMonth);
      generateSuggestedScores(currentMonth);
    }
    
    // Load user profile to get current handicap
    const loadProfile = async () => {
      if (!currentUser) return;
      
      try {
        const profile = await getUserProfile(currentUser.uid) as UserProfile;
        if (profile && typeof profile.handicap === 'number') {
          setHandicapStart(profile.handicap.toString());
          setHandicapEnd(profile.handicap.toString());
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    
    loadProfile();
  }, [currentUser, router, searchParams]);
  
  // Generate suggested scores based on practice logs
  const generateSuggestedScores = async (selectedMonth: string) => {
    if (!currentUser) return;
    
    setIsSuggestingScores(true);
    try {
      const suggested = await generateAutoSuggestedScores(currentUser.uid, selectedMonth);
      setSuggestedScores(suggested);
      
      // Update effort scores with suggested values
      setEffortScores(prev => ({
        ...prev,
        ...suggested
      }));
    } catch (error) {
      console.error("Error generating suggested scores:", error);
    } finally {
      setIsSuggestingScores(false);
    }
  };
  
  // Handle score change for a category
  const handleScoreChange = (category: keyof EffortScores, value: number) => {
    setEffortScores(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Get month name from YYYY-MM format
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  
  // Calculate average score across all categories
  const getAverageScore = () => {
    const values = Object.values(effortScores);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(1);
  };
  
  // Save the monthly recap
  const saveRecap = async () => {
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }
    
    if (!month || !handicapStart || !handicapEnd) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    setIsLoading(true);
    try {
      const recapData = {
        month,
        effortScores,
        autoSuggestedScores: suggestedScores,
        handicapStartOfMonth: parseFloat(handicapStart),
        handicapEndOfMonth: parseFloat(handicapEnd),
        notes,
        createdAt: Timestamp.now()
      };
      
      await saveMonthlyRecap(currentUser.uid, recapData);
      
      toast.success("Monthly recap saved successfully!");
      router.push("/recap");
    } catch (error: any) {
      toast.error(error.message || "Failed to save monthly recap");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate score button component
  const ScoreButtons = ({ category, score }: { category: keyof EffortScores, score: number }) => {
    return (
      <div className="flex justify-between space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleScoreChange(category, value)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
              value <= score 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Monthly Recap for {getMonthName(month)}</h1>
          <Link href="/recap/create">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Golf Improvement Scorecard</CardTitle>
            <CardDescription>
              Rate your effort in each category from 1 (minimal) to 5 (consistent, focused effort)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium mb-4">Handicap Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="handicapStart" className="text-sm font-medium">
                    Starting Handicap <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="handicapStart"
                    type="number"
                    step="0.1"
                    value={handicapStart}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHandicapStart(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="e.g., 15.2"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="handicapEnd" className="text-sm font-medium">
                    Ending Handicap <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="handicapEnd"
                    type="number"
                    step="0.1"
                    value={handicapEnd}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHandicapEnd(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="e.g., 14.8"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your Effort This Month</h3>
                <div>
                  <span className="mr-2 font-semibold">Average: {getAverageScore()}/5</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => generateSuggestedScores(month)}
                    disabled={isSuggestingScores}
                  >
                    {isSuggestingScores ? "Generating..." : "Suggest Scores"}
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                      <th className="border-b px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                      <th className="border-b px-4 py-3 text-center text-sm font-medium text-gray-900">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {effortCategories.map((category) => (
                      <tr key={category.id} className={suggestedScores[category.id] ? "bg-green-50" : ""}>
                        <td className="px-4 py-4 text-sm font-medium">
                          {category.label}
                          {suggestedScores[category.id] && (
                            <span className="text-xs text-blue-500 block">
                              Suggested based on logs
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{category.description}</td>
                        <td className="px-4 py-4">
                          <ScoreButtons
                            category={category.id}
                            score={effortScores[category.id]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Your reflections, achievements, or areas to improve next month..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/recap/create")}
            >
              Cancel
            </Button>
            <Button
              onClick={saveRecap}
              className="bg-blue-500 text-white hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Monthly Recap"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Loading fallback component
function RecapFormLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Loading Monthly Recap...</h1>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component with suspense boundary
export default function ManualCreateRecap() {
  return (
    <Suspense fallback={<RecapFormLoading />}>
      <ManualRecapContent />
    </Suspense>
  );
} 