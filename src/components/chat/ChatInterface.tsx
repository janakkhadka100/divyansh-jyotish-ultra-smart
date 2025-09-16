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
  Sparkles
} from 'lucide-react';
import JyotishCards from './JyotishCards';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  lang: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  sessionData: {
    birth: any;
    result: any;
  };
  initialLanguage: 'ne' | 'hi' | 'en';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessionId, 
  sessionData, 
  initialLanguage 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ne' | 'hi' | 'en'>(initialLanguage);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const translations = {
    ne: {
      chatTitle: 'ज्योतिष च्याट',
      placeholder: 'तपाईंको प्रश्न लेख्नुहोस्...',
      send: 'पठाउनुहोस्',
      loading: 'लोड हुँदै...',
      language: 'भाषा',
      exampleQuestions: 'उदाहरण प्रश्नहरू',
      examples: [
        'मेरो वर्तमान दशा के हो?',
        'पेसा/व्यवसायतर्फ कुन अवधि राम्रो?',
        'शुभ दिन कहिले?',
        'मेरो जन्मकुण्डलीमा के के छ?',
        'आजको पञ्चाङ्ग के छ?',
      ],
    },
    hi: {
      chatTitle: 'ज्योतिष चैट',
      placeholder: 'अपना प्रश्न लिखें...',
      send: 'भेजें',
      loading: 'लोड हो रहा है...',
      language: 'भाषा',
      exampleQuestions: 'उदाहरण प्रश्न',
      examples: [
        'मेरी वर्तमान दशा क्या है?',
        'धन/व्यापार के लिए कौन सा समय अच्छा है?',
        'शुभ दिन कब है?',
        'मेरी जन्मकुंडली में क्या क्या है?',
        'आज का पंचांग क्या है?',
      ],
    },
    en: {
      chatTitle: 'Jyotish Chat',
      placeholder: 'Type your question...',
      send: 'Send',
      loading: 'Loading...',
      language: 'Language',
      exampleQuestions: 'Example Questions',
      examples: [
        'What is my current dasha?',
        'Which period is good for money/business?',
        'When are the auspicious days?',
        'What is in my birth chart?',
        'What is today\'s panchang?',
      ],
    },
  };

  const t = translations[language];

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
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

    // Add user message immediately
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: inputMessage,
          language,
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
                // Add final message to messages
                const assistantMessage: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: fullResponse,
                  createdAt: new Date().toISOString(),
                  lang: language,
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
    
    // Trigger send after a short delay
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold">{t.chatTitle}</h1>
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
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
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

export default ChatInterface;



