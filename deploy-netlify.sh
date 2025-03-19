#!/bin/bash

# Exit on error
set -e

echo "🔄 Installing Netlify CLI if not already installed..."
npm install -g netlify-cli

echo "🔄 Building application..."
npm run build

echo "🔄 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment complete!"
echo "Your app is now deployed to Netlify with server functions via Netlify Functions."
echo "Make sure to set up your environment variables in the Netlify dashboard."