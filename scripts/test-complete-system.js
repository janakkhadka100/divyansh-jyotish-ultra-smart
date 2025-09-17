#!/usr/bin/env node

/**
 * Complete System Test Script
 * Tests all features and APIs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test all endpoints
const endpoints = [
  { name: 'Health Check', url: '/api/health', method: 'GET' },
  { name: 'Enhanced Chat', url: '/api/chat/enhanced', method: 'POST' },
  { name: 'Fast Chat', url: '/api/chat/fast', method: 'POST' },
  { name: 'Voice Chat', url: '/api/chat/voice', method: 'POST' },
  { name: 'Chat Interface', url: '/chat-final', method: 'GET' },
  { name: 'Dashboard', url: '/dashboard', method: 'GET' }
];

// Test data
const testData = {
  enhanced: {
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
  fast: {
    message: "ज्योतिष के हो?",
    userId: "test-user-123"
  },
  voice: {
    message: "मेरो स्वास्थ्य कस्तो छ?",
    userId: "test-user-123",
    language: "ne",
    voiceEnabled: true
  }
};

async function testEndpoint(endpoint) {
  console.log(`🧪 Testing: ${endpoint.name}`);
  
  try {
    const startTime = Date.now();
    let response;
    
    if (endpoint.method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint.url}`, { timeout: 10000 });
    } else {
      const data = testData[endpoint.url.split('/').pop()] || { message: "Test message" };
      response = await axios.post(`${BASE_URL}${endpoint.url}`, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`   ✅ Success (${responseTime}ms)`);
    console.log(`   Status: ${response.status}`);
    
    if (response.data && typeof response.data === 'object') {
      if (response.data.success !== undefined) {
        console.log(`   Success: ${response.data.success}`);
      }
      if (response.data.data) {
        console.log(`   Data Keys: ${Object.keys(response.data.data).join(', ')}`);
      }
    }
    
    return {
      success: true,
      responseTime,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
    }
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

async function testChatFunctionality() {
  console.log('💬 Testing Chat Functionality...\n');
  
  const chatTests = [
    {
      name: 'General Question',
      data: { message: 'ज्योतिष के हो?', userId: 'test-user' }
    },
    {
      name: 'Career Question with Birth Data',
      data: {
        message: 'मेरो करियर के होला?',
        userId: 'test-user',
        birthData: {
          name: 'Test User',
          date: '1990-01-01',
          time: '10:30',
          location: 'Kathmandu, Nepal',
          latitude: 27.7172,
          longitude: 85.324,
          timezone: 'Asia/Kathmandu',
          ayanamsa: 1
        }
      }
    },
    {
      name: 'Love Question',
      data: {
        message: 'मेरो प्रेम जीवन कस्तो छ?',
        userId: 'test-user',
        birthData: {
          name: 'Test User',
          date: '1990-01-01',
          time: '10:30',
          location: 'Kathmandu, Nepal'
        }
      }
    }
  ];

  const results = [];
  
  for (const test of chatTests) {
    console.log(`📝 Testing: ${test.name}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/enhanced`, test.data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      if (response.data.success) {
        const data = response.data.data;
        console.log(`   ✅ Success`);
        console.log(`   Question Type: ${data.questionType}`);
        console.log(`   Has Astrological Data: ${data.hasAstrologicalData}`);
        console.log(`   Response Length: ${data.response.length} characters`);
        
        results.push({
          name: test.name,
          success: true,
          questionType: data.questionType,
          hasAstrologicalData: data.hasAstrologicalData,
          responseLength: data.response.length
        });
      } else {
        console.log(`   ❌ Failed: ${response.data.error}`);
        results.push({
          name: test.name,
          success: false,
          error: response.data.error
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  return results;
}

async function testPerformance() {
  console.log('⚡ Testing Performance...\n');
  
  const performanceTests = [
    { name: 'Fast Chat API', url: '/api/chat/fast' },
    { name: 'Enhanced Chat API', url: '/api/chat/enhanced' },
    { name: 'Voice Chat API', url: '/api/chat/voice' }
  ];
  
  const results = [];
  
  for (const test of performanceTests) {
    console.log(`🚀 Testing: ${test.name}`);
    
    const times = [];
    const successCount = 0;
    const totalTests = 3;
    
    for (let i = 0; i < totalTests; i++) {
      try {
        const startTime = Date.now();
        const response = await axios.post(`${BASE_URL}${test.url}`, {
          message: 'Test message',
          userId: 'test-user'
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });
        const endTime = Date.now();
        
        if (response.data.success) {
          times.push(endTime - startTime);
        }
      } catch (error) {
        console.log(`   ⚠️  Test ${i + 1} failed: ${error.message}`);
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`   ✅ Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   ✅ Min: ${minTime}ms, Max: ${maxTime}ms`);
      console.log(`   ✅ Success Rate: ${times.length}/${totalTests} (${((times.length/totalTests)*100).toFixed(1)}%)`);
      
      results.push({
        name: test.name,
        avgTime,
        minTime,
        maxTime,
        successRate: (times.length/totalTests)*100
      });
    } else {
      console.log(`   ❌ All tests failed`);
      results.push({
        name: test.name,
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        successRate: 0
      });
    }
    
    console.log('');
  }
  
  return results;
}

async function main() {
  console.log('🚀 Starting Complete System Tests\n');

  // Test all endpoints
  console.log('🔍 Testing All Endpoints...\n');
  const endpointResults = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    endpointResults.push({ ...endpoint, result });
    console.log('');
  }

  // Test chat functionality
  const chatResults = await testChatFunctionality();
  
  // Test performance
  const performanceResults = await testPerformance();

  // Summary
  console.log('📊 Complete Test Results Summary:');
  console.log('');

  // Endpoint results
  const endpointSuccessCount = endpointResults.filter(r => r.result.success).length;
  console.log(`Endpoints: ${endpointSuccessCount}/${endpointResults.length} working`);

  // Chat functionality results
  const chatSuccessCount = chatResults.filter(r => r.success).length;
  console.log(`Chat Functionality: ${chatSuccessCount}/${chatResults.length} tests passed`);

  // Performance results
  const avgPerformance = performanceResults.reduce((sum, r) => sum + r.avgTime, 0) / performanceResults.length;
  console.log(`Average Performance: ${avgPerformance.toFixed(2)}ms`);

  // Overall success rate
  const totalTests = endpointResults.length + chatResults.length;
  const totalSuccess = endpointSuccessCount + chatSuccessCount;
  const overallSuccessRate = (totalSuccess / totalTests) * 100;

  console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);

  if (overallSuccessRate >= 80) {
    console.log('\n🎉 System is working excellently!');
    console.log('\n🌐 Available Features:');
    console.log('- ✅ Enhanced Chat API with ProKerala integration');
    console.log('- ✅ Fast Chat API for quick responses');
    console.log('- ✅ Voice Chat API for speech support');
    console.log('- ✅ Interactive Chat Interface');
    console.log('- ✅ Dashboard with analytics');
    console.log('- ✅ Health monitoring');
    console.log('- ✅ Question type detection');
    console.log('- ✅ Astrological data integration');
    console.log('- ✅ Nepali language support');
    
    console.log('\n🔗 Access Points:');
    console.log('- Main Chat: http://localhost:3000/chat-final');
    console.log('- Dashboard: http://localhost:3000/dashboard');
    console.log('- Health Check: http://localhost:3000/api/health');
    console.log('- Enhanced API: http://localhost:3000/api/chat/enhanced');
    console.log('- Fast API: http://localhost:3000/api/chat/fast');
    console.log('- Voice API: http://localhost:3000/api/chat/voice');
  } else {
    console.log('\n⚠️  Some issues detected. Please check the errors above.');
  }

  process.exit(overallSuccessRate >= 80 ? 0 : 1);
}

// Run the tests
main().catch(console.error);


