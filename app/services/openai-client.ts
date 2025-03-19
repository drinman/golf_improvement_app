/**
 * Direct OpenAI client for use with static site generation
 */
import OpenAI from 'openai';

// Initialize OpenAI directly (for use when API routes aren't available)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable browser usage
});

// Response type for AI service calls
export interface AIServiceResponse {
  response: string;
  error?: string;
  parsedData?: any; // Store the parsed JSON data if successful
}

// Types of AI content
export enum AIContentType {
  PRACTICE_PLAN = 'practice_plan',
  MONTHLY_RECAP = 'monthly_recap',
  PRACTICE_LOG = 'practice_log'
}

export class OpenAIClient {
  /**
   * Generate a practice plan based on handicap, sessions per week, and improvement areas
   */
  public static async generatePracticePlan(
    handicap: number,
    sessionsPerWeek: number,
    description: string,
    timeAvailability: string,
    focusArea: string = "Mixed",
    endDate?: string
  ): Promise<AIServiceResponse> {
    try {
      // Create a prompt that includes all the information
      let prompt = `Create a personalized golf practice plan with the following details:
- Golfer's handicap: ${handicap}
- Sessions per week: ${sessionsPerWeek}
- Focus area: ${focusArea}
- Description of needs and any injuries/limitations: ${description}
- Time availability and practice locations: ${timeAvailability}
${endDate ? `- Target end date: ${endDate}` : ''}

Create a detailed, structured practice plan following this format:
1. A title for the practice plan
2. User's goal based on their handicap
3. Key improvement areas extracted from their description (focus heavily on ${focusArea})
4. A brief overview paragraph with general advice for improving in ${focusArea}
5. ${sessionsPerWeek} practice sessions with specific drills tailored to the golfer's needs and focused on ${focusArea}
6. Each session should be on one of their available days, respecting their time constraints and practice locations
7. If the golfer has mentioned any injuries or physical limitations, ensure the plan accommodates these with appropriate modifications
8. Each drill should have clear step-by-step instructions
9. Include a motivational goal for each practice day`;

      // Call OpenAI directly
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { 
            role: "system", 
            content: "You are an expert golf coach who returns ONLY valid, well-formed JSON responses. Never include unescaped quotes or newlines within JSON strings." 
          },
          { 
            role: "user", 
            content: `${prompt}

The response must be a valid JSON object with this exact format:
{
  "title": "Weekly Golf Practice Plan: [DATE RANGE]",
  "userGoal": "Brief goal based on handicap",
  "improvementFocus": ["Area 1", "Area 2", "Area 3"],
  "overview": "Overall advice paragraph",
  "sessions": [
    {
      "day": "Day of week (e.g., Monday, March 17)",
      "focus": "Main focus for this session",
      "duration": "Total time (e.g., 45 mins)",
      "location": "Suggested practice location based on availability",
      "warmup": "Brief warmup description",
      "drills": [
        {
          "name": "Name of drill",
          "duration": "Time for this drill",
          "description": "Detailed step-by-step instructions for the drill. Write this as numbered steps or clear sentences that can be broken down into a list.",
          "goal": "What the golfer should aim to achieve",
          "keyThought": "A short, memorable cue or reminder to help the golfer focus on the most important aspect of this drill"
        }
      ]
    }
  ]
}

IMPORTANT: Your response must be valid JSON with no markdown formatting, code blocks, or explanatory text outside the JSON. Ensure all durations respect the time availability of each day.` 
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0].message.content || '';
      
      try {
        // Parse the JSON response
        const parsedData = JSON.parse(response);
        return {
          response,
          parsedData
        };
      } catch (error) {
        console.error('Error parsing response:', error);
        return {
          response,
          error: 'Failed to parse the response. Please try again.'
        };
      }
    } catch (error) {
      console.error('Practice plan generator error:', error);
      return {
        response: '',
        error: `Error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Generate a monthly recap based on practice data
   */
  public static async generateMonthlyRecap(
    completedSessions: number,
    scheduledSessions: number,
    effortScores: Record<string, number>,
    startHandicap: number,
    endHandicap: number
  ): Promise<AIServiceResponse> {
    try {
      const effortBreakdown = Object.entries(effortScores)
        .map(([category, score]) => `${this.formatCategory(category)} (${score})`)
        .join(', ');

      const prompt = `This month the golfer:
      - Completed ${completedSessions} of ${scheduledSessions} scheduled practice sessions.
      - Rated their effort: ${effortBreakdown}.
      - Handicap changed from ${startHandicap} → ${endHandicap}.
      
      Provide a brief encouraging monthly summary highlighting their successes and suggesting a focus area for next month.`;

      // Call OpenAI directly
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { 
            role: "system", 
            content: "You are an expert golf coach who returns ONLY valid, well-formed JSON responses. Never include unescaped quotes or newlines within JSON strings." 
          },
          { 
            role: "user", 
            content: `${prompt}
            
Respond with a JSON object that has this structure (and nothing else):
{
  "summary": "Overall summary of the month",
  "highlights": ["Key achievement 1", "Key achievement 2"],
  "focus_suggestion": "Suggested focus area for next month",
  "encouragement": "Personalized encouragement message"
}

Important: Your entire response must be valid JSON that can be parsed with JSON.parse(). Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0].message.content || '';
      
      try {
        // Parse the JSON response
        const parsedData = JSON.parse(response);
        return {
          response,
          parsedData
        };
      } catch (error) {
        console.error('Error parsing response:', error);
        return {
          response,
          error: 'Failed to parse the response. Please try again.'
        };
      }
    } catch (error) {
      console.error('Monthly recap generator error:', error);
      return {
        response: '',
        error: `Error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Format category name for better readability
   */
  private static formatCategory(category: string): string {
    // Convert camelCase to Proper Case with spaces
    return category
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }
}