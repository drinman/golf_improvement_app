"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  UserCredential
} from "firebase/auth";
import { auth } from "./config";
import { getAnalytics } from "firebase/analytics";

// Define the shape of our auth context
type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  logout: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider component to wrap around our app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    const provider = new OAuthProvider("apple.com");
    return await signInWithPopup(auth, provider);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 