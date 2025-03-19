import { 
  addGoal, 
  logPracticeSession, 
  savePracticePlan, 
  saveMonthlyRecap,
  updateUserProfile 
} from './db';
import { Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Practice focus areas for variety
const focusAreas = [
  "Driver Accuracy",
  "Iron Control",
  "Short Game",
  "Putting",
  "Bunker Play",
  "Course Management",
  "Mental Game",
  "Full Swing",
  "Distance Control",
  "Wedge Play"
];

// Locations for practice
const locations = [
  "Driving Range",
  "Practice Green",
  "Short Game Area",
  "Indoor Facility",
  "Home",
  "Golf Course",
  "Simulator"
];

// Drill templates to make data realistic
const drillTemplates = [
  {
    category: "Driver",
    drills: [
      {
        name: "Tee Height Drill",
        description: "Hit 10 drives with different tee heights to find optimal launch",
        goal: "Find optimal tee height for driver",
        duration: "15 minutes"
      },
      {
        name: "Alignment Stick Path Drill",
        description: "Place alignment sticks to create a proper swing path corridor",
        goal: "Eliminate slice by improving swing path",
        duration: "20 minutes"
      },
      {
        name: "3-2-1 Driver Drill",
        description: "Hit 3 shots at 70% power, 2 at 85%, 1 at full power, repeat",
        goal: "Build control before power",
        duration: "20 minutes"
      }
    ]
  },
  {
    category: "Iron",
    drills: [
      {
        name: "Clock Face Drill",
        description: "Practice different length backswings (7, 9, and 11 o'clock positions)",
        goal: "Improve distance control with partial swings",
        duration: "20 minutes" 
      },
      {
        name: "One-Handed Iron Shots",
        description: "Hit shots with just your lead hand, then just trail hand",
        goal: "Improve hand coordination and feel",
        duration: "15 minutes"
      },
      {
        name: "Target Practice",
        description: "Pick specific targets at different distances and hit 5 shots to each",
        goal: "Improve accuracy and target focus",
        duration: "25 minutes"
      }
    ]
  },
  {
    category: "Putting",
    drills: [
      {
        name: "Gate Drill",
        description: "Set up tees as a gate just wider than putter head, practice putting through gate",
        goal: "Improve putter face alignment",
        duration: "15 minutes"
      },
      {
        name: "Circle Drill",
        description: "Place 6 balls in a circle around hole at 3-foot distance, must make all to move to next level",
        goal: "Build confidence on short putts",
        duration: "20 minutes"
      },
      {
        name: "Ladder Drill",
        description: "Place balls at 10, 20, 30, 40 feet, focus on distance control",
        goal: "Improve distance control on long putts",
        duration: "20 minutes"
      }
    ]
  },
  {
    category: "Short Game",
    drills: [
      {
        name: "Landing Zone Practice",
        description: "Pick landing spots for chips/pitches and focus on landing ball on those spots",
        goal: "Improve precision with landing zones",
        duration: "20 minutes"
      },
      {
        name: "Up-and-Down Challenge",
        description: "Place 10 balls around green in different positions, try to get up and down from each",
        goal: "Improve scrambling ability",
        duration: "30 minutes"
      },
      {
        name: "Three Club Challenge",
        description: "Use only 3 clubs (e.g., SW, GW, PW) to play shots from various positions",
        goal: "Build creativity and adaptability",
        duration: "25 minutes"
      }
    ]
  },
  {
    category: "Bunker",
    drills: [
      {
        name: "Line in Sand Drill",
        description: "Draw line in sand, practice hitting sand behind line without touching line",
        goal: "Control entry point in sand",
        duration: "15 minutes"
      },
      {
        name: "Different Lies Practice",
        description: "Practice from uphill, downhill, and buried lies in bunker",
        goal: "Handle varied bunker scenarios",
        duration: "20 minutes"
      }
    ]
  },
  {
    category: "Mental",
    drills: [
      {
        name: "Pre-Shot Routine Practice",
        description: "Develop and consistently execute a pre-shot routine for each shot",
        goal: "Build consistency through routine",
        duration: "15 minutes"
      },
      {
        name: "Visualization Exercise",
        description: "Before each shot, clearly visualize the entire shot from start to finish",
        goal: "Improve mental imagery and focus",
        duration: "10 minutes"
      }
    ]
  }
];

// Create session templates for practice plans
const createSessionTemplates = () => {
  const templates = [];
  
  // Monday: Full swing focus
  templates.push({
    day: "Monday",
    focus: "Full Swing Technique",
    duration: "60 minutes",
    location: "Driving Range",
    warmup: "5 minutes of stretching, 5 minutes of half-swing practice with 8-iron",
    drills: [
      ...drillTemplates.find(t => t.category === "Driver")?.drills.slice(0, 2) || [],
      ...drillTemplates.find(t => t.category === "Iron")?.drills.slice(0, 1) || []
    ]
  });
  
  // Wednesday: Short game focus
  templates.push({
    day: "Wednesday",
    focus: "Short Game Improvement",
    duration: "60 minutes",
    location: "Short Game Area",
    warmup: "5 minutes of stretching, 5 minutes of putting to warm up touch",
    drills: [
      ...drillTemplates.find(t => t.category === "Short Game")?.drills.slice(0, 2) || [],
      ...drillTemplates.find(t => t.category === "Bunker")?.drills.slice(0, 1) || []
    ]
  });
  
  // Friday: Putting focus
  templates.push({
    day: "Friday",
    focus: "Putting Precision",
    duration: "45 minutes",
    location: "Practice Green",
    warmup: "5 minutes of gentle stretching, 5 minutes of very short putts to build confidence",
    drills: [
      ...drillTemplates.find(t => t.category === "Putting")?.drills || []
    ]
  });
  
  // Weekend: Mixed practice
  templates.push({
    day: "Saturday",
    focus: "Complete Game Practice",
    duration: "90 minutes",
    location: "Golf Course",
    warmup: "10 minutes of dynamic stretching and short swings with multiple clubs",
    drills: [
      // Make sure we have valid drill objects with all required properties
      drillTemplates.find(t => t.category === "Driver")?.drills[0] || {
        name: "Basic Driver Drill",
        duration: "15 minutes",
        description: "Practice driving for distance and accuracy",
        goal: "Improve driving consistency"
      },
      drillTemplates.find(t => t.category === "Iron")?.drills[0] || {
        name: "Basic Iron Drill",
        duration: "15 minutes",
        description: "Practice iron shots at different targets",
        goal: "Improve iron accuracy"
      },
      drillTemplates.find(t => t.category === "Short Game")?.drills[0] || {
        name: "Basic Chipping Drill",
        duration: "15 minutes",
        description: "Practice chip shots around the green",
        goal: "Improve short game touch"
      },
      drillTemplates.find(t => t.category === "Putting")?.drills[0] || {
        name: "Basic Putting Drill",
        duration: "15 minutes",
        description: "Practice putts from different distances",
        goal: "Improve putting consistency"
      },
      drillTemplates.find(t => t.category === "Mental")?.drills[0] || {
        name: "Basic Mental Drill",
        duration: "10 minutes",
        description: "Practice pre-shot routine and visualization",
        goal: "Improve mental focus"
      }
    ]
  });
  
  return templates;
};

// Generate a practice plan with different focus areas
const generatePracticePlan = (startDate: Date, isAI: boolean = true) => {
  // Create a title with the month
  const monthName = startDate.toLocaleString('default', { month: 'long' });
  const title = `${monthName} ${isAI ? 'AI-Generated' : 'Custom'} Practice Plan`;
  
  // Generate a focus area
  const focusIndex = Math.floor(Math.random() * focusAreas.length);
  const focus = focusAreas[focusIndex];
  
  // Create description
  const description = `This plan focuses on improving your ${focus.toLowerCase()} skills through structured practice sessions. Each session includes warm-up exercises and specific drills designed to address common challenges.`;
  
  // Calculate end date (4 weeks from start)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 28);
  
  // Get session templates
  const sessionTemplates = createSessionTemplates();
  
  // Customize sessions with specific focus
  const sessions = sessionTemplates.map(template => {
    // Clone template
    const session = {...template, id: uuidv4()};
    
    // Add focus-specific drill if applicable
    if (focus === "Driver Accuracy" && template.day === "Monday") {
      session.drills = [
        ...(drillTemplates.find(t => t.category === "Driver")?.drills || []),
        ...(session.drills.slice(0, 2))
      ];
    } else if (focus === "Putting" && template.day === "Friday") {
      session.drills = [
        ...(drillTemplates.find(t => t.category === "Putting")?.drills || []),
        {
          name: "Pressure Putting Challenge",
          description: "Start with 3-footer and move back 1 foot with each make. Miss and start over.",
          goal: "Build putting confidence under pressure",
          duration: "15 minutes"
        }
      ];
    }
    
    return session;
  });
  
  // Return the plan data
  return {
    title: title,
    description: description,
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    sessions: sessions,
    timePerSession: 60,
    aiGenerated: isAI,
    createdAt: Timestamp.fromDate(startDate)
  };
};

// Generate a practice log entry
const generatePracticeLog = (date: Date, planId?: string) => {
  // Randomize some aspects of the log
  const duration = [30, 45, 60, 75, 90][Math.floor(Math.random() * 5)];
  const focusIndex = Math.floor(Math.random() * focusAreas.length);
  const focus = focusAreas[focusIndex];
  const rating = Math.floor(Math.random() * 5) + 1; // 1-5 rating
  
  // Generate a session title
  const timeOfDay = date.getHours() < 12 ? "Morning" : date.getHours() < 17 ? "Afternoon" : "Evening";
  const sessionTitle = `${timeOfDay} ${focus} Practice`;
  
  // Get drills related to the focus
  let categoryMatch = "Driver";
  if (focus.includes("Putt")) categoryMatch = "Putting";
  else if (focus.includes("Short") || focus.includes("Wedge")) categoryMatch = "Short Game";
  else if (focus.includes("Bunker")) categoryMatch = "Bunker";
  else if (focus.includes("Iron")) categoryMatch = "Iron";
  else if (focus.includes("Mental")) categoryMatch = "Mental";
  
  const relatedDrills = drillTemplates.find(t => t.category === categoryMatch)?.drills || [];
  
  // Create drills for the log
  const logDrills = relatedDrills.map(drill => ({
    name: drill.name,
    completed: Math.random() > 0.2 // 80% completion rate
  }));
  
  // Add a few general drills
  if (Math.random() > 0.5) {
    logDrills.push({
      name: "Warmup Stretching Routine",
      completed: true
    });
  }
  
  if (Math.random() > 0.7) {
    logDrills.push({
      name: "Pre-Shot Routine Practice",
      completed: Math.random() > 0.3
    });
  }
  
  // Generate notes based on rating
  let notes = "";
  if (rating <= 2) {
    notes = `Struggled with ${focus.toLowerCase()} today. Need to focus more on fundamentals next time.`;
  } else if (rating === 3) {
    notes = `Decent practice session. Starting to see improvement in my ${focus.toLowerCase()}.`;
  } else {
    notes = `Great session! Really felt a breakthrough with my ${focus.toLowerCase()} technique.`;
  }
  
  // Create base log data without planId
  const logData = {
    type: "structured" as "structured" | "activity",
    sessionTitle: sessionTitle,
    notes: notes,
    rating: rating,
    duration: duration,
    drills: logDrills.length > 0 ? logDrills : [], // Ensure drills is never undefined
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.fromDate(date)
  };

  // Only add planId if it's defined
  if (planId) {
    return {
      ...logData,
      planId: planId
    };
  }
  
  return logData;
};

// Generate an activity log (non-practice session)
const generateActivityLog = (date: Date) => {
  // Pick random activity categories
  const activityTypes = ["mental", "strength", "mobility", "meditation", "cardio"];
  const selectedCategories: string[] = [];
  
  // Select 1-3 random categories
  const numCategories = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numCategories; i++) {
    const randomIndex = Math.floor(Math.random() * activityTypes.length);
    if (!selectedCategories.includes(activityTypes[randomIndex])) {
      selectedCategories.push(activityTypes[randomIndex]);
    }
  }
  
  // Generate activity title based on categories
  const primaryCategory = selectedCategories[0];
  let title = "";
  
  switch (primaryCategory) {
    case "mental":
      title = "Mental Game Exercise";
      break;
    case "strength":
      title = "Golf-Specific Strength Workout";
      break;
    case "mobility":
      title = "Flexibility & Mobility Routine";
      break;
    case "meditation":
      title = "Pre-Round Visualization Session";
      break;
    case "cardio":
      title = "Cardio Fitness Training";
      break;
    default:
      title = "Golf Improvement Activity";
  }
  
  // Generate duration (10-60 minutes)
  const duration = Math.floor(Math.random() * 50) + 10;
  
  // Generate notes
  const notes = `Completed ${title.toLowerCase()} to support my golf game. Focused on ${
    primaryCategory === "mental" ? "focus and concentration" :
    primaryCategory === "strength" ? "core and rotational strength" :
    primaryCategory === "mobility" ? "hip and shoulder mobility" :
    primaryCategory === "meditation" ? "mental imagery and course strategy" :
    "overall fitness and endurance"
  }.`;
  
  // Ensure there are no undefined values that could cause Firebase errors
  return {
    type: "activity" as "structured" | "activity",
    sessionTitle: title,
    notes: notes,
    rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating for activities
    duration: duration,
    categories: selectedCategories.length > 0 ? selectedCategories : ["general"],
    date: Timestamp.fromDate(date),
    createdAt: Timestamp.fromDate(date)
  };
};

// Generate goals with varying progress
const generateGoals = (userId: string, startDate: Date) => {
  const goals = [
    {
      title: "Reduce Handicap",
      description: "Work on lowering my handicap through consistent practice",
      targetDate: new Date(startDate),
      currentValue: 18.5,
      targetValue: 15.0,
      category: "handicap"
    },
    {
      title: "Improve Putting",
      description: "Reduce average putts per round",
      targetDate: new Date(startDate),
      currentValue: 36,
      targetValue: 30,
      category: "putting"
    },
    {
      title: "Increase Driving Accuracy",
      description: "Hit more fairways off the tee",
      targetDate: new Date(startDate),
      currentValue: 40, // percentage
      targetValue: 65, // percentage
      category: "driving"
    },
    {
      title: "Practice Consistency",
      description: "Practice at least 3 times per week",
      targetDate: new Date(startDate),
      currentValue: 1,
      targetValue: 3,
      category: "practice"
    },
    {
      title: "Improve Mental Game",
      description: "Complete mental training exercises weekly",
      targetDate: new Date(startDate),
      currentValue: 0,
      targetValue: 2,
      category: "mental"
    }
  ];
  
  // Set target dates 3-6 months in future
  goals.forEach(goal => {
    goal.targetDate.setMonth(goal.targetDate.getMonth() + Math.floor(Math.random() * 4) + 3);
  });
  
  return goals;
};

// Update goals with progress over time
const updateGoalProgress = (goals: any[], monthsPassed: number) => {
  return goals.map(goal => {
    const updatedGoal = {...goal};
    
    // Calculate progress percentage (0.1 to 0.25 per month, randomized)
    const progressRate = (Math.random() * 0.15) + 0.1;
    const totalProgressPercentage = progressRate * monthsPassed;
    
    // Calculate total change
    const totalChange = (goal.targetValue - goal.currentValue) * totalProgressPercentage;
    
    // Update current value
    if (goal.category === "handicap") {
      // For handicap, lower is better
      updatedGoal.currentValue = Math.max(goal.targetValue, goal.currentValue - Math.abs(totalChange));
    } else {
      // For other goals, higher is better
      updatedGoal.currentValue = Math.min(goal.targetValue, goal.currentValue + Math.abs(totalChange));
    }
    
    // Round to one decimal place
    updatedGoal.currentValue = Math.round(updatedGoal.currentValue * 10) / 10;
    
    return updatedGoal;
  });
};

// Interface for effort scores
interface EffortScores {
  practiceSessions: number;
  fullSwingWork: number;
  shortGameWork: number;
  puttingWork: number;
  mentalGame: number;
  strengthTraining: number;
  mobilityExercises: number;
  [key: string]: number; // Index signature for string keys
}

// Generate monthly recap data
const generateMonthlyRecap = (month: string, userId: string, handicap: number) => {
  // Generate effort scores (1-5 scale)
  const effortScores: EffortScores = {
    practiceSessions: Math.floor(Math.random() * 3) + 3, // 3-5 (biased high)
    fullSwingWork: Math.floor(Math.random() * 5) + 1,
    shortGameWork: Math.floor(Math.random() * 5) + 1,
    puttingWork: Math.floor(Math.random() * 5) + 1,
    mentalGame: Math.floor(Math.random() * 5) + 1,
    strengthTraining: Math.floor(Math.random() * 5) + 1,
    mobilityExercises: Math.floor(Math.random() * 5) + 1
  };
  
  // Set a primary focus area with higher score
  const focusAreaIndex = Math.floor(Math.random() * 6);
  const focusAreas = ['fullSwingWork', 'shortGameWork', 'puttingWork', 'mentalGame', 'strengthTraining', 'mobilityExercises'];
  const primaryFocus = focusAreas[focusAreaIndex];
  effortScores[primaryFocus] = Math.min(5, effortScores[primaryFocus] + (Math.floor(Math.random() * 2) + 1));
  
  // Generate handicap change (-0.5 to +0.2)
  // Generally improving, but occasionally getting slightly worse
  const handicapChange = (Math.random() * 0.7) - 0.5;
  const handicapEndOfMonth = Math.max(0, handicap + handicapChange);
  
  return {
    month,
    userId,
    effortScores,
    autoSuggestedScores: effortScores,
    handicapStartOfMonth: handicap,
    handicapEndOfMonth: Number(handicapEndOfMonth.toFixed(1)),
    notes: getMonthlyRecapNote(primaryFocus, handicapChange),
    createdAt: Timestamp.now(),
    autoGenerated: true,
    userReviewed: Math.random() > 0.3 // 70% reviewed
  };
};

// Helper to generate monthly recap notes
const getMonthlyRecapNote = (focusArea: string, handicapChange: number) => {
  const areaName = 
    focusArea === 'fullSwingWork' ? 'full swing' :
    focusArea === 'shortGameWork' ? 'short game' :
    focusArea === 'puttingWork' ? 'putting' :
    focusArea === 'mentalGame' ? 'mental game' :
    focusArea === 'strengthTraining' ? 'strength training' :
    'flexibility and mobility';
  
  if (handicapChange < -0.3) {
    return `Great progress this month! Your focus on ${areaName} is really paying off. Keep up the good work!`;
  } else if (handicapChange < 0) {
    return `Solid month of improvement. Your ${areaName} work is showing progress, but there's still room to grow.`;
  } else {
    return `This month was challenging. Despite working on ${areaName}, you may need to adjust your practice approach. Don't get discouraged!`;
  }
};

// Helper to format month as YYYY-MM
const formatYearMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Get month name for display
const getMonthName = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Create random date within a given month
const randomDateInMonth = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(year, month, day);
};

/**
 * Main function to populate user data with 6 months of realistic golf improvement history
 * 
 * @param userId The user ID to populate data for
 * @param clearExisting Whether to clear existing data before populating
 * @param initialHandicap Starting handicap (defaults to 18.5)
 * @returns Promise that resolves when all data is created
 */
export const populateSixMonthsData = async (
  userId: string, 
  clearExisting: boolean = true,
  initialHandicap: number = 18.5
) => {
  try {
    // First update the user profile with some basic info
    await updateUserProfile(userId, {
      handicap: initialHandicap,
      hasCompletedTutorial: true
    });
    
    // Calculate start date (6 months ago)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6);
    startDate.setDate(1); // Start from first day of month
    
    // Create a set of goals
    const goals = generateGoals(userId, startDate);
    
    // Track plans by month
    const plansByMonth = new Map();
    
    // Track current handicap
    let currentHandicap = initialHandicap;
    
    // Process each month
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      // Calculate month date
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + monthOffset);
      
      // Month identifier (YYYY-MM)
      const yearMonth = formatYearMonth(monthDate);
      console.log(`Generating data for ${getMonthName(yearMonth)}`);
      
      // Generate a practice plan for this month (80% chance)
      if (Math.random() > 0.2 || monthOffset === 0) {
        const planData = generatePracticePlan(monthDate, Math.random() > 0.3);
        const planResult = await savePracticePlan(userId, planData);
        plansByMonth.set(yearMonth, planResult.id);
      }
      
      // Generate practice logs (8-16 per month)
      const logsCount = Math.floor(Math.random() * 9) + 8;
      
      for (let i = 0; i < logsCount; i++) {
        // Create a random date in this month
        const logDate = randomDateInMonth(monthDate.getFullYear(), monthDate.getMonth());
        
        // Decide between practice log or activity log (70% practice, 30% activity)
        if (Math.random() > 0.3) {
          // Practice log - might be associated with a plan
          const planId = plansByMonth.get(yearMonth);
          const usesPlan = Math.random() > 0.4; // 60% connected to plan, 40% independent
          
          const logData = generatePracticeLog(logDate, usesPlan ? planId : undefined);
          await logPracticeSession(userId, logData);
        } else {
          // Activity log
          const activityData = generateActivityLog(logDate);
          await logPracticeSession(userId, activityData);
        }
      }
      
      // Generate monthly recap
      const recapData = generateMonthlyRecap(yearMonth, userId, currentHandicap);
      await saveMonthlyRecap(userId, recapData);
      
      // Update handicap for next month
      currentHandicap = recapData.handicapEndOfMonth;
      
      // Update goals with progress for this month
      const updatedGoals = updateGoalProgress(goals, monthOffset + 1);
      
      // If this is the last month, save the goals with final progress
      if (monthOffset === 5) {
        for (const goal of updatedGoals) {
          await addGoal(userId, {
            title: goal.title,
            description: goal.description,
            targetDate: Timestamp.fromDate(goal.targetDate),
            currentValue: goal.currentValue,
            targetValue: goal.targetValue,
            category: goal.category,
            createdAt: Timestamp.fromDate(startDate)
          });
        }
      }
    }
    
    return {
      success: true,
      message: "Successfully populated 6 months of data"
    };
  } catch (error) {
    console.error("Error populating data:", error);
    return {
      success: false,
      message: `Error: ${(error as Error).message}`
    };
  }
}; 