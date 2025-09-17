'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatStats {
  totalMessages: number;
  todayMessages: number;
  questionTypes: Record<string, number>;
  avgResponseTime: number;
  successRate: number;
}

interface RecentMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  questionType?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls for dashboard data
      const mockStats: ChatStats = {
        totalMessages: 1247,
        todayMessages: 23,
        questionTypes: {
          career: 45,
          love: 32,
          health: 28,
          finance: 19,
          education: 15,
          dasha: 12,
          kundli: 8,
          daily: 6,
          general: 4
        },
        avgResponseTime: 12.5,
        successRate: 94.2
      };

      const mockRecentMessages: RecentMessage[] = [
        {
          id: '1',
          message: 'मेरो करियर के होला?',
          response: 'तपाईंको कुण्डलीमा शुक्र ग्रह दसम भावमा छ...',
          timestamp: '2024-01-15T10:30:00Z',
          questionType: 'career'
        },
        {
          id: '2',
          message: 'मेरो प्रेम जीवन कस्तो छ?',
          response: 'तपाईंको सप्तम भावमा मंगल ग्रह छ...',
          timestamp: '2024-01-15T09:15:00Z',
          questionType: 'love'
        },
        {
          id: '3',
          message: 'मेरो स्वास्थ्य कस्तो छ?',
          response: 'तपाईंको षष्ठ भावमा शुक्र ग्रह छ...',
          timestamp: '2024-01-15T08:45:00Z',
          questionType: 'health'
        }
      ];

      setStats(mockStats);
      setRecentMessages(mockRecentMessages);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionTypeColor = (type: string) => {
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

  const getQuestionTypeLabel = (type: string) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ड्यासबोर्ड लोड हुँदैछ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 दिव्यांश ज्योतिष ड्यासबोर्ड
          </h1>
          <p className="text-gray-600">
            तपाईंको ज्योतिष च्याट सिस्टमको प्रदर्शन र सांख्यिकी
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">कुल सन्देशहरू</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">आजका सन्देशहरू</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">औसत प्रतिक्रिया समय</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.avgResponseTime}s</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">सफलता दर</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.successRate}%</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Types Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              प्रश्न प्रकारहरूको वितरण
            </h3>
            <div className="space-y-3">
              {stats?.questionTypes && Object.entries(stats.questionTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className={`mr-3 ${getQuestionTypeColor(type)}`}>
                      {getQuestionTypeLabel(type)}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(count / Math.max(...Object.values(stats.questionTypes))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Messages */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              हालका सन्देशहरू
            </h3>
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {message.message}
                    </p>
                    {message.questionType && (
                      <Badge className={`text-xs ${getQuestionTypeColor(message.questionType)}`}>
                        {getQuestionTypeLabel(message.questionType)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {message.response.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleString('ne-NP')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            त्वरित कार्यहरू
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => window.open('/chat-final', '_blank')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              💬 च्याट इन्टरफेस खोल्नुहोस्
            </Button>
            <Button 
              onClick={() => window.open('/api/health', '_blank')}
              variant="outline"
            >
              🏥 API स्वास्थ्य जाँच
            </Button>
            <Button 
              onClick={() => fetchDashboardData()}
              variant="outline"
            >
              🔄 डाटा रिफ्रेश गर्नुहोस्
            </Button>
          </div>
        </Card>

        {/* System Status */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            सिस्टम स्थिति
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">ChatGPT API: सक्रिय</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">ProKerala API: डेमो मोड</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">डेटाबेस: सक्रिय</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


