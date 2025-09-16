# 🚀 Quick Start Guide - Divyansh Jyotish

## तपाईंको API को साथ Application चलाउनुहोस्

### 1. Environment Setup (सबैभन्दा सजिलो तरिका)

```bash
# Automatic setup चलाउनुहोस्
npm run setup
```

यो command तपाईंलाई step-by-step guide गर्छ र सबै API keys configure गर्छ।

### 2. Manual Setup (यदि automatic काम नगरे)

`.env.local` फाइल बनाउनुहोस्:

```bash
# OpenAI API Key (ChatGPT के लागि)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# ProKerala API Key (ज्योतिष डाटा के लागि)
PROKERALA_API_KEY="your-prokerala-api-key-here"

# Database URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/divyansh_jyotish?schema=public"

# JWT Secret
JWT_SECRET="your-jwt-secret-here"
```

### 3. Dependencies Install गर्नुहोस्

```bash
npm install
```

### 4. Database Setup गर्नुहोस्

```bash
# Database migration
npm run db:migrate

# Database seed (optional)
npm run db:seed
```

### 5. Application चलाउनुहोस्

```bash
# Development server
npm run dev
```

### 6. Testing गर्नुहोस्

```bash
# API testing
npm run test:apis

# Health check
curl http://localhost:3000/api/health
```

## 🎯 API Keys कहाँबाट पाउने?

### OpenAI API Key (ChatGPT के लागि)
1. https://platform.openai.com/ मा जानुहोस्
2. Account बनाउनुहोस् वा login गर्नुहोस्
3. API Keys section मा जानुहोस्
4. "Create new secret key" क्लिक गर्नुहोस्
5. Key copy गर्नुहोस्

### ProKerala API Key (ज्योतिष डाटा के लागि)
1. https://www.prokerala.com/astrology/api/ मा जानुहोस्
2. "Get API Key" क्लिक गर्नुहोस्
3. Registration form भर्नुहोस्
4. API key प्राप्त गर्नुहोस्

## 🔧 Features

### ✅ **Real ProKerala API Integration**
- वास्तविक ज्योतिषीय गणना
- Kundli, Dashas, Panchang
- Different birth details ले different results

### ✅ **Real ChatGPT Integration**
- Dynamic AI responses
- Context-aware answers
- Multiple languages support (Nepali, Hindi, English)

### ✅ **Unified Interface**
- Single page application
- Real-time chat
- Beautiful UI

## 📱 Usage

### 1. Birth Details भर्नुहोस्
- नाम, मिति, समय, स्थान
- भाषा छान्नुहोस्

### 2. जन्मकुण्डली गणना गर्नुहोस्
- "जन्मकुण्डली गणना गर्नुहोस्" button क्लिक गर्नुहोस्
- Real ProKerala API बाट data आउनेछ

### 3. AI सँग chat गर्नुहोस्
- कुनै पनि प्रश्न सोध्नुहोस्
- AI तपाईंको जन्मकुण्डली अनुसार जवाफ दिनेछ

## 🧪 Testing

### API Health Check
```bash
curl http://localhost:3000/api/health
```

### Manual Testing
1. http://localhost:3000 खोल्नुहोस्
2. Birth details भर्नुहोस्
3. Different questions सोध्नुहोस्
4. Responses check गर्नुहोस्

## 🚨 Troubleshooting

### Common Issues:

1. **API Keys नभएको**
   - Environment variables check गर्नुहोस्
   - `.env.local` file बनाउनुहोस्

2. **Database Connection Error**
   - PostgreSQL running छ कि check गर्नुहोस्
   - Database URL सही छ कि check गर्नुहोस्

3. **API Rate Limits**
   - ProKerala र OpenAI दुबैमा rate limits छन्
   - कृपया wait गर्नुहोस्

4. **Network Issues**
   - Internet connection check गर्नुहोस्
   - Firewall settings check गर्नुहोस्

## 📊 Expected Results

### ProKerala API सफल भएपछि:
- ✅ Real astrology data
- ✅ Different results for different birth details
- ✅ Accurate planetary positions
- ✅ Real-time calculations

### ChatGPT सफल भएपछि:
- ✅ Dynamic responses
- ✅ Different answers for different questions
- ✅ Context-aware conversation
- ✅ Multi-language support

## 🎉 Success!

यदि सबै कुरा ठीक छ भने, तपाईंको Divyansh Jyotish application अब:
- Real ProKerala API सँग काम गर्छ
- Real ChatGPT सँग chat गर्छ
- Different questions ले different answers दिन्छ
- Beautiful UI मा सबै कुरा display गर्छ

---

**समस्या आएमा:** `API_SETUP_GUIDE.md` पढ्नुहोस् वा console logs check गर्नुहोस्।
