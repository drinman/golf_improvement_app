import { generateAutoSuggestedScores, getUserProfile, getMonthlyRecapByMonth, saveMonthlyRecap } from "./db";
import { doc, collection, addDoc, Timestamp, updateDoc, DocumentReference } from "firebase/firestore";
import { db } from "./config";
import type { EffortScores } from "@/app/types/recap";

// Define user profile type
interface UserProfile {
  id: string;
  handicap?: number;
  [key: string]: any;
}

/**
 * Generate a monthly recap for a specific user and month
 * This can be used by users to manually generate a recap without waiting for automation
 */
export const generateUserMonthlyRecap = async (userId: string, month: string): Promise<{
  success: boolean;
  recapId?: string;
  message?: string;
}> => {
  try {
    // Check if month format is valid
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return { success: false, message: "Invalid month format. Use YYYY-MM" };
    }

    // Check if recap already exists for this month
    const existingRecap = await getMonthlyRecapByMonth(userId, month);
    
    if (existingRecap) {
      return { 
        success: false, 
        message: "A recap for this month already exists",
        recapId: existingRecap.id
      };
    }

    // Get auto-suggested scores based on practice logs
    const suggestedScores = await generateAutoSuggestedScores(userId, month);
    
    // Get user profile for handicap
    const userProfile = await getUserProfile(userId) as UserProfile;
    
    if (!userProfile) {
      return { success: false, message: "User profile not found" };
    }
    
    const currentHandicap = userProfile.handicap || 18; // Default to 18 if not set
    
    // Create recap
    const recapData = {
      month,
      userId,
      effortScores: suggestedScores as EffortScores,
      autoSuggestedScores: suggestedScores,
      handicapStartOfMonth: currentHandicap, // Using current handicap as start for manually generated recaps
      handicapEndOfMonth: currentHandicap,
      notes: '',
      createdAt: Timestamp.now(),
      autoGenerated: true,
      userReviewed: false
    };
    
    // Save to Firestore and get the notification ID
    const result = await saveMonthlyRecap(userId, recapData);
    const recapId = typeof result === 'object' && result && 'id' in result ? result.id : undefined;
    
    // Create notification
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Monthly Recap Ready",
      message: `Your monthly recap for ${getMonthName(month)} is ready. Review and confirm your effort scores.`,
      read: false,
      type: "recap",
      link: `/recap/${month}`,
      timestamp: Timestamp.now()
    });
    
    return { 
      success: true, 
      message: "Recap generated successfully",
      recapId
    };
  } catch (error) {
    console.error("Error generating user monthly recap:", error);
    return { 
      success: false, 
      message: `Error: ${(error as Error).message}` 
    };
  }
};

// Get month name from YYYY-MM format
const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}; 