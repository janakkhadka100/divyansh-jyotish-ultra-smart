import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share, Star } from 'lucide-react';

interface DashboardDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function DashboardDetailPage({ params }: DashboardDetailPageProps) {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              फिर्ता
            </Button>
            <div className="text-2xl font-bold text-vedic-gold devanagari">
              ज्योतिष विवरण - #{params.id}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900">
              <Download className="h-4 w-4 mr-2" />
              डाउनलोड
            </Button>
            <Button variant="outline" className="text-vedic-gold border-vedic-gold hover:bg-vedic-gold hover:text-slate-900">
              <Share className="h-4 w-4 mr-2" />
              साझा गर्नुहोस्
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Chart Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <Card className="vedic-card">
              <CardHeader>
                <CardTitle className="text-vedic-red devanagari">
                  जन्मकुण्डली चार्ट
                </CardTitle>
                <CardDescription className="text-vedic-white/80 devanagari">
                  तपाईंको जन्म समय अनुसार ग्रहहरूको स्थिति
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-vedic-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-vedic-blue/30">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔮</div>
                    <p className="text-vedic-white/60 devanagari">
                      चार्ट यहाँ प्रदर्शित हुनेछ
                    </p>
                    <p className="text-sm text-vedic-gold devanagari">
                      ज्योतिष गणना प्रक्रियामा...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Info */}
          <div className="space-y-6">
            <Card className="vedic-card">
              <CardHeader>
                <CardTitle className="text-vedic-red devanagari">
                  चार्ट विवरण
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-vedic-white/60 devanagari">नाम:</p>
                  <p className="text-vedic-white devanagari">दिव्यांश शर्मा</p>
                </div>
                <div>
                  <p className="text-vedic-white/60 devanagari">जन्म मिति:</p>
                  <p className="text-vedic-white devanagari">२०८० माघ १५</p>
                </div>
                <div>
                  <p className="text-vedic-white/60 devanagari">जन्म समय:</p>
                  <p className="text-vedic-white devanagari">१०:३० बिहान</p>
                </div>
                <div>
                  <p className="text-vedic-white/60 devanagari">जन्म स्थान:</p>
                  <p className="text-vedic-white devanagari">काठमाडौं, नेपाल</p>
                </div>
              </CardContent>
            </Card>

            <Card className="vedic-card">
              <CardHeader>
                <CardTitle className="text-vedic-red devanagari">
                  ग्रह स्थिति
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">सूर्य:</span>
                  <span className="text-vedic-gold devanagari">मकर राशि</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">चन्द्र:</span>
                  <span className="text-vedic-gold devanagari">कर्क राशि</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">मङ्गल:</span>
                  <span className="text-vedic-gold devanagari">वृश्चिक राशि</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">बुध:</span>
                  <span className="text-vedic-gold devanagari">कुम्भ राशि</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">गुरु:</span>
                  <span className="text-vedic-gold devanagari">धनु राशि</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">शुक्र:</span>
                  <span className="text-vedic-gold devanagari">मकर राशि</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vedic-white devanagari">शनि:</span>
                  <span className="text-vedic-gold devanagari">कुम्भ राशि</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="mt-8">
          <Card className="vedic-card">
            <CardHeader>
              <CardTitle className="text-vedic-red devanagari">
                विस्तृत विश्लेषण
              </CardTitle>
              <CardDescription className="text-vedic-white/80 devanagari">
                तपाईंको जन्मकुण्डलीको गहिरो अध्ययन
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-vedic-gold mb-3 devanagari">
                  व्यक्तित्व विश्लेषण
                </h3>
                <p className="text-vedic-white/80 devanagari leading-relaxed">
                  तपाईंको जन्मकुण्डली अनुसार, तपाईं एक रचनात्मक र नेतृत्व गुण भएका व्यक्ति हुनुहुन्छ। 
                  सूर्य मकर राशिमा रहेकोले तपाईंमा दृढता, अनुशासन र लक्ष्य प्राप्तिको क्षमता छ। 
                  चन्द्र कर्क राशिमा रहेकोले तपाईं भावुक र परिवार प्रिय हुनुहुन्छ।
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-vedic-gold mb-3 devanagari">
                  करियर सल्लाह
                </h3>
                <p className="text-vedic-white/80 devanagari leading-relaxed">
                  तपाईंको ग्रह स्थिति अनुसार, प्रशासनिक क्षेत्र, व्यापार, वा सरकारी नोकरीमा सफलता पाउन सक्नुहुन्छ। 
                  गुरु धनु राशिमा रहेकोले शिक्षा, धर्म, वा विदेशी व्यापारमा पनि रुचि हुन सक्छ।
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-vedic-gold mb-3 devanagari">
                  भविष्यवाणी
                </h3>
                <p className="text-vedic-white/80 devanagari leading-relaxed">
                  अगाडि ६ महिनामा तपाईंको करियरमा राम्रो अवसर आउनेछ। 
                  विशेष गरी मार्च-अप्रिल महिनामा नयाँ कामको प्रस्ताव आउन सक्छ। 
                  प्रेम जीवनमा पनि स्थिरता आउनेछ।
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
