'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, LogOut, Home } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  type: 'user' | 'ai';
}

interface User {
  id: string;
  name: string;
  email: string;
  birthData: {
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    ayanamsa: number;
  };
}

export default function IntelligentChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Add welcome message
    setMessages([{
      id: '1',
      message: '',
      response: userData ? 
        `नमस्कार ${JSON.parse(userData).name}! म दिव्यांश ज्योतिषका विशेषज्ञ हुँ। तपाईंको जन्म विवरण अनुसार म तपाईंलाई ज्योतिष सल्लाह दिन सक्छु। तपाईंको कुनै प्रश्न छ?` :
        'नमस्कार! म दिव्यांश ज्योतिषका विशेषज्ञ हुँ। तपाईंको ज्योतिष सम्बन्धी कुनै प्रश्न छ?',
      timestamp: new Date().toISOString(),
      type: 'ai'
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      message: inputText,
      response: '',
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          userId: user?.id,
          token: localStorage.getItem('token'),
          birthData: user?.birthData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          message: '',
          response: data.data.response,
          timestamp: data.data.timestamp,
          type: 'ai'
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          message: '',
          response: 'माफ गर्नुहोस्, त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।',
          timestamp: new Date().toISOString(),
          type: 'ai'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        message: '',
        response: 'माफ गर्नुहोस्, त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।',
        timestamp: new Date().toISOString(),
        type: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/ne/auth/signin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xl">दि</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">दिव्यांश ज्योतिष</h1>
                <p className="text-sm text-yellow-400">बुद्धिमान ज्योतिष च्याट</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-white text-sm">नमस्कार, {user.name}</p>
                  <p className="text-white/60 text-xs">{user.email}</p>
                </div>
              )}
              <div className="flex space-x-2">
                <Link href="/ne">
                  <Button variant="outline" size="sm" className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900">
                    <Home className="w-4 h-4 mr-1" />
                    होम
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white">
                  <LogOut className="w-4 h-4 mr-1" />
                  लगआउट
                </Button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-yellow-400 text-center flex items-center justify-center gap-2">
                <Bot className="w-6 h-6" />
                बुद्धिमान ज्योतिष च्याट
              </CardTitle>
              {user && (
                <div className="text-center text-white/80 text-sm">
                  तपाईंको जन्म विवरण अनुसार व्यक्तिगत सल्लाह
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user'
                            ? 'bg-yellow-400 text-slate-900'
                            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        }`}
                      >
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-yellow-400 text-slate-900'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <p className="text-sm">
                          {message.type === 'user' ? message.message : message.response}
                        </p>
                        <p className="text-xs opacity-60 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-700 text-white px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-700 p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="तपाईंको प्रश्न लेख्नुहोस्..."
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-300 hover:to-orange-400"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
