# Golf Improvement App

## Deployment Options

### Option 1: Vercel Deployment (Recommended)
This option provides full functionality including AI features and API routes.

```bash
# To deploy to Vercel with full functionality
./deploy-vercel.sh
```

### Option 2: Firebase Static Hosting
This option is faster but has limited functionality. Some features requiring server-side processing won't work.

```bash
# To deploy to Firebase as a static site
./deploy-static.sh
```

## Development

To run the app locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Then visit http://localhost:3000 in your browser.

## Features

- Personalized practice plans using AI
- Track practice sessions and progression
- Monthly recaps and performance insights
- User authentication with Firebase
- Mobile-responsive design

## Environment Variables

The app requires the following environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=golf-improvement-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Architecture

- Next.js front-end
- Firebase for authentication and database
- OpenAI for AI-powered practice plans and insights
- Tailwind CSS for styling