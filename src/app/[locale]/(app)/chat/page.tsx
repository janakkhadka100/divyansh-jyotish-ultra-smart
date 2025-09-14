import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Plus } from 'lucide-react';

export default function ChatPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-vedic-gold devanagari">
            {t('chat.title')}
          </div>
          <Button variant="vedic" className="devanagari">
            <Plus className="h-4 w-4 mr-2" />
            {t('chat.newChat')}
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="vedic-card h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-vedic-red devanagari text-center">
                ज्योतिषी सँग कुरा गर्नुहोस्
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
                {/* Sample Messages */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-vedic-red rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-vedic-blue/20 p-3 rounded-lg max-w-xs">
                    <p className="text-vedic-white devanagari">
                      मेरो करियरको भविष्य के छ?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-vedic-red/20 p-3 rounded-lg max-w-xs">
                    <p className="text-vedic-white devanagari">
                      तपाईंको जन्मकुण्डली अनुसार, अगाडि ६ महिनामा तपाईंको करियरमा राम्रो अवसर आउनेछ। 
                      विशेष गरी मार्च-अप्रिल महिनामा नयाँ कामको प्रस्ताव आउन सक्छ।
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-vedic-gold rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-slate-900" />
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-vedic-red rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-vedic-blue/20 p-3 rounded-lg max-w-xs">
                    <p className="text-vedic-white devanagari">
                      मेरो प्रेम जीवन कस्तो हुनेछ?
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-vedic-red/20 p-3 rounded-lg max-w-xs">
                    <p className="text-vedic-white devanagari">
                      तपाईंको वर्तमान दशा अनुसार, यस वर्ष प्रेम सम्बन्धमा स्थिरता आउनेछ। 
                      अगस्त-सेप्टेम्बर महिनामा विवाहको सम्भावना छ।
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-vedic-gold rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-slate-900" />
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex space-x-2">
                <Input 
                  placeholder={t('chat.placeholder')}
                  className="flex-1 vedic-input devanagari"
                />
                <Button variant="vedic" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Questions */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-vedic-gold mb-4 devanagari text-center">
              सामान्य प्रश्नहरू
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="vedic-card h-auto p-4 text-left justify-start devanagari"
              >
                <div>
                  <p className="font-semibold text-vedic-white">करियर सल्लाह</p>
                  <p className="text-sm text-vedic-white/60">करियर सम्बन्धी ज्योतिष सल्लाह</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="vedic-card h-auto p-4 text-left justify-start devanagari"
              >
                <div>
                  <p className="font-semibold text-vedic-white">प्रेम र विवाह</p>
                  <p className="text-sm text-vedic-white/60">प्रेम जीवन र विवाह सम्बन्धी</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="vedic-card h-auto p-4 text-left justify-start devanagari"
              >
                <div>
                  <p className="font-semibold text-vedic-white">स्वास्थ्य</p>
                  <p className="text-sm text-vedic-white/60">स्वास्थ्य सम्बन्धी भविष्यवाणी</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="vedic-card h-auto p-4 text-left justify-start devanagari"
              >
                <div>
                  <p className="font-semibold text-vedic-white">वित्तीय</p>
                  <p className="text-sm text-vedic-white/60">धन र वित्तीय स्थिति</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
