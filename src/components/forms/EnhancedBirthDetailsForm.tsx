'use client';

import { useState } from 'react';
// import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, User, MessageSquare, Loader2 } from 'lucide-react';

interface BirthDetails {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  ayanamsa: number;
}

interface ComputeResult {
  success: boolean;
  data: {
    sessionId: string;
    summary: {
      name: string;
      birthDate: string;
      birthTime: string;
      location: string;
      ascendant: { sign: string; degree: number; nakshatra: string };
      moonSign: { sign: string; degree: number; nakshatra: string };
      sunSign: { sign: string; degree: number; nakshatra: string };
      currentDasha: any;
      keyYogas: any[];
      charts: any[];
      panchang: any;
    };
    computedAt: string;
    provider: string;
    chatUrl: string;
  };
  error?: string;
}

interface EnhancedBirthDetailsFormProps {
  locale: 'ne' | 'hi' | 'en';
}

export default function EnhancedBirthDetailsForm({ locale }: EnhancedBirthDetailsFormProps) {
  // const t = useTranslations();
  const [formData, setFormData] = useState<BirthDetails>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    ayanamsa: 1, // Default to Lahiri
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    ne: {
      formTitle: 'ज्योतिष पढाइ पाउनुहोस्',
      formDescription: 'सही जन्म विवरण दिनुहोस् र आफ्नो ज्योतिष पढाइ पाउनुहोस्',
      name: 'नाम',
      namePlaceholder: 'आफ्नो नाम लेख्नुहोस्',
      birthDate: 'जन्म मिति',
      birthTime: 'जन्म समय',
      birthPlace: 'जन्म स्थान',
      birthPlacePlaceholder: 'जन्म स्थान (शहर, देश)',
      getReading: 'ज्योतिष पढाइ पाउनुहोस्',
      processing: 'प्रक्रियामा...',
      success: {
        title: 'ज्योतिष पढाइ तयार भयो!',
        description: 'तपाईंको जन्मकुण्डली सफलतापूर्वक गणना भयो।',
        sessionId: 'सत्र ID:',
        ascendant: 'लग्न:',
        moonSign: 'चन्द्र राशि:',
        sunSign: 'सूर्य राशि:',
        goToChat: 'ज्योतिष च्याटमा जानुहोस्',
      },
      errors: {
        fillAll: 'कृपया सबै फिल्ड भर्नुहोस्',
        computeError: 'ज्योतिष गणना गर्नमा त्रुटि भयो:',
        tryAgain: 'त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।',
      },
    },
    hi: {
      formTitle: 'ज्योतिष पढ़ाई पाएं',
      formDescription: 'सही जन्म विवरण दें और अपनी ज्योतिष पढ़ाई पाएं',
      name: 'नाम',
      namePlaceholder: 'अपना नाम लिखें',
      birthDate: 'जन्म तिथि',
      birthTime: 'जन्म समय',
      birthPlace: 'जन्म स्थान',
      birthPlacePlaceholder: 'जन्म स्थान (शहर, देश)',
      getReading: 'ज्योतिष पढ़ाई पाएं',
      processing: 'प्रक्रिया में...',
      success: {
        title: 'ज्योतिष पढ़ाई तैयार!',
        description: 'आपकी जन्मकुंडली सफलतापूर्वक गणना की गई।',
        sessionId: 'सत्र ID:',
        ascendant: 'लग्न:',
        moonSign: 'चंद्र राशि:',
        sunSign: 'सूर्य राशि:',
        goToChat: 'ज्योतिष चैट में जाएं',
      },
      errors: {
        fillAll: 'कृपया सभी फील्ड भरें',
        computeError: 'ज्योतिष गणना में त्रुटि:',
        tryAgain: 'त्रुटि हुई। कृपया फिर से प्रयास करें।',
      },
    },
    en: {
      formTitle: 'Get Your Jyotish Reading',
      formDescription: 'Enter accurate birth details and get your personalized astrology reading',
      name: 'Name',
      namePlaceholder: 'Enter your name',
      birthDate: 'Birth Date',
      birthTime: 'Birth Time',
      birthPlace: 'Birth Place',
      birthPlacePlaceholder: 'Birth place (city, country)',
      getReading: 'Get Jyotish Reading',
      processing: 'Processing...',
      success: {
        title: 'Jyotish Reading Ready!',
        description: 'Your birth chart has been calculated successfully.',
        sessionId: 'Session ID:',
        ascendant: 'Ascendant:',
        moonSign: 'Moon Sign:',
        sunSign: 'Sun Sign:',
        goToChat: 'Go to Jyotish Chat',
      },
      errors: {
        fillAll: 'Please fill all fields',
        computeError: 'Error computing horoscope:',
        tryAgain: 'An error occurred. Please try again.',
      },
    },
  };

  const messages = translations[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.birthDate || !formData.birthTime || !formData.birthPlace) {
      setError(messages.errors.fillAll);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compute-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          date: formData.birthDate,
          time: formData.birthTime,
          location: formData.birthPlace,
          lang: locale,
          ayanamsa: formData.ayanamsa,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to results page
        window.location.href = `/ne/results?sessionId=${data.data.sessionId}`;
      } else {
        setError(`${messages.errors.computeError} ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('Error computing horoscope:', error);
      setError(messages.errors.tryAgain);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BirthDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthDate: '',
      birthTime: '',
      birthPlace: '',
      ayanamsa: 1,
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-800/50 border-slate-700 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-yellow-400 text-center">
            {messages.formTitle}
          </CardTitle>
          <CardDescription className="text-center text-white/80">
            {messages.formDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-white font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {messages.name}
                </label>
                <Input 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={messages.namePlaceholder} 
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {messages.birthDate}
                </label>
                <Input 
                  type="date" 
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {messages.birthTime}
                </label>
                <Input 
                  type="time" 
                  value={formData.birthTime}
                  onChange={(e) => handleInputChange('birthTime', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {messages.birthPlace}
                </label>
                <Input 
                  value={formData.birthPlace}
                  onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                  placeholder={messages.birthPlacePlaceholder} 
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  अयनांश
                </label>
                <select 
                  value={formData.ayanamsa}
                  onChange={(e) => handleInputChange('ayanamsa', parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400 rounded-md px-3 py-2"
                  required
                >
                  <option value={1}>लाहिरी (Lahiri)</option>
                  <option value={2}>रामन (Raman)</option>
                  <option value={3}>कृष्णमूर्ति (Krishnamurti)</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-bold text-lg py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {messages.processing}
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    {messages.getReading}
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  {messages.success.title}
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  {messages.success.description}
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{messages.success.sessionId}</span>
                    <span className="font-mono text-xs">{result.data.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{messages.success.ascendant}</span>
                    <span>{result.data.summary.ascendant.sign} ({result.data.summary.ascendant.degree}°)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{messages.success.moonSign}</span>
                    <span>{result.data.summary.moonSign.sign} ({result.data.summary.moonSign.degree}°)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{messages.success.sunSign}</span>
                    <span>{result.data.summary.sunSign.sign} ({result.data.summary.sunSign.degree}°)</span>
                  </div>
                </div>
                {result.data.chatUrl && (
                  <div className="pt-4 border-t border-green-200 dark:border-green-800">
                    <a
                      href={result.data.chatUrl}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {messages.success.goToChat}
                    </a>
                  </div>
                )}
              </div>
              
              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full"
              >
                {locale === 'ne' ? 'नयाँ ज्योतिष पढाइ' :
                 locale === 'hi' ? 'नई ज्योतिष पढ़ाई' :
                 'New Jyotish Reading'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
