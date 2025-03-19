import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./firebase/auth-context";
import Navigation from "./components/navigation";
import { Toaster } from "@/components/ui/sonner";
import TutorialController from "./components/tutorial/tutorial-controller";
import FeedbackButton from "./components/feedback-button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UpSwing - Improve Your Golf Game",
  description: "Improve your golf game with personalized practice plans and progress tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navigation />
            <main className="flex-grow pt-16 px-4 md:px-6">
              {children}
            </main>
            <footer className="py-4 text-center text-sm text-gray-500 border-t">
              &copy; {new Date().getFullYear()} UpSwing. All rights reserved.
            </footer>
            <FeedbackButton />
          </div>
          <TutorialController />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
