#!/usr/bin/env node

/**
 * Environment Setup Script for Divyansh Jyotish
 * Automatically configures all required APIs and services
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Divyansh Jyotish Environment Setup\n');
  console.log('यो script तपाईंको सबै APIs र services configure गर्छ।\n');

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      process.exit(0);
    }
  }

  console.log('\n📋 Required API Keys:\n');
  console.log('1. OpenAI API Key (ChatGPT के लागि)');
  console.log('2. ProKerala API Key (ज्योतिष डाटा के लागि)');
  console.log('3. Google Maps API Key (स्थान के लागि - Optional)');
  console.log('4. Database URL (PostgreSQL के लागि)\n');

  // Collect API keys
  const openaiKey = await question('🔑 OpenAI API Key (sk-...): ');
  const prokeralaKey = await question('🔑 ProKerala API Key: ');
  const googleMapsKey = await question('🔑 Google Maps API Key (Optional): ');
  const databaseUrl = await question('🗄️  Database URL (postgresql://...): ');

  // Generate JWT secret
  const jwtSecret = 'divyansh-jyotish-' + Math.random().toString(36).substring(2, 15);
  
  // Generate encryption key
  const encryptionKey = 'divyansh-jyotish-' + Math.random().toString(36).substring(2, 15) + '-key';

  // Create .env.local content
  const envContent = `# Database Configuration
DATABASE_URL="${databaseUrl || 'postgresql://postgres:password@localhost:5432/divyansh_jyotish?schema=public'}"

# OpenAI Configuration (Required for ChatGPT)
OPENAI_API_KEY="${openaiKey}"

# ProKerala API Configuration (Required for astrology data)
PROKERALA_API_KEY="${prokeralaKey}"

# JWT Secret
JWT_SECRET="${jwtSecret}"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Divyansh Jyotish"
NODE_ENV="development"

# Geocoding Configuration
GEOCODE_PROVIDER="osm"
GOOGLE_MAPS_API_KEY="${googleMapsKey || 'your-google-maps-api-key-here'}"
TIMEZONE_API_KEY="your-timezone-api-key-here"

# Redis Configuration (Optional)
REDIS_URL="redis://localhost:6379"

# Privacy & Security
ANONYMIZE_DATA="true"
DATA_RETENTION_DAYS="30"
GDPR_COMPLIANT="true"

# Performance Configuration
CDN_ENABLED="false"
EDGE_ENABLED="false"
CDN_CACHE_TTL="3600"
EDGE_LATENCY_THRESHOLD="100"

# Weather & Traffic APIs (Optional)
WEATHER_API_KEY="your-weather-api-key-here"
TRAFFIC_API_KEY="your-traffic-api-key-here"

# Encryption
ENCRYPTION_KEY="${encryptionKey}"
`;

  // Write .env.local file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
  } catch (error) {
    console.log('\n❌ Error creating .env.local:', error.message);
    process.exit(1);
  }

  // Create additional configuration files
  createAdditionalConfigs();

  console.log('\n🎉 Environment setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Setup database: npm run db:migrate');
  console.log('3. Start development server: npm run dev');
  console.log('4. Test APIs: npm run test:apis');
  console.log('\n📚 Documentation:');
  console.log('- API_SETUP_GUIDE.md - Complete setup guide');
  console.log('- FIXES_SUMMARY.md - What was fixed');
  console.log('- scripts/test-apis.js - API testing script');

  rl.close();
}

function createAdditionalConfigs() {
  // Create API configuration file
  const apiConfigPath = path.join(process.cwd(), 'src/config/api-config.ts');
  const apiConfigContent = `export const API_CONFIG = {
  PROKERALA: {
    BASE_URL: 'https://api.prokerala.com/v2/astrology',
    TIMEOUT: 30000,
    RATE_LIMIT_DELAY: 1000
  },
  OPENAI: {
    MODEL: 'gpt-4',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
  },
  GEOCODING: {
    PROVIDER: 'osm',
    TIMEOUT: 10000
  }
};

export default API_CONFIG;
`;

  try {
    fs.writeFileSync(apiConfigPath, apiConfigContent);
    console.log('✅ API configuration created');
  } catch (error) {
    console.log('⚠️  Could not create API config:', error.message);
  }

  // Create database configuration
  const dbConfigPath = path.join(process.cwd(), 'src/config/database-config.ts');
  const dbConfigContent = `export const DATABASE_CONFIG = {
  CONNECTION_POOL_SIZE: 10,
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
};

export default DATABASE_CONFIG;
`;

  try {
    fs.writeFileSync(dbConfigPath, dbConfigContent);
    console.log('✅ Database configuration created');
  } catch (error) {
    console.log('⚠️  Could not create database config:', error.message);
  }
}

// Run setup
setupEnvironment().catch(console.error);
