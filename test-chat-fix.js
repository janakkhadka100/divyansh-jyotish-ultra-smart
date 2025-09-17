const axios = require('axios');

async function testChatFix() {
  console.log('🧪 Testing Chat Fix...\n');
  
  const baseUrl = 'https://divyansh-jyotish.vercel.app';
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`, { timeout: 5000 });
    console.log('✅ Health check:', healthResponse.data.status);
    
    // Test 2: Enhanced chat with dasha question
    console.log('\n2️⃣ Testing enhanced chat with dasha question...');
    const chatResponse = await axios.post(`${baseUrl}/api/chat/enhanced`, {
      message: 'मेरो दशा के हो?'
    }, { 
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Chat response received');
    console.log('📝 Response:', chatResponse.data.data?.response);
    console.log('🔍 Has astrological data:', chatResponse.data.data?.hasAstrologicalData);
    
    // Test 3: Career question
    console.log('\n3️⃣ Testing career question...');
    const careerResponse = await axios.post(`${baseUrl}/api/chat/enhanced`, {
      message: 'मेरो करियर के होला?'
    }, { 
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Career response received');
    console.log('📝 Response:', careerResponse.data.data?.response);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testChatFix();
