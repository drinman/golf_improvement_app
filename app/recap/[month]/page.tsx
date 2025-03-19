"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getMonthlyRecapByMonth } from "@/app/firebase/db";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/firebase/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpIcon, ArrowDownIcon, CalendarDaysIcon, ChartBarIcon, TrophyIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { MonthlyRecap, EffortScores } from "@/app/types/recap";
import { effortCategories } from "@/app/types/recap";
import { use } from "react";

// Type for confirmation state
type ConfirmationState = {
  isConfirming: boolean;
  isProcessing: boolean;
};

// Define params type
interface RecapParams {
  month: string;
}

export default function MonthlyRecapDetail({ params }: { params: RecapParams | Promise<RecapParams> }) {
  // Unwrap params with React.use
  const unwrappedParams = use(params as Promise<RecapParams>);
  const month = unwrappedParams.month;
  
  const router = useRouter();
  const { currentUser } = useAuth();
  const [recap, setRecap] = useState<MonthlyRecap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<ConfirmationState>({
    isConfirming: false,
    isProcessing: false
  });

  useEffect(() => {
    const fetchRecap = async () => {
      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      try {
        const recapData = await getMonthlyRecapByMonth(currentUser.uid, month);
        setRecap(recapData);
      } catch (error) {
        console.error("Error fetching monthly recap:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecap();
  }, [currentUser, month, router]);

  // Handle confirming an auto-generated recap
  const handleConfirmRecap = async () => {
    if (!recap || !currentUser) return;

    setConfirmState({ isConfirming: true, isProcessing: true });

    try {
      const recapRef = doc(db, "users", currentUser.uid, "monthlyRecaps", recap.id);
      await updateDoc(recapRef, {
        userReviewed: true
      });

      // Update local state
      setRecap({
        ...recap,
        userReviewed: true
      });

      toast.success("Recap confirmed successfully");
      setConfirmState({ isConfirming: false, isProcessing: false });
    } catch (error) {
      console.error("Error confirming recap:", error);
      toast.error("Failed to confirm recap");
      setConfirmState({ isConfirming: false, isProcessing: false });
    }
  };

  // Get month name from YYYY-MM format
  const getMonthName = (monthStr: string) => {
    const [year, monthNum] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Calculate average score across all categories
  const getAverageScore = (effortScores: EffortScores) => {
    if (!effortScores) return "0";
    
    const values = Object.values(effortScores);
    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    return (sum / values.length).toFixed(1);
  };

  // Get handicap change
  const getHandicapChange = (startHandicap: number, endHandicap: number) => {
    return (startHandicap - endHandicap).toFixed(1);
  };

  // Determine if handicap improved
  const handicapImproved = (startHandicap: number, endHandicap: number) => {
    return startHandicap > endHandicap;
  };

  // Generate feedback based on scores and handicap change
  const generateFeedback = (averageScore: number, handicapChange: number) => {
    const absHandicapChange = Math.abs(handicapChange);
    
    if (averageScore >= 4 && handicapChange > 0) {
      return "Excellent work! Your consistent effort is clearly paying off with significant handicap improvement.";
    } else if (averageScore >= 3.5 && handicapChange > 0) {
      return "Good progress! Your solid effort is showing in your handicap improvement.";
    } else if (averageScore >= 3 && handicapChange > 0) {
      return "You're making progress! Your effort is beginning to show results.";
    } else if (averageScore >= 3 && handicapChange === 0) {
      return "You're putting in decent effort, but you might need to adjust your focus areas to see handicap improvement.";
    } else if (averageScore < 3 && handicapChange === 0) {
      return "Your handicap remained stable. Consider increasing your practice consistency to break through.";
    } else if (averageScore < 3 && handicapChange < 0) {
      return "Your handicap increased slightly. Focus on consistency and quality in your practice sessions.";
    } else if (averageScore >= 3.5 && handicapChange < 0) {
      return "Despite good effort, your handicap increased. This happens sometimes - keep working and results will come.";
    } else {
      return "Keep practicing consistently and focusing on quality. Progress takes time.";
    }
  };

  // Score indicator (stars or dots)
  const ScoreIndicator = ({ score }: { score: number }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((value) => (
          <div
            key={value}
            className={`h-3 w-3 rounded-full mx-0.5 ${
              value <= score ? "bg-teal-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <div className="text-center">
          <p className="text-gray-500">Loading recap...</p>
        </div>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="py-10 text-center">
            <h1 className="text-2xl font-bold mb-4">Recap Not Found</h1>
            <p className="text-gray-600 mb-6">
              The monthly recap for {getMonthName(month)} doesn't exist yet.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/recap">Back to Recaps</Link>
              </Button>
              <Button asChild className="bg-blue-500 text-white hover:bg-blue-600">
                <Link href={`/recap/create?month=${month}`}>Create This Recap</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageScoreString = getAverageScore(recap.effortScores);
  const averageScore = parseFloat(averageScoreString);
  const handicapChange = getHandicapChange(recap.handicapStartOfMonth, recap.handicapEndOfMonth);
  const improved = handicapImproved(recap.handicapStartOfMonth, recap.handicapEndOfMonth);
  const numericHandicapChange = parseFloat(handicapChange);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{getMonthName(recap.month)} Recap</h1>
          <div className="flex gap-2">
            <Link href={`/recap/edit/${recap.month}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-100">
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Link href="/recap">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">Back to Recaps</Button>
            </Link>
          </div>
        </div>

        {recap.autoGenerated && !recap.userReviewed && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                    Auto-generated Recap
                  </h2>
                  <p className="text-gray-700">
                    This recap was created automatically based on your practice data.
                    Please review and confirm that the effort scores are accurate.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button 
                    onClick={handleConfirmRecap}
                    disabled={confirmState.isProcessing}
                    className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Confirm Recap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <TrophyIcon className="h-5 w-5 text-blue-500" />
                  Effort Score
                </span>
                <span className="text-2xl font-bold">{averageScoreString}/5</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Your average effort across all categories this month.
              </p>
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-50 border-4 border-teal-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-teal-600">{averageScoreString}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <ChartBarIcon className="h-5 w-5 text-blue-500" />
                  Handicap Change
                </span>
                <div className="flex items-center">
                  {numericHandicapChange !== 0 && (
                    <>
                      {improved ? (
                        <ArrowDownIcon className="h-5 w-5 text-teal-600 mr-1" />
                      ) : (
                        <ArrowUpIcon className="h-5 w-5 text-red-600 mr-1" />
                      )}
                    </>
                  )}
                  <span className={`text-2xl font-bold ${improved ? "text-teal-600" : numericHandicapChange === 0 ? "text-gray-600" : "text-red-600"}`}>
                    {Math.abs(numericHandicapChange).toFixed(1)}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                {recap.handicapStartOfMonth.toFixed(1)} → {recap.handicapEndOfMonth.toFixed(1)} 
                ({improved ? "improved by" : numericHandicapChange === 0 ? "no change" : "increased by"} {Math.abs(numericHandicapChange).toFixed(1)})
              </p>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{generateFeedback(averageScore, numericHandicapChange)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-gray-50 border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">Monthly Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                    <th className="border-b px-4 py-3 text-center text-sm font-medium text-gray-900">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {effortCategories.map((category) => {
                    const id = category.id;
                    const autoSuggested = recap.autoSuggestedScores?.[id] !== undefined;
                    return (
                      <tr key={id} className={autoSuggested ? "bg-teal-50" : ""}>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-800">{category.label}</span>
                            {autoSuggested && (
                              <span className="text-xs text-teal-600 block">
                                Suggested from practice logs
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <ScoreIndicator score={recap.effortScores[id]} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {recap.notes && (
          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-800">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{recap.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 