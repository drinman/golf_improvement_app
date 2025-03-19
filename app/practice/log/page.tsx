"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { logPracticeSession, getUserPracticePlans } from "@/app/firebase/db";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect } from "react";
import { PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Activity categories
const activityCategories = [
  { id: "mental", label: "Mental Game" },
  { id: "strength", label: "Strength Training" },
  { id: "mobility", label: "Mobility/Flexibility" },
  { id: "meditation", label: "Meditation" },
  { id: "cardio", label: "Cardio or Fitness" },
  { id: "other", label: "Other" }
];

// Duration options in minutes
const durationOptions = [10, 15, 20, 30, 45, 60, 90, 120];

// Component that uses searchParams
function LogPracticeContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams?.get('planId');
  
  // Common fields for both types
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number>(0);
  
  // Logging mode
  const [logType, setLogType] = useState<"structured" | "activity">("structured");
  
  // Structured practice fields
  const [sessionTitle, setSessionTitle] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("none");
  const [drills, setDrills] = useState<{ name: string; completed: boolean }[]>([
    { name: "", completed: false }
  ]);
  
  // Activity logging fields
  const [activityTitle, setActivityTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherCategory, setOtherCategory] = useState("");
  
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<{ id: string; title: string }[]>([]);

  // Load user's practice plans
  useEffect(() => {
    const loadPlans = async () => {
      if (!currentUser) return;
      
      try {
        const plans = await getUserPracticePlans(currentUser.uid);
        setPlans(plans);
        
        const formattedPlans = plans.map(plan => ({
          id: plan.id,
          title: (plan as any).title || `Plan ${plan.id.substring(0, 4)}`
        }));
        
        setAvailablePlans(formattedPlans);
        
        // If plan ID is provided in URL, select it
        if (planIdFromUrl && plans.some(plan => plan.id === planIdFromUrl)) {
          setSelectedPlanId(planIdFromUrl);
          
          // Find the plan to get its title for the session title
          const selectedPlan = plans.find(plan => plan.id === planIdFromUrl) as any;
          if (selectedPlan && selectedPlan.title) {
            setSessionTitle(`Session for ${selectedPlan.title}`);
          }
        }
      } catch (error) {
        console.error("Error loading practice plans:", error);
        toast.error("Failed to load practice plans");
      }
    };

    loadPlans();
  }, [currentUser, planIdFromUrl]);

  // Structured practice handlers
  const handleAddDrill = () => {
    setDrills([...drills, { name: "", completed: false }]);
  };

  const handleDrillChange = (index: number, value: string) => {
    const updatedDrills = [...drills];
    updatedDrills[index].name = value;
    setDrills(updatedDrills);
  };

  const handleDrillToggle = (index: number) => {
    const updatedDrills = [...drills];
    updatedDrills[index].completed = !updatedDrills[index].completed;
    setDrills(updatedDrills);
  };

  const handleRemoveDrill = (index: number) => {
    const updatedDrills = [...drills];
    updatedDrills.splice(index, 1);
    setDrills(updatedDrills);
  };
  
  // Activity logging handlers
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prevSelected => 
      prevSelected.includes(categoryId)
        ? prevSelected.filter(id => id !== categoryId)
        : [...prevSelected, categoryId]
    );
    
    // If selecting "other" for the first time, focus the input
    if (categoryId === "other" && !selectedCategories.includes("other")) {
      setTimeout(() => {
        const otherInput = document.getElementById("other-category-input");
        if (otherInput) {
          otherInput.focus();
        }
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }

    if (logType === "structured") {
      if (!sessionTitle || !duration || !date) {
        toast.error("Please fill out all required fields");
        return;
      }
    } else {
      if (selectedCategories.length === 0 || !duration || !date) {
        toast.error("Please select at least one category and fill out all required fields");
        return;
      }
      
      if (selectedCategories.includes("other") && !otherCategory) {
        toast.error("Please specify the 'Other' category");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Define the type for log data
      interface LogData {
        type: "structured" | "activity";
        sessionTitle: string;
        notes: string;
        rating?: number;
        duration: number;
        date: Timestamp;
        createdAt: Timestamp;
        planId?: string;
        drills?: { name: string; completed: boolean }[];
        categories?: string[];
        otherCategory?: string;
      }
      
      let logData: LogData;
      
      if (logType === "structured") {
        // Filter out empty drills and format them for storage
        const completedDrills = drills
          .filter(drill => drill.name.trim() !== "")
          .map(drill => ({
            name: drill.name,
            completed: drill.completed
          }));

        logData = {
          type: "structured",
          sessionTitle,
          notes: notes || "",
          rating: rating || undefined,
          duration: parseInt(duration),
          drills: completedDrills,
          date: Timestamp.fromDate(new Date(date)),
          createdAt: Timestamp.now()
        };

        // Only add planId if it has a value and is not "none"
        if (selectedPlanId && selectedPlanId !== "none") {
          logData.planId = selectedPlanId;
        }
      } else {
        // For activity logging
        const formattedCategories = selectedCategories.includes("other")
          ? [...selectedCategories.filter(c => c !== "other"), `other:${otherCategory}`]
          : selectedCategories;
          
        logData = {
          type: "activity",
          sessionTitle: activityTitle || `${activityCategories.find(c => c.id === selectedCategories[0])?.label} Session`,
          notes: notes || "",
          rating: rating || undefined,
          duration: parseInt(duration),
          categories: formattedCategories,
          date: Timestamp.fromDate(new Date(date)),
          createdAt: Timestamp.now()
        };
        
        if (selectedCategories.includes("other")) {
          logData.otherCategory = otherCategory;
        }
      }

      await logPracticeSession(currentUser.uid, logData);
      toast.success("Session logged successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to log session");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Log Session</h1>
          <Button 
            variant="outline" 
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>

        <Tabs defaultValue="structured" className="mb-6" onValueChange={(value) => setLogType(value as "structured" | "activity")}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger 
              value="structured" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Structured Practice
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Other Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="structured" className="mt-4">
            <div className="text-sm text-gray-700 mb-2">
              Log a structured practice session from your practice plan or custom drills
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="selectedPlan" className="text-sm font-medium text-gray-700">
                  Practice Plan (optional)
                </label>
                <Select 
                  value={selectedPlanId} 
                  onValueChange={setSelectedPlanId}
                >
                  <SelectTrigger id="selectedPlan" className="w-full">
                    <SelectValue placeholder="Select a practice plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No plan selected</SelectItem>
                    {availablePlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium text-gray-800">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="duration" className="text-sm font-medium text-gray-800">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  >
                    <option value="">Select duration</option>
                    {durationOptions.map(option => (
                      <option key={option} value={option.toString()}>
                        {option} minutes
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  
                  {duration === "custom" && (
                    <Input
                      type="number"
                      placeholder="Enter minutes"
                      className="mt-2 border-gray-300"
                      value={duration === "custom" ? "" : duration}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) setDuration(value);
                      }}
                    />
                  )}
                </div>
              </div>

              {logType === "structured" ? (
                // Structured Practice Fields
                <>
                  <div className="space-y-2">
                    <label htmlFor="sessionTitle" className="text-sm font-medium text-gray-800">
                      Session Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="sessionTitle"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="e.g., Range Work: Iron Accuracy"
                      required
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-800">
                        Drills/Activities
                      </label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddDrill}
                        className="border-teal-400 text-teal-600 hover:bg-teal-50"
                      >
                        <PlusCircleIcon className="h-4 w-4 mr-1" />
                        Add Drill
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {drills.map((drill, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={drill.completed}
                            onCheckedChange={() => handleDrillToggle(index)}
                            id={`drill-${index}`}
                            className="border-gray-300 data-[state=checked]:bg-teal-400 data-[state=checked]:border-teal-400"
                          />
                          <Input
                            value={drill.name}
                            onChange={(e) => handleDrillChange(index, e.target.value)}
                            placeholder="e.g., Putting ladder drill"
                            className="flex-1 border-gray-300"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDrill(index)}
                            disabled={drills.length === 1}
                          >
                            <XCircleIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // Activity Logging Fields
                <>
                  <div className="space-y-2">
                    <label htmlFor="activityTitle" className="text-sm font-medium text-gray-800">
                      Activity Title (optional)
                    </label>
                    <Input
                      id="activityTitle"
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                      placeholder="e.g., Morning Visualization Routine"
                      className="border-gray-300"
                    />
                    <p className="text-xs text-gray-700">
                      If left empty, we'll generate a title based on your selected categories
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">
                      Activity Categories <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activityCategories.map(category => (
                        <div key={category.id} className="flex items-center">
                          <Badge 
                            variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                            className={`cursor-pointer ${
                              selectedCategories.includes(category.id) 
                                ? "bg-teal-400 text-white hover:bg-teal-500" 
                                : "bg-white text-gray-800 hover:bg-gray-100 border-gray-300"
                            }`}
                            onClick={() => toggleCategory(category.id)}
                          >
                            {selectedCategories.includes(category.id) && "✓ "}
                            {category.label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    {selectedCategories.includes("other") && (
                      <Input
                        id="other-category-input"
                        value={otherCategory}
                        onChange={(e) => setOtherCategory(e.target.value)}
                        placeholder="Specify other category..."
                        className="mt-2 border-gray-300"
                      />
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium text-gray-800">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={logType === "structured" 
                    ? "How did this session go? What did you learn?" 
                    : "Details about your activity and what you learned"
                  }
                  className="min-h-[100px] border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">
                  Session Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        rating >= star ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-500 text-white hover:bg-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging..." : "Log Session"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-4">
            <div className="text-sm text-gray-700 mb-2">
              Log other golf improvement activities like mental practice, fitness, mobility, etc.
            </div>
          </TabsContent>
        </Tabs>

        <Card className="bg-gray-50 border border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-gray-800">
              {logType === "structured" ? "Practice Session Details" : "Activity Details"}
            </CardTitle>
            <CardDescription className="text-gray-700">
              {logType === "structured" 
                ? "Record what you worked on during your practice" 
                : "Log your golf improvement activities beyond technical practice"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Rest of the component content remains unchanged */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading component
function LogPracticeLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Log Session</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded-md"></div>
            <div className="h-20 bg-gray-200 rounded-md"></div>
            <div className="h-40 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with suspense
export default function LogPractice() {
  return (
    <Suspense fallback={<LogPracticeLoading />}>
      <LogPracticeContent />
    </Suspense>
  );
} 