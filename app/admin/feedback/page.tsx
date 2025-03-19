"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/firebase/auth-context";
import { getFeedback } from "@/app/firebase/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function FeedbackAdmin() {
  const { currentUser } = useAuth();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const allFeedback = await getFeedback();
        setFeedback(allFeedback);
      } catch (error) {
        console.error("Error loading feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, []);

  // Filter feedback based on active tab
  const filteredFeedback = activeTab === "all" 
    ? feedback 
    : feedback.filter(item => item.status === activeTab);

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "bug":
        return "bg-red-100 text-red-800";
      case "feature":
        return "bg-purple-100 text-purple-800";
      case "suggestion":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFeedbackStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-green-100 text-green-800";
      case "inProgress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "wontFix":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "MMM d, yyyy h:mm a");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Feedback Dashboard</h1>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({feedback.length})</TabsTrigger>
            <TabsTrigger value="new">
              New ({feedback.filter(item => item.status === "new").length})
            </TabsTrigger>
            <TabsTrigger value="inProgress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <div className="space-y-4">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((item) => (
                <FeedbackCard 
                  key={item.id} 
                  item={item} 
                  typeColor={getFeedbackTypeColor(item.type)} 
                  statusColor={getFeedbackStatusColor(item.status)}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No feedback found
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <div className="space-y-4">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((item) => (
                <FeedbackCard 
                  key={item.id} 
                  item={item} 
                  typeColor={getFeedbackTypeColor(item.type)} 
                  statusColor={getFeedbackStatusColor(item.status)}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No new feedback found
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="inProgress" className="mt-0">
          <div className="space-y-4">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((item) => (
                <FeedbackCard 
                  key={item.id} 
                  item={item} 
                  typeColor={getFeedbackTypeColor(item.type)} 
                  statusColor={getFeedbackStatusColor(item.status)}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No in-progress feedback found
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <div className="space-y-4">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((item) => (
                <FeedbackCard 
                  key={item.id} 
                  item={item} 
                  typeColor={getFeedbackTypeColor(item.type)} 
                  statusColor={getFeedbackStatusColor(item.status)}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No completed feedback found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Feedback Card Component
function FeedbackCard({ item, typeColor, statusColor, formatDate }: any) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="py-3 px-4 bg-gray-50 border-b flex justify-between items-start flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeColor}>{item.type}</Badge>
            <Badge className={statusColor}>{item.status || "new"}</Badge>
            <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
          </div>
          <CardTitle className="mt-2 text-base">{item.userEmail || "Anonymous"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="whitespace-pre-wrap">{item.message}</div>
        
        {item.deviceInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{item.deviceInfo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}