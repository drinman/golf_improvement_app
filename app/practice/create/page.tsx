"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getUserProfile, savePracticePlan } from "@/app/firebase/db";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function CreatePracticePlan() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState("");
  const [handicap, setHandicap] = useState("");
  const [goal, setGoal] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [timePerSession, setTimePerSession] = useState("60"); // Default 60 minutes
  const [improveAreas, setImproveAreas] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  
  const improvementOptions = [
    "Driving distance",
    "Driving accuracy",
    "Iron play",
    "Approach shots",
    "Chipping",
    "Bunker play",
    "Putting",
    "Course management",
    "Mental game",
    "Physical fitness"
  ];

  // Load user profile on mount
  useState(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile && typeof profile === 'object' && 'handicap' in profile) {
          const handicapValue = profile.handicap;
          if (typeof handicapValue === 'number') {
            setHandicap(handicapValue.toString());
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    
    loadProfile();
  });

  const toggleImproveArea = (area: string) => {
    if (improveAreas.includes(area)) {
      setImproveAreas(improveAreas.filter(a => a !== area));
    } else {
      setImproveAreas([...improveAreas, area]);
    }
  };

  const generatePracticePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }

    if (!handicap || !goal || improveAreas.length === 0 || !timePerSession) {
      toast.error("Please fill out all required fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      // In a real implementation, this would call a cloud function that uses OpenAI
      // For this MVP, we'll simulate the API call with a local function
      
      const planSessions = await simulateAIResponse(
        parseFloat(handicap),
        goal,
        sessionsPerWeek,
        improveAreas,
        parseInt(timePerSession)
      );
      
      const plan = {
        title: practiceTitle || `${sessionsPerWeek}x Weekly Practice Plan`,
        sessions: planSessions,
        timePerSession: parseInt(timePerSession),
        aiGenerated: true
      };
      
      setGeneratedPlan(plan);
      toast.success("Practice plan generated successfully!");
      
    } catch (error: any) {
      toast.error(error.message || "Failed to generate practice plan");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      
      // Calculate end date (4 weeks from now)
      const endDate = new Date();
      endDate.setDate(now.getDate() + (7 * 4)); // 4 weeks
      
      const planData = {
        title: generatedPlan.title,
        description: `Generated plan focusing on: ${improveAreas.join(", ")}`,
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        sessions: generatedPlan.sessions,
        timePerSession: parseInt(timePerSession), // Add timePerSession to saved data
        aiGenerated: true,
        createdAt: Timestamp.fromDate(now)
      };
      
      await savePracticePlan(currentUser.uid, planData);
      
      toast.success("Practice plan saved successfully!");
      router.push("/practice/plan");
    } catch (error: any) {
      toast.error(error.message || "Failed to save practice plan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Practice Plan</h1>
          <Link href="/practice/plan">
            <Button variant="outline">Back to Practice</Button>
          </Link>
        </div>

        {!generatedPlan ? (
          <Card>
            <CardHeader>
              <CardTitle>Create AI-Generated Practice Plan</CardTitle>
              <CardDescription>
                Tell us about your game and goals to receive a personalized practice routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generatePracticePlan} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="practiceTitle" className="text-sm font-medium">
                    Plan Title (optional)
                  </label>
                  <Input
                    id="practiceTitle"
                    value={practiceTitle}
                    onChange={(e) => setPracticeTitle(e.target.value)}
                    placeholder="My Weekly Practice Plan"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="handicap" className="text-sm font-medium">
                      Current Handicap <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="handicap"
                      type="number"
                      step="0.1"
                      value={handicap}
                      onChange={(e) => setHandicap(e.target.value)}
                      placeholder="e.g., 15.2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="sessionsPerWeek" className="text-sm font-medium">
                      Practice Sessions Per Week <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="sessionsPerWeek"
                      value={sessionsPerWeek}
                      onChange={(e) => setSessionsPerWeek(parseInt(e.target.value))}
                      className="w-full rounded-md border border-gray-300 p-2"
                      required
                    >
                      <option value={1}>1 session per week</option>
                      <option value={2}>2 sessions per week</option>
                      <option value={3}>3 sessions per week</option>
                      <option value={4}>4 sessions per week</option>
                      <option value={5}>5+ sessions per week</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="timePerSession" className="text-sm font-medium">
                    Minutes Per Session <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="timePerSession"
                    value={timePerSession}
                    onChange={(e) => setTimePerSession(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hour)</option>
                    <option value="90">90 minutes (1.5 hours)</option>
                    <option value="120">120 minutes (2 hours)</option>
                    <option value="180">180 minutes (3 hours)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="goal" className="text-sm font-medium">
                    Primary Goal <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Lower handicap to single digits within 6 months"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Areas to Improve <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {improvementOptions.map((area) => (
                      <div key={area} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`area-${area}`}
                          checked={improveAreas.includes(area)}
                          onChange={() => toggleImproveArea(area)}
                          className="mr-2"
                        />
                        <label htmlFor={`area-${area}`}>{area}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {isGenerating ? "Generating Plan..." : "Generate Practice Plan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{generatedPlan.title}</CardTitle>
              <CardDescription>
                Focus areas: {improveAreas.join(", ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedPlan.sessions.map((session: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-2">{session.day}: {session.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">Duration: {session.duration} minutes</p>
                  
                  <div className="space-y-3 mt-3">
                    {session.drills.map((drill: any, drillIndex: number) => (
                      <div key={drillIndex} className="border-l-2 border-green-500 pl-3">
                        <p className="font-medium">{drill.name} ({drill.duration} mins)</p>
                        <p className="text-sm text-gray-600">{drill.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={savePlan}
                  disabled={isLoading}
                  className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                >
                  {isLoading ? "Saving..." : "Save Practice Plan"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setGeneratedPlan(null)}
                >
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Simulate an AI response for the MVP
// In a real implementation, this would be replaced with a call to OpenAI via a Firebase Cloud Function
async function simulateAIResponse(
  handicap: number,
  goal: string,
  sessionsPerWeek: number,
  improveAreas: string[],
  timePerSession: number
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const selectedDays = daysOfWeek.slice(0, sessionsPerWeek);
  
  // Generate different sessions based on areas to improve
  return selectedDays.map((day, index) => {
    // For each session, focus on 1-2 areas
    const sessionAreas = improveAreas.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, improveAreas.length));
    const primaryArea = sessionAreas[0];
    
    // Use the timePerSession value instead of random duration
    const sessionDuration = timePerSession;
    
    // Generate title based on focus areas
    const title = `${primaryArea} Focus Session`;
    
    // Generate drills based on the areas
    const drills = generateDrillsForAreas(sessionAreas, sessionDuration);
    
    return {
      day,
      title,
      duration: sessionDuration,
      drills
    };
  });
}

function generateDrillsForAreas(areas: string[], totalDuration: number) {
  const drills = [];
  let remainingDuration = totalDuration;
  
  // Create 3-5 drills that add up to the total duration
  const numDrills = Math.floor(3 + Math.random() * 3);
  
  for (let i = 0; i < numDrills; i++) {
    const isLast = i === numDrills - 1;
    const area = areas[i % areas.length];
    
    // Last drill gets remaining time, others get a portion
    const drillDuration = isLast 
      ? remainingDuration 
      : Math.floor(remainingDuration / (numDrills - i) * (0.7 + Math.random() * 0.6));
    
    remainingDuration -= drillDuration;
    
    // Get appropriate drill for the area
    drills.push(getDrillForArea(area, drillDuration));
  }
  
  return drills;
}

function getDrillForArea(area: string, duration: number) {
  // Database of sample drills for each area
  const drillsByArea: Record<string, { name: string, description: string }[]> = {
    "Driving distance": [
      { name: "Speed Training", description: "Practice swings at maximum speed with alignment sticks" },
      { name: "Step Drill", description: "Take practice swings stepping forward to generate more power" },
      { name: "Launch Monitor Work", description: "Focus on increasing club head speed and optimizing launch angle" }
    ],
    "Driving accuracy": [
      { name: "Corridor Drill", description: "Place alignment sticks to create a corridor and aim to hit between them" },
      { name: "Target Practice", description: "Pick specific targets on the range and aim to hit them consistently" },
      { name: "Three-Ball Drill", description: "Hit three consecutive shots with the same target and club" }
    ],
    "Iron play": [
      { name: "Distance Control", description: "Hit three shots with each iron focusing on consistent distances" },
      { name: "Divot Pattern Drill", description: "Hit balls aiming for consistent divot pattern after the ball" },
      { name: "Trajectory Control", description: "Practice hitting high, medium and low shots with the same club" }
    ],
    "Approach shots": [
      { name: "Landing Spot Drill", description: "Focus on hitting specific landing spots on the green rather than at pins" },
      { name: "Clock Face Drill", description: "Practice approaches to different positions around the green" },
      { name: "Par 3 Simulation", description: "Simulate different par 3 distances and shapes" }
    ],
    "Chipping": [
      { name: "Around the World", description: "Chip from different positions around a practice green to the same target" },
      { name: "Landing Zone Practice", description: "Focus on landing chips in a specific small area" },
      { name: "Three-Club Chip", description: "Practice the same chip with three different clubs" }
    ],
    "Bunker play": [
      { name: "Dollar Bill Drill", description: "Place a dollar bill under the ball and try to extract it with the ball" },
      { name: "Line in the Sand", description: "Draw a line in the sand and focus on hitting behind it" },
      { name: "Different Lies", description: "Practice from different lie conditions in the bunker" }
    ],
    "Putting": [
      { name: "Gate Drill", description: "Set up tees as a gate just wider than your putter head and putt through them" },
      { name: "Clock Drill", description: "Place balls in a circle around a hole and putt from different distances" },
      { name: "Lag Putting Grid", description: "Create a grid with tees and practice lag putting to different sections" }
    ],
    "Course management": [
      { name: "Course Visualization", description: "Mentally play your home course, making strategic decisions for each hole" },
      { name: "Trouble Shot Practice", description: "Practice shots you commonly face on your course" },
      { name: "Strategic Targets", description: "Practice hitting to 'safe zones' rather than always at flags" }
    ],
    "Mental game": [
      { name: "Pre-Shot Routine", description: "Focus on developing a consistent pre-shot routine for every shot" },
      { name: "Pressure Simulation", description: "Create practice games with consequences to simulate pressure" },
      { name: "Mindfulness Exercise", description: "Practice breathing techniques between shots to maintain focus" }
    ],
    "Physical fitness": [
      { name: "Golf-Specific Stretching", description: "Focus on rotational flexibility and hip mobility" },
      { name: "Balance Drill", description: "Practice swings standing on one leg to improve balance" },
      { name: "Core Strength", description: "Planks and rotational exercises to improve core stability" }
    ]
  };

  // Default to putting if area not found
  const drillOptions = drillsByArea[area] || drillsByArea["Putting"];
  
  // Select a random drill from the options
  const selectedDrill = drillOptions[Math.floor(Math.random() * drillOptions.length)];
  
  return {
    name: selectedDrill.name,
    description: selectedDrill.description,
    duration
  };
} 