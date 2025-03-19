import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyRecaps } from "@/app/api/functions/generateMonthlyRecaps";

export async function POST(request: NextRequest) {
  try {
    // Check for API key authorization
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.ADMIN_API_KEY;
    
    if (!apiKey || !authHeader || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== apiKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Generate recaps
    const result = await generateMonthlyRecaps();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in generate-recaps API route:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
} 