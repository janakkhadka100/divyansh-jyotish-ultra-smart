#!/usr/bin/env node

/**
 * Deploy to Vercel Script
 * Alternative deployment method
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel Deployment...\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('❌ Vercel CLI not found. Installing...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully');
  } catch (installError) {
    console.log('❌ Failed to install Vercel CLI');
    console.log('Please install manually: npm install -g vercel');
    process.exit(1);
  }
}

// Create .vercelignore file
const vercelIgnoreContent = `
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
out/
dist/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Test files
__tests__/
*.test.js
*.test.ts
*.spec.js
*.spec.ts

# Documentation
*.md
!README.md

# Scripts
scripts/
`;

fs.writeFileSync('.vercelignore', vercelIgnoreContent.trim());
console.log('✅ Created .vercelignore file');

// Create deployment script
const deployScript = `
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
`;

fs.writeFileSync('deploy.sh', deployScript.trim());
fs.chmodSync('deploy.sh', '755');
console.log('✅ Created deployment script');

// Create environment setup guide
const envGuide = `
# Environment Variables for Vercel

## Required Variables:
- OPENAI_API_KEY: Your OpenAI API key
- NEXTAUTH_SECRET: Random secret for NextAuth
- NEXTAUTH_URL: Your Vercel app URL

## Optional Variables:
- PROKERALA_API_KEY: ProKerala API key (for real astrological data)
- DATABASE_URL: PostgreSQL database URL
- JWT_SECRET: JWT signing secret

## Setup Instructions:
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add all required variables
5. Redeploy your project

## Local Testing:
Create .env.local file with:
OPENAI_API_KEY=your_key_here
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
`;

fs.writeFileSync('VERCEL_ENV_SETUP.md', envGuide.trim());
console.log('✅ Created environment setup guide');

console.log('\n📋 Deployment Instructions:');
console.log('1. Run: vercel login');
console.log('2. Run: vercel --prod');
console.log('3. Set environment variables in Vercel dashboard');
console.log('4. Redeploy if needed');

console.log('\n🌐 Alternative: Use Vercel Dashboard');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Click "New Project"');
console.log('3. Import from GitHub: janakkhadka100/divyansh-jyotish-ultra-smart');
console.log('4. Configure environment variables');
console.log('5. Deploy');

console.log('\n✅ All deployment files created successfully!');
console.log('📁 Files created:');
console.log('- .vercelignore');
console.log('- deploy.sh');
console.log('- VERCEL_ENV_SETUP.md');

