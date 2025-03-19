"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";

// Pages that don't require authentication
const publicPages = ["/", "/auth/signin", "/auth/signup"];

// Simplified route guard for deployment
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
      if (!publicPages.includes(pathname) && 
          !pathname.includes('_next') && 
          !pathname.includes('api')) {
        router.push("/auth/signin");
      }
    }
  }, [currentUser, loading, pathname, router]);

  // Always render children, let the redirects handle the navigation
  return <>{children}</>;
} 