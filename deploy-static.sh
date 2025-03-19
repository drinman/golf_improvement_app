#!/bin/bash

# Exit on error
set -e

echo "🔄 Creating public API directory..."
mkdir -p public/api/openai

echo "🔄 Building Next.js application as static site..."
npm run build

echo "🚀 Deploying static site to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "Your app should be available at: https://golf-improvement-app.web.app"