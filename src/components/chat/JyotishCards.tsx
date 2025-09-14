'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VedicCard from '@/components/cards/VedicCards';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Star, 
  Moon, 
  Sun, 
  Zap,
  TrendingUp,
  Info
} from 'lucide-react';

interface JyotishCardsProps {
  sessionData: {
    birth: {
      name: string;
      date: string;
      time: string;
      location: string;
      lat: number;
      lon: number;
      tzId: string;
    };
    result: {
      summary: any;
      payload: any;
    };
  };
  onExplainCard: (cardData: any, cardType: string) => void;
  language: 'ne' | 'hi' | 'en';
}

const JyotishCards: React.FC<JyotishCardsProps> = ({ 
  sessionData, 
  onExplainCard, 
  language 
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const translations = {
    ne: {
      birthSummary: 'जन्म सारांश',
      lagna: 'लग्न (D1)',
      navamsa: 'नवांश (D9)',
      currentDasha: 'वर्तमान दशा',
      upcomingPeriods: 'आगामी अवधिहरू',
      keyYogas: 'मुख्य योगहरू',
      panchangSnapshot: 'पञ्चाङ्ग स्नैपशट',
      explainThis: 'यो कार्ड व्याख्या गर्नुहोस्',
      expand: 'फैलाउनुहोस्',
      collapse: 'सङ्कुचन गर्नुहोस्',
    },
    hi: {
      birthSummary: 'जन्म सारांश',
      lagna: 'लग्न (D1)',
      navamsa: 'नवांश (D9)',
      currentDasha: 'वर्तमान दशा',
      upcomingPeriods: 'आगामी अवधियां',
      keyYogas: 'मुख्य योग',
      panchangSnapshot: 'पंचांग स्नैपशॉट',
      explainThis: 'इस कार्ड की व्याख्या करें',
      expand: 'विस्तार करें',
      collapse: 'सिकुड़ें',
    },
    en: {
      birthSummary: 'Birth Summary',
      lagna: 'Lagna (D1)',
      navamsa: 'Navamsa (D9)',
      currentDasha: 'Current Dasha',
      upcomingPeriods: 'Upcoming Periods',
      keyYogas: 'Key Yogas',
      panchangSnapshot: 'Panchang Snapshot',
      explainThis: 'Explain This Card',
      expand: 'Expand',
      collapse: 'Collapse',
    },
  };

  const t = translations[language];

  const { birth, result } = sessionData;
  const summary = result.summary || {};
  const payload = result.payload || {};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ne' ? 'ne-NP' : language === 'hi' ? 'hi-IN' : 'en-US');
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(language === 'ne' ? 'ne-NP' : language === 'hi' ? 'hi-IN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSignEmoji = (sign: string) => {
    const signEmojis: { [key: string]: string } = {
      'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
      'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
      'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓',
      'Mesha': '♈', 'Vrishabha': '♉', 'Mithuna': '♊', 'Karka': '♋',
      'Simha': '♌', 'Kanya': '♍', 'Tula': '♎', 'Vrishchika': '♏',
      'Dhanu': '♐', 'Makara': '♑', 'Kumbha': '♒', 'Meena': '♓',
    };
    return signEmojis[sign] || '⭐';
  };

  const CardWrapper: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    cardType: string;
    children: React.ReactNode;
    data?: any;
  }> = ({ title, icon, cardType, children, data }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedCard(expandedCard === cardType ? null : cardType)}
            >
              {expandedCard === cardType ? t.collapse : t.expand}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExplainCard(data || summary, cardType)}
            >
              <Info className="h-3 w-3 mr-1" />
              {t.explainThis}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Birth Summary Card */}
      <VedicCard
        title="Birth Summary"
        titleNe={t.birthSummary}
        titleHi={t.birthSummary}
        icon={<Calendar className="h-4 w-4" />}
        data={{
          birthDate: formatDate(birth.date),
          birthTime: formatTime(birth.time),
          birthPlace: birth.location,
          name: birth.name,
          timezone: birth.tzId,
        }}
        language={language}
        onExplain={onExplainCard}
      />

      {/* Lagna (D1) Card */}
      <VedicCard
        title="Lagna D1"
        titleNe={t.lagna}
        titleHi={t.lagna}
        icon={<Star className="h-4 w-4" />}
        data={{
          ascendant: summary.ascendant?.sign,
          ascendantDegree: summary.ascendant?.degree,
          moonSign: summary.moonSign?.sign,
          moonDegree: summary.moonSign?.degree,
          sunSign: summary.sunSign?.sign,
          sunDegree: summary.sunSign?.degree,
          positions: payload.kundli?.charts?.[0]?.positions?.slice(0, 5),
        }}
        language={language}
        onExplain={onExplainCard}
      />

      {/* Navamsa (D9) Card */}
      <VedicCard
        title="Navamsa D9"
        titleNe={t.navamsa}
        titleHi={t.navamsa}
        icon={<Zap className="h-4 w-4" />}
        data={{
          available: !!payload.kundli?.charts?.[1],
          positions: payload.kundli?.charts?.[1]?.positions?.slice(0, 5),
          positionCount: payload.kundli?.charts?.[1]?.positions?.length || 0,
        }}
        language={language}
        onExplain={onExplainCard}
      />

      {/* Current Dasha Card */}
      <VedicCard
        title="Current Dasha"
        titleNe={t.currentDasha}
        titleHi={t.currentDasha}
        icon={<TrendingUp className="h-4 w-4" />}
        data={{
          vimshottari: summary.currentDasha?.vimshottari,
          antardasha: summary.currentDasha?.antardasha,
          pratyantardasha: summary.currentDasha?.pratyantardasha,
          endDate: summary.currentDasha?.endDate,
        }}
        language={language}
        onExplain={onExplainCard}
      />

      {/* Upcoming Periods Card */}
      <VedicCard
        title="Upcoming Periods"
        titleNe={t.upcomingPeriods}
        titleHi={t.upcomingPeriods}
        icon={<Clock className="h-4 w-4" />}
        data={{
          available: !!payload.dashas,
          nextChange: payload.dashas?.vimshottari?.currentDasha?.endDate ? 
            formatDate(payload.dashas.vimshottari.currentDasha.endDate) : 'Unknown',
          periods: payload.dashas?.vimshottari?.upcomingPeriods?.slice(0, 3),
        }}
        language={language}
        onExplain={onExplainCard}
      />

      {/* Key Yogas Card */}
      <VedicCard
        title="Key Yogas"
        titleNe={t.keyYogas}
        titleHi={t.keyYogas}
        icon={<Star className="h-4 w-4" />}
        data={{
          yogas: summary.keyYogas?.slice(0, 3) || [],
          totalYogas: summary.keyYogas?.length || 0,
          topYogas: summary.keyYogas?.filter((y: any) => y.strength >= 8) || [],
        }}
        language={language}
        onExplain={onExplainCard}
      />

      {/* Panchang Snapshot Card */}
      <VedicCard
        title="Panchang Snapshot"
        titleNe={t.panchangSnapshot}
        titleHi={t.panchangSnapshot}
        icon={<Calendar className="h-4 w-4" />}
        data={{
          tithi: summary.panchang?.tithi,
          nakshatra: summary.panchang?.nakshatra,
          yoga: summary.panchang?.yoga,
          karana: summary.panchang?.karana,
          available: !!summary.panchang,
        }}
        language={language}
        onExplain={onExplainCard}
      />
    </div>
  );
};

export default JyotishCards;
