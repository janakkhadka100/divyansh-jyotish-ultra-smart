'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { geocodingService } from '@/server/services/geocoding';

interface BirthDetails {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

interface BirthDetailsFormProps {
  onSubmit: (data: BirthDetails & { coordinates: { latitude: number; longitude: number; timezone: string } }) => void;
  loading?: boolean;
}

export default function BirthDetailsForm({ onSubmit, loading = false }: BirthDetailsFormProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<BirthDetails>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.birthDate || !formData.birthTime || !formData.birthPlace) {
      alert('कृपया सबै फिल्ड भर्नुहोस्');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get coordinates for the birth place
      const coordinates = await geocodingService.getCoordinates(formData.birthPlace);
      
      // Create session with birth data
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          locale: 'ne',
          birthData: {
            name: formData.name,
            rawDate: formData.birthDate,
            rawTime: formData.birthTime,
            location: formData.birthPlace,
            lat: coordinates.latitude,
            lon: coordinates.longitude,
            tzId: coordinates.timezone,
            tzOffsetMinutes: new Date().getTimezoneOffset() * -1, // Convert to positive offset
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Generate horoscope
        const horoscopeResponse = await fetch(`/api/sessions/${result.data.id}/horoscope`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: result.data.id,
            provider: 'prokerala',
          }),
        });

        const horoscopeResult = await horoscopeResponse.json();
        
        if (horoscopeResult.success) {
          onSubmit({
            ...formData,
            sessionId: result.data.id,
            coordinates: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              timezone: coordinates.timezone,
            },
          });
        } else {
          alert('ज्योतिष गणना गर्नमा त्रुटि भयो: ' + horoscopeResult.error);
        }
      } else {
        alert('सत्र बनाउनमा त्रुटि भयो: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।');
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

  return (
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('common.name')}
            </label>
            <Input 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="आफ्नो नाम लेख्नुहोस्" 
              className="vedic-input devanagari"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('common.birthDate')}
            </label>
            <Input 
              type="date" 
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="vedic-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('common.birthTime')}
            </label>
            <Input 
              type="time" 
              value={formData.birthTime}
              onChange={(e) => handleInputChange('birthTime', e.target.value)}
              className="vedic-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-vedic-white font-medium devanagari flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('common.birthPlace')}
            </label>
            <Input 
              value={formData.birthPlace}
              onChange={(e) => handleInputChange('birthPlace', e.target.value)}
              placeholder="जन्म स्थान (शहर, देश)" 
              className="vedic-input devanagari"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full vedic-button text-lg py-3"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? 'प्रक्रियामा...' : t('landing.getReading')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
