"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getUserPracticePlans, getUserPracticeLogs } from "@/app/firebase/db";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { CalendarDaysIcon, ClockIcon, SparklesIcon, TagIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Focus area options with badge styling
const focusAreas = [
  { value: "all", label: "All", badgeClass: "" },
  { value: "full_swing", label: "Full Swing", badgeClass: "bg-green-100 text-green-700" },
  { value: "short_game", label: "Short Game", badgeClass: "bg-yellow-100 text-yellow-700" },
  { value: "putting", label: "Putting", badgeClass: "bg-blue-100 text-blue-700" },
  { value: "fitness", label: "Fitness & Mobility", badgeClass: "bg-purple-100 text-purple-700" },
  { value: "mental_game", label: "Mental Game", badgeClass: "bg-indigo-100 text-indigo-700" },
  { value: "mixed", label: "Mixed", badgeClass: "bg-gray-100 text-gray-700" }
];

export default function Practice() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'logs' ? 'logs' : 'plans');
  const [practicePlans, setPracticePlans] = useState<any[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      try {
        const plans = await getUserPracticePlans(currentUser.uid);
        const logs = await getUserPracticeLogs(currentUser.uid);

        setPracticePlans(plans);
        setPracticeLogs(logs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, router]);

  // Filter plans by focus area
  const filteredPlans = activeFilter === "all" 
    ? practicePlans 
    : practicePlans.filter(plan => {
        // Convert to lowercase, replace spaces with underscores for comparison
        const normalizedFocusArea = (plan.focusArea || "mixed")
          .toLowerCase()
          .replace(/\s+&?\s+/g, '_');
        return normalizedFocusArea === activeFilter;
      });

  // Format timestamp for display
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <div className="text-center">
          <p className="text-gray-500">Loading your practice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Practice Center</h1>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Link href="/practice/plan">
            <Button className="bg-blue-500 text-white hover:bg-blue-600">New Practice Plan</Button>
          </Link>
          <Link href="/practice/log">
            <Button variant="outline">Log Practice</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="plans">Practice Plans</TabsTrigger>
          <TabsTrigger value="logs">Practice Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          {/* Focus area filters */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {focusAreas.map((area) => (
                <Badge 
                  key={area.value}
                  onClick={() => setActiveFilter(area.value)}
                  className={`py-1 px-3 cursor-pointer ${
                    activeFilter === area.value 
                      ? "ring-2 ring-offset-2 " + (area.badgeClass || "ring-blue-300") 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${area.badgeClass}`}
                >
                  {area.label}
                </Badge>
              ))}
            </div>
          </div>

          {filteredPlans.length > 0 ? (
            <div className="space-y-6">
              {filteredPlans.map((plan) => (
                <PracticePlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-gray-500 mb-4">
                  {activeFilter === "all" 
                    ? "You don't have any practice plans yet." 
                    : `No practice plans found with focus area: ${focusAreas.find(a => a.value === activeFilter)?.label || activeFilter}.`}
                </p>
                <Link href="/practice/plan">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">
                    Create Your First Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          {practiceLogs.length > 0 ? (
            <div className="space-y-4">
              {practiceLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{log.sessionTitle}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(log.date)} • {log.duration} minutes
                        </p>
                      </div>
                      {log.rating && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`h-4 w-4 text-sm ${i < log.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {log.notes && (
                      <p className="text-gray-600 mt-2 text-sm">
                        {log.notes}
                      </p>
                    )}
                    
                    {log.drills && log.drills.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm font-medium mb-2">Drills completed:</p>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          {log.drills.map((drill: any, index: number) => (
                            <li key={index}>{drill.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-gray-500 mb-4">You haven't logged any practice sessions yet.</p>
                <Link href="/practice/log">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">
                    Log Your First Practice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Update the practice plan card to display time per session
function PracticePlanCard({ plan }: { plan: any }) {
  const startDate = plan.startDate.toDate();
  const endDate = plan.endDate.toDate();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Find matching focus area for badge styling
  const getFocusAreaBadge = (focusAreaName: string = "Mixed") => {
    // Convert plan.focusArea to a format that matches our focusAreas array values
    const normalizedFocusArea = focusAreaName
      .toLowerCase()
      .replace(/\s+&?\s+/g, '_');
    
    const matchingArea = focusAreas.find(area => 
      area.value === normalizedFocusArea || 
      area.label.toLowerCase() === focusAreaName.toLowerCase()
    );
    
    return matchingArea?.badgeClass || "bg-gray-100 text-gray-700";
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{plan.title}</CardTitle>
          <div className="flex gap-1.5">
            {plan.focusArea && (
              <Badge variant="outline" className={`flex items-center ${getFocusAreaBadge(plan.focusArea)}`}>
                <TagIcon className="h-3 w-3 mr-1" />
                {plan.focusArea}
              </Badge>
            )}
            {plan.aiGenerated && (
              <Badge className="bg-blue-50 text-blue-800 border-blue-200 flex items-center">
                <SparklesIcon className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {formatDate(startDate)} - {formatDate(endDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
            <span>{plan.sessions.length} sessions</span>
          </div>
          {plan.timePerSession && (
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4 text-blue-500" />
              <span>{plan.timePerSession} min per session</span>
            </div>
          )}
        </div>
        {plan.description && <p className="text-sm text-gray-600">{plan.description}</p>}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-blue-500 text-white hover:bg-blue-600">
          <Link href={`/practice/plan?id=${plan.id}`}>View Plan</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 