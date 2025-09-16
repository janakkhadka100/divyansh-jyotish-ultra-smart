'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Moon, 
  Sun, 
  Calendar, 
  MapPin, 
  Clock, 
  MessageSquare, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Heart,
  Brain,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface HoroscopeResult {
  sessionId: string;
  summary: {
    name: string;
    birthDate: string;
    birthTime: string;
    location: string;
    ascendant: {
      sign: string;
      degree: number;
      nakshatra: string;
    };
    moonSign: {
      sign: string;
      degree: number;
      nakshatra: string;
    };
    sunSign: {
      sign: string;
      degree: number;
      nakshatra: string;
    };
    currentDasha: {
      vimshottari: string;
      antardasha: string;
      pratyantardasha: string;
      sookshmaDasha: string;
      yoginiDasha: string;
    };
    keyYogas: Array<{
      name: string;
      type: string;
      strength: number;
    }>;
    charts: Array<{
      type: string;
      name: string;
      planetCount: number;
    }>;
    panchang: {
      tithi: string;
      nakshatra: string;
      yoga: string;
      karana: string;
    };
  };
  computedAt: string;
  provider: string;
  chatUrl: string;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<HoroscopeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the result from the API using sessionId
    // For demo purposes, we'll generate a mock result
    const sessionId = searchParams.get('sessionId');
    if (sessionId) {
      // Simulate API call
      setTimeout(() => {
        setResult({
          sessionId,
          summary: {
            name: 'दिव्यांश',
            birthDate: '1993-12-16',
            birthTime: '16:18',
            location: 'काठमाडौं, नेपाल',
            ascendant: {
              sign: 'मेष',
              degree: 15,
              nakshatra: 'भरणी'
            },
            moonSign: {
              sign: 'कर्क',
              degree: 8,
              nakshatra: 'पुनर्वसु'
            },
            sunSign: {
              sign: 'धनु',
              degree: 22,
              nakshatra: 'पूर्वाषाढा'
            },
            currentDasha: {
              vimshottari: 'चन्द्र',
              antardasha: 'मंगल',
              pratyantardasha: 'सूर्य',
              sookshmaDasha: 'बुध',
              yoginiDasha: 'शुक्र'
            },
            keyYogas: [
              { name: 'राजयोग', type: 'शुभ', strength: 5 },
              { name: 'धनयोग', type: 'शुभ', strength: 4 },
              { name: 'विद्यायोग', type: 'शुभ', strength: 5 },
              { name: 'कर्मयोग', type: 'शुभ', strength: 3 },
              { name: 'भाग्ययोग', type: 'शुभ', strength: 4 }
            ],
            charts: [
              { type: 'राशि', name: 'राशि चार्ट', planetCount: 9 },
              { type: 'नवमांश', name: 'नवमांश चार्ट', planetCount: 9 },
              { type: 'दशमांश', name: 'दशमांश चार्ट', planetCount: 9 }
            ],
            panchang: {
              tithi: 'शुक्ल पक्ष',
              nakshatra: 'भरणी',
              yoga: 'सिद्धि',
              karana: 'विष्टि'
            }
          },
          computedAt: new Date().toISOString(),
          provider: 'demo',
          chatUrl: `/ne/chat?sessionId=${sessionId}`
        });
        setLoading(false);
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">ज्योतिष पढाइ तयार गर्दै...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-96 bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">त्रुटि</h2>
            <p className="text-white/80 mb-4">ज्योतिष परिणाम फेला परेन।</p>
            <Link href="/ne">
              <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                होमपेजमा फर्कनुहोस्
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Link href="/ne" className="text-2xl font-bold text-yellow-400">
            दिव्यांश ज्योतिष
          </Link>
          <div className="flex space-x-4">
            <Link href={result.chatUrl}>
              <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300">
                <MessageSquare className="w-4 h-4 mr-2" />
                ज्योतिष च्याट
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            ज्योतिष पढाइ तयार भयो!
          </h1>
          <p className="text-white/80 text-lg">
            {result.summary.name} को जन्मकुण्डली सफलतापूर्वक गणना भयो
          </p>
        </div>

        {/* Birth Details */}
        <Card className="mb-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              जन्म विवरण
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">नाम</p>
                  <p className="text-white font-medium">{result.summary.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">जन्म मिति</p>
                  <p className="text-white font-medium">{result.summary.birthDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">जन्म समय</p>
                  <p className="text-white font-medium">{result.summary.birthTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">जन्म स्थान</p>
                  <p className="text-white font-medium">{result.summary.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Astrological Details */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Ascendant, Moon, Sun Signs */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <Star className="w-5 h-5" />
                मुख्य राशिहरू
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sun className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="text-white/60 text-sm">लग्न</p>
                    <p className="text-white font-medium">{result.summary.ascendant.sign}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {result.summary.ascendant.degree}°
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Moon className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white/60 text-sm">चन्द्र राशि</p>
                    <p className="text-white font-medium">{result.summary.moonSign.sign}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {result.summary.moonSign.degree}°
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sun className="w-6 h-6 text-orange-400" />
                  <div>
                    <p className="text-white/60 text-sm">सूर्य राशि</p>
                    <p className="text-white font-medium">{result.summary.sunSign.sign}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-orange-400 border-orange-400">
                  {result.summary.sunSign.degree}°
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Current Dasha */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                वर्तमान दशा
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white/60 text-sm">विंशोत्तरी दशा</p>
                <p className="text-white font-medium text-lg">{result.summary.currentDasha.vimshottari}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white/60 text-sm">अन्तर्दशा</p>
                <p className="text-white font-medium">{result.summary.currentDasha.antardasha}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-white/60 text-sm">प्रत्यन्तर्दशा</p>
                <p className="text-white font-medium">{result.summary.currentDasha.pratyantardasha}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Yogas */}
        <Card className="mb-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              मुख्य योगहरू
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.summary.keyYogas.map((yoga, index) => (
                <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{yoga.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={yoga.type === 'शुभ' ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}
                    >
                      {yoga.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < yoga.strength ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-white/60 text-sm">शक्ति: {yoga.strength}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={result.chatUrl}>
              <Button className="px-8 py-4 bg-yellow-400 text-slate-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors">
                <MessageSquare className="w-5 h-5 mr-2" />
                ज्योतिषीसँग कुरा गर्नुहोस्
              </Button>
            </Link>
            <Link href="/ne/dashboard">
              <Button variant="outline" className="px-8 py-4 border-2 border-yellow-400 text-yellow-400 font-bold rounded-lg hover:bg-yellow-400 hover:text-slate-900 transition-colors">
                <Heart className="w-5 h-5 mr-2" />
                ड्यासबोर्ड हेर्नुहोस्
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


