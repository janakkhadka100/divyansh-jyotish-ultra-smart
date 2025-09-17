# Environment Setup Guide

## Required Environment Variables

### 1. Database Configuration
```env
DATABASE_URL="postgresql://username:password@host:5432/database_name"
```
- **Local Development**: Use local PostgreSQL instance
- **Production**: Use Vercel Postgres, Supabase, or other PostgreSQL provider

### 2. OpenAI Configuration
```env
OPENAI_API_KEY="sk-your-openai-api-key"
```
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Required for AI chat functionality

### 3. Prokerala API Configuration
```env
PROKERALA_API_KEY="your-prokerala-api-key"
PROKERALA_CLIENT_NAME="your-client-name"
PROKERALA_CLIENT_ID="your-client-id"
PROKERALA_CLIENT_SECRET="your-client-secret"
```
- Get your API credentials from [Prokerala](https://www.prokerala.com/api/)
- Required for astrology calculations

### 4. NextAuth Configuration
```env
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"
```
- Generate a secure secret: `openssl rand -base64 32`
- Use your production domain for NEXTAUTH_URL

### 5. Application Configuration
```env
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_NAME="Divyansh Jyotish"
NODE_ENV="production"
```

### 6. Optional Configuration
```env
# Analytics
ANALYTICS_API_KEY="your-analytics-key"

# Geocoding
GOOGLE_MAPS_API_KEY="your-google-maps-key"
TIMEZONE_API_KEY="your-timezone-api-key"

# Redis (for caching)
REDIS_URL="redis://localhost:6379"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## Vercel Deployment Steps

### 1. Deploy to Vercel
```bash
# Run the deployment script
./scripts/deploy.sh

# Or manually deploy
vercel --prod
```

### 2. Set Environment Variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add all required environment variables
5. Redeploy the application

### 3. Database Setup
1. Create a PostgreSQL database (Vercel Postgres, Supabase, etc.)
2. Get the connection string
3. Set DATABASE_URL in Vercel environment variables
4. Run database migrations:
   ```bash
   pnpm prisma db push
   ```

### 4. Test the Deployment
1. Visit your deployed URL
2. Test the chat functionality
3. Test astrology calculations
4. Check all features are working

## Local Development Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd divyansh-jyotish
pnpm install
```

### 2. Environment Setup
```bash
cp env.example .env.local
# Edit .env.local with your local values
```

### 3. Database Setup
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma db push

# Seed database (optional)
pnpm prisma db seed
```

### 4. Start Development Server
```bash
pnpm dev
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure proper network access

2. **API Key Issues**
   - Verify API key validity
   - Check API key permissions
   - Ensure proper environment variable names

3. **Build Errors**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review TypeScript errors

4. **Deployment Issues**
   - Check Vercel logs
   - Verify environment variables
   - Check build output

### Debug Mode
Enable debug mode by setting:
```env
DEBUG=true
NODE_ENV=development
```

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to version control
   - Use strong, unique secrets
   - Rotate keys regularly

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Implement proper access controls

3. **API Security**
   - Implement rate limiting
   - Use HTTPS everywhere
   - Validate all inputs

## Monitoring and Maintenance

1. **Performance Monitoring**
   - Use Vercel Analytics
   - Monitor response times
   - Track error rates

2. **Security Monitoring**
   - Monitor for unusual activity
   - Set up alerts
   - Regular security audits

3. **Database Maintenance**
   - Regular backups
   - Monitor performance
   - Optimize queries

## Support

For additional support:
- Check the deployment guide
- Review error logs
- Contact the development team




