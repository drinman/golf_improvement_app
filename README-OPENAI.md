# OpenAI Integration for Golf Improvement App

This document provides instructions for setting up and using the OpenAI integration in the Golf Improvement App.

## Setup Instructions

1. **Get an OpenAI API Key**
   - Sign up for an account at [OpenAI](https://platform.openai.com/)
   - Create a new API key from your OpenAI dashboard

2. **Configure Environment Variables**
   - In the `.env.local` file, replace `your_openai_api_key_here` with your actual OpenAI API key:
     ```
     OPENAI_API_KEY=your_actual_key_here
     ```

## Features Implemented

### 1. AI Practice Plan Generator
- **Location**: `/practice/plan`
- **Purpose**: Generates personalized weekly practice plans based on:
  - User's handicap
  - Available practice sessions per week
  - Selected improvement areas
- **How it works**: 
  - User selects up to 3 areas for improvement
  - AI generates a structured practice plan with specific drills
  - Each drill includes duration, description, and goals

### Coming Soon

#### 2. Monthly Recap & Insights
- Will automatically analyze practice data and provide natural language summaries
- Highlights successes and suggests focus areas for next month

#### 3. Smart Practice Log Entry
- Will make logging practice sessions effortless 
- With minimal input, AI will suggest structured session descriptions and notes

## Technical Implementation

The integration uses:
- Next.js API routes for secure API key handling
- OpenAI's Chat Completions API with GPT-4 Turbo
- JSON-structured responses for consistent formatting

## Troubleshooting

If you encounter any issues:

1. **Check API Key**: Verify your OpenAI API key is correctly set in the `.env.local` file
2. **Check API Quota**: Ensure your OpenAI account has available credits/quota
3. **Network Issues**: Verify your application can make outbound API calls to OpenAI

## Security Notes

- **Never** commit your actual OpenAI API key to version control
- The `.env.local` file is excluded from Git by default
- API requests are processed server-side to keep your API key secure 