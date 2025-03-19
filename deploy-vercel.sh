#!/bin/bash

# Exit on error
set -e

echo "🔄 Installing Vercel CLI if not already installed..."
npm install -g vercel

echo "🔄 Deploying app to Vercel (includes server functionality)..."
vercel --prod

echo "✅ Deployment complete!"
echo "Your app is now deployed to Vercel with full server-side capabilities."
echo "The OpenAI API routes will work properly in this environment."