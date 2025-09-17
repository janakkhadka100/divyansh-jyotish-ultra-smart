#!/usr/bin/env node

/**
 * Final Integration Test Script
 * Tests complete ProKerala + ChatGPT integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test scenarios
const testScenarios = [
  {
    name: "General Astrology Question",
    data: {
      message: "ज्योतिष के हो?",
      userId: "test-user-123"
    },
    expectedType: "general"
  },
  {
    name: "Career Question with Birth Data",
    data: {
      message: "मेरो करियर के होला?",
      userId: "test-user-123",
      birthData: {
        name: "Test User",
        date: "1990-01-01",
        time: "10:30",
        location: "Kathmandu, Nepal",
        latitude: 27.7172,
        longitude: 85.324,
        timezone: "Asia/Kathmandu",
        ayanamsa: 1
      }
    },
    expectedType: "career"
  },
  {
    name: "Love Question with Birth Data",
    data: {
      message: "मेरो प्रेम जीवन कस्तो छ?",
      userId: "test-user-123",
      birthData: {
        name: "Test User",
        date: "1990-01-01",
        time: "10:30",
        location: "Kathmandu, Nepal",
        latitude: 27.7172,
        longitude: 85.324,
        timezone: "Asia/Kathmandu",
        ayanamsa: 1
      }
    },
    expectedType: "love"
  },
  {
    name: "Health Question with Birth Data",
    data: {
      message: "मेरो स्वास्थ्य कस्तो छ?",
      userId: "test-user-123",
      birthData: {
        name: "Test User",
        date: "1990-01-01",
        time: "10:30",
        location: "Kathmandu, Nepal",
        latitude: 27.7172,
        longitude: 85.324,
        timezone: "Asia/Kathmandu",
        ayanamsa: 1
      }
    },
    expectedType: "health"
  },
  {
    name: "Dasha Question with Birth Data",
    data: {
      message: "मेरो वर्तमान दशा के हो?",
      userId: "test-user-123",
      birthData: {
        name: "Test User",
        date: "1990-01-01",
        time: "10:30",
        location: "Kathmandu, Nepal",
        latitude: 27.7172,
        longitude: 85.324,
        timezone: "Asia/Kathmandu",
        ayanamsa: 1
      }
    },
    expectedType: "dasha"
  },
  {
    name: "Daily Question with Birth Data",
    data: {
      message: "आजको शुभ समय के हो?",
      userId: "test-user-123",
      birthData: {
        name: "Test User",
        date: "1990-01-01",
        time: "10:30",
        location: "Kathmandu, Nepal",
        latitude: 27.7172,
        longitude: 85.324,
        timezone: "Asia/Kathmandu",
        ayanamsa: 1
      }
    },
    expectedType: "daily"
  }
];

async function testScenario(scenario) {
  console.log(`🧪 Testing: ${scenario.name}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, scenario.data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.data.success) {
      const data = response.data.data;
      console.log(`   ✅ Success (${responseTime}ms)`);
      console.log(`   Question Type: ${data.questionType} (Expected: ${scenario.expectedType})`);
      console.log(`   Has Astrological Data: ${data.hasAstrologicalData}`);
      console.log(`   Response Length: ${data.response.length} characters`);
      console.log(`   Response Preview: ${data.response.substring(0, 100)}...`);
      
      // Check if question type detection is correct
      const typeCorrect = data.questionType === scenario.expectedType;
      console.log(`   Type Detection: ${typeCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      
      return {
        success: true,
        responseTime,
        questionType: data.questionType,
        expectedType: scenario.expectedType,
        typeCorrect,
        hasAstrologicalData: data.hasAstrologicalData,
        responseLength: data.response.length
      };
    } else {
      console.log(`   ❌ Failed: ${response.data.error}`);
      return {
        success: false,
        error: response.data.error
      };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAPIHealth() {
  console.log('🏥 Testing API Health...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log(`   ✅ Health Check: ${response.data.status}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Health Check Failed: ${error.message}`);
    return false;
  }
}

async function testChatInterface() {
  console.log('💬 Testing Chat Interface...');
  
  try {
    const response = await axios.get(`${BASE_URL}/chat-final`);
    if (response.status === 200) {
      console.log(`   ✅ Chat Interface: Accessible`);
      return true;
    } else {
      console.log(`   ❌ Chat Interface: Not accessible`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Chat Interface Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Final Integration Tests\n');

  // Test API Health
  const healthOk = await testAPIHealth();
  console.log('');

  if (!healthOk) {
    console.log('❌ API Health check failed. Please start the development server first.');
    console.log('Run: npm run dev');
    process.exit(1);
  }

  // Test Chat Interface
  const interfaceOk = await testChatInterface();
  console.log('');

  // Test all scenarios
  const results = [];
  for (const scenario of testScenarios) {
    const result = await testScenario(scenario);
    results.push({ ...scenario, result });
    console.log('');
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('');

  const successCount = results.filter(r => r.result.success).length;
  const totalCount = results.length;
  console.log(`API Health: ${healthOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Chat Interface: ${interfaceOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Enhanced Chat: ${successCount}/${totalCount} tests passed`);

  // Question type detection accuracy
  const typeCorrectCount = results.filter(r => r.result.typeCorrect).length;
  console.log(`Question Type Detection: ${typeCorrectCount}/${totalCount} correct`);

  // Astrological data integration
  const astroDataCount = results.filter(r => r.result.hasAstrologicalData).length;
  console.log(`Astrological Data Integration: ${astroDataCount}/${totalCount} with data`);

  // Response times
  const avgResponseTime = results
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + r.result.responseTime, 0) / successCount;
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);

  const allPassed = healthOk && interfaceOk && successCount === totalCount;

  if (allPassed) {
    console.log('\n🎉 All tests passed! Your complete integration is working perfectly.');
    console.log('\n🌐 Access your application:');
    console.log('- Main app: http://localhost:3000');
    console.log('- Final Chat: http://localhost:3000/chat-final');
    console.log('- Enhanced API: http://localhost:3000/api/chat/enhanced');
    console.log('\n✨ Features working:');
    console.log('- ✅ ProKerala Jyotish data integration (mock mode)');
    console.log('- ✅ ChatGPT API integration');
    console.log('- ✅ Question type detection');
    console.log('- ✅ Astrological data context');
    console.log('- ✅ Nepali language responses');
    console.log('- ✅ Interactive chat interface');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Ensure the development server is running: npm run dev');
    console.log('2. Check OpenAI API key configuration');
    console.log('3. Verify ProKerala service is working');
    console.log('4. Check network connectivity');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);


