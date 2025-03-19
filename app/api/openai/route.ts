import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Remove any special configuration for now to ensure compatibility

// Initialize OpenAI - use environment variable
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { prompt, type } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }
    
    // Add formatting instructions to ensure valid JSON
    const enhancedPrompt = `${prompt}

IMPORTANT: Your response MUST be a valid JSON object with properly escaped quotation marks and no trailing commas. 
Do not include markdown formatting, code blocks, or explanatory text outside the JSON.
Double-check that all strings are properly terminated and that there are no syntax errors.`;
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Using a more reliable model for JSON
      messages: [
        { 
          role: "system", 
          content: "You are an expert golf coach who returns ONLY valid, well-formed JSON responses. Never include unescaped quotes or newlines within JSON strings." 
        },
        { role: "user", content: enhancedPrompt }
      ],
      temperature: 0.5, // Lower temperature for more consistent formatting
      max_tokens: 2000, // Increased token limit for larger responses
      response_format: { type: "json_object" }, // Request JSON format explicitly
    });

    // Return response
    return NextResponse.json({
      response: completion.choices[0].message.content,
      type
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return NextResponse.json(
      { error: "Failed to generate content: " + (error as Error).message },
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