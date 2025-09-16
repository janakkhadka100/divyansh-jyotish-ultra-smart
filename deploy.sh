#!/bin/bash

echo "🚀 Deploying to Vercel..."

# Check if logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

# Deploy to Vercel
echo "📦 Building and deploying..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Your app is now live on Vercel!"