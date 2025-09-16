#!/usr/bin/env node

/**
 * Enhanced Chat System Testing Script
 * Tests ProKerala + ChatGPT integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data with birth details
const testBirthData = {
  name: "Test User",
  date: "1990-01-01",
  time: "10:30",
  location: "Kathmandu, Nepal",
  latitude: 27.7172,
  longitude: 85.324,
  timezone: "Asia/Kathmandu",
  ayanamsa: 1
};

const testQuestions = [
  {
    question: "मेरो जन्मकुण्डली के छ?",
    type: "kundli",
    withBirthData: true
  },
  {
    question: "मेरो करियर के होला?",
    type: "career",
    withBirthData: true
  },
  {
    question: "मेरो प्रेम जीवन कस्तो छ?",
    type: "love",
    withBirthData: true
  },
  {
    question: "मेरो स्वास्थ्य कस्तो छ?",
    type: "health",
    withBirthData: true
  },
  {
    question: "मेरो वर्तमान दशा के हो?",
    type: "dasha",
    withBirthData: true
  },
  {
    question: "आजको शुभ समय के हो?",
    type: "daily",
    withBirthData: true
  },
  {
    question: "ज्योतिष के हो?",
    type: "general",
    withBirthData: false
  }
];

async function testEnhancedChat() {
  console.log('🤖 Testing Enhanced Chat System...\n');

  const results = [];

  for (const test of testQuestions) {
    console.log(`📝 Testing: "${test.question}"`);
    console.log(`   Type: ${test.type}`);
    console.log(`   With Birth Data: ${test.withBirthData ? 'Yes' : 'No'}`);

    try {
      const requestData = {
        message: test.question,
        userId: "test-user-123"
      };

      if (test.withBirthData) {
        requestData.birthData = testBirthData;
      }

      const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.success) {
        const data = response.data.data;
        console.log(`   ✅ Success`);
        console.log(`   Response: ${data.response.substring(0, 100)}...`);
        console.log(`   Question Type: ${data.questionType}`);
        console.log(`   Has Astrological Data: ${data.hasAstrologicalData}`);
        console.log(`   Contextual Response: ${data.contextualResponse.substring(0, 50)}...`);
        
        results.push({
          question: test.question,
          type: test.type,
          success: true,
          response: data.response,
          questionType: data.questionType,
          hasAstrologicalData: data.hasAstrologicalData
        });
      } else {
        console.log(`   ❌ Failed: ${response.data.error}`);
        results.push({
          question: test.question,
          type: test.type,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      results.push({
        question: test.question,
        type: test.type,
        success: false,
        error: error.message
      });
    }

    console.log(''); // Empty line for readability
  }

  return results;
}

async function testQuestionTypeDetection() {
  console.log('🔍 Testing Question Type Detection...\n');

  const testCases = [
    { question: "मेरो करियर के होला?", expected: "career" },
    { question: "मेरो प्रेम जीवन कस्तो छ?", expected: "love" },
    { question: "मेरो स्वास्थ्य कस्तो छ?", expected: "health" },
    { question: "मेरो धन कस्तो छ?", expected: "finance" },
    { question: "मेरो शिक्षा कस्तो छ?", expected: "education" },
    { question: "मेरो दशा के छ?", expected: "dasha" },
    { question: "मेरो कुण्डली के छ?", expected: "kundli" },
    { question: "आजको शुभ समय के हो?", expected: "daily" },
    { question: "ज्योतिष के हो?", expected: "general" }
  ];

  const detectionResults = [];

  for (const testCase of testCases) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, {
        message: testCase.question,
        userId: "test-user-123"
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success) {
        const detectedType = response.data.data.questionType;
        const isCorrect = detectedType === testCase.expected;
        
        console.log(`   ${isCorrect ? '✅' : '❌'} "${testCase.question}"`);
        console.log(`      Expected: ${testCase.expected}, Got: ${detectedType}`);
        
        detectionResults.push({
          question: testCase.question,
          expected: testCase.expected,
          detected: detectedType,
          correct: isCorrect
        });
      } else {
        console.log(`   ❌ "${testCase.question}" - API Error: ${response.data.error}`);
        detectionResults.push({
          question: testCase.question,
          expected: testCase.expected,
          detected: null,
          correct: false
        });
      }
    } catch (error) {
      console.log(`   ❌ "${testCase.question}" - Error: ${error.message}`);
      detectionResults.push({
        question: testCase.question,
        expected: testCase.expected,
        detected: null,
        correct: false
      });
    }
  }

  return detectionResults;
}

async function testAstrologicalDataIntegration() {
  console.log('🌟 Testing Astrological Data Integration...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, {
      message: "मेरो जन्मकुण्डली के छ?",
      userId: "test-user-123",
      birthData: testBirthData
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log(`   ✅ Astrological data integration working`);
      console.log(`   Has Astrological Data: ${data.hasAstrologicalData}`);
      console.log(`   Response Length: ${data.response.length} characters`);
      console.log(`   Question Type: ${data.questionType}`);
      
      // Check if response contains astrological terms
      const astroTerms = ['लग्न', 'राशि', 'ग्रह', 'दशा', 'भाव', 'योग', 'नक्षत्र'];
      const containsAstroTerms = astroTerms.some(term => data.response.includes(term));
      
      console.log(`   Contains Astrological Terms: ${containsAstroTerms}`);
      
      return {
        success: true,
        hasAstrologicalData: data.hasAstrologicalData,
        responseLength: data.response.length,
        containsAstroTerms
      };
    } else {
      console.log(`   ❌ Failed: ${response.data.error}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Enhanced Chat System Tests\n');

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start the development server first.');
    console.log('Run: npm run dev');
    process.exit(1);
  }

  // Test enhanced chat
  const chatResults = await testEnhancedChat();
  console.log('');

  // Test question type detection
  const detectionResults = await testQuestionTypeDetection();
  console.log('');

  // Test astrological data integration
  const astroResults = await testAstrologicalDataIntegration();
  console.log('');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('');

  const successCount = chatResults.filter(r => r.success).length;
  const totalCount = chatResults.length;
  console.log(`Enhanced Chat: ${successCount}/${totalCount} tests passed`);

  const detectionSuccessCount = detectionResults.filter(r => r.correct).length;
  const detectionTotalCount = detectionResults.length;
  console.log(`Question Type Detection: ${detectionSuccessCount}/${detectionTotalCount} tests passed`);

  console.log(`Astrological Data Integration: ${astroResults.success ? '✅ Working' : '❌ Failed'}`);

  const allPassed = successCount === totalCount && detectionSuccessCount === detectionTotalCount && astroResults.success;

  if (allPassed) {
    console.log('\n🎉 All tests passed! Your enhanced chat system is working correctly.');
    console.log('\n🌐 Access your application:');
    console.log('- Main app: http://localhost:3000');
    console.log('- Enhanced chat: http://localhost:3000/api/chat/enhanced');
    console.log('- Demo page: http://localhost:3000/demo');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your environment variables (.env.local)');
    console.log('2. Ensure OpenAI API key is valid and has credits');
    console.log('3. Check ProKerala service configuration');
    console.log('4. Review the API logs for detailed error messages');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);

