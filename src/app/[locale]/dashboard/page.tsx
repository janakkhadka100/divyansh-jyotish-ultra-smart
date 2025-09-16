import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MessageCircle, Star, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-yellow-400">
            दिव्यांश ज्योतिष
          </div>
          <Link href="/ne/chat">
            <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-300">
              ज्योतिषीसँग कुरा गर्नुहोस्
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            स्वागत छ, दिव्यांश
          </h1>
          <p className="text-white/80">
            आफ्नो ज्योतिष यात्रा शुरू गर्नुहोस्
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60">कुल चार्ट</p>
                  <p className="text-2xl font-bold text-yellow-400">3</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60">पढाइहरू</p>
                  <p className="text-2xl font-bold text-yellow-400">12</p>
                </div>
                <Star className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60">च्याट सत्र</p>
                  <p className="text-2xl font-bold text-yellow-400">5</p>
                </div>
                <MessageCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60">अन्तिम पढाइ</p>
                  <p className="text-sm font-bold text-yellow-400">२ दिन अगाडि</p>
                </div>
                <Calendar className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Charts */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-red-400">
                मेरा चार्टहरू
              </CardTitle>
              <CardDescription className="text-white/80">
                आफ्ना सबै ज्योतिष चार्टहरू
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-blue-400/30 rounded-lg">
                <h3 className="font-semibold text-white">जन्मकुण्डली</h3>
                <p className="text-sm text-white/60">मुख्य जन्म चार्ट</p>
                <p className="text-xs text-yellow-400">२ दिन अगाडि निर्मित</p>
              </div>
              <div className="p-4 border border-blue-400/30 rounded-lg">
                <h3 className="font-semibold text-white">दशा चार्ट</h3>
                <p className="text-sm text-white/60">वर्तमान दशा विश्लेषण</p>
                <p className="text-xs text-yellow-400">१ हप्ता अगाडि निर्मित</p>
              </div>
              <Button variant="outline" className="w-full text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900">
                नयाँ चार्ट बनाउनुहोस्
              </Button>
            </CardContent>
          </Card>

          {/* Recent Readings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-red-400">
                हालका पढाइहरू
              </CardTitle>
              <CardDescription className="text-white/80">
                हालका ज्योतिष पढाइहरू
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-blue-400/30 rounded-lg">
                <h3 className="font-semibold text-white">करियर भविष्यवाणी</h3>
                <p className="text-sm text-white/60">तपाईंको करियरमा आउने परिवर्तनहरू</p>
                <p className="text-xs text-yellow-400">१ दिन अगाडि</p>
              </div>
              <div className="p-4 border border-blue-400/30 rounded-lg">
                <h3 className="font-semibold text-white">प्रेम जीवन</h3>
                <p className="text-sm text-white/60">प्रेम र विवाह सम्बन्धी भविष्यवाणी</p>
                <p className="text-xs text-yellow-400">३ दिन अगाडि</p>
              </div>
              <Button variant="outline" className="w-full text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900">
                सबै पढाइहरू हेर्नुहोस्
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
