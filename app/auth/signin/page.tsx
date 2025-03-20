"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/firebase/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Signing in with email:", email);
      // Trim email and password to remove any accidental whitespace
      const result = await signIn(email.trim(), password);
      console.log("Sign in successful");
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign in error details:", error.code, error.message);
      
      // More user-friendly error messages
      if (error.code === 'auth/invalid-credential') {
        toast.error("Invalid email or password. Please try again.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Invalid email format. Please check your email.");
      } else if (error.code === 'auth/user-disabled') {
        toast.error("This account has been disabled. Please contact support.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error("Invalid credentials. Please check your email and password.");
      } else {
        toast.error(error.message || "Failed to sign in");
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
      toast.success("Signed in with Apple successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Apple");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-7rem)] bg-white">
      <Card className="w-full max-w-md bg-gray-50 border border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-800">Sign In</CardTitle>
          <CardDescription className="text-center text-gray-700">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
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
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Apple
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-700">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 