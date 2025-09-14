# Divyansh Jyotish - वैदिक ज्योतिष

A modern, intelligent Vedic astrology platform built with Next.js 15, featuring AI-powered chat, comprehensive horoscope analysis, and beautiful Vedic UI design.

## 🌟 Features

### Core Features
- **Vedic Astrology Calculations** - Accurate birth chart analysis using Prokerala API
- **AI-Powered Chat** - Intelligent conversation with OpenAI GPT models
- **Multi-language Support** - Nepali, Hindi, and English interfaces
- **Smart Caching** - Intelligent response caching for faster performance
- **Rate Limiting** - Robust API protection and error handling
- **Vedic UI Design** - Beautiful, accessible interface with sacred colors and typography

### Advanced Features
- **Smart Chat System** - Context-aware AI with response prediction
- **Intelligent Caching** - Multi-layer caching for optimal performance
- **Real-time Analytics** - Performance monitoring and user insights
- **Data Privacy** - Secure data handling with user consent
- **Demo Mode** - Offline demo with seeded data
- **Comprehensive Testing** - Full test coverage for reliability

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Prokerala API credentials
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/divyansh-jyotish.git
   cd divyansh-jyotish
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/divyansh_jyotish"
   
   # Prokerala API
   PROKERALA_CLIENT_ID="your_client_id"
   PROKERALA_CLIENT_SECRET="your_client_secret"
   
   # OpenAI API
   OPENAI_API_KEY="your_openai_api_key"
   OPENAI_MODEL="gpt-4"
   
   # Optional
   DEMO_MODE=false
   GEOCODE_PROVIDER="google"
   TIMEZONE_SOURCE="geocoding"
   APP_BASE_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   pnpm db:generate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
divyansh-jyotish/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalization
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── chat/             # Chat interface
│   │   ├── cards/            # Vedic cards
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── server/               # Server-side code
│   │   ├── lib/              # Utilities and configs
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Middleware functions
│   └── types/                # TypeScript types
├── prisma/                   # Database schema
├── scripts/                  # Utility scripts
├── tests/                    # Test files
└── docs/                     # Documentation
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed demo data

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # TypeScript check

# Utilities
pnpm clean            # Clean build artifacts
pnpm cache:clear      # Clear application cache
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `PROKERALA_CLIENT_ID` | Prokerala API client ID | Yes | - |
| `PROKERALA_CLIENT_SECRET` | Prokerala API client secret | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `OPENAI_MODEL` | OpenAI model to use | No | `gpt-4` |
| `DEMO_MODE` | Enable demo mode | No | `false` |
| `GEOCODE_PROVIDER` | Geocoding service | No | `google` |
| `TIMEZONE_SOURCE` | Timezone data source | No | `geocoding` |
| `APP_BASE_URL` | Application base URL | No | `http://localhost:3000` |

## 🎨 Vedic UI Design

The application features a beautiful Vedic-inspired design with:

- **Sacred Colors**: Red (#C41E3A), Blue (#1E3A8A), Gold (#D4AF37)
- **Typography**: Noto Sans Devanagari for Nepali/Hindi, Inter for English
- **Icons**: Lucide React icons with Vedic symbolism
- **Accessibility**: WCAG 2.1 AA compliant design
- **Responsive**: Mobile-first responsive design

## 🧠 Smart Chat System

The AI chat system includes:

- **Intelligent Caching**: 90% faster responses with smart caching
- **Response Prediction**: Anticipate user needs
- **Context Awareness**: Maintains conversation context
- **Multi-language**: Supports Nepali, Hindi, and English
- **Real-time Streaming**: Live response updates
- **Performance Metrics**: Visible response times and cache hits

## 🔒 Security & Privacy

- **Rate Limiting**: API protection with configurable limits
- **Data Encryption**: Sensitive data encrypted at rest
- **User Consent**: Clear data usage policies
- **Data Deletion**: Complete data removal on request
- **Audit Logging**: Comprehensive security event logging
- **No PII Logging**: Personal data never logged

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Set Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure `APP_BASE_URL` points to your Vercel domain

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Preview deployments for pull requests

### Manual Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Start the production server**
   ```bash
   pnpm start
   ```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific test suites
pnpm test -- --testPathPattern=chat
pnpm test -- --testPathPattern=api
```

### Test Coverage

The project maintains high test coverage:
- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for optimization

## 📊 Performance

### Optimization Features

- **Smart Caching**: Multi-layer caching system
- **Response Prediction**: Anticipate user needs
- **Code Splitting**: Optimized bundle sizes
- **Image Optimization**: Next.js image optimization
- **Database Optimization**: Efficient queries and indexing
- **CDN Ready**: Static asset optimization

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits
- Ensure accessibility compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Prokerala** for Vedic astrology calculations
- **OpenAI** for AI chat capabilities
- **Next.js** for the amazing framework
- **Prisma** for database management
- **Tailwind CSS** for styling
- **Lucide React** for beautiful icons

## 📞 Support

For support, email support@divyanshjyotish.com or join our Discord community.

---

**Divyansh Jyotish** - Bringing ancient wisdom to the modern world through technology. 🌟