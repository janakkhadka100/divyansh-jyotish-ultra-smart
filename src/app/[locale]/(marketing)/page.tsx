import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-vedic-gold devanagari">
            {t('landing.title')}
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" className="text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900">
              नेपाली
            </Button>
            <Button variant="outline" className="text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900">
              हिन्दी
            </Button>
            <Button variant="outline" className="text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900">
              English
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-vedic-gold mb-4 devanagari">
            {t('landing.title')}
          </h1>
          <p className="text-xl text-vedic-white mb-2 devanagari">
            {t('landing.subtitle')}
          </p>
          <p className="text-lg text-vedic-white/80 devanagari">
            {t('landing.description')}
          </p>
        </div>

        {/* Birth Details Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="vedic-card">
            <CardHeader>
              <CardTitle className="text-2xl text-vedic-red text-center devanagari">
                {t('landing.formTitle')}
              </CardTitle>
              <CardDescription className="text-center text-vedic-white/80 devanagari">
                सही जन्म विवरण दिनुहोस् र आफ्नो ज्योतिष पढाइ पाउनुहोस्
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('common.name')}
                  </label>
                  <Input 
                    placeholder="आफ्नो नाम लेख्नुहोस्" 
                    className="vedic-input devanagari"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('common.birthDate')}
                  </label>
                  <Input 
                    type="date" 
                    className="vedic-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('common.birthTime')}
                  </label>
                  <Input 
                    type="time" 
                    className="vedic-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('common.birthPlace')}
                  </label>
                  <Input 
                    placeholder="जन्म स्थान (शहर, देश)" 
                    className="vedic-input devanagari"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full vedic-button text-lg py-3"
                >
                  {t('landing.getReading')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card className="vedic-card text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🔮</div>
              <h3 className="text-xl font-semibold text-vedic-red mb-2 devanagari">
                जन्मकुण्डली
              </h3>
              <p className="text-vedic-white/80 devanagari">
                आफ्नो विस्तृत जन्मकुण्डली र ग्रहहरूको स्थिति जान्नुहोस्
              </p>
            </CardContent>
          </Card>

          <Card className="vedic-card text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold text-vedic-red mb-2 devanagari">
                दशा विश्लेषण
              </h3>
              <p className="text-vedic-white/80 devanagari">
                आफ्नो वर्तमान र भविष्यका दशा अवधिहरू जान्नुहोस्
              </p>
            </CardContent>
          </Card>

          <Card className="vedic-card text-center">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-vedic-red mb-2 devanagari">
                ज्योतिष च्याट
              </h3>
              <p className="text-vedic-white/80 devanagari">
                ज्योतिषीसँग सीधै कुरा गर्नुहोस् र प्रश्नहरूको जवाफ पाउनुहोस्
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-vedic-red/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-vedic-white/60 devanagari">
            © 2024 दिव्यांश ज्योतिष - सबै अधिकार सुरक्षित
          </p>
        </div>
      </footer>
    </div>
  );
}
