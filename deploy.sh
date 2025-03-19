#!/bin/bash

# Exit on error
set -e

echo "🔄 Building Next.js application for functions..."
npm run build:functions

echo "📦 Installing dependencies in functions directory..."
cd functions
npm install

# Fix potential memory issues with Firebase deployment
export NODE_OPTIONS="--max-old-space-size=4096"

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting,functions:nextApp

echo "✅ Deployment complete!"
echo "Your app should be available at: https://golf-improvement-app.web.app"