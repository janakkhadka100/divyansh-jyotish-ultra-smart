import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        prokerala: 'unknown',
        openai: 'unknown'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasProkeralaKey: !!process.env.PROKERALA_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    };

    // Check database
    try {
      const { prisma } = await import('@/server/lib/database');
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check ProKerala API
    try {
      if (process.env.PROKERALA_API_KEY) {
        const axios = require('axios');
        await axios.get('https://api.prokerala.com/v2/astrology/panchang?date=2024-01-01&latitude=27.7172&longitude=85.3240', {
          headers: {
            'Authorization': `Bearer ${process.env.PROKERALA_API_KEY}`
          },
          timeout: 5000
        });
        health.services.prokerala = 'healthy';
      } else {
        health.services.prokerala = 'no-api-key';
      }
    } catch (error) {
      health.services.prokerala = 'unhealthy';
      console.error('ProKerala API health check failed:', error);
    }

    // Check OpenAI API
    try {
      if (process.env.OPENAI_API_KEY) {
        const OpenAI = require('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        await openai.models.list();
        health.services.openai = 'healthy';
      } else {
        health.services.openai = 'no-api-key';
      }
    } catch (error) {
      health.services.openai = 'unhealthy';
      console.error('OpenAI API health check failed:', error);
    }

    const isHealthy = Object.values(health.services).every(status => 
      status === 'healthy' || status === 'no-api-key'
    );

    return NextResponse.json(health, { 
      status: isHealthy ? 200 : 503 
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
