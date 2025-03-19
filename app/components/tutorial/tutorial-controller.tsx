"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/app/firebase/auth-context';
import { getUserProfile } from '@/app/firebase/db';
import TutorialModal from './tutorial-modal';

interface TutorialContextType {
  showTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};

export default function TutorialController() {
  const { currentUser } = useAuth();
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        
        // Show tutorial if user is new or hasn't completed the tutorial
        if (!profile) {
          setShowTutorialModal(true);
        } else if (typeof profile === 'object' && 'hasCompletedTutorial' in profile) {
          setShowTutorialModal(profile.hasCompletedTutorial === false);
        } else {
          // If the profile exists but doesn't have the hasCompletedTutorial property
          // we'll show the tutorial by default
          setShowTutorialModal(true);
        }
      } catch (error) {
        console.error("Error checking tutorial status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [currentUser]);

  const handleTutorialComplete = () => {
    setShowTutorialModal(false);
  };

  const showTutorial = () => {
    setShowTutorialModal(true);
  };

  const contextValue = {
    showTutorial
  };

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <TutorialContext.Provider value={contextValue}>
      {showTutorialModal && (
        <TutorialModal 
          userId={currentUser.uid} 
          onComplete={handleTutorialComplete} 
        />
      )}
    </TutorialContext.Provider>
  );
} 