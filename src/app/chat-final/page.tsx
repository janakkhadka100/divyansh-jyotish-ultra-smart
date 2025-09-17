'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  type: 'user' | 'ai';
  questionType?: string;
  hasAstrologicalData?: boolean;
}

interface BirthData {
  name: string;
  date: string;
  time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  ayanamsa?: number;
}

export default function FinalChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [showBirthForm, setShowBirthForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      response: '',
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: 'user-123',
          birthData: birthData
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: '',
          response: data.data.response,
          timestamp: data.data.timestamp,
          type: 'ai',
          questionType: data.data.questionType,
          hasAstrologicalData: data.data.hasAstrologicalData
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: '',
        response: 'माफ गर्नुहोस्, केही समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।',
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

  const handleBirthDataSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: BirthData = {
      name: formData.get('name') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
      ayanamsa: 1
    };
    setBirthData(data);
    setShowBirthForm(false);
  };

  const getQuestionTypeColor = (type?: string) => {
    const colors = {
      career: 'bg-blue-100 text-blue-800',
      love: 'bg-pink-100 text-pink-800',
      health: 'bg-green-100 text-green-800',
      finance: 'bg-yellow-100 text-yellow-800',
      education: 'bg-purple-100 text-purple-800',
      dasha: 'bg-orange-100 text-orange-800',
      kundli: 'bg-indigo-100 text-indigo-800',
      daily: 'bg-cyan-100 text-cyan-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getQuestionTypeLabel = (type?: string) => {
    const labels = {
      career: 'करियर',
      love: 'प्रेम',
      health: 'स्वास्थ्य',
      finance: 'धन',
      education: 'शिक्षा',
      dasha: 'दशा',
      kundli: 'कुण्डली',
      daily: 'दैनिक',
      general: 'सामान्य'
    };
    return labels[type as keyof typeof labels] || 'सामान्य';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌟 दिव्यांश ज्योतिष च्याट
          </h1>
          <p className="text-gray-600">
            ProKerala ज्योतिष डाटा र ChatGPT को साथमा आफ्नो ज्योतिषीय प्रश्नहरूको उत्तर पाउनुहोस्
          </p>
        </div>

        {/* Birth Data Form */}
        {showBirthForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-xl font-semibold mb-4">जन्म विवरण दिनुहोस्</h3>
            <form onSubmit={handleBirthDataSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="name"
                  placeholder="नाम"
                  required
                />
                <Input
                  name="date"
                  type="date"
                  placeholder="जन्म मिति"
                  required
                />
                <Input
                  name="time"
                  type="time"
                  placeholder="जन्म समय"
                  required
                />
                <Input
                  name="location"
                  placeholder="जन्म स्थान (जस्तै: काठमाडौं, नेपाल)"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  सेभ गर्नुहोस्
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBirthForm(false)}
                >
                  रद्द गर्नुहोस्
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Birth Data Display */}
        {birthData && (
          <Card className="mb-6 p-4 bg-green-50 border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-green-800">जन्म विवरण:</h4>
                <p className="text-green-700">
                  {birthData.name} - {birthData.date} {birthData.time} - {birthData.location}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBirthForm(true)}
              >
                परिवर्तन गर्नुहोस्
              </Button>
            </div>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="mb-6 h-96 overflow-y-auto">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-2">नमस्कार! म दिव्यांश ज्योतिषका विशेषज्ञ हुँ।</p>
                <p>तपाईंको ज्योतिष सम्बन्धी प्रश्नहरू सोध्नुहोस्।</p>
                {!birthData && (
                  <p className="text-sm mt-2 text-blue-600">
                    अधिक सटीक उत्तरका लागि जन्म विवरण दिनुहोस्।
                  </p>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.type === 'user' ? (
                    <p>{message.message}</p>
                  ) : (
                    <div>
                      {message.questionType && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getQuestionTypeColor(message.questionType)}`}>
                          {getQuestionTypeLabel(message.questionType)}
                        </span>
                      )}
                      {message.hasAstrologicalData && (
                        <span className="inline-block px-2 py-1 text-xs rounded-full mb-2 bg-yellow-100 text-yellow-800">
                          ज्योतिष डाटा सहित
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{message.response}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>उत्तर आउँदैछ...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="तपाईंको ज्योतिष सम्बन्धी प्रश्न लेख्नुहोस्..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            पठाउनुहोस्
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => setShowBirthForm(true)}
            variant="outline"
            className="flex-1"
          >
            {birthData ? 'जन्म विवरण परिवर्तन गर्नुहोस्' : 'जन्म विवरण दिनुहोस्'}
          </Button>
          <Button
            onClick={() => setMessages([])}
            variant="outline"
            className="flex-1"
          >
            च्याट खाली गर्नुहोस्
          </Button>
        </div>

        {/* Sample Questions */}
        <Card className="mt-6 p-4">
          <h4 className="font-semibold mb-3">नमुना प्रश्नहरू:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'मेरो जन्मकुण्डली के छ?',
              'मेरो करियर के होला?',
              'मेरो प्रेम जीवन कस्तो छ?',
              'मेरो स्वास्थ्य कस्तो छ?',
              'मेरो वर्तमान दशा के हो?',
              'आजको शुभ समय के हो?'
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => setInputMessage(question)}
                className="text-left justify-start"
              >
                {question}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


