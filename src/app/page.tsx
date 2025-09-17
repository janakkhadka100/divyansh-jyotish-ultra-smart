import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Professional Header */}
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xl">दि</span>
              </div>
              <div className="text-2xl font-bold text-white">
                दिव्यांश ज्योतिष
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-4">
                <Link href="/ne/chat/intelligent" className="text-white/80 hover:text-yellow-400 transition-colors">
                  च्याट
                </Link>
                <Link href="/ne/dashboard" className="text-white/80 hover:text-yellow-400 transition-colors">
                  ड्यासबोर्ड
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Professional Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
            <span className="text-slate-900 font-bold text-3xl">दि</span>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            दिव्यांश ज्योतिष
          </h1>
          <p className="text-2xl text-yellow-400 mb-4 font-semibold">
            वैदिक ज्योतिष प्लेटफर्म
          </p>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            आफ्नो जन्मकुण्डली र ज्योतिष विश्लेषण पाउनुहोस्। प्राचीन वैदिक ज्ञान र आधुनिक प्रविधिको संयोजन।
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              सुरक्षित र गोपनीय
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              तत्काल परिणाम
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              विशेषज्ञ सल्लाह
            </span>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
              <h2 className="text-3xl font-bold text-slate-900 text-center">
                ज्योतिष यात्रा शुरू गर्नुहोस्
              </h2>
              <p className="text-slate-800 text-center mt-2">
                खाता खोलेर आफ्नो व्यक्तिगत ज्योतिष अनुभव पाउनुहोस्
              </p>
            </div>
            <div className="p-8">
              <div className="text-center space-y-6">
                <p className="text-white/80 text-lg">
                  तपाईंको जन्म विवरण सुरक्षित राखेर, म तपाईंलाई व्यक्तिगत ज्योतिष सल्लाह दिन सक्छु।
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/ne/auth/signup">
                    <button className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105">
                      खाता खोल्नुहोस्
                    </button>
                  </Link>
                  <Link href="/ne/auth/signin">
                    <button className="px-8 py-4 border-2 border-yellow-400 text-yellow-400 font-bold rounded-lg hover:bg-yellow-400 hover:text-slate-900 transition-all duration-300 transform hover:scale-105">
                      साइन इन गर्नुहोस्
                    </button>
                  </Link>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-white/60 text-sm">
                    खाता खोल्नुहोस् र तत्काल ज्योतिष सल्लाह पाउनुहोस्
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            हाम्रो सेवाहरू
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔮</span>
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                जन्मकुण्डली
              </h3>
              <p className="text-white/80 leading-relaxed">
                आफ्नो विस्तृत जन्मकुण्डली र ग्रहहरूको स्थिति जान्नुहोस्। प्राचीन वैदिक विधि अनुसार गणना।
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                दशा विश्लेषण
              </h3>
              <p className="text-white/80 leading-relaxed">
                आफ्नो वर्तमान र भविष्यका दशा अवधिहरू जान्नुहोस्। ग्रहहरूको प्रभाव र समयको विश्लेषण।
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl text-center hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                ज्योतिष च्याट
              </h3>
              <p className="text-white/80 leading-relaxed">
                ज्योतिषीसँग सीधै कुरा गर्नुहोस् र प्रश्नहरूको जवाफ पाउनुहोस्। AI-संचालित बुद्धिमान सल्लाह।
              </p>
            </div>
          </div>
        </div>

        {/* Professional Action Buttons */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">
            आजै शुरू गर्नुहोस्
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/ne/chat/intelligent"
              className="group px-10 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span className="text-xl">💬</span>
              बुद्धिमान ज्योतिष च्याट
            </Link>
            <Link 
              href="/ne/dashboard"
              className="group px-10 py-5 border-2 border-yellow-400 text-yellow-400 font-bold rounded-2xl hover:bg-yellow-400 hover:text-slate-900 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span className="text-xl">📊</span>
              ड्यासबोर्ड हेर्नुहोस्
            </Link>
          </div>
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-slate-900 font-bold">दि</span>
                </div>
                <h3 className="text-xl font-bold text-white">दिव्यांश ज्योतिष</h3>
              </div>
              <p className="text-white/60">
                प्राचीन वैदिक ज्ञान र आधुनिक प्रविधिको संयोजन
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">सेवाहरू</h4>
              <ul className="space-y-2 text-white/60">
                <li>जन्मकुण्डली</li>
                <li>दशा विश्लेषण</li>
                <li>ज्योतिष च्याट</li>
                <li>विशेषज्ञ सल्लाह</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">समर्थन</h4>
              <ul className="space-y-2 text-white/60">
                <li>सहयोग केन्द्र</li>
                <li>प्रायः सोधिने प्रश्न</li>
                <li>सम्पर्क</li>
                <li>गोपनीयता नीति</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">सम्पर्क</h4>
              <ul className="space-y-2 text-white/60">
                <li>ईमेल: info@divyanshjyotish.com</li>
                <li>फोन: +977-1-1234567</li>
                <li>काठमाडौं, नेपाल</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center">
            <p className="text-white/60">
              © 2024 दिव्यांश ज्योतिष - सबै अधिकार सुरक्षित |
              <span className="ml-2">प्राचीन ज्ञान, आधुनिक प्रविधि</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
