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

// Define the shape of our auth context
type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
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
    try {
      console.log("Attempting to sign in with:", { email }); // Don't log password
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Firebase signIn error:", error.code, error.message);
      throw error;
    }
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
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      }, (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
      return () => {};
    }
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
      {children}
    </AuthContext.Provider>
  );
}; 