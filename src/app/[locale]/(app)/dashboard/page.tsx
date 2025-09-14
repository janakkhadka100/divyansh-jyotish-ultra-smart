import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MessageCircle, Star, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-vedic-gold devanagari">
            {t('dashboard.title')}
          </div>
          <Button variant="vedic" className="devanagari">
            {t('dashboard.chatWithAstrologer')}
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-vedic-gold mb-2 devanagari">
            {t('dashboard.welcome')}, दिव्यांश
          </h1>
          <p className="text-vedic-white/80 devanagari">
            आफ्नो ज्योतिष यात्रा शुरू गर्नुहोस्
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="vedic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-vedic-white/60 devanagari">कुल चार्ट</p>
                  <p className="text-2xl font-bold text-vedic-gold">3</p>
                </div>
                <BarChart3 className="h-8 w-8 text-vedic-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="vedic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-vedic-white/60 devanagari">पढाइहरू</p>
                  <p className="text-2xl font-bold text-vedic-gold">12</p>
                </div>
                <Star className="h-8 w-8 text-vedic-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="vedic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-vedic-white/60 devanagari">च्याट सत्र</p>
                  <p className="text-2xl font-bold text-vedic-gold">5</p>
                </div>
                <MessageCircle className="h-8 w-8 text-vedic-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="vedic-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-vedic-white/60 devanagari">अन्तिम पढाइ</p>
                  <p className="text-sm font-bold text-vedic-gold">२ दिन अगाडि</p>
                </div>
                <Calendar className="h-8 w-8 text-vedic-red" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Charts */}
          <Card className="vedic-card">
            <CardHeader>
              <CardTitle className="text-vedic-red devanagari">
                {t('dashboard.myCharts')}
              </CardTitle>
              <CardDescription className="text-vedic-white/80 devanagari">
                आफ्ना सबै ज्योतिष चार्टहरू
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-vedic-blue/30 rounded-lg">
                <h3 className="font-semibold text-vedic-white devanagari">जन्मकुण्डली</h3>
                <p className="text-sm text-vedic-white/60 devanagari">मुख्य जन्म चार्ट</p>
                <p className="text-xs text-vedic-gold">२ दिन अगाडि निर्मित</p>
              </div>
              <div className="p-4 border border-vedic-blue/30 rounded-lg">
                <h3 className="font-semibold text-vedic-white devanagari">दशा चार्ट</h3>
                <p className="text-sm text-vedic-white/60 devanagari">वर्तमान दशा विश्लेषण</p>
                <p className="text-xs text-vedic-gold">१ हप्ता अगाडि निर्मित</p>
              </div>
              <Button variant="outline" className="w-full text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900 devanagari">
                नयाँ चार्ट बनाउनुहोस्
              </Button>
            </CardContent>
          </Card>

          {/* Recent Readings */}
          <Card className="vedic-card">
            <CardHeader>
              <CardTitle className="text-vedic-red devanagari">
                {t('dashboard.recentReadings')}
              </CardTitle>
              <CardDescription className="text-vedic-white/80 devanagari">
                हालका ज्योतिष पढाइहरू
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-vedic-blue/30 rounded-lg">
                <h3 className="font-semibold text-vedic-white devanagari">करियर भविष्यवाणी</h3>
                <p className="text-sm text-vedic-white/60 devanagari">तपाईंको करियरमा आउने परिवर्तनहरू</p>
                <p className="text-xs text-vedic-gold">१ दिन अगाडि</p>
              </div>
              <div className="p-4 border border-vedic-blue/30 rounded-lg">
                <h3 className="font-semibold text-vedic-white devanagari">प्रेम जीवन</h3>
                <p className="text-sm text-vedic-white/60 devanagari">प्रेम र विवाह सम्बन्धी भविष्यवाणी</p>
                <p className="text-xs text-vedic-gold">३ दिन अगाडि</p>
              </div>
              <Button variant="outline" className="w-full text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900 devanagari">
                सबै पढाइहरू हेर्नुहोस्
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
