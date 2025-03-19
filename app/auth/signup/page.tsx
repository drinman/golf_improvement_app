"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/firebase/auth-context";
import { createUserProfile } from "@/app/firebase/db";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const userCredential = await signUp(email, password);
      const user = userCredential.user;
      
      // Prepare profile data with proper validation
      const profileData = {
        email: user.email || '',
        name: name.trim() || undefined,
        handicap: handicap && handicap.trim() !== "" ? parseFloat(handicap) : undefined,
        createdAt: Timestamp.now()
      };

      console.log("Creating user profile with data:", profileData);
      
      // Create user profile
      await createUserProfile(user.uid, profileData);
      
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;
      
      // Prepare profile data with proper validation
      const profileData = {
        email: user.email || '',
        name: user.displayName?.trim() || undefined,
        handicap: handicap && handicap.trim() !== "" ? parseFloat(handicap) : undefined,
        createdAt: Timestamp.now()
      };

      console.log("Creating Google user profile with data:", profileData);
      
      // Create user profile
      await createUserProfile(user.uid, profileData);
      
      toast.success("Signed up with Google successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google signup error:", error);
      toast.error(error.message || "Failed to sign up with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithApple();
      const user = userCredential.user;
      
      // Prepare profile data with proper validation
      const profileData = {
        email: user.email || '',
        name: user.displayName?.trim() || undefined,
        handicap: handicap && handicap.trim() !== "" ? parseFloat(handicap) : undefined,
        createdAt: Timestamp.now()
      };

      console.log("Creating Apple user profile with data:", profileData);
      
      // Create user profile
      await createUserProfile(user.uid, profileData);
      
      toast.success("Signed up with Apple successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Apple signup error:", error);
      toast.error(error.message || "Failed to sign up with Apple");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-7rem)] bg-white">
      <Card className="w-full max-w-md bg-gray-50 border border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-800">Create an Account</CardTitle>
          <CardDescription className="text-center text-gray-700">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name (optional)
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="handicap" className="text-sm font-medium text-gray-700">
                Current Handicap (optional)
              </label>
              <Input
                id="handicap"
                type="number"
                step="0.1"
                placeholder="15.2"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-600">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleAppleSignUp}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Apple
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-700">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 