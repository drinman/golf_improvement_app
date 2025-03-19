import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Elevate Your Golf Game</span>
          <span className="block text-blue-500">With Data-Driven Practice</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Structured goal tracking, AI-generated practice routines, and progress monitoring – all designed to help you reach your golf potential.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Features</h2>
          <p className="mt-2 text-gray-600">Tools designed to accelerate your improvement</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Goal Tracking</CardTitle>
              <CardDescription>Set, track, and achieve your golf targets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Define short and long-term goals. Monitor progress with visual indicators and timelines to stay motivated.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Practice Plans</CardTitle>
              <CardDescription>Personalized routines that target your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our AI analyzes your goals, handicap, and areas for improvement to generate structured practice schedules.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Logging</CardTitle>
              <CardDescription>Track every practice session</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Log your practices, rate effectiveness, take notes, and view trends to see what's working.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-gray-600">Simple process, powerful results</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <ol className="relative border-l border-gray-200 ml-4">
            <li className="mb-10 ml-6">
              <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full -left-4 ring-4 ring-white">
                1
              </span>
              <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">Set Your Goals</h3>
              <p className="mb-4 text-base text-gray-600">
                Define what you want to achieve – whether it's lowering your handicap, qualifying for a tournament, or mastering specific skills.
              </p>
            </li>
            <li className="mb-10 ml-6">
              <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full -left-4 ring-4 ring-white">
                2
              </span>
              <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">Generate Practice Plans</h3>
              <p className="mb-4 text-base text-gray-600">
                Our AI creates personalized practice routines based on your goals, available time, and areas needing improvement.
              </p>
            </li>
            <li className="ml-6">
              <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full -left-4 ring-4 ring-white">
                3
              </span>
              <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">Track and Improve</h3>
              <p className="mb-4 text-base text-gray-600">
                Log your practice sessions, monitor progress, and adjust your approach based on data-driven insights.
              </p>
            </li>
          </ol>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 bg-blue-50 rounded-xl p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Game?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of golfers who are using our platform to structure their improvement journey.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600">
            Start Your Free Trial
          </Button>
        </Link>
      </div>
    </div>
  );
}
