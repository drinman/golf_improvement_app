/**
 * Service for handling OpenAI integrations
 */
import OpenAI from 'openai';

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

export class OpenAIService {
  /**
   * Generate a practice plan based on handicap, sessions per week, and improvement areas
   */
  public static async generatePracticePlan(
    handicap: number,
    sessionsPerWeek: number,
    description: string,
    timeAvailability: string,
    focusArea: string = "Mixed", // Add focus area parameter with default
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
9. Include a motivational goal for each practice day

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

IMPORTANT: Your response must be valid JSON with no markdown formatting, code blocks, or explanatory text outside the JSON. Ensure all durations respect the time availability of each day. Break down drill descriptions into clear instructional steps that are easy to follow. The key thought for each drill should be a short, focused reminder that helps the golfer maintain proper technique. If the golfer has mentioned any injuries or limitations, please ensure the drills are safe and appropriate for their condition.`;

      // Call the API route instead of OpenAI directly
      return this.callOpenAI(prompt, AIContentType.PRACTICE_PLAN);
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
    const effortBreakdown = Object.entries(effortScores)
      .map(([category, score]) => `${this.formatCategory(category)} (${score})`)
      .join(', ');

    const prompt = `This month the golfer:
    - Completed ${completedSessions} of ${scheduledSessions} scheduled practice sessions.
    - Rated their effort: ${effortBreakdown}.
    - Handicap changed from ${startHandicap} → ${endHandicap}.
    
    Provide a brief encouraging monthly summary highlighting their successes and suggesting a focus area for next month. 
    
    Respond with a JSON object that has this structure (and nothing else):
    {
      "summary": "Overall summary of the month",
      "highlights": ["Key achievement 1", "Key achievement 2"],
      "focus_suggestion": "Suggested focus area for next month",
      "encouragement": "Personalized encouragement message"
    }
    
    Important: Your entire response must be valid JSON that can be parsed with JSON.parse(). Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`;

    return this.callOpenAI(prompt, AIContentType.MONTHLY_RECAP);
  }

  /**
   * Generate practice log content based on minimal input
   */
  public static async generatePracticeLogContent(
    category: string,
    duration: number,
    rating: number
  ): Promise<AIServiceResponse> {
    const prompt = `Given the golfer did a ${duration}-minute ${category.toLowerCase()} practice session rated as ${rating} out of 5, generate a concise, structured session note describing the likely drills and session effectiveness briefly.
    
    Respond with a JSON object that has this structure (and nothing else):
    {
      "session_summary": "Brief overall summary",
      "drills_completed": ["Likely drill 1", "Likely drill 2"],
      "effectiveness": "Assessment of effectiveness based on rating",
      "suggestion": "Brief suggestion for next time"
    }
    
    Important: Your entire response must be valid JSON that can be parsed with JSON.parse(). Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`;

    return this.callOpenAI(prompt, AIContentType.PRACTICE_LOG);
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

  /**
   * Call OpenAI API - for static site generation, we now use the OpenAIClient directly
   * instead of going through the API route
   */
  private static async callOpenAI(prompt: string, type: AIContentType): Promise<AIServiceResponse> {
    try {
      // Import the OpenAIClient dynamically to avoid SSR issues
      const { OpenAIClient } = await import('./openai-client');
      
      // Call the appropriate method based on the type
      let result: AIServiceResponse;
      
      switch (type) {
        case AIContentType.PRACTICE_PLAN:
          // For practice plans, we need to extract parameters from the prompt
          // This is just a fallback - normally these should be passed directly
          const handicapMatch = prompt.match(/Golfer's handicap: (\d+\.?\d*)/);
          const sessionsMatch = prompt.match(/Sessions per week: (\d+)/);
          const focusMatch = prompt.match(/Focus area: ([^-\n]+)/);
          const descriptionMatch = prompt.match(/Description of needs[^:]*: ([^-\n]+)/);
          const timeMatch = prompt.match(/Time availability[^:]*: ([^-\n]+)/);
          
          result = await OpenAIClient.generatePracticePlan(
            handicapMatch ? parseFloat(handicapMatch[1]) : 18,
            sessionsMatch ? parseInt(sessionsMatch[1]) : 3,
            descriptionMatch ? descriptionMatch[1] : "General improvement",
            timeMatch ? timeMatch[1] : "Weekdays after work, weekends mornings",
            focusMatch ? focusMatch[1] : "Mixed"
          );
          break;
          
        case AIContentType.MONTHLY_RECAP:
          // For recaps, we use a simpler approach with default values
          result = await OpenAIClient.generateMonthlyRecap(5, 8, { driving: 3, putting: 4, shortGame: 3 }, 18, 17.5);
          break;
          
        default:
          // For other types, return a static response
          return {
            response: '{"error": "This feature is not available in static mode"}',
            error: 'Static generation limitations'
          };
      }
      
      return result;
    } catch (error) {
      console.error('API error:', error);
      return {
        response: '',
        error: `API error: ${(error as Error).message}`
      };
    }
  }
} 