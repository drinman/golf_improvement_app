"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { ClockIcon, CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function PracticePlanDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      try {
        const planRef = doc(db, "users", currentUser.uid, "practicePlans", id);
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
          setPlan({ id: planSnap.id, ...planSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching practice plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [currentUser, id, router]);

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8">
      {isLoading ? (
        <div className="text-center p-12">
          <p>Loading practice plan...</p>
        </div>
      ) : !plan ? (
        <div className="text-center p-12">
          <h1 className="text-2xl font-bold mb-4">Practice Plan Not Found</h1>
          <p className="mb-6">
            The practice plan you're looking for doesn't exist or you don't have
            access to view it.
          </p>
          <Button asChild>
            <Link href="/practice/plan">Return to Practice Plans</Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
              <p className="text-gray-600 mb-2">
                {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
              </p>
              <div className="flex flex-wrap gap-2 items-center mb-4">
                {plan.aiGenerated && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
                {plan.timePerSession && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {plan.timePerSession} minutes per session
                  </Badge>
                )}
                <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">
                  <CalendarDaysIcon className="h-3 w-3 mr-1" />
                  {plan.sessions.length} sessions
                </Badge>
              </div>
              {plan.description && (
                <p className="text-gray-700">{plan.description}</p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href="/practice/plan">Return to Practice Plans</Link>
              </Button>
              <Button 
                className="bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => {
                  // TODO: Implement export to calendar
                  alert("Export to calendar feature coming soon!");
                }}
              >
                Add to Calendar
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Sessions</h2>
            
            {plan.sessions.map((session: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {session.day}: {session.title}
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className="bg-blue-50 text-blue-800 border-blue-200"
                    >
                      {session.duration} minutes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {session.drills && session.drills.length > 0 ? (
                    <div className="space-y-4">
                      {session.drills.map((drill: any, drillIndex: number) => (
                        <div key={drillIndex} className="border-l-2 border-blue-500 pl-3 py-1">
                          <p className="font-medium">{drill.name}</p>
                          <p className="text-sm text-gray-600">{drill.description}</p>
                          <p className="text-sm text-gray-500">
                            {drill.duration} minutes
                            {drill.repetitions && ` • ${drill.repetitions} reps`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No drills defined for this session.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 