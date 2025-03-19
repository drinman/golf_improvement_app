"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../firebase/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationCenter from "./notification-center";

export default function Navigation() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isAdmin = currentUser?.email?.endsWith("@golfimprover.app") || false;

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-10 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-blue-500">UpSwing</span>
        </Link>
      </div>

      {currentUser ? (
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard') ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
              Dashboard
            </Link>
            <Link href="/practice/plan" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname.startsWith('/practice') ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
              Practice Planner
            </Link>
            <Link href="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile') ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
              Profile
            </Link>
            <Link href="/recap" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/recap') ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
              Monthly Recap
            </Link>
            {isAdmin && (
              <Link href="/admin/feedback" className={`px-3 py-2 rounded-md text-sm font-medium ${pathname.startsWith('/admin') ? 'bg-yellow-100 text-yellow-800' : 'text-yellow-600 hover:bg-yellow-50'}`}>
                Admin
              </Link>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Link href="/auth/signin">
            <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="default" size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
              Sign Up
            </Button>
          </Link>
        </div>
      )}

      {/* Mobile menu, show/hide based on menu state */}
      {showMenu && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/dashboard"
              className="text-gray-700 hover:bg-blue-50 hover:text-blue-800 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/practice/plan"
              className="text-gray-700 hover:bg-blue-50 hover:text-blue-800 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
            >
              Practice Planner
            </Link>
            <Link 
              href="/profile"
              className="text-gray-700 hover:bg-blue-50 hover:text-blue-800 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
            >
              Profile
            </Link>
            <Link 
              href="/recap"
              className="text-gray-700 hover:bg-blue-50 hover:text-blue-800 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
            >
              Monthly Recap
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {/* ... user info and profile link ... */}
          </div>
        </div>
      )}
    </nav>
  );
} 