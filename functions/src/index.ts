import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// Configure nodemailer for sending emails
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

// Function to generate auto-suggested scores based on practice logs
async function generateAutoSuggestedScores(userId: string, month: string): Promise<Record<string, number>> {
  // Get start and end dates for the month
  const [year, monthNum] = month.split("-");
  const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0); // Last day of month
  
  // Get practice logs for the month
  const logsCollection = db.collection("users").doc(userId).collection("practiceLogs");
  const snapshot = await logsCollection
    .where("date", ">=", admin.firestore.Timestamp.fromDate(startDate))
    .where("date", "<=", admin.firestore.Timestamp.fromDate(endDate))
    .get();
    
  const logs = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data());
  
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
  logs.forEach((log: any) => {
    if (!log.drills) return;
    
    log.drills.forEach((drill: any) => {
      const drillName = (drill.name || "").toLowerCase();
      
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
  suggestedScores.practiceSessions = Math.min(5, Math.max(1, Math.ceil(categoryCounts.practiceSessions / (maxSessionsPerMonth / 5))));
  
  // Other category scores
  const calculateCategoryScore = (count: number, expectedMax: number): number => {
    return Math.min(5, Math.max(1, Math.ceil(count / (expectedMax / 5))));
  };
  
  suggestedScores.fullSwingWork = calculateCategoryScore(categoryCounts.fullSwingWork, 15);
  suggestedScores.shortGameWork = calculateCategoryScore(categoryCounts.shortGameWork, 15);
  suggestedScores.puttingWork = calculateCategoryScore(categoryCounts.puttingWork, 15);
  suggestedScores.mentalGame = calculateCategoryScore(categoryCounts.mentalGame, 10);
  suggestedScores.strengthTraining = calculateCategoryScore(categoryCounts.strengthTraining, 12);
  suggestedScores.mobilityExercises = calculateCategoryScore(categoryCounts.mobilityExercises, 12);
  
  return suggestedScores;
}

interface HandicapData {
  startingHandicap: number | null;
  currentHandicap: number | null;
}

// Get user's handicap data
async function getUserHandicapData(userId: string): Promise<HandicapData | null> {
  try {
    // Get user profile for current handicap
    const userProfile = await db.collection("users").doc(userId).get();
    const profileData = userProfile.data();
    
    if (!profileData) return null;
    
    const currentHandicap = profileData.handicap || null;
    
    // Try to get previous month's recap for starting handicap
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const lastMonthRecap = await db.collection("users")
      .doc(userId)
      .collection("monthlyRecaps")
      .where("month", "==", lastMonthStr)
      .limit(1)
      .get();
    
    let startingHandicap = currentHandicap;
    
    // If we have last month's recap, use its ending handicap as this month's starting
    if (!lastMonthRecap.empty) {
      const lastRecapData = lastMonthRecap.docs[0].data();
      startingHandicap = lastRecapData.handicapEndOfMonth;
    }
    
    return {
      startingHandicap: startingHandicap,
      currentHandicap: currentHandicap
    };
  } catch (error) {
    console.error("Error getting handicap data:", error);
    return null;
  }
}

// Send email notification
async function sendEmailNotification(userId: string, userName: string, userEmail: string, month: string): Promise<boolean> {
  const monthDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 1);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const mailOptions = {
    from: '"Golf Improver" <noreply@golfimprover.app>',
    to: userEmail,
    subject: `Your ${monthName} Golf Improvement Recap is Ready!`,
    text: `Hi ${userName},\n\nYour monthly golf improvement recap for ${monthName} is now ready to view. See how your practice efforts correlated with your handicap progress this month.\n\nCheck it out now at: https://golfimprover.app/recap/${month}\n\nKeep improving!\nThe Golf Improver Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Monthly Golf Recap</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hi ${userName},</p>
          <p>Your monthly golf improvement recap for <strong>${monthName}</strong> is now ready to view!</p>
          <p>See how your practice efforts correlated with your handicap progress this month.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://golfimprover.app/recap/${month}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Your Recap
            </a>
          </div>
          <p>Keep improving!</p>
          <p>The Golf Improver Team</p>
        </div>
      </div>
    `
  };
  
  try {
    await mailTransport.sendMail(mailOptions);
    console.log(`Email sent to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send in-app notification
async function sendInAppNotification(userId: string, month: string): Promise<boolean> {
  const monthDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 1);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const notification = {
    title: `${monthName} Recap Ready`,
    message: `Your monthly golf improvement recap for ${monthName} is now available. Check it out!`,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
    type: 'RECAP',
    link: `/recap/${month}`
  };
  
  try {
    await db.collection('users').doc(userId).collection('notifications').add(notification);
    console.log(`In-app notification sent to user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error sending in-app notification:', error);
    return false;
  }
}

// Scheduled function to generate monthly recaps (runs on the 1st of each month)
exports.generateMonthlyRecaps = functions.pubsub
  .schedule('0 0 1 * *')  // Run at midnight on the 1st of every month
  .timeZone('America/New_York')
  .onRun(async (context: functions.EventContext) => {
    // Get the previous month in YYYY-MM format
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    const processPromises = usersSnapshot.docs.map(async (userDoc: admin.firestore.QueryDocumentSnapshot) => {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Check if user already has a recap for this month
        const existingRecapsSnapshot = await db.collection('users').doc(userId)
          .collection('monthlyRecaps')
          .where('month', '==', month)
          .limit(1)
          .get();
        
        // Skip if recap already exists
        if (!existingRecapsSnapshot.empty) {
          console.log(`Monthly recap for ${month} already exists for user ${userId}`);
          return;
        }
        
        // Generate auto-suggested scores
        const suggestedScores = await generateAutoSuggestedScores(userId, month);
        
        // Get handicap data
        const handicapData = await getUserHandicapData(userId);
        
        if (!handicapData || handicapData.currentHandicap === null) {
          console.log(`Skipping recap for user ${userId} - no handicap data`);
          return;
        }
        
        // Create recap document
        const recapData = {
          month,
          userId,
          effortScores: { ...suggestedScores }, // Use suggested scores as default effort scores
          autoSuggestedScores: suggestedScores,
          handicapStartOfMonth: handicapData.startingHandicap,
          handicapEndOfMonth: handicapData.currentHandicap,
          notes: '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          autoGenerated: true
        };
        
        // Save to Firestore
        await db.collection('users').doc(userId)
          .collection('monthlyRecaps')
          .add(recapData);
        
        console.log(`Created monthly recap for user ${userId} for ${month}`);
        
        // Send notifications if user has email
        if (userData.email) {
          const userName = userData.displayName || 'Golfer';
          await sendEmailNotification(userId, userName, userData.email, month);
        }
        
        // Send in-app notification
        await sendInAppNotification(userId, month);
        
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    });
    
    await Promise.all(processPromises);
    
    console.log(`Monthly recap generation completed for ${month}`);
    return null;
  });

interface ManualGenerateRecapData {
  month: string;
}

// HTTP endpoint to manually trigger monthly recap generation for testing
exports.manualGenerateRecap = functions.https.onCall(async (data: ManualGenerateRecapData, context: functions.https.CallableContext) => {
  // Check if the request is made by an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  
  const userId = context.auth.uid;
  const { month } = data;
  
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new functions.https.HttpsError('invalid-argument', 'Month must be in YYYY-MM format');
  }
  
  try {
    // Generate auto-suggested scores
    const suggestedScores = await generateAutoSuggestedScores(userId, month);
    
    // Get handicap data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }
    
    const currentHandicap = userData.handicap || null;
    
    // Create recap document
    const recapData = {
      month,
      userId,
      effortScores: { ...suggestedScores }, // Use suggested scores as default effort scores
      autoSuggestedScores: suggestedScores,
      handicapStartOfMonth: currentHandicap,
      handicapEndOfMonth: currentHandicap,
      notes: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      autoGenerated: true
    };
    
    // Check if recap already exists for this month
    const existingRecapsSnapshot = await db.collection('users').doc(userId)
      .collection('monthlyRecaps')
      .where('month', '==', month)
      .limit(1)
      .get();
    
    let recapId;
    
    if (!existingRecapsSnapshot.empty) {
      // Update existing recap
      recapId = existingRecapsSnapshot.docs[0].id;
      await db.collection('users').doc(userId)
        .collection('monthlyRecaps')
        .doc(recapId)
        .update({
          autoSuggestedScores: suggestedScores,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
      // Create new recap
      const recapRef = await db.collection('users').doc(userId)
        .collection('monthlyRecaps')
        .add(recapData);
      recapId = recapRef.id;
      
      // Send in-app notification
      await sendInAppNotification(userId, month);
    }
    
    return { success: true, recapId, month };
  } catch (error) {
    console.error('Error generating manual recap:', error);
    throw new functions.https.HttpsError('internal', 'Error generating recap');
  }
}); 