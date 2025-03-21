"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { addGoal } from "@/app/firebase/db";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewGoal() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [category, setCategory] = useState("handicap");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }

    if (!title || !targetValue || !category) {
      toast.error("Please fill out all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Convert string values to numbers where appropriate
      const goalData = {
        title,
        description: description || undefined,
        targetDate: targetDate ? Timestamp.fromDate(new Date(targetDate)) : Timestamp.now(),
        currentValue: currentValue ? parseFloat(currentValue) : 0,
        targetValue: parseFloat(targetValue),
        category,
        createdAt: Timestamp.now()
      };

      await addGoal(currentUser.uid, goalData);
      toast.success("Goal created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create goal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Goal</h1>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>
              Set a clear, measurable goal to track your golf improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Goal Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Reduce handicap to single digits"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about your goal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  >
                    <option value="handicap">Handicap</option>
                    <option value="scoring">Scoring Average</option>
                    <option value="putting">Putting</option>
                    <option value="driving">Driving Distance</option>
                    <option value="fairways">Fairways Hit</option>
                    <option value="greens">Greens in Regulation</option>
                    <option value="practice">Practice Time</option>
                    <option value="tournament">Tournament</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetDate" className="text-sm font-medium">
                    Target Date
                  </label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="currentValue" className="text-sm font-medium">
                    {category === "handicap" ? "Current Handicap" : "Current Value"}
                  </label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.1"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder={
                      category === "handicap" ? "e.g., 15.2" :
                      category === "scoring" ? "e.g., 85" :
                      category === "putting" ? "e.g., 33" :
                      category === "driving" ? "e.g., 240" :
                      category === "fairways" ? "e.g., 50" :
                      category === "greens" ? "e.g., 40" :
                      category === "practice" ? "e.g., 5" :
                      "Current value"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetValue" className="text-sm font-medium">
                    {category === "handicap" ? "Target Handicap" : "Target Value"} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="targetValue"
                    type="number"
                    step="0.1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder={
                      category === "handicap" ? "e.g., 9.9" :
                      category === "scoring" ? "e.g., 79" :
                      category === "putting" ? "e.g., 28" :
                      category === "driving" ? "e.g., 270" :
                      category === "fairways" ? "e.g., 70" :
                      category === "greens" ? "e.g., 60" :
                      category === "practice" ? "e.g., 10" :
                      "Target value"
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white hover:bg-blue-600"
                >
                  {isLoading ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-gray-500">
              Set realistic goals that are challenging yet achievable
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 