#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for Divyansh Jyotish
 * Tests all integrated APIs and features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  compute: {
    name: "Test User",
    date: "1990-01-01",
    time: "10:30",
    location: "Kathmandu, Nepal",
    language: "ne",
    ayanamsa: 1
  },
  chat: {
    message: "मेरो जन्मकुण्डली के छ?",
    language: "ne"
  },
  geocode: {
    location: "Kathmandu, Nepal"
  }
};

async function testUnifiedAPI() {
  console.log('🧪 Testing Unified API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/unified`, {
      action: 'compute',
      data: testData.compute
    }, {
      timeout: 30000
    });

    if (response.data.success) {
      console.log('✅ Unified API working correctly');
      console.log('📊 Response summary:', {
        sessionId: response.data.data.sessionId,
        hasAstrologicalData: !!response.data.data.astrologicalData,
        hasGeoData: !!response.data.data.geoData,
        language: response.data.data.language
      });
      return response.data.data.sessionId;
    } else {
      console.log('❌ Unified API failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Unified API error:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

async function testChatAPI(sessionId) {
  console.log('🤖 Testing Chat API...');
  
  if (!sessionId) {
    console.log('⚠️  Skipping chat test - no session ID');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/unified`, {
      action: 'chat',
      data: {
        ...testData.chat,
        sessionId: sessionId
      }
    }, {
      timeout: 30000
    });

    if (response.data.success) {
      console.log('✅ Chat API working correctly');
      console.log('💬 Response:', response.data.data.message.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ Chat API failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Chat API error:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testGeocodeAPI() {
  console.log('🌍 Testing Geocode API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/unified`, {
      action: 'geocode',
      data: testData.geocode
    }, {
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ Geocode API working correctly');
      console.log('📍 Location data:', response.data.data);
      return true;
    } else {
      console.log('❌ Geocode API failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Geocode API error:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testDifferentQuestions(sessionId) {
  console.log('🔄 Testing different questions...');
  
  if (!sessionId) {
    console.log('⚠️  Skipping questions test - no session ID');
    return false;
  }

  const questions = [
    "मेरो करियर के होला?",
    "मेरो प्रेम जीवन कस्तो छ?",
    "मेरो स्वास्थ्य कस्तो छ?",
    "आजको शुभ समय के हो?",
    "मेरो वर्तमान दशा के हो?"
  ];

  const responses = [];
  
  for (const question of questions) {
    try {
      const response = await axios.post(`${BASE_URL}/api/unified`, {
        action: 'chat',
        data: {
          message: question,
          sessionId: sessionId,
          language: 'ne'
        }
      }, {
        timeout: 15000
      });

      if (response.data.success) {
        responses.push({
          question,
          response: response.data.data.message.substring(0, 50) + '...',
          success: true
        });
      } else {
        responses.push({
          question,
          error: response.data.error,
          success: false
        });
      }
    } catch (error) {
      responses.push({
        question,
        error: error.message,
        success: false
      });
    }
  }

  // Check if responses are different
  const uniqueResponses = new Set(responses.map(r => r.response).filter(r => r));
  const isVaried = uniqueResponses.size > 1;

  console.log('📝 Question responses:');
  responses.forEach((r, i) => {
    console.log(`${i + 1}. ${r.question}`);
    if (r.success) {
      console.log(`   ✅ ${r.response}`);
    } else {
      console.log(`   ❌ ${r.error}`);
    }
  });

  if (isVaried) {
    console.log('✅ Different questions return different responses');
  } else {
    console.log('❌ All questions return similar responses');
  }

  return responses.every(r => r.success) && isVaried;
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/unified`);
    
    console.log('📊 Health Status:', response.data);
    
    const isHealthy = response.data.status === 'healthy';
    if (isHealthy) {
      console.log('✅ All services are healthy');
    } else {
      console.log('⚠️  Some services are unhealthy');
    }
    
    return isHealthy;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive API Tests for Divyansh Jyotish\n');

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start the development server first.');
    console.log('Run: npm run dev');
    process.exit(1);
  }

  const results = {
    health: false,
    unified: false,
    chat: false,
    geocode: false,
    varied: false
  };

  // Test Health Check
  results.health = await testHealthCheck();
  console.log('');

  // Test Unified API
  const sessionId = await testUnifiedAPI();
  results.unified = !!sessionId;
  console.log('');

  // Test Chat API
  results.chat = await testChatAPI(sessionId);
  console.log('');

  // Test Geocode API
  results.geocode = await testGeocodeAPI();
  console.log('');

  // Test different questions
  results.varied = await testDifferentQuestions(sessionId);
  console.log('');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`Health Check: ${results.health ? '✅ Working' : '❌ Failed'}`);
  console.log(`Unified API: ${results.unified ? '✅ Working' : '❌ Failed'}`);
  console.log(`Chat API: ${results.chat ? '✅ Working' : '❌ Failed'}`);
  console.log(`Geocode API: ${results.geocode ? '✅ Working' : '❌ Failed'}`);
  console.log(`Varied Responses: ${results.varied ? '✅ Working' : '❌ Failed'}`);

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your unified APIs are working correctly.');
    console.log('\n🌐 Access your application:');
    console.log('- Main app: http://localhost:3000');
    console.log('- Demo page: http://localhost:3000/demo');
    console.log('- Health check: http://localhost:3000/api/unified');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your environment variables (.env.local)');
    console.log('2. Ensure API keys are valid and have credits');
    console.log('3. Check network connectivity');
    console.log('4. Review the QUICK_START.md file');
    console.log('5. Run: npm run setup');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);
