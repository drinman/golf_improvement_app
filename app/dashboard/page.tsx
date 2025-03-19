"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getUserProfile, getUserGoals, getUserPracticeLogs, getUserPracticePlans, getUserMonthlyRecaps } from "@/app/firebase/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { 
  TrophyIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  ChartBarIcon, 
  FireIcon, 
  SparklesIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  StarIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<any[]>([]);
  const [practicePlans, setPracticePlans] = useState<any[]>([]);
  const [monthlyRecaps, setMonthlyRecaps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for UI controls
  const [expandedGoals, setExpandedGoals] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState(false);
  
  // Stats calculations
  const [stats, setStats] = useState({
    sessionsThisMonth: 0,
    totalTimeThisMonth: 0,
    currentStreak: 0,
    handicapProgress: 0,
    hasImproved: false,
    handicapChange: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        const userGoals = await getUserGoals(currentUser.uid);
        const logs = await getUserPracticeLogs(currentUser.uid);
        const plans = await getUserPracticePlans(currentUser.uid);
        const recaps = await getUserMonthlyRecaps(currentUser.uid);

        setUserProfile(profile);
        setGoals(userGoals);
        setPracticeLogs(logs);
        setPracticePlans(plans);
        setMonthlyRecaps(recaps);
        
        // Calculate stats
        calculateStats(logs, profile, userGoals);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, router]);

  // Calculate dashboard stats
  const calculateStats = (logs: any[], profile: any, userGoals: any[]) => {
    // Current date for calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter logs for current month
    const thisMonthLogs = logs.filter(log => {
      const logDate = log.date.toDate();
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });
    
    // Calculate sessions this month
    const sessionsThisMonth = thisMonthLogs.length;
    
    // Calculate total practice time this month
    const totalTimeThisMonth = thisMonthLogs.reduce((total, log) => total + log.duration, 0);
    
    // Calculate current streak
    const streak = calculatePracticeStreak(logs);
    
    // Calculate handicap progress
    let handicapProgress = 0;
    let hasImproved = false;
    let handicapChange = 0;
    
    const handicapGoal = userGoals.find(goal => goal.title.toLowerCase().includes('handicap'));
    
    if (handicapGoal && profile.handicap !== undefined) {
      const startValue = handicapGoal.startValue || profile.handicap;
      const targetValue = handicapGoal.targetValue;
      
      // Calculate progress percentage
      if (targetValue < startValue) { // Goal is to lower handicap
        const totalNeededReduction = startValue - targetValue;
        const actualReduction = startValue - profile.handicap;
        handicapProgress = Math.min(100, Math.max(0, (actualReduction / totalNeededReduction) * 100));
        hasImproved = profile.handicap < startValue;
        handicapChange = startValue - profile.handicap;
      } else { // Goal is to increase handicap (rare)
        const totalNeededIncrease = targetValue - startValue;
        const actualIncrease = profile.handicap - startValue;
        handicapProgress = Math.min(100, Math.max(0, (actualIncrease / totalNeededIncrease) * 100));
        hasImproved = profile.handicap > startValue;
        handicapChange = profile.handicap - startValue;
      }
    }
    
    setStats({
      sessionsThisMonth,
      totalTimeThisMonth,
      currentStreak: streak,
      handicapProgress,
      hasImproved,
      handicapChange
    });
  };
  
  // Calculate practice streak
  const calculatePracticeStreak = (logs: any[]) => {
    if (!logs.length) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if practiced today or yesterday
    const mostRecentLogDate = sortedLogs[0].date.toDate();
    mostRecentLogDate.setHours(0, 0, 0, 0);
    
    const msBetween = today.getTime() - mostRecentLogDate.getTime();
    const daysBetween = msBetween / (1000 * 60 * 60 * 24);
    
    // If the most recent log is more than 1 day old, streak is broken
    if (daysBetween > 1) return 0;
    
    // Count consecutive days practiced
    let streak = 1;
    let currentDate = mostRecentLogDate;
    
    for (let i = 1; i < sortedLogs.length; i++) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      
      const logDate = sortedLogs[i].date.toDate();
      logDate.setHours(0, 0, 0, 0);
      
      // If this log is from the previous day, increase streak
      if (logDate.getTime() === prevDate.getTime()) {
        streak++;
        currentDate = logDate;
      } else if (logDate.getTime() < prevDate.getTime()) {
        // Gap in streak, stop counting
        break;
      }
    }
    
    return streak;
  };

  // Prepare practice data for chart
  const practiceChartData = practiceLogs.slice(0, 10).map(log => ({
    date: log.date.toDate().toLocaleDateString(),
    duration: log.duration,
    rating: log.rating || 0
  })).reverse();

  // Format timestamp for display
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString();
  };
  
  // Format minutes as hours and minutes
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr${hours !== 1 ? 's' : ''}`;
    return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <div className="text-center">
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Get the most recent monthly recap
  const latestRecap = monthlyRecaps[0];
  
  // Find primary handicap goal
  const handicapGoal = goals.find(goal => goal.title.toLowerCase().includes('handicap'));
  
  // Get current month name
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-6 w-full">
      {/* Welcome & Quick Stats - Full width section */}
      <div className="w-full px-4 lg:px-8 mb-6">
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {userProfile?.name || "Golfer"}!</h1>
                <div className="mt-2 text-gray-700">
                  <p className="flex items-center mb-1">
                    <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Handicap: <span className="font-medium mx-1">{userProfile?.handicap !== undefined ? userProfile.handicap : "Not set"}</span>
                    {handicapGoal && (
                      <span className="ml-1">→ Target: <span className="font-medium">{handicapGoal.targetValue}</span></span>
                    )}
                  </p>
                  
                  <p className="flex items-center mb-1">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <span>{stats.sessionsThisMonth} session{stats.sessionsThisMonth !== 1 ? 's' : ''} logged this month</span>
                    {stats.totalTimeThisMonth > 0 && (
                      <span className="ml-1">({formatTime(stats.totalTimeThisMonth)})</span>
                    )}
                  </p>
                  
                  {stats.handicapChange > 0 && (
                    <p className="flex items-center">
                      <TrophyIcon className="h-5 w-5 text-blue-500 mr-2" />
                      {stats.hasImproved ? 
                        <span>Great progress! You've improved your handicap by <span className="font-medium">{stats.handicapChange.toFixed(1)}</span> strokes!</span> :
                        <span>You're only <span className="font-medium">{stats.handicapChange.toFixed(1)}</span> strokes away from your goal!</span>
                      }
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex gap-2">
                <Link href="/practice/plan">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">New Practice Plan</Button>
                </Link>
                <Link href="/practice/log">
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">Log Session</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Practice Streak Card - Only show if there's an active streak */}
      {stats.currentStreak > 0 && (
        <div className="w-full px-4 lg:px-8 mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <FireIcon className="h-6 w-6 text-amber-500 mr-2" />
                <span className="text-amber-800 font-medium">
                  Practice Streak: {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}! 
                  {stats.currentStreak >= 3 ? ' Keep it up! 🔥' : ' Great start!'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Goals Section */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-1 text-gray-800 whitespace-nowrap">
              <TrophyIcon className="h-5 w-5 text-blue-500" />
              Your Goals
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/goals/new">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm px-3 py-1.5 rounded-md min-w-max"
                >
                  + Add Goal
                </Button>
              </Link>
              <div className="relative">
                <select 
                  className="border border-gray-200 rounded text-sm px-3 py-1.5 text-gray-700 bg-gray-50 appearance-none pr-8 min-w-max"
                  defaultValue="progress"
                >
                  <option value="progress">Sort: Progress</option>
                  <option value="deadline">Sort: Deadline</option>
                  <option value="recent">Sort: Recent</option>
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                  ⌄
                </span>
              </div>
            </div>
          </div>

          {goals.length > 0 ? (
            <>
              {/* Goals Summary Card */}
              <Card className="mb-4 bg-gray-50 border border-gray-200">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-800">🎯 {goals.length} Active Goals</h3>
                    <p className="text-sm text-gray-700">
                      Avg Progress: {goals.length > 0 
                        ? Math.round(goals.reduce((sum, goal) => sum + (((goal.currentValue || 0) / goal.targetValue) * 100), 0) / goals.length) 
                        : 0}%
                    </p>
                  </div>
                  
                  {handicapGoal && (
                    <p className="text-sm text-gray-600 mt-1">
                      Next: Get to single digit handicap ({formatDate(handicapGoal.targetDate)})
                    </p>
                  )}
                  
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm px-3 py-1.5 rounded-md min-w-max"
                      onClick={() => setExpandedGoals(!expandedGoals)}
                    >
                      {expandedGoals ? "Show Less" : "View All Goals"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Top 2 Goals (Pinned/Priority) */}
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.slice(0, expandedGoals ? goals.length : 2).map((goal) => (
                  <Card key={goal.id} className="bg-gray-50 border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800">{goal.title}</h3>
                        {goal.targetDate && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Due: {formatDate(goal.targetDate)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-700">
                          <span>Current: {goal.currentValue || "Not started"}</span>
                          <span>Target: {goal.targetValue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(((goal.currentValue || 0) / goal.targetValue) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700 min-w-[40px] text-right">
                            {Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>

              <div className="text-center">
                <Link href="/dashboard/goals/new">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 text-sm px-3 py-1.5 rounded-md min-w-max"
                  >
                    Add New Goal
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Card className="bg-gray-50 border border-gray-200">
              <CardContent className="py-4">
                <p className="text-gray-700 text-center">
                  You haven't set any goals yet. 
                  <Link href="/dashboard/goals/new" className="text-blue-600 ml-1 hover:underline">
                    Create your first goal
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Practice Plans Section */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500 mr-2" />
            Practice Plans
          </h2>
          
          {practicePlans.length > 0 ? (
            <>
              {/* Tabs for plan status */}
              <div className="mb-4 border-b border-gray-200">
                <nav className="flex -mb-px gap-4">
                  <button className="text-blue-500 border-b-2 border-blue-500 pb-2 font-medium">
                    Active
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 pb-2">
                    Completed
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 pb-2">
                    Archived
                  </button>
                </nav>
              </div>
              
              <div className="space-y-4">
                {practicePlans.slice(0, 3).map((plan) => {
                  const startDate = plan.startDate.toDate();
                  const endDate = plan.endDate.toDate();
                  
                  // Calculate session completion (mock data for demonstration)
                  const totalSessions = plan.sessions?.length || 4;
                  const completedSessions = Math.floor(Math.random() * (totalSessions + 1)); // Just for demo
                  const completionPercentage = (completedSessions / totalSessions) * 100;
                  
                  const formatShortDate = (date: Date) => {
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  };
                  
                  return (
                    <Card key={plan.id} className="hover:shadow-sm transition-shadow bg-gray-50 border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-800">{plan.title}</h3>
                              {plan.aiGenerated && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 flex items-center">
                                  <SparklesIcon className="h-3 w-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 mt-1">
                              {formatShortDate(startDate)} - {formatShortDate(endDate)}
                            </p>
                          </div>
                          <Badge className={completedSessions === totalSessions 
                            ? "bg-teal-100 text-teal-800" 
                            : "bg-blue-100 text-blue-800"}>
                            {completedSessions === totalSessions 
                              ? "Completed" 
                              : `${completedSessions}/${totalSessions} Sessions`}
                          </Badge>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 my-2">
                          <div 
                            className="bg-teal-400 h-1.5 rounded-full" 
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        
                        <div className="flex mt-3 space-x-2">
                          <Link href={`/practice/${plan.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">View Plan</Button>
                          </Link>
                          <Link href="/practice/log" className="flex-1">
                            <Button size="sm" className="w-full bg-blue-500 text-white hover:bg-blue-600">Log Session</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                <div className="text-center space-x-2">
                  <Link href="/practice/plan">
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                      View All Plans
                    </Button>
                  </Link>
                  <Link href="/practice/plan">
                    <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New Plan
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <Card className="bg-gray-50 border border-gray-200">
              <CardContent className="py-6 text-center">
                <p className="text-gray-700 mb-3">
                  No practice plans created yet.
                </p>
                <Link href="/practice/plan">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600">
                    Create Your First Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Recent Practice Logs */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
            Recent Activity
          </h2>
          
          {practiceLogs.length > 0 ? (
            <div className="space-y-4">
              {practiceLogs.slice(0, expandedLogs ? practiceLogs.length : 5).map((log, index) => {
                const logDate = log.date.toDate();
                const isToday = new Date().toDateString() === logDate.toDateString();
                const isYesterday = new Date(Date.now() - 86400000).toDateString() === logDate.toDateString();
                const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : formatDate(log.date);
                
                // Achievement badges
                let achievementBadge = null;
                if (index === 0 && stats.currentStreak >= 3) {
                  achievementBadge = (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      <FireIcon className="h-3 w-3 mr-1" /> {stats.currentStreak}-Day Streak
                    </Badge>
                  );
                } else if (index === 0 && log.duration >= 90) {
                  achievementBadge = (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <TrophyIcon className="h-3 w-3 mr-1" /> Epic Practice
                    </Badge>
                  );
                }
                
                return (
                  <Card key={log.id} className="overflow-hidden hover:shadow-sm transition-shadow bg-gray-50 border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg text-gray-800">{log.sessionTitle}</h3>
                            {achievementBadge}
                          </div>
                          <p className="text-sm text-gray-700 flex items-center gap-1">
                            <span>{dateLabel}</span>
                            <span className="mx-1">•</span>
                            <span>{log.duration} minutes</span>
                          </p>
                          {log.notes && <p className="text-sm mt-1 text-gray-700">{log.notes}</p>}
                        </div>
                        
                        {log.rating && (
                          <div className="flex items-center mt-2 md:mt-0">
                            <span className="text-sm font-medium mr-1 text-gray-700">Rating:</span>
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
                          </div>
                        )}
                      </div>
                      
                      {log.drills && log.drills.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {log.drills.map((drill: any, drillIndex: number) => (
                              <Badge key={drillIndex} variant="outline" className="bg-gray-50 text-gray-800 border-gray-300">
                                {drill.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              <div className="text-center mt-4">
                {expandedLogs && practiceLogs.length > 5 ? (
                  <Button 
                    variant="outline" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    onClick={() => setExpandedLogs(false)}
                  >
                    Show Fewer Logs
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 mr-2"
                      onClick={() => setExpandedLogs(true)}
                    >
                      View All Logs
                    </Button>
                    <Link href="/practice/page">
                      <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                        Go to Practice History
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Card className="bg-gray-50 border border-gray-200">
              <CardContent className="py-4">
                <p className="text-gray-700 text-center">
                  No activity recorded yet.
                  <Link href="/practice/log" className="text-blue-600 ml-1 hover:underline">
                    Log your first practice session
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Monthly Recap - Full width section */}
      <div className="mb-6 w-full px-4 lg:px-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
          <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
          Monthly Recap
        </h2>
        
        {latestRecap ? (
          <Card className="overflow-hidden bg-gray-50 border border-gray-200">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="bg-blue-50 p-6 flex flex-col justify-center items-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-1">
                    {monthNames[new Date(latestRecap.month).getMonth()]} Effort Score
                  </h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2 flex items-center">
                    {parseFloat(getAverageScore(latestRecap.effortScores)).toFixed(1)}
                    <span className="text-base ml-1">/5</span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <StarIcon
                        key={value}
                        className={`h-5 w-5 ${
                          value <= parseFloat(getAverageScore(latestRecap.effortScores))
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col">
                  <div className="mb-3">
                    <div className="text-sm text-gray-700 mb-1">Handicap Change</div>
                    <div className="flex items-center">
                      <span className="text-lg font-semibold mr-2 text-gray-800">
                        {latestRecap.handicapStartOfMonth.toFixed(1)} →{" "}
                        {latestRecap.handicapEndOfMonth.toFixed(1)}
                      </span>
                      {latestRecap.handicapStartOfMonth > latestRecap.handicapEndOfMonth ? (
                        <Badge className="bg-teal-100 text-teal-800 flex items-center">
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                          {(latestRecap.handicapStartOfMonth - latestRecap.handicapEndOfMonth).toFixed(1)}
                        </Badge>
                      ) : latestRecap.handicapStartOfMonth < latestRecap.handicapEndOfMonth ? (
                        <Badge className="bg-red-100 text-red-800 flex items-center">
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                          {(latestRecap.handicapEndOfMonth - latestRecap.handicapStartOfMonth).toFixed(1)}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          No change
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-700 mb-1">Practice Summary</div>
                    <p className="text-sm text-gray-800">
                      {stats.sessionsThisMonth} sessions logged ({formatTime(stats.totalTimeThisMonth)})
                    </p>
                    
                    {latestRecap.notes && (
                      <p className="text-sm text-gray-700 mt-3 italic line-clamp-2">
                        "{latestRecap.notes}"
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 flex flex-col justify-center items-start">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Top Focus Areas
                  </h3>
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Putting</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div
                            key={value}
                            className={`h-2 w-2 rounded-full mx-0.5 ${
                              value <= (latestRecap.effortScores.putting || 0) ? "bg-blue-400" : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Driving</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div
                            key={value}
                            className={`h-2 w-2 rounded-full mx-0.5 ${
                              value <= (latestRecap.effortScores.driving || 0) ? "bg-blue-400" : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Short Game</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div
                            key={value}
                            className={`h-2 w-2 rounded-full mx-0.5 ${
                              value <= (latestRecap.effortScores.shortGame || 0) ? "bg-blue-400" : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 border-t border-gray-100 p-4 flex justify-center">
              <Link href={`/recap/${latestRecap.month}`}>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">View Full Recap</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card className="bg-gray-50 border border-gray-200">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-gray-700 mb-3">
                  Your {currentMonth} recap will be generated at the end of the month.
                </p>
                <p className="text-sm text-gray-600">
                  Log your practice sessions regularly to get the most accurate insights!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Calculate average score across all categories
function getAverageScore(effortScores: any) {
  if (!effortScores) return "0";
  
  const values = Object.values(effortScores) as number[];
  const sum = values.reduce((acc: number, val: number) => acc + val, 0);
  return (sum / values.length).toFixed(1);
} 