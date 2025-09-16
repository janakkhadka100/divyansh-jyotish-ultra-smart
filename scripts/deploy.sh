#!/bin/bash

# Divyansh Jyotish - Deployment Script
# This script helps deploy the application to Vercel

echo "🚀 Starting Divyansh Jyotish Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel first:"
    vercel login
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building the application..."
pnpm build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your application is now live on Vercel!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up environment variables in Vercel dashboard"
    echo "2. Configure your database connection"
    echo "3. Set up OpenAI API key"
    echo "4. Configure Prokerala API key"
    echo "5. Test all features"
    echo ""
    echo "🔧 Environment variables needed:"
    echo "- DATABASE_URL"
    echo "- OPENAI_API_KEY"
    echo "- PROKERALA_API_KEY"
    echo "- NEXTAUTH_SECRET"
    echo "- NEXTAUTH_URL"
else
    echo "❌ Deployment failed. Please check the errors and try again."
    exit 1
fi



