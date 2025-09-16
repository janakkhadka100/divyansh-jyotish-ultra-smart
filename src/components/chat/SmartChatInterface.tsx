'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  Languages,
  Sparkles,
  Zap,
  Brain,
  Clock,
  TrendingUp,
  Settings,
  Info,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Share2,
  Calendar,
  Moon,
  Sun
} from 'lucide-react';
import JyotishCards from './JyotishCards';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  lang: string;
  metadata?: {
    fromCache?: boolean;
    confidence?: number;
    responseTime?: number;
    tokenCount?: number;
  };
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
    heart: number;
    star: number;
  };
  isFavorite?: boolean;
  tags?: string[];
}

interface SmartChatInterfaceProps {
  sessionId: string;
  sessionData: {
    birth: any;
    result: any;
  };
  initialLanguage: 'ne' | 'hi' | 'en';
}

const SmartChatInterface: React.FC<SmartChatInterfaceProps> = ({ 
  sessionId, 
  sessionData, 
  initialLanguage 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ne' | 'hi' | 'en'>(initialLanguage);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [smartSettings, setSmartSettings] = useState({
    enableOptimization: true,
    enablePrediction: true,
    enableCaching: true,
    responseStyle: 'friendly',
    intelligenceLevel: 'high',
  });
  const [chatStats, setChatStats] = useState({
    totalMessages: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    userSatisfaction: 0,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const translations = {
    ne: {
      chatTitle: 'बुद्धिमान ज्योतिष च्याट',
      placeholder: 'तपाईंको प्रश्न लेख्नुहोस्...',
      send: 'पठाउनुहोस्',
      loading: 'लोड हुँदै...',
      language: 'भाषा',
      settings: 'सेटिङहरू',
      intelligence: 'बुद्धिमत्ता',
      optimization: 'अनुकूलन',
      prediction: 'भविष्यवाणी',
      caching: 'क्यासिङ',
      responseStyle: 'प्रतिक्रिया शैली',
      intelligenceLevel: 'बुद्धिमत्ता स्तर',
      exampleQuestions: 'उदाहरण प्रश्नहरू',
      examples: [
        'मेरो वर्तमान दशा के हो?',
        'पेसा/व्यवसायतर्फ कुन अवधि राम्रो?',
        'शुभ दिन कहिले?',
        'मेरो जन्मकुण्डलीमा के के छ?',
        'आजको पञ्चाङ्ग के छ?',
        'मेरो लग्न के हो?',
        'चन्द्र राशि के हो?',
        'मुख्य योगहरू के के छन्?',
      ],
      stats: {
        totalMessages: 'कुल सन्देश',
        averageResponseTime: 'औसत प्रतिक्रिया समय',
        cacheHitRate: 'क्यास हिट दर',
        userSatisfaction: 'प्रयोगकर्ता सन्तुष्टि',
      },
      intelligenceLevels: {
        basic: 'आधारभूत',
        medium: 'मध्यम',
        high: 'उच्च',
        expert: 'विशेषज्ञ',
      },
      responseStyles: {
        friendly: 'मित्रवत',
        professional: 'व्यावसायिक',
        mystical: 'रहस्यमय',
        analytical: 'विश्लेषणात्मक',
      },
    },
    hi: {
      chatTitle: 'बुद्धिमान ज्योतिष चैट',
      placeholder: 'अपना प्रश्न लिखें...',
      send: 'भेजें',
      loading: 'लोड हो रहा है...',
      language: 'भाषा',
      settings: 'सेटिंग्स',
      intelligence: 'बुद्धिमत्ता',
      optimization: 'अनुकूलन',
      prediction: 'भविष्यवाणी',
      caching: 'कैशिंग',
      responseStyle: 'प्रतिक्रिया शैली',
      intelligenceLevel: 'बुद्धिमत्ता स्तर',
      exampleQuestions: 'उदाहरण प्रश्न',
      examples: [
        'मेरी वर्तमान दशा क्या है?',
        'धन/व्यापार के लिए कौन सा समय अच्छा है?',
        'शुभ दिन कब है?',
        'मेरी जन्मकुंडली में क्या क्या है?',
        'आज का पंचांग क्या है?',
        'मेरा लग्न क्या है?',
        'चंद्र राशि क्या है?',
        'मुख्य योग क्या हैं?',
      ],
      stats: {
        totalMessages: 'कुल संदेश',
        averageResponseTime: 'औसत प्रतिक्रिया समय',
        cacheHitRate: 'कैश हिट दर',
        userSatisfaction: 'उपयोगकर्ता संतुष्टि',
      },
      intelligenceLevels: {
        basic: 'बुनियादी',
        medium: 'मध्यम',
        high: 'उच्च',
        expert: 'विशेषज्ञ',
      },
      responseStyles: {
        friendly: 'मित्रवत',
        professional: 'व्यावसायिक',
        mystical: 'रहस्यमय',
        analytical: 'विश्लेषणात्मक',
      },
    },
    en: {
      chatTitle: 'Smart Jyotish Chat',
      placeholder: 'Type your question...',
      send: 'Send',
      loading: 'Loading...',
      language: 'Language',
      settings: 'Settings',
      intelligence: 'Intelligence',
      optimization: 'Optimization',
      prediction: 'Prediction',
      caching: 'Caching',
      responseStyle: 'Response Style',
      intelligenceLevel: 'Intelligence Level',
      exampleQuestions: 'Example Questions',
      examples: [
        'What is my current dasha?',
        'Which period is good for money/business?',
        'When are the auspicious days?',
        'What is in my birth chart?',
        'What is today\'s panchang?',
        'What is my ascendant?',
        'What is my moon sign?',
        'What are the key yogas?',
      ],
      stats: {
        totalMessages: 'Total Messages',
        averageResponseTime: 'Avg Response Time',
        cacheHitRate: 'Cache Hit Rate',
        userSatisfaction: 'User Satisfaction',
      },
      intelligenceLevels: {
        basic: 'Basic',
        medium: 'Medium',
        high: 'High',
        expert: 'Expert',
      },
      responseStyles: {
        friendly: 'Friendly',
        professional: 'Professional',
        mystical: 'Mystical',
        analytical: 'Analytical',
      },
    },
  };

  const t = translations[language];

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
    loadChatStats();
  }, [sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle typing indicator
  useEffect(() => {
    if (inputMessage.trim()) {
      setIsTyping(true);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      setTypingTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [inputMessage]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadChatStats = async () => {
    try {
      const response = await fetch(`/api/chat/smart?sessionId=${sessionId}&type=stats`);
      const data = await response.json();
      
      if (data.success) {
        setChatStats(data.data);
      }
    } catch (error) {
      console.error('Error loading chat stats:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date().toISOString(),
      lang: language,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database
    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: inputMessage,
          language,
        }),
      });
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    setInputMessage('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: inputMessage,
          language,
          enableOptimization: smartSettings.enableOptimization,
          enablePrediction: smartSettings.enablePrediction,
          enableCaching: smartSettings.enableCaching,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';
      let responseMetadata: any = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }
              if (data.done) {
                responseMetadata = {
                  fromCache: data.fromCache,
                  confidence: data.confidence,
                  responseTime: data.totalTime,
                  tokenCount: data.totalTokens,
                };
                
                // Add final message to messages
                const assistantMessage: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: fullResponse,
                  createdAt: new Date().toISOString(),
                  lang: language,
                  metadata: responseMetadata,
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingMessage('');
                break;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      // Reload stats after successful response
      loadChatStats();

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'ne' ? 'माफ गर्नुहोस्, तपाईंको प्रश्नको जवाफ दिन सकिएन।' : 
                language === 'hi' ? 'क्षमा करें, आपके प्रश्न का उत्तर नहीं दे सका।' :
                'Sorry, I couldn\'t answer your question.',
        createdAt: new Date().toISOString(),
        lang: language,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainCard = async (cardData: any, cardType: string) => {
    const explainMessage = language === 'ne' ? 
      `${cardType} कार्डको व्याख्या गर्नुहोस्` :
      language === 'hi' ? 
      `${cardType} कार्ड की व्याख्या करें` :
      `Explain the ${cardType} card`;

    setInputMessage(explainMessage);
    
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (example: string) => {
    setInputMessage(example);
    inputRef.current?.focus();
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSmartSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold">{t.chatTitle}</h1>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Smart
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Languages className="h-4 w-4" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'ne' | 'hi' | 'en')}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="ne">नेपाली</option>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Smart Settings */}
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">{t.optimization}</label>
                  <input
                    type="checkbox"
                    checked={smartSettings.enableOptimization}
                    onChange={(e) => handleSettingsChange('enableOptimization', e.target.checked)}
                    className="ml-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.prediction}</label>
                  <input
                    type="checkbox"
                    checked={smartSettings.enablePrediction}
                    onChange={(e) => handleSettingsChange('enablePrediction', e.target.checked)}
                    className="ml-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.caching}</label>
                  <input
                    type="checkbox"
                    checked={smartSettings.enableCaching}
                    onChange={(e) => handleSettingsChange('enableCaching', e.target.checked)}
                    className="ml-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.intelligenceLevel}</label>
                  <select
                    value={smartSettings.intelligenceLevel}
                    onChange={(e) => handleSettingsChange('intelligenceLevel', e.target.value)}
                    className="ml-2 text-sm border rounded px-2 py-1"
                  >
                    <option value="basic">{t.intelligenceLevels.basic}</option>
                    <option value="medium">{t.intelligenceLevels.medium}</option>
                    <option value="high">{t.intelligenceLevels.high}</option>
                    <option value="expert">{t.intelligenceLevels.expert}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Chat Stats */}
          <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>{chatStats.totalMessages} {t.stats.totalMessages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{chatStats.averageResponseTime}ms</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{chatStats.cacheHitRate}% {t.stats.cacheHitRate}</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t.exampleQuestions}
              </h3>
              <div className="space-y-2">
                {t.examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="block w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                      {message.metadata && (
                        <div className="flex items-center space-x-1 text-xs opacity-70">
                          {message.metadata.fromCache && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-2 w-2 mr-1" />
                              Cache
                            </Badge>
                          )}
                          {message.metadata.confidence && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-2 w-2 mr-1" />
                              {Math.round(message.metadata.confidence * 100)}%
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Message */}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-2">
                  <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs opacity-70">{t.loading}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Jyotish Cards */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {language === 'ne' ? 'ज्योतिष कार्डहरू' : 
             language === 'hi' ? 'ज्योतिष कार्ड' : 
             'Jyotish Cards'}
          </h2>
          <JyotishCards
            sessionData={sessionData}
            onExplainCard={handleExplainCard}
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

export default SmartChatInterface;



