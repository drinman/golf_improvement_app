"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/firebase/auth-context";
import { useState } from "react";
import { resetUserTutorial } from "@/app/firebase/db";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ResetTutorialButton() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [clearData, setClearData] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleReset = async () => {
    if (!currentUser) return;
    
    setIsResetting(true);
    try {
      await resetUserTutorial(currentUser.uid, clearData);
      setResetComplete(true);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        // Reload the page to show the tutorial
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Error resetting tutorial:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Reset Tutorial</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Tutorial</DialogTitle>
          <DialogDescription>
            This will reset the tutorial so you can go through it again.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="clear-data" 
            checked={clearData} 
            onCheckedChange={(checked) => setClearData(checked as boolean)} 
          />
          <Label htmlFor="clear-data" className="text-sm">
            Also reset my data (goals, practice logs, etc.)
          </Label>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReset} 
            disabled={isResetting || resetComplete}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            {isResetting ? "Resetting..." : resetComplete ? "Complete!" : "Reset Tutorial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 