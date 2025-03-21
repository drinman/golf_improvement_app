import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  orderBy, 
  Timestamp,
  deleteDoc
} from "firebase/firestore";
import { db } from "./config";
import type { MonthlyRecap, EffortScores } from "@/app/types/recap";

// Feedback interface
export interface Feedback {
  type: string;
  message: string;
  userId?: string;
  userEmail?: string;
  createdAt: Date;
  status: string;
  deviceInfo?: string;
  screenshotUrl?: string;
}

// User profile functions
export const createUserProfile = async (
  userId: string, 
  data: { 
    email: string; 
    name?: string; 
    handicap?: number; 
    createdAt: Timestamp;
    hasCompletedTutorial?: boolean;
  }
) => {
  try {
    console.log("Creating user profile:", userId, data);
    // First check if profile already exists
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    // Set hasCompletedTutorial to false for new users
    const userData = {
      ...data,
      hasCompletedTutorial: data.hasCompletedTutorial !== undefined ? data.hasCompletedTutorial : false
    };
    
    // Clean userData to remove undefined values, as Firestore doesn't support 'undefined'
    const cleanedUserData: Record<string, any> = {};
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedUserData[key] = value;
      }
    });
    
    if (docSnap.exists()) {
      // Update only the fields that are provided
      console.log("Profile exists, updating:", cleanedUserData);
      return await updateDoc(docRef, cleanedUserData);
    } else {
      // Create new profile
      console.log("Creating new profile:", cleanedUserData);
      return await setDoc(docRef, cleanedUserData);
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    console.log("Updating user profile:", userId, data);
    
    // Don't allow empty/null/undefined values to overwrite existing data
    const cleanData: Record<string, any> = {};
    
    // Only include fields that have valid values
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanData[key] = value;
      }
    });
    
    if (Object.keys(cleanData).length === 0) {
      console.log("No valid data to update");
      return;
    }
    
    const userRef = doc(db, "users", userId);
    
    // Check if document exists
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      // Document doesn't exist, create it
      console.log("Document doesn't exist, creating:", cleanData);
      // Add createdAt field if not already present
      if (!cleanData.createdAt) {
        cleanData.createdAt = Timestamp.now();
      }
      return await setDoc(userRef, cleanData);
    } else {
      // Document exists, update it
      return await updateDoc(userRef, cleanData);
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Goals functions
export const addGoal = async (userId: string, goalData: {
  title: string;
  description?: string;
  targetDate: Timestamp;
  currentValue?: number;
  targetValue: number;
  category: string;
  createdAt: Timestamp;
}) => {
  // Clean goalData to remove undefined values, as Firestore doesn't support 'undefined'
  const cleanedGoalData: Record<string, any> = {};
  Object.entries(goalData).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedGoalData[key] = value;
    }
  });
  
  const goalsCollection = collection(db, "users", userId, "goals");
  return await addDoc(goalsCollection, cleanedGoalData);
};

export const getUserGoals = async (userId: string) => {
  const goalsCollection = collection(db, "users", userId, "goals");
  const q = query(goalsCollection, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Practice plan functions
export const savePracticePlan = async (userId: string, planData: {
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  sessions: any[];
  timePerSession: number;
  aiGenerated: boolean;
  createdAt: Timestamp;
}) => {
  // Clean planData to remove undefined values
  const cleanedPlanData: Record<string, any> = {};
  Object.entries(planData).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedPlanData[key] = value;
    }
  });
  
  const plansCollection = collection(db, "users", userId, "practicePlans");
  return await addDoc(plansCollection, cleanedPlanData);
};

export const getUserPracticePlans = async (userId: string) => {
  const plansCollection = collection(db, "users", userId, "practicePlans");
  const q = query(plansCollection, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Practice logs functions
export const logPracticeSession = async (userId: string, logData: {
  type?: "structured" | "activity";
  planId?: string;
  sessionTitle: string;
  notes: string;
  rating?: number;
  duration: number;
  drills?: any[];
  categories?: string[];
  otherCategory?: string;
  date: Timestamp;
  createdAt: Timestamp;
}) => {
  // Clean logData to remove undefined values
  const cleanedLogData: Record<string, any> = {};
  Object.entries(logData).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedLogData[key] = value;
    }
  });
  
  const logsCollection = collection(db, "users", userId, "practiceLogs");
  return await addDoc(logsCollection, cleanedLogData);
};

export const getUserPracticeLogs = async (userId: string) => {
  const logsCollection = collection(db, "users", userId, "practiceLogs");
  const q = query(logsCollection, orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Monthly Recap functions
export const saveMonthlyRecap = async (userId: string, recapData: {
  month: string; // Format: "YYYY-MM"
  effortScores: EffortScores;
  autoSuggestedScores?: Record<string, number>;
  handicapStartOfMonth: number;
  handicapEndOfMonth: number;
  notes?: string;
  autoGenerated?: boolean;
  userReviewed?: boolean;
  createdAt: Timestamp;
}) => {
  // Clean recapData to remove undefined values
  const cleanedRecapData: Record<string, any> = {};
  Object.entries(recapData).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedRecapData[key] = value;
    }
  });
  
  const recapsCollection = collection(db, "users", userId, "monthlyRecaps");
  // Check if a recap for this month already exists
  const q = query(recapsCollection, where("month", "==", recapData.month));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Update existing recap
    const recapDoc = querySnapshot.docs[0];
    return await updateDoc(doc(db, "users", userId, "monthlyRecaps", recapDoc.id), cleanedRecapData);
  } else {
    // Create new recap
    return await addDoc(recapsCollection, cleanedRecapData);
  }
};

export const getUserMonthlyRecaps = async (userId: string, limit = 12): Promise<MonthlyRecap[]> => {
  const recapsCollection = collection(db, "users", userId, "monthlyRecaps");
  const q = query(recapsCollection, orderBy("month", "desc"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MonthlyRecap[];
};

export const getMonthlyRecapByMonth = async (userId: string, month: string): Promise<MonthlyRecap | null> => {
  const recapsCollection = collection(db, "users", userId, "monthlyRecaps");
  const q = query(recapsCollection, where("month", "==", month));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const recapDoc = querySnapshot.docs[0];
  return {
    id: recapDoc.id,
    ...recapDoc.data()
  } as MonthlyRecap;
};

export const generateAutoSuggestedScores = async (userId: string, month: string) => {
  // Get start and end dates for the month
  const [year, monthNum] = month.split("-");
  const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0); // Last day of month
  
  // Get practice logs for the month
  const logsCollection = collection(db, "users", userId, "practiceLogs");
  const q = query(
    logsCollection,
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate))
  );
  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map(doc => doc.data());
  
  // Count sessions by category
  const categoryCounts: Record<string, number> = {
    practiceSessions: logs.length,
    fullSwingWork: 0,
    shortGameWork: 0,
    puttingWork: 0,
    mentalGame: 0,
    strengthTraining: 0,
    mobilityExercises: 0
  };
  
  // Analyze drill types to suggest scores
  logs.forEach(log => {
    if (!log.drills) return;
    
    log.drills.forEach((drill: any) => {
      const drillName = drill.name.toLowerCase();
      
      if (drillName.includes("putt") || drillName.includes("green")) {
        categoryCounts.puttingWork += 1;
      } else if (drillName.includes("chip") || drillName.includes("pitch") || drillName.includes("bunker")) {
        categoryCounts.shortGameWork += 1;
      } else if (drillName.includes("swing") || drillName.includes("drive") || drillName.includes("iron")) {
        categoryCounts.fullSwingWork += 1;
      } else if (drillName.includes("mental") || drillName.includes("routine") || drillName.includes("visualization")) {
        categoryCounts.mentalGame += 1;
      } else if (drillName.includes("strength") || drillName.includes("fitness")) {
        categoryCounts.strengthTraining += 1;
      } else if (drillName.includes("mobility") || drillName.includes("stretch")) {
        categoryCounts.mobilityExercises += 1;
      }
    });
  });
  
  // Convert counts to suggested scores (1-5 scale)
  const suggestedScores: Record<string, number> = {};
  const maxSessionsPerMonth = 20; // Assumption: practicing 5 times a week is maximum (5 score)
  
  // Practice sessions overall score
  suggestedScores.practiceSessions = Math.min(5, Math.ceil(categoryCounts.practiceSessions / (maxSessionsPerMonth / 5)));
  
  // Other category scores
  const calculateCategoryScore = (count: number, expectedMax: number) => {
    return Math.min(5, Math.max(1, Math.ceil(count / (expectedMax / 5))));
  };
  
  suggestedScores.fullSwingWork = calculateCategoryScore(categoryCounts.fullSwingWork, 15);
  suggestedScores.shortGameWork = calculateCategoryScore(categoryCounts.shortGameWork, 15);
  suggestedScores.puttingWork = calculateCategoryScore(categoryCounts.puttingWork, 15);
  suggestedScores.mentalGame = calculateCategoryScore(categoryCounts.mentalGame, 10);
  suggestedScores.strengthTraining = calculateCategoryScore(categoryCounts.strengthTraining, 12);
  suggestedScores.mobilityExercises = calculateCategoryScore(categoryCounts.mobilityExercises, 12);
  
  return suggestedScores;
};

// Tutorial and test functions
export const resetUserTutorial = async (userId: string, clearData: boolean = false) => {
  try {
    // Reset the tutorial completion status
    await updateUserProfile(userId, {
      hasCompletedTutorial: false
    });
    
    // If clearData is true, delete all user data for testing
    if (clearData) {
      // Get collections to clear
      const collections = ['goals', 'practicePlans', 'practiceLogs', 'monthlyRecaps', 'feedback'];
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, "users", userId, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        // Delete each document in the collection
        const deletePromises = snapshot.docs.map(docSnapshot => {
          const docRef = doc(db, "users", userId, collectionName, docSnapshot.id);
          return deleteDoc(docRef);
        });
        
        await Promise.all(deletePromises);
      }
      
      // Reset user profile but keep essential data
      const profile = await getUserProfile(userId) as any;
      if (profile) {
        await updateUserProfile(userId, {
          hasCompletedTutorial: false,
          handicap: 18.5, // Set a default handicap for testing
          createdAt: Timestamp.now() // Reset the creation date
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error resetting user tutorial and data:", error);
    throw error;
  }
};

// Feedback functions
export const addFeedback = async (feedbackData: Feedback) => {
  try {
    const userId = feedbackData.userId || 'anonymous';
    
    // Add device info if available
    if (typeof window !== 'undefined') {
      feedbackData.deviceInfo = `${window.navigator.userAgent}, ${window.innerWidth}x${window.innerHeight}`;
    }
    
    // Clean feedbackData to remove undefined values
    const cleanedFeedbackData: Record<string, any> = {};
    Object.entries(feedbackData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedFeedbackData[key] = value;
      }
    });
    
    // Ensure createdAt is properly handled as a Timestamp
    if (cleanedFeedbackData.createdAt && !(cleanedFeedbackData.createdAt instanceof Timestamp)) {
      cleanedFeedbackData.createdAt = Timestamp.fromDate(cleanedFeedbackData.createdAt);
    }
    
    // Store in user's feedback collection if logged in
    if (feedbackData.userId) {
      const feedbackCollection = collection(db, "users", userId, "feedback");
      await addDoc(feedbackCollection, cleanedFeedbackData);
    }
    
    // Also store in global feedback collection for easy access
    const globalFeedbackCollection = collection(db, "feedback");
    return await addDoc(globalFeedbackCollection, cleanedFeedbackData);
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
};

export const getFeedback = async (status?: string) => {
  try {
    const feedbackCollection = collection(db, "feedback");
    let q = query(feedbackCollection, orderBy("createdAt", "desc"));
    
    if (status) {
      q = query(feedbackCollection, where("status", "==", status), orderBy("createdAt", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting feedback:", error);
    throw error;
  }
}; 