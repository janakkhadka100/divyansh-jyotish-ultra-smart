#!/usr/bin/env node

/**
 * API Testing Script for Divyansh Jyotish
 * Tests ProKerala API and ChatGPT integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testBirthData = {
  name: "Test User",
  date: "1990-01-01",
  time: "10:30",
  location: "Kathmandu, Nepal",
  lang: "ne"
};

const testChatMessage = {
  message: "मेरो जन्मकुण्डली के छ?",
  userId: "test-user-123"
};

async function testProKeralaAPI() {
  console.log('🧪 Testing ProKerala API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/compute`, testBirthData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    if (response.data.success) {
      console.log('✅ ProKerala API working correctly');
      console.log('📊 Response summary:', {
        sessionId: response.data.sessionId,
        hasKundli: !!response.data.data?.kundli,
        hasDashas: !!response.data.data?.dashas,
        hasPanchang: !!response.data.data?.panchang,
        provider: response.data.data?.provider
      });
      return true;
    } else {
      console.log('❌ ProKerala API failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ ProKerala API error:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testChatGPTAPI() {
  console.log('🤖 Testing ChatGPT API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chat/intelligent`, testChatMessage, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    if (response.data.success) {
      console.log('✅ ChatGPT API working correctly');
      console.log('💬 Response:', response.data.data.response.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ ChatGPT API failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ ChatGPT API error:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

async function testDifferentQuestions() {
  console.log('🔄 Testing different questions...');
  
  const questions = [
    "मेरो करियर के होला?",
    "मेरो प्रेम जीवन कस्तो छ?",
    "मेरो स्वास्थ्य कस्तो छ?",
    "आजको शुभ समय के हो?"
  ];

  const responses = [];
  
  for (const question of questions) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/intelligent`, {
        ...testChatMessage,
        message: question
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success) {
        responses.push({
          question,
          response: response.data.data.response.substring(0, 50) + '...',
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

async function main() {
  console.log('🚀 Starting API Tests for Divyansh Jyotish\n');

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
    prokerala: false,
    chatgpt: false,
    varied: false
  };

  // Test ProKerala API
  results.prokerala = await testProKeralaAPI();
  console.log('');

  // Test ChatGPT API
  results.chatgpt = await testChatGPTAPI();
  console.log('');

  // Test different questions
  results.varied = await testDifferentQuestions();
  console.log('');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`ProKerala API: ${results.prokerala ? '✅ Working' : '❌ Failed'}`);
  console.log(`ChatGPT API: ${results.chatgpt ? '✅ Working' : '❌ Failed'}`);
  console.log(`Varied Responses: ${results.varied ? '✅ Working' : '❌ Failed'}`);

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your APIs are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your environment variables (.env.local)');
    console.log('2. Ensure API keys are valid and have credits');
    console.log('3. Check network connectivity');
    console.log('4. Review the API_SETUP_GUIDE.md file');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);
