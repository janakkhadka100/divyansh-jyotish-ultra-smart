# Vercel Production Deployment Setup

## 🌐 Your Vercel URLs
- **Primary Domain**: https://divyansh-jyotish.vercel.app
- **Development URL**: https://divyansh-jyotish-9d6wfzvsd-janaks-projects-69446763.vercel.app

## 🔧 Environment Variables Setup

### Required Environment Variables in Vercel Dashboard:

1. **NODE_ENV**: `production`
2. **DATABASE_URL**: Your production database connection string
3. **OPENAI_API_KEY**: Your OpenAI API key
4. **NEXT_PUBLIC_APP_URL**: `https://divyansh-jyotish.vercel.app`

### Optional Environment Variables:

1. **PROKERALA_API_KEY**: For real astrological data (uses mock data if not provided)
2. **PROKERALA_CLIENT_ID**: ProKerala client ID
3. **PROKERALA_CLIENT_SECRET**: ProKerala client secret
4. **OPENAI_MODEL**: `gpt-4` (default)
5. **GEOCODE_PROVIDER**: `google` (default)
6. **TIMEZONE_SOURCE**: `geocoding` (default)
7. **NEXTAUTH_SECRET**: Random secret for authentication
8. **REDIS_URL**: For caching (optional)

## 🚀 Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all the required variables listed above

### 2. Deploy from GitHub:
The application will automatically deploy when you push to the `main` branch.

### 3. Custom Domain Setup (Optional):
1. Go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

## 🔍 Testing Your Deployment

### Health Check:
```bash
curl https://divyansh-jyotish.vercel.app/api/health
```

### Enhanced Chat API:
```bash
curl -X POST https://divyansh-jyotish.vercel.app/api/chat/enhanced \
  -H "Content-Type: application/json" \
  -d '{"message": "मेरो करियर के होला?"}'
```

### Chat Interface:
- **Main App**: https://divyansh-jyotish.vercel.app
- **Chat Interface**: https://divyansh-jyotish.vercel.app/chat-final
- **Dashboard**: https://divyansh-jyotish.vercel.app/dashboard

## 📊 Features Available in Production

✅ **ProKerala + ChatGPT Integration**: Full astrological analysis
✅ **Nepali Language Support**: Complete
✅ **Question Type Detection**: 9 types
✅ **Multiple Chat APIs**: Enhanced, Fast, Voice
✅ **Mock Data Fallback**: Works without API keys
✅ **Performance Optimized**: Caching and optimization
✅ **Security Headers**: XSS, CSRF protection
✅ **Mobile Responsive**: Works on all devices

## 🛠️ Troubleshooting

### If ProKerala API is not working:
- The app will automatically use mock data
- Check `PROKERALA_API_KEY` in environment variables
- Verify ProKerala API credentials

### If OpenAI API is not working:
- Check `OPENAI_API_KEY` in environment variables
- Verify API key has sufficient credits
- Check API rate limits

### If Database is not working:
- The app will use demo mode
- Check `DATABASE_URL` in environment variables
- Verify database connection

## 📈 Monitoring

- **Vercel Analytics**: Available in dashboard
- **Function Logs**: Check in Vercel dashboard
- **Performance**: Monitor in Vercel dashboard
- **Health Check**: `/api/health` endpoint

## 🔄 Updates

To update your production deployment:
1. Make changes to your code
2. Commit and push to `main` branch
3. Vercel will automatically redeploy
4. Check deployment status in Vercel dashboard

## 📞 Support

- **Vercel Support**: Check Vercel documentation
- **GitHub Issues**: Create issues in your repository
- **Health Check**: Use `/api/health` for diagnostics
