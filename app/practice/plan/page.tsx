"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getUserProfile } from "@/app/firebase/db";
import { OpenAIService } from "@/app/services/openai-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  PaperAirplaneIcon, 
  CalendarIcon, 
  ClockIcon, 
  ShareIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  DocumentArrowDownIcon,
  DevicePhoneMobileIcon,
  TagIcon,
  ArrowRightCircleIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/config";
import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase/firestore";
import { savePracticePlan } from "@/app/firebase/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Type for time availability
interface TimeAvailability {
  [key: string]: number; // day of week -> minutes available
}

// Type for the practice plan
interface PracticeDrill {
  name: string;
  duration: string;
  description: string;
  goal: string;
  keyThought?: string; // Optional key thought for each drill
}

interface PracticeSession {
  day: string;
  focus: string;
  duration: string;
  location?: string;
  warmup?: string;
  drills: PracticeDrill[];
  id?: string; // For editing/saving
}

interface PracticePlan {
  title?: string;
  overview: string;
  userGoal?: string;
  improvementFocus?: string[];
  focusArea?: string; // Added field for the main focus area
  sessions: PracticeSession[];
  id?: string; // For saving to database
  isAIGenerated?: boolean;
}

// Type for user profile
interface UserProfile {
  id: string;
  handicap?: number;
  [key: string]: any;
}

// Type for editing state
interface EditingState {
  isOpen: boolean;
  sessionIndex: number;
  session: PracticeSession | null;
}

// Type for practice log entry
interface PracticeLogEntry {
  id: string;
  date: string;
  title: string;
  duration: number;
}

// Days of the week
const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

// Time options
const timeOptions = [
  { value: "0", label: "Not available" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2+ hours" },
];

// Focus area options
const focusAreas = [
  { value: "full_swing", label: "Full Swing", badgeClass: "bg-green-100 text-green-700" },
  { value: "short_game", label: "Short Game", badgeClass: "bg-yellow-100 text-yellow-700" },
  { value: "putting", label: "Putting", badgeClass: "bg-blue-100 text-blue-700" },
  { value: "fitness", label: "Fitness & Mobility", badgeClass: "bg-purple-100 text-purple-700" },
  { value: "mental_game", label: "Mental Game", badgeClass: "bg-indigo-100 text-indigo-700" },
  { value: "mixed", label: "Mixed", badgeClass: "bg-gray-100 text-gray-700" }
];

// Component that uses searchParams
function PracticePlannerContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams?.get('id');
  
  // Tab state
  const [activeTab, setActiveTab] = useState("ai-generated");
  
  // Form state
  const [handicap, setHandicap] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("3");
  const [description, setDescription] = useState("");
  const [focusArea, setFocusArea] = useState("mixed"); // Default focus area
  const [endDate, setEndDate] = useState("");
  const [timeAvailability, setTimeAvailability] = useState<TimeAvailability>({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  const [locationAvailability, setLocationAvailability] = useState<{[key: string]: string}>({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  });
  const [injuries, setInjuries] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const [isViewingExistingPlan, setIsViewingExistingPlan] = useState(false);
  
  // Manual plan state
  const [manualPlan, setManualPlan] = useState<PracticePlan>({
    title: "",
    overview: "",
    sessions: [],
    isAIGenerated: false
  });
  
  // State for accordion open/closed status
  const [openSessions, setOpenSessions] = useState<{[key: number]: boolean}>({});
  
  // State for manual plan editing
  const [manualPlanTitle, setManualPlanTitle] = useState("");
  const [manualPlanOverview, setManualPlanOverview] = useState("");
  const [manualPlanGoal, setManualPlanGoal] = useState("");
  const [editingSession, setEditingSession] = useState<EditingState>({
    isOpen: false,
    sessionIndex: -1,
    session: null
  });
  
  // Practice log entries (mock data for now)
  const [practiceLogEntries, setPracticeLogEntries] = useState<PracticeLogEntry[]>([
    { id: "1", date: "2023-03-15", title: "Morning Practice", duration: 45 },
    { id: "2", date: "2023-03-17", title: "Short Game Focus", duration: 60 },
    { id: "3", date: "2023-03-18", title: "Driving Range", duration: 75 }
  ]);
  
  // State for linking logs to sessions
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [sessionToLink, setSessionToLink] = useState<{index: number, session: PracticeSession} | null>(null);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  
  // Load a specific plan if ID is provided in the URL
  useEffect(() => {
    const loadExistingPlan = async () => {
      if (!currentUser || !planId) return;
      
      try {
        setIsLoading(true);
        // Get the specific practice plan
        const practicePlanDoc = doc(db, "users", currentUser.uid, "practicePlans", planId);
        const practicePlanSnapshot = await getDoc(practicePlanDoc);
        
        if (!practicePlanSnapshot.exists()) {
          toast.error("Plan not found");
          return;
        }
        
        const planData = practicePlanSnapshot.data();
        
        // Transform Firestore data to match the PracticePlan structure
        const loadedPlan: PracticePlan = {
          id: practicePlanSnapshot.id,
          title: planData.title || "Practice Plan",
          overview: planData.description || "",
          isAIGenerated: planData.aiGenerated || false,
          sessions: planData.sessions.map((session: any) => ({
            id: session.id,
            day: session.day,
            focus: session.focus,
            duration: session.duration,
            location: session.location,
            warmup: session.warmup,
            drills: session.drills.map((drill: any) => ({
              name: drill.name,
              duration: drill.duration,
              description: drill.description,
              goal: drill.goal,
              keyThought: drill.keyThought
            }))
          }))
        };
        
        // Set the plan and mark as viewing existing plan
        setPlan(loadedPlan);
        setIsViewingExistingPlan(true);
        
      } catch (error) {
        console.error("Error loading practice plan:", error);
        toast.error("Failed to load practice plan");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExistingPlan();
  }, [currentUser, planId]);

  // Get user profile for handicap
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }
      
      try {
        const profile = await getUserProfile(currentUser.uid) as UserProfile;
        if (profile && profile.handicap) {
          setHandicap(profile.handicap.toString());
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    
    // Only load profile if not viewing existing plan
    if (!isViewingExistingPlan) {
      loadProfile();
    }
  }, [currentUser, router, isViewingExistingPlan]);
  
  // Handle time availability change
  const handleTimeChange = (day: string, minutes: number) => {
    setTimeAvailability({
      ...timeAvailability,
      [day]: minutes
    });
  };
  
  // Count available days
  const getAvailableDaysCount = () => {
    return Object.values(timeAvailability).filter(time => time > 0).length;
  };
  
  // Generate AI practice plan
  const generatePlan = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create a plan");
      router.push("/auth/signin");
      return;
    }
    
    // Validate inputs
    if (!handicap) {
      toast.error("Please enter your handicap");
      return;
    }
    
    if (!getAvailableDaysCount()) {
      toast.error("Please select at least one day with availability");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format availability for the prompt
      let availabilityText = "";
      
      Object.entries(timeAvailability).forEach(([day, minutes]) => {
        if (minutes > 0) {
          const location = locationAvailability[day] || "General practice area";
          availabilityText += `${day.charAt(0).toUpperCase() + day.slice(1)}: ${minutes} minutes at ${location}. `;
        }
      });
      
      if (injuries) {
        availabilityText += `Injuries/Limitations: ${injuries}`;
      }
      
      // Get selected focus area label
      const selectedFocusArea = focusAreas.find(area => area.value === focusArea)?.label || "Mixed";
      
      // Call OpenAI to generate a practice plan
      const result = await OpenAIService.generatePracticePlan(
        parseInt(handicap),
        parseInt(sessionsPerWeek),
        description,
        availabilityText,
        selectedFocusArea, // Add focus area to the parameters
        endDate
      );
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      // Parse the result
      if (result.parsedData) {
        const planData = result.parsedData;
        
        // Set the plan state
        setPlan({
          title: planData.title,
          overview: planData.overview,
          userGoal: planData.userGoal,
          improvementFocus: planData.improvementFocus,
          focusArea: selectedFocusArea, // Store the focus area
          sessions: planData.sessions,
          isAIGenerated: true
        });
        
        toast.success("Practice plan generated successfully!");
      } else {
        // If parsing failed, show error
        toast.error("Failed to parse the generated plan. Please try again.");
      }
    } catch (error) {
      console.error("Error generating practice plan:", error);
      toast.error("Failed to generate practice plan");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Edit session placeholder
  const editSession = (sessionIndex: number) => {
    toast.success("Edit session feature coming soon!");
  };
  
  // Save plan to user's account
  const savePlan = async () => {
    if (!currentUser || !plan) {
      toast.error("You must be logged in and have a plan to save");
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      // Calculate end date (4 weeks from now)
      const endDate = new Date();
      endDate.setDate(now.getDate() + (7 * 4)); // 4 weeks
      
      // Prepare sessions for Firestore
      const firestoreSessions = plan.sessions.map(session => ({
        day: session.day,
        focus: session.focus,
        duration: session.duration,
        location: session.location || "",
        warmup: session.warmup || "",
        drills: session.drills.map(drill => ({
          name: drill.name,
          duration: drill.duration,
          description: drill.description,
          goal: drill.goal,
          keyThought: drill.keyThought || ""
        })),
        id: session.id || uuidv4()
      }));
      
      // Create practice plan data object
      const planData = {
        title: plan.title || "Practice Plan",
        description: plan.overview,
        focusArea: plan.focusArea || "Mixed", // Add focus area to saved plan
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        sessions: firestoreSessions,
        timePerSession: 60, // Default or calculate from session durations
        aiGenerated: plan.isAIGenerated || false,
        createdAt: Timestamp.fromDate(now)
      };
      
      // Save to Firestore
      const planId = await savePracticePlan(currentUser.uid, planData);
      
      toast.success("Practice plan saved successfully!");
      
      // Update the plan with the ID
      setPlan({
        ...plan,
        id: planId.id
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to save practice plan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start practice session placeholder
  const startPractice = () => {
    toast.success("Start practice feature coming soon!");
  };
  
  // Reset the form and plan
  const resetForm = () => {
    setPlan(null);
    setDescription("");
    setEndDate("");
    setTimeAvailability({
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    });
  };
  
  // Format date range for title
  const getDateRange = () => {
    if (!endDate) return '';
    
    const now = new Date();
    const end = new Date(endDate);
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    
    return `${formatter.format(now)} - ${formatter.format(end)}`;
  };
  
  // Toggle accordion section
  const toggleSession = (index: number) => {
    setOpenSessions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Parse duration to extract minutes
  const extractMinutes = (duration: string): number => {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };
  
  // Format drill steps
  const formatDrillSteps = (description: string): string[] => {
    // Split by periods, newlines, or numbered lists
    const steps = description
      .split(/\.\s+|\n+|(?:\d+\.\s+)/)
      .map(step => step.trim())
      .filter(step => step.length > 0);
    
    return steps.length > 0 ? steps : [description];
  };
  
  // Send plan to phone placeholder
  const sendToPhone = () => {
    // Implement a simple SMS share functionality
    const phone = prompt("Enter your phone number to receive this plan:");
    if (phone) {
      // In a real implementation, this would send an SMS via an API
      toast.success(`Plan would be sent to ${phone} (Feature coming soon)`);
    }
  };
  
  // Download PDF functionality
  const downloadPDF = () => {
    if (!plan) return;
    
    // Create a simple text representation of the plan
    let planText = `# ${plan.title || "Practice Plan"}\n\n`;
    planText += `${plan.overview}\n\n`;
    
    plan.sessions.forEach((session, index) => {
      planText += `## Session ${index + 1}: ${session.day} - ${session.focus}\n`;
      planText += `Duration: ${session.duration}\n`;
      if (session.location) planText += `Location: ${session.location}\n`;
      if (session.warmup) planText += `Warmup: ${session.warmup}\n\n`;
      
      planText += "Drills:\n";
      session.drills.forEach((drill, drillIndex) => {
        planText += `${drillIndex + 1}. ${drill.name} (${drill.duration})\n`;
        planText += `   ${drill.description}\n`;
        if (drill.goal) planText += `   Goal: ${drill.goal}\n`;
        if (drill.keyThought) planText += `   Key thought: ${drill.keyThought}\n`;
        planText += '\n';
      });
    });
    
    // Create a Blob containing the plan text
    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title || "Practice_Plan"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Plan downloaded as text file!");
  };
  
  // Create manual plan placeholder
  const createManualPlan = () => {
    toast.success("Create manual plan feature coming soon!");
    // We'll implement this in the next phase
  };
  
  // Create new blank session for manual plan
  const addNewSession = () => {
    const newSession: PracticeSession = {
      id: uuidv4(),
      day: "Monday",
      focus: "New Practice Session",
      duration: "60 minutes",
      location: "Practice Area",
      drills: [
        {
          name: "New Drill",
          duration: "15 minutes",
          description: "Description of the drill steps",
          goal: "Goal of this drill"
        }
      ]
    };
    
    setManualPlan({
      ...manualPlan,
      sessions: [...manualPlan.sessions, newSession]
    });
    
    // Open the session editor for the new session
    setEditingSession({
      isOpen: true,
      sessionIndex: manualPlan.sessions.length,
      session: newSession
    });
  };
  
  // Open session editor
  const openSessionEditor = (sessionIndex: number) => {
    const sessionToEdit = plan ? 
      plan.sessions[sessionIndex] : 
      manualPlan.sessions[sessionIndex];
    
    setEditingSession({
      isOpen: true,
      sessionIndex,
      session: JSON.parse(JSON.stringify(sessionToEdit)) // Deep copy
    });
  };
  
  // Save edited session
  const saveSessionEdit = () => {
    if (!editingSession.session) return;
    
    if (activeTab === "ai-generated" && plan) {
      // Update AI-generated plan
      const updatedSessions = [...plan.sessions];
      updatedSessions[editingSession.sessionIndex] = editingSession.session;
      
      setPlan({
        ...plan,
        sessions: updatedSessions
      });
    } else {
      // Update manual plan
      const updatedSessions = [...manualPlan.sessions];
      updatedSessions[editingSession.sessionIndex] = editingSession.session;
      
      setManualPlan({
        ...manualPlan,
        sessions: updatedSessions
      });
    }
    
    // Close editor
    setEditingSession({
      isOpen: false,
      sessionIndex: -1,
      session: null
    });
  };
  
  // Update session being edited
  const updateEditingSession = (
    field: string, 
    value: string | PracticeDrill[]
  ) => {
    if (!editingSession.session) return;
    
    setEditingSession({
      ...editingSession,
      session: {
        ...editingSession.session,
        [field]: value
      }
    });
  };
  
  // Add drill to session being edited
  const addDrillToSession = () => {
    if (!editingSession.session) return;
    
    const newDrill: PracticeDrill = {
      name: "New Drill",
      duration: "15 minutes",
      description: "Steps for this drill",
      goal: "Goal for this drill"
    };
    
    setEditingSession({
      ...editingSession,
      session: {
        ...editingSession.session,
        drills: [...editingSession.session.drills, newDrill]
      }
    });
  };
  
  // Update a drill in the session being edited
  const updateDrill = (
    drillIndex: number, 
    field: string, 
    value: string
  ) => {
    if (!editingSession.session) return;
    
    const updatedDrills = [...editingSession.session.drills];
    updatedDrills[drillIndex] = {
      ...updatedDrills[drillIndex],
      [field]: value
    };
    
    setEditingSession({
      ...editingSession,
      session: {
        ...editingSession.session,
        drills: updatedDrills
      }
    });
  };
  
  // Delete a drill from the session being edited
  const deleteDrill = (drillIndex: number) => {
    if (!editingSession.session) return;
    
    const updatedDrills = [...editingSession.session.drills];
    updatedDrills.splice(drillIndex, 1);
    
    setEditingSession({
      ...editingSession,
      session: {
        ...editingSession.session,
        drills: updatedDrills
      }
    });
  };
  
  // Save manual plan
  const saveManualPlan = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to save a plan");
      return;
    }
    
    if (manualPlan.sessions.length === 0) {
      toast.error("Please add at least one session to your plan");
      return;
    }
    
    setIsLoading(true);
    try {
      const completeManualPlan: PracticePlan = {
        ...manualPlan,
        title: manualPlanTitle || "Custom Practice Plan",
        overview: manualPlanOverview || "Custom practice plan",
        userGoal: manualPlanGoal || undefined
      };
      
      // Set as current plan and switch to view mode
      setPlan(completeManualPlan);
      
      // Prepare data for Firebase
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + (7 * 4)); // 4 weeks
      
      // Prepare sessions for Firestore
      const firestoreSessions = completeManualPlan.sessions.map(session => ({
        day: session.day,
        focus: session.focus,
        duration: session.duration,
        location: session.location || "",
        warmup: session.warmup || "",
        drills: session.drills.map(drill => ({
          name: drill.name,
          duration: drill.duration,
          description: drill.description,
          goal: drill.goal,
          keyThought: drill.keyThought || ""
        })),
        id: session.id || uuidv4()
      }));
      
      // Create practice plan data object
      const planData = {
        title: completeManualPlan.title || "Custom Practice Plan",
        description: completeManualPlan.overview || "Custom practice plan",
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        sessions: firestoreSessions,
        timePerSession: 60, // Default value
        aiGenerated: false,
        createdAt: Timestamp.fromDate(now)
      };
      
      // Save to Firestore
      const planId = await savePracticePlan(currentUser.uid, planData);
      
      // Update the plan with the ID
      setPlan({
        ...completeManualPlan,
        id: planId.id
      });
      
      setActiveTab("ai-generated"); // Use the same view for both types
      toast.success("Custom plan created and saved successfully!");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to save custom plan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open link session dialog
  const openLinkSessionDialog = (index: number, session: PracticeSession) => {
    setSessionToLink({ index, session });
    setLinkDialogOpen(true);
  };
  
  // Link log to session
  const linkLogToSession = () => {
    if (!sessionToLink || !selectedLog) {
      toast.error("Please select a practice log");
      return;
    }
    
    // In a real implementation, you would save this link to your database
    toast.success(`Linked practice log to ${sessionToLink.session.day} session`);
    setLinkDialogOpen(false);
    setSessionToLink(null);
    setSelectedLog(null);
  };
  
  // Create share link
  const sharePlan = () => {
    if (!plan) return;
    
    // Options for sharing - simple implementation
    const shareText = `Check out my golf practice plan: ${plan.title || "Practice Plan"}`;
    const shareOptions = [];
    
    // Check if navigator.share is available (mobile devices)
    if (navigator.share) {
      navigator.share({
        title: plan.title || "Practice Plan",
        text: `Check out my golf practice plan for improving my game.`,
      })
      .then(() => toast.success("Plan shared successfully!"))
      .catch((error) => {
        console.error("Error sharing:", error);
        toast.error("Failed to share plan");
      });
    } else {
      // Fallback for browsers without Web Share API
      try {
        navigator.clipboard.writeText(shareText);
        toast.success("Plan description copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy to clipboard");
      }
    }
  };
  
  // Render the AI planner interface
  const renderAIPlanner = () => {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create Your Practice Plan</h2>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-start">
            <SparklesIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800">AI-Powered Practice Plans</h3>
              <p className="text-sm text-blue-600">
                Our AI will create a personalized practice plan based on your needs, time availability, and skill level. Fill out the form below to get started.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="handicap" className="text-gray-700">Your Handicap</Label>
                <Input 
                  id="handicap" 
                  type="number" 
                  placeholder="e.g., 15" 
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="sessions" className="text-gray-700">Sessions Per Week</Label>
                <Select
                  value={sessionsPerWeek}
                  onValueChange={setSessionsPerWeek}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select sessions per week" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 session</SelectItem>
                    <SelectItem value="2">2 sessions</SelectItem>
                    <SelectItem value="3">3 sessions</SelectItem>
                    <SelectItem value="4">4 sessions</SelectItem>
                    <SelectItem value="5">5 sessions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="focusArea" className="text-gray-700">Focus Area</Label>
                <Select
                  value={focusArea}
                  onValueChange={setFocusArea}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select main focus area" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreas.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the area you'd like to focus on most in this practice plan
                </p>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-gray-700">Description & Goals</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe what you'd like to improve, e.g., 'I need to work on my slice and improve my short game'" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Time Availability</h3>
                <div className="space-y-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.id} className="flex items-center justify-between">
                      <Label htmlFor={`day-${day.id}`} className="min-w-[100px]">{day.label}</Label>
                      <Select
                        value={timeAvailability[day.id].toString()}
                        onValueChange={(value) => handleTimeChange(day.id, parseInt(value))}
                      >
                        <SelectTrigger id={`day-${day.id}`} className="w-full max-w-[200px]">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {timeAvailability[day.id] > 0 && (
                        <Input 
                          placeholder="Practice location" 
                          value={locationAvailability[day.id] || ""}
                          onChange={(e) => {
                            setLocationAvailability({
                              ...locationAvailability,
                              [day.id]: e.target.value
                            });
                          }}
                          className="ml-2 w-full max-w-[180px]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="injuries" className="text-gray-700">Injuries or Limitations (Optional)</Label>
                <Textarea 
                  id="injuries" 
                  placeholder="Let us know if you have any injuries or physical limitations we should account for" 
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="pt-4">
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isLoading}
                  onClick={generatePlan}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating Your Plan...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Practice Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to render a practice plan
  const renderPracticePlan = (plan: PracticePlan) => {
    return (
      <div className="space-y-6">
        {/* Plan overview */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            {plan.isAIGenerated && (
              <Badge variant="outline" className="mb-3 bg-blue-50 text-blue-800 border-blue-200 flex w-fit items-center">
                <SparklesIcon className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
            
            <p className="text-gray-700 whitespace-pre-line mb-4">{plan.overview}</p>
            
            {plan.userGoal && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-blue-800 text-sm mb-4">
                <strong>Goal:</strong> {plan.userGoal}
              </div>
            )}
            
            {plan.improvementFocus && plan.improvementFocus.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="text-sm font-medium text-gray-700 mr-1">Focus areas:</div>
                {plan.improvementFocus.map((focus, index) => (
                  <Badge key={index} className="bg-teal-100 text-teal-800 border-teal-200">
                    {focus}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sessions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
            Practice Sessions
          </h2>
          
          {plan.sessions.map((session, sessionIndex) => (
            <Card 
              key={session.id || sessionIndex} 
              className={`bg-white border border-gray-200 hover:shadow-sm transition-shadow ${
                openSessions[sessionIndex] ? 'shadow-sm' : ''
              }`}
            >
              <CardHeader 
                className="p-4 cursor-pointer flex flex-row items-center justify-between"
                onClick={() => toggleSession(sessionIndex)}
              >
                <div>
                  <CardTitle className="text-lg text-gray-800 flex items-center">
                    {session.day}: {session.focus}
                  </CardTitle>
                  <CardDescription className="text-gray-600 flex items-center mt-1">
                    <ClockIcon className="h-4 w-4 mr-1" /> {session.duration}
                    {session.location && (
                      <span className="ml-3">{session.location}</span>
                    )}
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSessionEditor(sessionIndex);
                    }}
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    {openSessions[sessionIndex] ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="sr-only">Toggle</span>
                  </Button>
                </div>
              </CardHeader>
              
              {openSessions[sessionIndex] && (
                <CardContent className="px-4 pb-4 pt-0">
                  {session.warmup && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Warm-up</h4>
                      <p className="text-gray-600">{session.warmup}</p>
                    </div>
                  )}
                  
                  <h4 className="font-medium text-gray-700 mb-2">Drills</h4>
                  <div className="space-y-4 mt-2">
                    {session.drills.map((drill, drillIndex) => (
                      <div 
                        key={drillIndex} 
                        className="bg-gray-50 p-3 rounded-md border border-gray-200"
                      >
                        <div className="flex justify-between mb-1">
                          <h5 className="font-medium text-gray-800">{drill.name}</h5>
                          <span className="text-sm text-gray-500">{drill.duration}</span>
                        </div>
                        
                        <p className="text-gray-600 whitespace-pre-line text-sm mb-2">
                          {drill.description}
                        </p>
                        
                        {drill.goal && (
                          <div className="text-sm text-blue-800 bg-blue-50 rounded-sm px-2 py-1 border border-blue-100 mb-1">
                            <span className="font-medium">Goal:</span> {drill.goal}
                          </div>
                        )}
                        
                        {drill.keyThought && (
                          <div className="text-sm text-teal-800 bg-teal-50 rounded-sm px-2 py-1 border border-teal-100">
                            <span className="font-medium">Key thought:</span> {drill.keyThought}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        
        <div className="flex justify-center mt-6 space-x-3">
          <Link href="/practice/log">
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              Log a Practice Session
            </Button>
          </Link>
          
          <Button variant="outline" onClick={savePlan} disabled={isLoading} className="border-gray-300 text-gray-700 hover:bg-gray-100">
            {isLoading ? "Saving..." : "Save Plan"}
          </Button>
        </div>
      </div>
    );
  };
  
  // Render session editor dialog
  const renderSessionEditor = () => {
    if (!editingSession.session) return null;
    
    return (
      <Dialog open={editingSession.isOpen} onOpenChange={(open: boolean) => {
        if (!open) setEditingSession({...editingSession, isOpen: false});
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Practice Session</DialogTitle>
            <DialogDescription>
              Customize this practice session
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-day">Day</Label>
                  <Select
                    value={editingSession.session.day}
                    onValueChange={(value) => updateEditingSession('day', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.id} value={day.label}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-duration">Duration</Label>
                  <Select
                    value={editingSession.session.duration.split(' ')[0]}
                    onValueChange={(value) => updateEditingSession('duration', `${value} minutes`)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {[30, 45, 60, 90, 120].map((duration) => (
                        <SelectItem key={duration} value={duration.toString()}>
                          {duration} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-focus">Focus</Label>
                <Input
                  id="session-focus"
                  value={editingSession.session.focus}
                  onChange={(e) => updateEditingSession('focus', e.target.value)}
                  placeholder="Main focus for this session"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-location">Location</Label>
                <Input
                  id="session-location"
                  value={editingSession.session.location || ''}
                  onChange={(e) => updateEditingSession('location', e.target.value)}
                  placeholder="Practice location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-warmup">Warmup (Optional)</Label>
                <Textarea
                  id="session-warmup"
                  value={editingSession.session.warmup || ''}
                  onChange={(e) => updateEditingSession('warmup', e.target.value)}
                  placeholder="Brief warmup description"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Drills</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addDrillToSession}
                    className="flex items-center gap-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Drill
                  </Button>
                </div>
                
                {editingSession.session.drills.map((drill, drillIndex) => (
                  <div key={drillIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Drill {drillIndex + 1}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteDrill(drillIndex)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`drill-name-${drillIndex}`}>Name</Label>
                        <Input
                          id={`drill-name-${drillIndex}`}
                          value={drill.name}
                          onChange={(e) => updateDrill(drillIndex, 'name', e.target.value)}
                          placeholder="Drill name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`drill-duration-${drillIndex}`}>Duration</Label>
                        <Select
                          value={drill.duration.split(' ')[0]}
                          onValueChange={(value) => updateDrill(drillIndex, 'duration', `${value} minutes`)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 30, 45].map((duration) => (
                              <SelectItem key={duration} value={duration.toString()}>
                                {duration} minutes
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`drill-description-${drillIndex}`}>Description</Label>
                      <Textarea
                        id={`drill-description-${drillIndex}`}
                        value={drill.description}
                        onChange={(e) => updateDrill(drillIndex, 'description', e.target.value)}
                        placeholder="Step-by-step instructions for this drill"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`drill-goal-${drillIndex}`}>Key Thought</Label>
                      <Input
                        id={`drill-goal-${drillIndex}`}
                        value={drill.goal}
                        onChange={(e) => updateDrill(drillIndex, 'goal', e.target.value)}
                        placeholder="Key thought or focus for this drill"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setEditingSession({...editingSession, isOpen: false})}
            >
              Cancel
            </Button>
            <Button onClick={saveSessionEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Render link practice log dialog
  const renderLinkLogDialog = () => {
    return (
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Practice Log</DialogTitle>
            <DialogDescription>
              Connect a completed practice log to this session
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="mb-2 block">Select a practice log</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {practiceLogEntries.length > 0 ? (
                practiceLogEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedLog === entry.id ? 'border-green-500 bg-green-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLog(entry.id)}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{entry.title}</span>
                      <span className="text-sm text-gray-500">{entry.duration} min</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No practice logs available
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={linkLogToSession}
              disabled={!selectedLog}
            >
              Link Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Update the create-your-own tab content
  const renderManualPlanCreator = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Own Practice Plan</CardTitle>
          <CardDescription>
            Build a custom practice plan from scratch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="plan-title">
              Plan Title
            </Label>
            <Input
              id="plan-title"
              value={manualPlanTitle}
              onChange={(e) => setManualPlanTitle(e.target.value)}
              placeholder="e.g., Weekly Practice Plan"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plan-goal">
              Goal (Optional)
            </Label>
            <Input
              id="plan-goal"
              value={manualPlanGoal}
              onChange={(e) => setManualPlanGoal(e.target.value)}
              placeholder="e.g., Reduce handicap by 2 strokes"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plan-overview">
              Overview
            </Label>
            <Textarea
              id="plan-overview"
              value={manualPlanOverview}
              onChange={(e) => setManualPlanOverview(e.target.value)}
              placeholder="Brief description of this practice plan and its focus"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Practice Sessions</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addNewSession}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add Session
              </Button>
            </div>
            
            {manualPlan.sessions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">No practice sessions added yet</p>
                <Button 
                  onClick={addNewSession}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {manualPlan.sessions.map((session, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.day}</h4>
                      <p className="text-sm text-gray-600">{session.focus} • {session.duration}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openSessionEditor(idx)}>
                        <PencilIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={saveManualPlan}
            disabled={manualPlan.sessions.length === 0}
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
          >
            Create Practice Plan
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Main render function
  return (
    <div className="container mx-auto py-8">
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <p className="text-gray-500">Loading practice plan...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* If we have a plan to display or viewing an existing plan */}
          {(plan || isViewingExistingPlan) ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {plan?.title || "Practice Plan"}
                </h1>
                
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadPDF}
                    className="flex items-center border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" /> 
                    Download
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={sendToPhone}
                    className="flex items-center border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <DevicePhoneMobileIcon className="h-4 w-4 mr-1" /> 
                    Send to Phone
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={sharePlan}
                    className="flex items-center border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <ShareIcon className="h-4 w-4 mr-1" /> 
                    Share
                  </Button>
                  
                  <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </div>
              
              {/* Render the plan */}
              {plan && renderPracticePlan(plan)}
            </div>
          ) : (
            // If we don't have a plan, show the AI planner or manual creator
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create a Practice Plan</h1>
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
              
              <Tabs defaultValue="ai-generated" className="mb-8" onValueChange={(value) => setActiveTab(value)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger 
                    value="ai-generated"
                    className="text-base py-2.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    AI Coach
                  </TabsTrigger>
                  <TabsTrigger 
                    value="manual"
                    className="text-base py-2.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    Create Manually
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="ai-generated">
                  {renderAIPlanner()}
                </TabsContent>
                
                <TabsContent value="manual">
                  {renderManualPlanCreator()}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
      
      {/* Session editor */}
      {editingSession.isOpen && renderSessionEditor()}
      
      {/* Link log dialog */}
      {linkDialogOpen && renderLinkLogDialog()}
    </div>
  );
}

// Loading component
function PracticePlanLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Practice Plan</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded-md mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded-md"></div>
            <div className="h-20 bg-gray-200 rounded-md"></div>
            <div className="h-20 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with suspense boundary
export default function PracticePlanner() {
  return (
    <Suspense fallback={<PracticePlanLoading />}>
      <PracticePlannerContent />
    </Suspense>
  );
}