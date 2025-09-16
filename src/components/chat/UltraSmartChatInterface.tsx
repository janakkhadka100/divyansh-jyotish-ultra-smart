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
  Sun,
  Target,
  Lightbulb,
  BarChart3,
  Activity,
  Cpu,
  Database,
  Layers,
  Eye,
  EyeOff,
  Zap as ZapIcon,
  Brain as BrainIcon,
  Heart as HeartIcon,
  Target as TargetIcon
} from 'lucide-react';
import JyotishCards from './JyotishCards';

interface UltraSmartMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  lang: string;
  metadata?: {
    responseTime?: number;
    emotionalContext?: string;
    predictionCount?: number;
    learningInsights?: any;
    confidence?: number;
    reasoning?: string;
  };
  predictions?: {
    response: string;
    confidence: number;
    reasoning: string;
  }[];
  emotionalContext?: {
    emotion: string;
    intensity: number;
    confidence: number;
    suggestedTone: string;
  };
  learningInsights?: any;
}

interface UltraSmartChatInterfaceProps {
  sessionId: string;
  sessionData: {
    birth: any;
    result: any;
  };
  initialLanguage: 'ne' | 'hi' | 'en';
}

const UltraSmartChatInterface: React.FC<UltraSmartChatInterfaceProps> = ({ 
  sessionId, 
  sessionData, 
  initialLanguage 
}) => {
  const [messages, setMessages] = useState<UltraSmartMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ne' | 'hi' | 'en'>(initialLanguage);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [ultraSettings, setUltraSettings] = useState({
    enableLearning: true,
    enablePrediction: true,
    enableEmotionRecognition: true,
    enableMultiModal: true,
    responseStyle: 'friendly',
    intelligenceLevel: 'ultra',
  });
  const [chatStats, setChatStats] = useState({
    totalMessages: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    learningProgress: 0,
    predictionAccuracy: 0,
    emotionalContext: 'neutral',
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const translations = {
    ne: {
      chatTitle: 'अल्ट्रा स्मार्ट ज्योतिष च्याट',
      subtitle: 'बुद्धिमान, छिटो र अनुकूलित AI सहित',
      placeholder: 'तपाईंको प्रश्न लेख्नुहोस्...',
      send: 'पठाउनुहोस्',
      loading: 'लोड हुँदै...',
      language: 'भाषा',
      settings: 'सेटिङहरू',
      intelligence: 'बुद्धिमत्ता',
      learning: 'सिकाइ',
      prediction: 'भविष्यवाणी',
      emotion: 'भावना',
      multiModal: 'मल्टी-मोडल',
      responseStyle: 'प्रतिक्रिया शैली',
      intelligenceLevel: 'बुद्धिमत्ता स्तर',
      insights: 'अन्तर्दृष्टि',
      performance: 'प्रदर्शन',
      emotionalContext: 'भावनात्मक संदर्भ',
      learningProgress: 'सिकाइ प्रगति',
      predictionAccuracy: 'भविष्यवाणी सटीकता',
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
        'मेरो भविष्यमा के के हुन सक्छ?',
        'ग्रह गोचरले अहिले के प्रभाव पारिरहेको छ?',
      ],
      intelligenceLevels: {
        basic: 'आधारभूत',
        medium: 'मध्यम',
        high: 'उच्च',
        ultra: 'अल्ट्रा',
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
      chatTitle: 'अल्ट्रा स्मार्ट ज्योतिष चैट',
      subtitle: 'बुद्धिमान, तेज़ और अनुकूलित AI के साथ',
      placeholder: 'अपना प्रश्न लिखें...',
      send: 'भेजें',
      loading: 'लोड हो रहा है...',
      language: 'भाषा',
      settings: 'सेटिंग्स',
      intelligence: 'बुद्धिमत्ता',
      learning: 'सीखना',
      prediction: 'भविष्यवाणी',
      emotion: 'भावना',
      multiModal: 'मल्टी-मोडल',
      responseStyle: 'प्रतिक्रिया शैली',
      intelligenceLevel: 'बुद्धिमत्ता स्तर',
      insights: 'अंतर्दृष्टि',
      performance: 'प्रदर्शन',
      emotionalContext: 'भावनात्मक संदर्भ',
      learningProgress: 'सीखने की प्रगति',
      predictionAccuracy: 'भविष्यवाणी सटीकता',
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
        'मेरे भविष्य में क्या क्या हो सकता है?',
        'ग्रह गोचर से अभी क्या प्रभाव पड़ रहा है?',
      ],
      intelligenceLevels: {
        basic: 'बुनियादी',
        medium: 'मध्यम',
        high: 'उच्च',
        ultra: 'अल्ट्रा',
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
      chatTitle: 'Ultra Smart Jyotish Chat',
      subtitle: 'With intelligent, fast and adaptive AI',
      placeholder: 'Type your question...',
      send: 'Send',
      loading: 'Loading...',
      language: 'Language',
      settings: 'Settings',
      intelligence: 'Intelligence',
      learning: 'Learning',
      prediction: 'Prediction',
      emotion: 'Emotion',
      multiModal: 'Multi-Modal',
      responseStyle: 'Response Style',
      intelligenceLevel: 'Intelligence Level',
      insights: 'Insights',
      performance: 'Performance',
      emotionalContext: 'Emotional Context',
      learningProgress: 'Learning Progress',
      predictionAccuracy: 'Prediction Accuracy',
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
        'What can happen in my future?',
        'What effects are the planetary transits having now?',
      ],
      intelligenceLevels: {
        basic: 'Basic',
        medium: 'Medium',
        high: 'High',
        ultra: 'Ultra',
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

  // Load chat history and insights on mount
  useEffect(() => {
    loadChatHistory();
    loadChatStats();
    loadInsights();
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
      const response = await fetch(`/api/chat/ultra-smart?sessionId=${sessionId}&type=stats`);
      const data = await response.json();
      
      if (data.success) {
        setChatStats(data.data.performance);
      }
    } catch (error) {
      console.error('Error loading chat stats:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch(`/api/chat/ultra-smart?sessionId=${sessionId}&type=learning`);
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: UltraSmartMessage = {
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
      const response = await fetch('/api/chat/ultra-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: inputMessage,
          language,
          enableLearning: ultraSettings.enableLearning,
          enablePrediction: ultraSettings.enablePrediction,
          enableEmotionRecognition: ultraSettings.enableEmotionRecognition,
          enableMultiModal: ultraSettings.enableMultiModal,
          userContext: {
            responseStyle: ultraSettings.responseStyle,
            intelligenceLevel: ultraSettings.intelligenceLevel,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: UltraSmartMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          createdAt: new Date().toISOString(),
          lang: language,
          metadata: data.data.metadata,
          predictions: data.data.predictions,
          emotionalContext: data.data.emotionalContext,
          learningInsights: data.data.learningInsights,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessage('');
        
        // Reload stats and insights
        loadChatStats();
        loadInsights();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: UltraSmartMessage = {
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
    setUltraSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-screen bg-vedic-light">
      {/* Left Side - Ultra Smart Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Ultra Smart Chat Header */}
        <div className="bg-gradient-to-r from-vedic-primary to-vedic-secondary shadow-vedic-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Brain className="h-8 w-8 text-vedic-gold" />
                  <div className="absolute -top-1 -right-1">
                    <Zap className="h-4 w-4 text-vedic-gold animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-white font-vedic">
                    {t.chatTitle}
                  </h1>
                  <p className="text-sm text-vedic-gold font-vedic">
                    {t.subtitle}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="bg-vedic-gold/20 text-vedic-gold border-vedic-gold">
                    <BrainIcon className="h-3 w-3 mr-1" />
                    Ultra
                  </Badge>
                  <Badge variant="outline" className="bg-vedic-gold/20 text-vedic-gold border-vedic-gold">
                    <ZapIcon className="h-3 w-3 mr-1" />
                    Smart
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Languages className="h-4 w-4 text-white" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'ne' | 'hi' | 'en')}
                  className="text-sm border border-vedic-gold/30 rounded px-2 py-1 bg-white/90 text-vedic-dark"
                >
                  <option value="ne">नेपाली</option>
                  <option value="hi">हिन्दी</option>
                  <option value="en">English</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white border-vedic-gold/30 hover:bg-vedic-gold/20"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInsights(!showInsights)}
                  className="text-white border-vedic-gold/30 hover:bg-vedic-gold/20"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Ultra Smart Settings Panel */}
            {showSettings && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ultraSettings.enableLearning}
                      onChange={(e) => handleSettingsChange('enableLearning', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-white font-vedic">{t.learning}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ultraSettings.enablePrediction}
                      onChange={(e) => handleSettingsChange('enablePrediction', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-white font-vedic">{t.prediction}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ultraSettings.enableEmotionRecognition}
                      onChange={(e) => handleSettingsChange('enableEmotionRecognition', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-white font-vedic">{t.emotion}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ultraSettings.enableMultiModal}
                      onChange={(e) => handleSettingsChange('enableMultiModal', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-sm text-white font-vedic">{t.multiModal}</label>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="mt-2 flex items-center space-x-4 text-sm text-vedic-gold">
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>{chatStats.totalMessages} {t.performance}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{chatStats.averageResponseTime}ms</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>{Math.round(chatStats.learningProgress)}% {t.learningProgress}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>{Math.round(chatStats.predictionAccuracy)}% {t.predictionAccuracy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="relative mb-4">
                <Brain className="h-16 w-16 text-vedic-primary mx-auto animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-vedic-gold animate-bounce" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-vedic-dark mb-2 font-vedic">
                {t.exampleQuestions}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-4xl mx-auto">
                {t.examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-left p-3 bg-white/90 rounded-lg border border-vedic-gold/30 hover:bg-vedic-gold/10 transition-colors shadow-vedic"
                  >
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-vedic-primary" />
                      <span className="font-vedic text-vedic-dark">{example}</span>
                    </div>
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
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-vedic-primary text-white'
                    : 'bg-white/90 text-vedic-dark border border-vedic-gold/30 shadow-vedic'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <div className="relative">
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-vedic-primary" />
                      {message.metadata?.emotionalContext && (
                        <div className="absolute -top-1 -right-1">
                          <Heart className="h-3 w-3 text-vedic-saffron" />
                        </div>
                      )}
                    </div>
                  )}
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap font-vedic">{message.content}</p>
                    
                    {/* Message Metadata */}
                    {message.metadata && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1 text-xs opacity-70">
                          {message.metadata.responseTime && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-2 w-2 mr-1" />
                              {message.metadata.responseTime}ms
                            </Badge>
                          )}
                          {message.metadata.confidence && (
                            <Badge variant="outline" className="text-xs">
                              <Target className="h-2 w-2 mr-1" />
                              {Math.round(message.metadata.confidence * 100)}%
                            </Badge>
                          )}
                          {message.metadata.predictionCount && (
                            <Badge variant="outline" className="text-xs">
                              <Brain className="h-2 w-2 mr-1" />
                              {message.metadata.predictionCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    )}

                    {/* Emotional Context */}
                    {message.emotionalContext && (
                      <div className="mt-2 p-2 bg-vedic-gold/10 rounded text-xs">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3 text-vedic-saffron" />
                          <span className="font-vedic">
                            {message.emotionalContext.emotion} ({Math.round(message.emotionalContext.intensity * 100)}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Predictions */}
                    {message.predictions && message.predictions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.predictions.slice(0, 2).map((prediction, index) => (
                          <div key={index} className="p-2 bg-vedic-gold/5 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-vedic">{prediction.response}</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(prediction.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-white/90 text-vedic-dark border border-vedic-gold/30 shadow-vedic">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-vedic-primary" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-vedic-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-vedic-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-vedic-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/90 border-t border-vedic-gold/30 p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1 border-vedic-gold/30 focus:border-vedic-primary"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 bg-vedic-primary hover:bg-vedic-primary/90 text-white"
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
      <div className="w-80 bg-white/90 border-l border-vedic-gold/30 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-vedic-dark font-vedic">
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

      {/* Insights Panel */}
      {showInsights && insights && (
        <div className="w-80 bg-white/90 border-l border-vedic-gold/30 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-vedic-dark font-vedic">
              {t.insights}
            </h2>
            <div className="space-y-4">
              <Card className="bg-vedic-gold/10 border-vedic-gold/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="h-4 w-4 text-vedic-primary" />
                    <span className="font-vedic text-sm font-medium">{t.performance}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Total Interactions:</span>
                      <span>{insights.totalInteractions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Satisfaction:</span>
                      <span>{Math.round(insights.averageSatisfaction * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Learning Progress:</span>
                      <span>{Math.round(insights.learningProgress)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraSmartChatInterface;


