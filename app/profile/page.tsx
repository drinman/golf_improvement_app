"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { getUserProfile, updateUserProfile } from "@/app/firebase/db";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ResetTutorialButton from "@/app/components/tutorial/reset-tutorial-button";

// Define the user profile type
interface UserProfile {
  id: string;
  name?: string;
  email: string;
  handicap?: number;
  createdAt: any;
  [key: string]: any; // Allow for other properties
}

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) {
        router.push("/auth/signin");
        return;
      }

      try {
        console.log("Fetching profile for user:", currentUser.uid);
        const profile = await getUserProfile(currentUser.uid);
        console.log("Profile data received:", profile);
        
        if (profile && typeof profile === 'object') {
          // Check if profile has name property
          if ('name' in profile && profile.name && typeof profile.name === 'string') {
            setName(profile.name);
            console.log("Name set to:", profile.name);
          }
          
          // Check if profile has handicap property
          if ('handicap' in profile && 
              profile.handicap !== undefined && 
              profile.handicap !== null &&
              typeof profile.handicap === 'number') {
            setHandicap(profile.handicap.toString());
            console.log("Handicap set to:", profile.handicap);
          }
        } else {
          console.log("No profile data found or invalid format - creating initial profile");
          // Create an initial empty profile
          await updateUserProfile(currentUser.uid, {
            email: currentUser.email || '',
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push("/auth/signin");
      return;
    }

    setIsSaving(true);

    try {
      const handicapValue = handicap ? parseFloat(handicap) : undefined;
      
      await updateUserProfile(currentUser.uid, {
        name: name || undefined,
        handicap: handicapValue
      });
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return currentUser?.email?.substring(0, 2).toUpperCase() || "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <div className="text-center">
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 bg-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Profile</h1>

        <Card className="mb-8 bg-gray-50 border border-gray-200">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src="" alt={name || "User"} />
              <AvatarFallback className="text-xl bg-blue-500 text-white">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-gray-800">{name || "Golfer"}</CardTitle>
            <CardDescription>{currentUser?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="handicap" className="text-sm font-medium text-gray-700">
                  Current Handicap
                </label>
                <Input
                  id="handicap"
                  type="number"
                  step="0.1"
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  placeholder="e.g., 15.2"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">Account Settings</CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-800">Email Address</h3>
              <p className="text-gray-700">{currentUser?.email}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-800">Data & Privacy</h3>
              <p className="text-gray-700">
                Manage your data and privacy settings
              </p>
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  Download Your Data
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-800">Tutorial</h3>
              <p className="text-gray-700">
                Review the app tutorial again to learn about all features
              </p>
              <div className="flex space-x-2 pt-2">
                <ResetTutorialButton />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 