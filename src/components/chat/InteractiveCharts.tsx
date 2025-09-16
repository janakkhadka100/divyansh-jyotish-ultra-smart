'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Share2, 
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  Moon,
  Sun
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
  date?: string;
  [key: string]: any;
}

interface InteractiveChartsProps {
  chartData: {
    planetaryPositions: ChartData[];
    dashaTimeline: ChartData[];
    yogas: ChartData[];
    houses: ChartData[];
    nakshatras: ChartData[];
  };
  onChartInteraction: (chartType: string, data: any) => void;
  onExport: (chartType: string, format: 'png' | 'svg' | 'pdf') => void;
  onShare: (chartType: string, data: any) => void;
  language: 'ne' | 'hi' | 'en';
}

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  chartData,
  onChartInteraction,
  onExport,
  onShare,
  language,
}) => {
  const [activeChart, setActiveChart] = useState<string>('planetaryPositions');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [chartFilters, setChartFilters] = useState({
    dateRange: { start: '', end: '' },
    categories: [] as string[],
    showLabels: true,
    showGrid: true,
  });

  const chartRef = useRef<HTMLDivElement>(null);

  const translations = {
    ne: {
      charts: 'चार्टहरू',
      planetaryPositions: 'ग्रह स्थितिहरू',
      dashaTimeline: 'दशा समयरेखा',
      yogas: 'योगहरू',
      houses: 'घरहरू',
      nakshatras: 'नक्षत्रहरू',
      zoomIn: 'जुम इन',
      zoomOut: 'जुम आउट',
      reset: 'रिसेट',
      fullscreen: 'पूर्ण स्क्रिन',
      exitFullscreen: 'पूर्ण स्क्रिन बाहिर',
      export: 'निर्यात',
      share: 'साझा गर्नुहोस्',
      previous: 'अघिल्लो',
      next: 'अर्को',
      selectChart: 'चार्ट छान्नुहोस्',
      chartSettings: 'चार्ट सेटिङहरू',
      showLabels: 'लेबलहरू देखाउनुहोस्',
      showGrid: 'ग्रिड देखाउनुहोस्',
      dateRange: 'मिति दायरा',
      categories: 'श्रेणीहरू',
      noData: 'कुनै डेटा छैन',
      loading: 'लोड हुँदै...',
    },
    hi: {
      charts: 'चार्ट',
      planetaryPositions: 'ग्रह स्थितियां',
      dashaTimeline: 'दशा टाइमलाइन',
      yogas: 'योग',
      houses: 'घर',
      nakshatras: 'नक्षत्र',
      zoomIn: 'ज़ूम इन',
      zoomOut: 'ज़ूम आउट',
      reset: 'रीसेट',
      fullscreen: 'पूर्ण स्क्रीन',
      exitFullscreen: 'पूर्ण स्क्रीन से बाहर',
      export: 'निर्यात',
      share: 'साझा करें',
      previous: 'पिछला',
      next: 'अगला',
      selectChart: 'चार्ट चुनें',
      chartSettings: 'चार्ट सेटिंग्स',
      showLabels: 'लेबल दिखाएं',
      showGrid: 'ग्रिड दिखाएं',
      dateRange: 'तिथि सीमा',
      categories: 'श्रेणियां',
      noData: 'कोई डेटा नहीं',
      loading: 'लोड हो रहा है...',
    },
    en: {
      charts: 'Charts',
      planetaryPositions: 'Planetary Positions',
      dashaTimeline: 'Dasha Timeline',
      yogas: 'Yogas',
      houses: 'Houses',
      nakshatras: 'Nakshatras',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      reset: 'Reset',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit Fullscreen',
      export: 'Export',
      share: 'Share',
      previous: 'Previous',
      next: 'Next',
      selectChart: 'Select Chart',
      chartSettings: 'Chart Settings',
      showLabels: 'Show Labels',
      showGrid: 'Show Grid',
      dateRange: 'Date Range',
      categories: 'Categories',
      noData: 'No Data',
      loading: 'Loading...',
    },
  };

  const t = translations[language];

  const chartTypes = [
    { id: 'planetaryPositions', label: t.planetaryPositions, icon: Star },
    { id: 'dashaTimeline', label: t.dashaTimeline, icon: Calendar },
    { id: 'yogas', label: t.yogas, icon: Moon },
    { id: 'houses', label: t.houses, icon: Sun },
    { id: 'nakshatras', label: t.nakshatras, icon: Star },
  ];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setSelectedData(null);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleChartClick = (data: any) => {
    setSelectedData(data);
    onChartInteraction(activeChart, data);
  };

  const handleExport = (format: 'png' | 'svg' | 'pdf') => {
    onExport(activeChart, format);
  };

  const handleShare = () => {
    onShare(activeChart, selectedData);
  };

  const handleFilterChange = (key: string, value: any) => {
    setChartFilters(prev => ({ ...prev, [key]: value }));
  };

  const getChartComponent = () => {
    const data = chartData[activeChart as keyof typeof chartData];
    
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {t.noData}
        </div>
      );
    }

    const commonProps = {
      data,
      onClick: handleChartClick,
      style: { transform: `scale(${zoomLevel})` },
    };

    switch (activeChart) {
      case 'planetaryPositions':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'dashaTimeline':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'yogas':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart {...commonProps}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'houses':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'nakshatras':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div>{t.noData}</div>;
    }
  };

  const currentChartIndex = chartTypes.findIndex(chart => chart.id === activeChart);
  const canGoPrevious = currentChartIndex > 0;
  const canGoNext = currentChartIndex < chartTypes.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setActiveChart(chartTypes[currentChartIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setActiveChart(chartTypes[currentChartIndex + 1].id);
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">{t.charts}</h3>
          <Badge variant="outline">{chartTypes.find(chart => chart.id === activeChart)?.label}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? t.exitFullscreen : t.fullscreen}
          </Button>
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="flex flex-wrap gap-2">
        {chartTypes.map(chart => {
          const Icon = chart.icon;
          return (
            <Button
              key={chart.id}
              variant={activeChart === chart.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart(chart.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {chart.label}
            </Button>
          );
        })}
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
            {t.reset}
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('png')}
          >
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('svg')}
          >
            <Download className="h-4 w-4 mr-2" />
            SVG
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={!selectedData}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {t.share}
          </Button>
        </div>
      </div>

      {/* Chart Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.chartSettings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartFilters.showLabels}
                onChange={(e) => handleFilterChange('showLabels', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t.showLabels}</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={chartFilters.showGrid}
                onChange={(e) => handleFilterChange('showGrid', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t.showGrid}</span>
            </label>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="date"
              value={chartFilters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', { ...chartFilters.dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t.dateRange}
            />
            <input
              type="date"
              value={chartFilters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', { ...chartFilters.dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder={t.dateRange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardContent className="p-6">
          <div ref={chartRef} className="overflow-auto">
            {getChartComponent()}
          </div>
        </CardContent>
      </Card>

      {/* Selected Data Display */}
      {selectedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
              {JSON.stringify(selectedData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractiveCharts;


