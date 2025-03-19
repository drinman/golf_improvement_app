"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircleIcon } from "lucide-react";
import { addFeedback } from "@/app/firebase/db";
import { useAuth } from "@/app/firebase/auth-context";
import { toast } from "sonner";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await addFeedback({
        type: feedbackType,
        message,
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        createdAt: new Date(),
        status: "new"
      });
      
      toast.success("Thank you for your feedback!");
      setMessage("");
      setOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant="outline" 
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-md rounded-full h-12 w-12 p-0 bg-blue-500 hover:bg-blue-600 border-0"
      >
        <MessageCircleIcon className="h-6 w-6 text-white" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <select
                id="feedback-type"
                className="w-full p-2 border rounded-md"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option value="suggestion">Suggestion</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Feedback</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Your Feedback</Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what you think..."
                className="min-h-[100px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}