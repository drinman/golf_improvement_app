"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/firebase/auth-context";
import { doc, collection, query, where, orderBy, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/firebase/config";
import { XMarkIcon, BellIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  type: string;
  link?: string;
};

export default function NotificationCenter() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, "users", currentUser.uid, "notifications");
    const q = query(
      notificationsRef,
      orderBy("timestamp", "desc")
    );

    // Set up real-time listener for notifications
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList: Notification[] = [];
      let newUnreadCount = 0;

      snapshot.forEach((doc) => {
        const notification = {
          id: doc.id,
          ...doc.data()
        } as Notification;
        
        notificationList.push(notification);
        
        if (!notification.read) {
          newUnreadCount++;
        }
      });

      setNotifications(notificationList);
      setUnreadCount(newUnreadCount);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if it's not already
    if (!notification.read) {
      try {
        const notificationRef = doc(
          db, 
          "users", 
          currentUser!.uid, 
          "notifications", 
          notification.id
        );
        
        await updateDoc(notificationRef, {
          read: true
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to the specified link if it exists
    if (notification.link) {
      router.push(notification.link);
    }
    
    // Close notification panel
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(
          db, 
          "users", 
          currentUser.uid, 
          "notifications", 
          notification.id
        );
        
        return updateDoc(notificationRef, {
          read: true
        });
      });

      await Promise.all(updatePromises);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate();
    return format(date, "MMM d, h:mm a");
  };

  return (
    <div className="relative">
      {/* Bell icon with unread count */}
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.read ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">New</span>
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {formatNotificationTime(notification.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 