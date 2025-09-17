'use client';

import React from 'react';

interface AstrologicalData {
  kundli?: {
    ascendant?: {
      sign: string;
      signName: string;
      degree: number;
      nakshatraName: string;
    };
    moonSign?: {
      sign: string;
      signName: string;
      degree: number;
      nakshatraName: string;
    };
    sunSign?: {
      sign: string;
      signName: string;
      degree: number;
      nakshatraName: string;
    };
    planets?: Array<{
      name: string;
      sign: string;
      degree: number;
      house: number;
    }>;
    yogas?: Array<{
      yogaName: string;
      yogaType: string;
      strength: string;
    }>;
  };
  dasha?: {
    currentDasha?: string;
    antardasha?: string;
    pratyantardasha?: string;
    currentPeriod?: {
      vimshottari: string;
      antardasha: string;
      pratyantardasha: string;
      sookshmaDasha: string;
      yoginiDasha: string;
    };
  };
  panchang?: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
  };
  source?: string;
}

interface AstrologicalDataCardsProps {
  data: AstrologicalData;
  birthData?: {
    name?: string;
    date?: string;
    time?: string;
    location?: string;
  };
}

export default function AstrologicalDataCards({ data, birthData }: AstrologicalDataCardsProps) {
  if (!data) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* Birth Details Card */}
      {birthData && (
        <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 shadow-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="text-xl">👤</span>
            जन्म विवरण
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-300">नाम:</span>
              <span className="text-white ml-2">{birthData.name || 'अज्ञात'}</span>
            </div>
            <div>
              <span className="text-blue-300">जन्म मिति:</span>
              <span className="text-white ml-2">{birthData.date || 'अज्ञात'}</span>
            </div>
            <div>
              <span className="text-blue-300">जन्म समय:</span>
              <span className="text-white ml-2">{birthData.time || 'अज्ञात'}</span>
            </div>
            <div>
              <span className="text-blue-300">स्थान:</span>
              <span className="text-white ml-2">{birthData.location || 'अज्ञात'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Kundli Card */}
      {data.kundli && (
        <div className="bg-gradient-to-r from-green-900/80 to-teal-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 shadow-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="text-xl">🔮</span>
            जन्मकुण्डली
            {data.source === 'prokerala' && (
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Real Data</span>
            )}
            {data.source === 'mock' && (
              <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">Demo Data</span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ascendant */}
            {data.kundli.ascendant && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-green-300 font-semibold mb-2">लग्न</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-blue-300">राशि:</span> <span className="text-white">{data.kundli.ascendant.sign}</span></div>
                  <div><span className="text-blue-300">अंश:</span> <span className="text-white">{data.kundli.ascendant.degree}°</span></div>
                  <div><span className="text-blue-300">नक्षत्र:</span> <span className="text-white">{data.kundli.ascendant.nakshatraName}</span></div>
                </div>
              </div>
            )}

            {/* Moon Sign */}
            {data.kundli.moonSign && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-green-300 font-semibold mb-2">चन्द्र राशि</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-blue-300">राशि:</span> <span className="text-white">{data.kundli.moonSign.sign}</span></div>
                  <div><span className="text-blue-300">अंश:</span> <span className="text-white">{data.kundli.moonSign.degree}°</span></div>
                  <div><span className="text-blue-300">नक्षत्र:</span> <span className="text-white">{data.kundli.moonSign.nakshatraName}</span></div>
                </div>
              </div>
            )}

            {/* Sun Sign */}
            {data.kundli.sunSign && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-green-300 font-semibold mb-2">सूर्य राशि</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-blue-300">राशि:</span> <span className="text-white">{data.kundli.sunSign.sign}</span></div>
                  <div><span className="text-blue-300">अंश:</span> <span className="text-white">{data.kundli.sunSign.degree}°</span></div>
                  <div><span className="text-blue-300">नक्षत्र:</span> <span className="text-white">{data.kundli.sunSign.nakshatraName}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Planets */}
          {data.kundli.planets && data.kundli.planets.length > 0 && (
            <div className="mt-4">
              <h4 className="text-green-300 font-semibold mb-2">ग्रहहरू</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.kundli.planets.map((planet, index) => (
                  <div key={index} className="bg-slate-700/50 rounded p-2 text-xs">
                    <div className="text-yellow-300 font-medium">{planet.name}</div>
                    <div className="text-white">{planet.sign} - {planet.degree}°</div>
                    <div className="text-blue-300">भाव {planet.house}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yogas */}
          {data.kundli.yogas && data.kundli.yogas.length > 0 && (
            <div className="mt-4">
              <h4 className="text-green-300 font-semibold mb-2">योगहरू</h4>
              <div className="space-y-2">
                {data.kundli.yogas.map((yoga, index) => (
                  <div key={index} className="bg-slate-700/50 rounded p-2">
                    <div className="text-yellow-300 font-medium">{yoga.yogaName}</div>
                    <div className="text-white text-sm">{yoga.yogaType} - {yoga.strength}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dasha Card */}
      {data.dasha && (
        <div className="bg-gradient-to-r from-orange-900/80 to-red-900/80 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4 shadow-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="text-xl">⏰</span>
            दशा विश्लेषण
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <h4 className="text-orange-300 font-semibold mb-2">वर्तमान दशा</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-blue-300">महादशा:</span>
                  <span className="text-white ml-2">{data.dasha.currentDasha || 'अज्ञात'}</span>
                </div>
                <div>
                  <span className="text-blue-300">अन्तर्दशा:</span>
                  <span className="text-white ml-2">{data.dasha.antardasha || 'अज्ञात'}</span>
                </div>
                <div>
                  <span className="text-blue-300">प्रत्यन्तर्दशा:</span>
                  <span className="text-white ml-2">{data.dasha.pratyantardasha || 'अज्ञात'}</span>
                </div>
              </div>
            </div>

            {data.dasha.currentPeriod && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-orange-300 font-semibold mb-2">विस्तृत दशा</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="text-blue-300">विम्शोत्तरी:</span> <span className="text-white">{data.dasha.currentPeriod.vimshottari}</span></div>
                  <div><span className="text-blue-300">सूक्ष्म दशा:</span> <span className="text-white">{data.dasha.currentPeriod.sookshmaDasha}</span></div>
                  <div><span className="text-blue-300">योगिनी:</span> <span className="text-white">{data.dasha.currentPeriod.yoginiDasha}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panchang Card */}
      {data.panchang && (
        <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 shadow-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="text-xl">📅</span>
            पञ्चाङ्ग
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">तिथि</h4>
              <div className="text-white text-sm">{data.panchang.tithi}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">नक्षत्र</h4>
              <div className="text-white text-sm">{data.panchang.nakshatra}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">योग</h4>
              <div className="text-white text-sm">{data.panchang.yoga}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">करण</h4>
              <div className="text-white text-sm">{data.panchang.karana}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">सूर्योदय</h4>
              <div className="text-white text-sm">{data.panchang.sunrise}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">सूर्यास्त</h4>
              <div className="text-white text-sm">{data.panchang.sunset}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">चन्द्रोदय</h4>
              <div className="text-white text-sm">{data.panchang.moonrise}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <h4 className="text-purple-300 font-semibold mb-1">चन्द्रास्त</h4>
              <div className="text-white text-sm">{data.panchang.moonset}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
