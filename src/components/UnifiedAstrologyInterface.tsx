'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AstrologicalData {
  kundli: {
    ascendant: {
      signName: string;
      degree: number;
      nakshatraName: string;
    };
    moonSign: {
      signName: string;
      degree: number;
      nakshatraName: string;
    };
    sunSign: {
      signName: string;
      degree: number;
      nakshatraName: string;
    };
    planets: Array<{
      name: string;
      sign: string;
      degree: number;
      house: number;
    }>;
    houses: Array<{
      number: number;
      sign: string;
      lord: string;
    }>;
    yogas: Array<{
      yogaName: string;
      yogaType: string;
      strength: string;
    }>;
  };
  dasha: {
    currentPeriod: {
      vimshottari: string;
      antardasha: string;
      pratyantardasha: string;
      sookshmaDasha: string;
      yoginiDasha: string;
    };
    periods: Array<{
      planet: string;
      startDate: string;
      endDate: string;
      remaining: string;
    }>;
  };
  panchang: {
    tithi: {
      name: string;
      number: number;
    };
    nakshatra: {
      name: string;
      number: number;
    };
    yoga: {
      name: string;
      number: number;
    };
    karana: {
      name: string;
      number: number;
    };
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  type: 'user' | 'ai';
}

export default function UnifiedAstrologyInterface() {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    language: 'ne' as 'ne' | 'hi' | 'en',
  });

  const [astrologicalData, setAstrologicalData] = useState<AstrologicalData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'compute',
          data: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAstrologicalData(result.data.astrologicalData);
        setSessionId(result.data.sessionId);
        setChatMessages([]); // Clear previous chat
      } else {
        setError(result.error || 'Failed to compute horoscope');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !sessionId) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatLoading(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      message: userMessage,
      response: '',
      timestamp: new Date().toISOString(),
      type: 'user',
    };

    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch('/api/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          data: {
            message: userMessage,
            sessionId: sessionId,
            language: formData.language,
            astrologicalData: astrologicalData,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: '',
          response: result.data.message,
          timestamp: result.data.timestamp,
          type: 'ai',
        };

        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        setError(result.error || 'Failed to get AI response');
      }
    } catch (err) {
      setError('Chat error occurred');
      console.error('Chat error:', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🌟 Divyansh Jyotish - Unified Astrology Interface
          </h1>
          <p className="text-xl text-blue-200">
            Real ProKerala API + ChatGPT Integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form and Results */}
          <div className="space-y-6">
            {/* Birth Details Form */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">जन्म विवरण (Birth Details)</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      नाम (Name)
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="आफ्नो नाम लेख्नुहोस्"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        जन्म मिति (Date)
                      </label>
                      <Input
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="bg-white/20 border-white/30 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        जन्म समय (Time)
                      </label>
                      <Input
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="bg-white/20 border-white/30 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      जन्म स्थान (Location)
                    </label>
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="काठमाडौं, नेपाल"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      भाषा (Language)
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-md bg-white/20 border border-white/30 text-white"
                    >
                      <option value="ne">नेपाली (Nepali)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                  >
                    {loading ? 'गणना गर्दै...' : 'जन्मकुण्डली गणना गर्नुहोस्'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="bg-red-500/20 backdrop-blur-sm border-red-500/30">
                <CardContent className="pt-6">
                  <p className="text-red-200">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Astrological Results */}
            {astrologicalData && (
              <div className="space-y-4">
                {/* Basic Info */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">मूल जानकारी (Basic Info)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Badge className="bg-blue-500 text-white">लग्न (Ascendant)</Badge>
                        <p className="text-white mt-1">{astrologicalData.kundli.ascendant.signName}</p>
                      </div>
                      <div>
                        <Badge className="bg-green-500 text-white">चन्द्र राशि (Moon Sign)</Badge>
                        <p className="text-white mt-1">{astrologicalData.kundli.moonSign.signName}</p>
                      </div>
                    </div>
                    <div>
                      <Badge className="bg-yellow-500 text-white">सूर्य राशि (Sun Sign)</Badge>
                      <p className="text-white mt-1">{astrologicalData.kundli.sunSign.signName}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Dasha */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">वर्तमान दशा (Current Dasha)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Badge className="bg-purple-500 text-white">विम्शोत्तरी</Badge>
                        <p className="text-white mt-1">{astrologicalData.dasha.currentPeriod.vimshottari}</p>
                      </div>
                      <div>
                        <Badge className="bg-pink-500 text-white">अन्तर्दशा</Badge>
                        <p className="text-white mt-1">{astrologicalData.dasha.currentPeriod.antardasha}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Yogas */}
                {astrologicalData.kundli.yogas.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">योगहरू (Yogas)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {astrologicalData.kundli.yogas.map((yoga, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-white">{yoga.yogaName}</span>
                            <Badge className="bg-orange-500 text-white">{yoga.strength}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Chat Interface */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-white text-lg">AI ज्योतिष सल्लाहकार (AI Astrology Advisor)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message || msg.response}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/20 text-white p-3 rounded-lg">
                        <p className="text-sm">AI सोच्दै... (AI thinking...)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="तपाईंको प्रश्न लेख्नुहोस्..."
                    className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    disabled={!sessionId || chatLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!sessionId || chatLoading || !chatMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    पठाउनुहोस्
                  </Button>
                </form>

                {!sessionId && (
                  <p className="text-white/70 text-sm text-center mt-4">
                    पहिले जन्मकुण्डली गणना गर्नुहोस्
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
