"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateUserProfile } from '@/app/firebase/db';
import { tutorialSteps } from '../tutorial-data';
import Image from 'next/image';

interface TutorialModalProps {
  userId: string;
  onComplete: () => void;
}

export default function TutorialModal({ userId, onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [imagesExist, setImagesExist] = useState<Record<string, boolean>>({});

  const step = tutorialSteps[currentStep];

  useEffect(() => {
    // Check if images exist
    if (step.image) {
      const img = new window.Image();
      img.onload = () => {
        setImagesExist(prev => ({ ...prev, [step.image!]: true }));
      };
      img.onerror = () => {
        setImagesExist(prev => ({ ...prev, [step.image!]: false }));
      };
      img.src = step.image;
    }
  }, [currentStep, step.image]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await updateUserProfile(userId, {
        hasCompletedTutorial: true
      });
      onComplete();
    } catch (error) {
      console.error("Error completing tutorial:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      await updateUserProfile(userId, {
        hasCompletedTutorial: true
      });
      onComplete();
    } catch (error) {
      console.error("Error skipping tutorial:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-500">{step.title}</CardTitle>
          <div className="flex justify-center mt-2 space-x-1">
            {tutorialSteps.map((_, index) => (
              <div 
                key={index} 
                className={`h-2 w-12 rounded-full ${index === currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="text-center px-6 py-8">
          {step.image && imagesExist[step.image] && (
            <div className="mb-6 flex justify-center">
              <div className="relative h-48 w-full max-w-xs">
                <Image 
                  src={step.image} 
                  alt={step.title}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded"
                />
              </div>
            </div>
          )}
          {!step.image || !imagesExist[step.image] ? (
            <div className="mb-6 flex justify-center">
              <div className="h-48 w-full max-w-xs bg-gray-100 rounded flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏌️‍♂️</div>
                  <div>{step.title}</div>
                </div>
              </div>
            </div>
          ) : null}
          <p className="text-base text-gray-700">{step.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isFirstStep ? (
            <Button 
              variant="outline" 
              onClick={handleSkip}
              disabled={isCompleting}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Skip Tutorial
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={isCompleting}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Back
            </Button>
          )}
          <Button 
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleNext}
            disabled={isCompleting}
          >
            {isCompleting ? "Please wait..." : isLastStep ? "Get Started" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 