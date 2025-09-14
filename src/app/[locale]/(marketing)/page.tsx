import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EnhancedBirthDetailsForm from '@/components/forms/EnhancedBirthDetailsForm';
import { useState } from 'react';

export default function LandingPage() {
  const t = useTranslations();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFormSubmit = async (data: any) => {
    setIsGenerating(true);
    
    try {
      // Generate birth chart using Prokerala API
      const response = await fetch('/api/astrology/birth-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: data.coordinates.latitude,
          longitude: data.coordinates.longitude,
          datetime: `${data.birthDate}T${data.birthTime}:00`,
          timezone: data.coordinates.timezone,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Redirect to dashboard with chart data
        // For now, just show success message
        alert('जन्मकुण्डली सफलतापूर्वक बन्यो!');
      } else {
        alert('त्रुटि: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating birth chart:', error);
      alert('जन्मकुण्डली बनाउनमा त्रुटि भयो।');
    } finally {
      setIsGenerating(false);
    }
  };

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
        <EnhancedBirthDetailsForm 
          locale={params.locale as 'ne' | 'hi' | 'en'}
        />
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
