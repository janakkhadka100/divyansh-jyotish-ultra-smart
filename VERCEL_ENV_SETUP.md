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