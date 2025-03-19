"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";

// Pages that don't require authentication
const publicPages = ["/", "/auth/signin", "/auth/signup"];

// Redirect to dashboard if authenticated and on landing or auth page
export function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until auth state is determined
    if (loading) return;

    if (currentUser) {
      // If user is authenticated and on a public page, redirect to dashboard
      if (publicPages.includes(pathname)) {
        router.push("/dashboard");
      }
    } else {
      // If user is not authenticated and not on a public page, redirect to sign in
      if (!publicPages.includes(pathname)) {
        router.push("/auth/signin");
      }
    }
  }, [currentUser, loading, pathname, router]);

  // Show children only when not in a state of redirection
  // This prevents flash of content before redirect
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser && publicPages.includes(pathname)) {
    // Don't render content that will soon be redirected
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !publicPages.includes(pathname)) {
    // Don't render content that will soon be redirected
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 