# 🚀 Vercel Deployment Guide - Divyansh Jyotish

## तपाईंको Application Vercel मा Live गर्नुहोस्

### 1. Prerequisites (आवश्यक कुराहरू)

#### Vercel CLI Install गर्नुहोस्
```bash
npm install -g vercel
```

#### Vercel Account बनाउनुहोस्
1. https://vercel.com मा जानुहोस्
2. GitHub account सँग sign up गर्नुहोस्
3. Account verify गर्नुहोस्

### 2. Quick Deployment (सबैभन्दा सजिलो)

```bash
# Automatic deployment
npm run deploy
```

यो command सबै कुरा automatic गर्छ:
- Vercel configuration create गर्छ
- Git initialize गर्छ
- Vercel मा deploy गर्छ

### 3. Manual Deployment (Step by Step)

#### Step 1: Vercel Login
```bash
vercel login
```

#### Step 2: Deploy
```bash
vercel --prod
```

#### Step 3: Environment Variables Set गर्नुहोस्
Vercel dashboard मा जानुहोस् र यी variables add गर्नुहोस्:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
PROKERALA_API_KEY=your-prokerala-api-key-here
DATABASE_URL=your-database-url-here
JWT_SECRET=your-jwt-secret-here
NODE_ENV=production
```

#### Step 4: Redeploy
```bash
vercel --prod
```

### 4. Database Setup (Production के लागि)

#### Option 1: Vercel Postgres (Recommended)
1. Vercel dashboard मा जानुहोस्
2. Storage tab मा जानुहोस्
3. Postgres database create गर्नुहोस्
4. Connection string copy गर्नुहोस्
5. Environment variables मा add गर्नुहोस्

#### Option 2: External Database
- Neon, Supabase, या अन्य PostgreSQL provider use गर्नुहोस्
- Connection string environment variables मा add गर्नुहोस्

### 5. Environment Variables (Production)

Vercel dashboard मा यी variables add गर्नुहोस्:

```bash
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here
PROKERALA_API_KEY=your-prokerala-api-key-here
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-secure-jwt-secret-here

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=Divyansh Jyotish
NODE_ENV=production

# Security
ANONYMIZE_DATA=true
DATA_RETENTION_DAYS=30
GDPR_COMPLIANT=true
```

### 6. Post-Deployment Steps

#### Database Migration
```bash
# Vercel dashboard मा go to Functions tab
# Create a new function for database migration
# Or use Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

#### Test Your Application
```bash
# Health check
curl https://your-app.vercel.app/api/unified

# Test APIs
curl -X POST https://your-app.vercel.app/api/unified \
  -H "Content-Type: application/json" \
  -d '{"action":"compute","data":{"name":"Test","date":"1990-01-01","time":"10:30","location":"Kathmandu, Nepal","language":"ne"}}'
```

### 7. Custom Domain (Optional)

#### Vercel Dashboard मा:
1. Project settings मा जानुहोस्
2. Domains tab मा जानुहोस्
3. Custom domain add गर्नुहोस्
4. DNS settings configure गर्नुहोस्

### 8. Monitoring र Analytics

#### Vercel Analytics
- Automatic performance monitoring
- Real-time analytics
- Error tracking

#### Custom Monitoring
```bash
# Health check endpoint
https://your-app.vercel.app/api/unified

# Application logs
vercel logs
```

### 9. Troubleshooting

#### Common Issues:

1. **Build Failed**
   ```bash
   # Check build logs
   vercel logs
   
   # Fix dependencies
   npm install
   npm run build
   ```

2. **Environment Variables नभएको**
   - Vercel dashboard मा check गर्नुहोस्
   - Variables properly set छन् कि check गर्नुहोस्

3. **Database Connection Error**
   - DATABASE_URL सही छ कि check गर्नुहोस्
   - Database accessible छ कि check गर्नुहोस्

4. **API Errors**
   - API keys valid छन् कि check गर्नुहोस्
   - Rate limits check गर्नुहोस्

### 10. Performance Optimization

#### Vercel Configuration
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "regions": ["bom1"]
}
```

#### Next.js Optimization
- Image optimization
- Static generation
- Edge functions

### 11. Security

#### Headers (Already configured)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

#### Environment Variables
- Never commit API keys
- Use Vercel environment variables
- Regular key rotation

### 12. Backup र Recovery

#### Database Backup
```bash
# Regular backups
pg_dump $DATABASE_URL > backup.sql
```

#### Code Backup
- Git repository
- Vercel automatic backups

## 🎉 Success!

यदि सबै कुरा ठीक छ भने, तपाईंको application अब live छ:

- ✅ https://your-app.vercel.app
- ✅ Real ProKerala API
- ✅ Real ChatGPT integration
- ✅ Production database
- ✅ SSL certificate
- ✅ Global CDN

## 📞 Support

यदि समस्या आउँछ:
1. Vercel dashboard मा logs check गर्नुहोस्
2. `vercel logs` command चलाउनुहोस्
3. Environment variables verify गर्नुहोस्
4. Database connection test गर्नुहोस्

---

**🚀 तपाईंको Divyansh Jyotish application अब Vercel मा live छ!**

Access कर्नुहोस्: https://your-app.vercel.app
