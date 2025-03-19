#!/bin/bash

# Exit on error
set -e

echo "🔄 Installing Vercel CLI if not already installed..."
npm install -g vercel

echo "🔄 Make sure vercel.json exists and has the right rewrite rules..."
cat vercel.json

echo "🔄 Adding build cache cleaning step..."
rm -rf .next
rm -rf .vercel/output

echo "🔄 Deploying app to Vercel with proper routing configuration..."
vercel --prod

echo "✅ Deployment complete!"
echo "Your app is now deployed to Vercel with full server-side capabilities."
echo "The OpenAI API routes should work properly in this environment."
echo "If you're still seeing 404 errors, please check that all environment variables are set in the Vercel dashboard."