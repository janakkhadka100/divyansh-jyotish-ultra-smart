#!/usr/bin/env node

/**
 * Vercel Deployment Script for Divyansh Jyotish
 * Automatically deploys to Vercel with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function createDeploymentConfig() {
  console.log('📝 Creating deployment configuration...');
  
  // Create .vercelignore
  const vercelIgnore = `
# Dependencies
node_modules/
.pnpm-store/

# Environment files
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
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# Nuxt.js build output
.nuxt

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

# Database
*.db
*.sqlite
*.sqlite3

# Prisma
prisma/migrations/

# Test files
tests/
__tests__/
*.test.js
*.test.ts
*.spec.js
*.spec.ts

# Documentation
*.md
docs/

# Scripts
scripts/
  `.trim();

  fs.writeFileSync('.vercelignore', vercelIgnore);
  console.log('✅ .vercelignore created');

  // Create vercel.json if it doesn't exist
  if (!checkFileExists('vercel.json')) {
    const vercelConfig = {
      "framework": "nextjs",
      "buildCommand": "npm run build",
      "devCommand": "npm run dev",
      "installCommand": "npm install",
      "outputDirectory": ".next",
      "functions": {
        "src/app/api/**/*.ts": {
          "maxDuration": 60
        }
      },
      "env": {
        "NODE_ENV": "production"
      },
      "build": {
        "env": {
          "NODE_ENV": "production"
        }
      },
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-XSS-Protection",
              "value": "1; mode=block"
            },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            }
          ]
        }
      ],
      "rewrites": [
        {
          "source": "/api/(.*)",
          "destination": "/api/$1"
        }
      ],
      "regions": ["bom1"]
    };

    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ vercel.json created');
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if package.json exists
  if (!checkFileExists('package.json')) {
    console.error('❌ package.json not found');
    process.exit(1);
  }
  
  // Check if vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed');
  } catch (error) {
    console.error('❌ Vercel CLI not found. Please install it first:');
    console.error('npm install -g vercel');
    process.exit(1);
  }
  
  // Check if git is initialized
  try {
    execSync('git status', { stdio: 'pipe' });
    console.log('✅ Git repository initialized');
  } catch (error) {
    console.log('⚠️  Git not initialized, initializing...');
    runCommand('git init', 'Initializing git repository');
    runCommand('git add .', 'Adding files to git');
    runCommand('git commit -m "Initial commit for Vercel deployment"', 'Creating initial commit');
  }
}

function deployToVercel() {
  console.log('🚀 Deploying to Vercel...');
  
  try {
    // Login to Vercel (if not already logged in)
    console.log('🔐 Checking Vercel authentication...');
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      console.log('✅ Already logged in to Vercel');
    } catch (error) {
      console.log('🔐 Please login to Vercel...');
      execSync('vercel login', { stdio: 'inherit' });
    }
    
    // Deploy to Vercel
    console.log('🚀 Deploying application...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('🎉 Deployment completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set environment variables in Vercel dashboard');
    console.log('2. Add your API keys:');
    console.log('   - OPENAI_API_KEY');
    console.log('   - PROKERALA_API_KEY');
    console.log('   - DATABASE_URL');
    console.log('   - JWT_SECRET');
    console.log('3. Redeploy the application');
    console.log('\n🌐 Your application will be available at the provided URL');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you are logged in to Vercel');
    console.log('2. Check your internet connection');
    console.log('3. Verify your project configuration');
    console.log('4. Try running: vercel --prod --force');
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Divyansh Jyotish - Vercel Deployment Script\n');
  
  try {
    checkPrerequisites();
    createDeploymentConfig();
    deployToVercel();
  } catch (error) {
    console.error('❌ Deployment script failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
main();
