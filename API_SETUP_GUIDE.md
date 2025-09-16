# 🔧 API Setup Guide - Divyansh Jyotish

## समस्या समाधान (Problem Resolution)

यस गाइडले तपाईंलाई ProKerala API र ChatGPT integration ठीक गर्न मद्दत गर्छ।

## 🚀 Quick Setup

### 1. Environment Variables सेटअप

`.env.local` फाइल बनाउनुहोस्:

```bash
# OpenAI Configuration (Required for ChatGPT)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# ProKerala API Configuration (Required for real astrology data)
PROKERALA_API_KEY="your-prokerala-api-key-here"

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/divyansh_jyotish?schema=public"

# JWT Secret
JWT_SECRET="your-jwt-secret-here"
```

### 2. API Keys प्राप्त गर्नुहोस्

#### OpenAI API Key:
1. https://platform.openai.com/ मा जानुहोस्
2. Account बनाउनुहोस् वा login गर्नुहोस्
3. API Keys section मा जानुहोस्
4. "Create new secret key" क्लिक गर्नुहोस्
5. Key copy गरेर `.env.local` मा राख्नुहोस्

#### ProKerala API Key:
1. https://www.prokerala.com/astrology/api/ मा जानुहोस्
2. "Get API Key" क्लिक गर्नुहोस्
3. Registration form भर्नुहोस्
4. API key प्राप्त गर्नुहोस्
5. `.env.local` मा राख्नुहोस्

### 3. Database Setup

```bash
# Prisma migration चलाउनुहोस्
npx prisma migrate dev

# Database seed गर्नुहोस्
npx prisma db seed
```

### 4. Application चलाउनुहोस्

```bash
# Dependencies install गर्नुहोस्
npm install

# Development server चलाउनुहोस्
npm run dev
```

## 🔍 समस्या निवारण (Troubleshooting)

### ProKerala API समस्या:
- ✅ API key सही छ कि जाँच गर्नुहोस्
- ✅ Internet connection जाँच गर्नुहोस्
- ✅ API quota exceeded तोकिएको छ कि जाँच गर्नुहोस्

### ChatGPT समस्या:
- ✅ OpenAI API key सही छ कि जाँच गर्नुहोस्
- ✅ API credits बाँकी छ कि जाँच गर्नुहोस्
- ✅ Rate limiting भएको छ कि जाँच गर्नुहोस्

### Database समस्या:
- ✅ Database connection string सही छ कि जाँच गर्नुहोस्
- ✅ PostgreSQL server चलिरहेको छ कि जाँच गर्नुहोस्

## 📊 Testing

### API Endpoints Test गर्नुहोस्:

```bash
# ProKerala API test
curl -X POST http://localhost:3000/api/compute \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "date": "1990-01-01",
    "time": "10:30",
    "location": "Kathmandu, Nepal",
    "lang": "ne"
  }'

# ChatGPT API test
curl -X POST http://localhost:3000/api/chat/intelligent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "मेरो जन्मकुण्डली के छ?",
    "userId": "test-user"
  }'
```

## 🎯 Expected Results

### ProKerala API सफल भएपछि:
- Real astrology data प्राप्त हुनेछ
- Different birth details ले different results दिनेछ
- Accurate planetary positions र dashas आउनेछ

### ChatGPT सफल भएपछि:
- Dynamic responses आउनेछ
- Different questions ले different answers दिनेछ
- Real-time AI conversation हुनेछ

## 🚨 Important Notes

1. **API Keys सुरक्षित राख्नुहोस्** - कहिल्यै public repository मा commit नगर्नुहोस्
2. **Rate Limits** - ProKerala र OpenAI दुबैमा rate limits छन्
3. **Costs** - OpenAI API usage को लागि cost आउँछ
4. **Backup** - Environment variables को backup राख्नुहोस्

## 📞 Support

यदि तपाईंलाई कुनै समस्या आउँछ:
1. Console logs जाँच गर्नुहोस्
2. Network tab मा API calls हेर्नुहोस्
3. Environment variables double-check गर्नुहोस्
4. API documentation पढ्नुहोस्

---

**सफलता!** यदि सबै कुरा ठीक छ भने, तपाईंको Divyansh Jyotish application अब real ProKerala API र ChatGPT integration सँग काम गर्नेछ।
