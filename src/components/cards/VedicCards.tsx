'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Moon, 
  Sun, 
  Zap, 
  TrendingUp,
  Heart,
  Shield,
  Target,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface VedicCardProps {
  title: string;
  titleNe: string;
  titleHi: string;
  icon: React.ReactNode;
  data?: any;
  language: 'ne' | 'hi' | 'en';
  onExplain?: (cardData: any, cardType: string) => void;
  isLoading?: boolean;
  className?: string;
}

const VedicCard: React.FC<VedicCardProps> = ({
  title,
  titleNe,
  titleHi,
  icon,
  data,
  language,
  onExplain,
  isLoading = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayTitle = language === 'ne' ? titleNe : language === 'hi' ? titleHi : title;

  const getCardIcon = (type: string) => {
    const icons = {
      birth: <Calendar className="h-5 w-5 text-vedic-primary" />,
      lagna: <Star className="h-5 w-5 text-vedic-gold" />,
      navamsa: <Moon className="h-5 w-5 text-vedic-secondary" />,
      dasha: <Zap className="h-5 w-5 text-vedic-saffron" />,
      timeline: <TrendingUp className="h-5 w-5 text-vedic-maroon" />,
      yoga: <Heart className="h-5 w-5 text-vedic-primary" />,
      panchang: <Sun className="h-5 w-5 text-vedic-gold" />,
    };
    return icons[type as keyof typeof icons] || <Info className="h-5 w-5 text-vedic-primary" />;
  };

  const getEmptyStateMessage = () => {
    const messages = {
      ne: 'डेटा उपलब्ध छैन',
      hi: 'डेटा उपलब्ध नहीं है',
      en: 'No data available',
    };
    return messages[language];
  };

  const getExplainButtonText = () => {
    const texts = {
      ne: 'व्याख्या गर्नुहोस्',
      hi: 'व्याख्या करें',
      en: 'Explain',
    };
    return texts[language];
  };

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-vedic-gold/30 shadow-vedic hover:shadow-vedic-lg transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getCardIcon(title.toLowerCase())}
            <CardTitle className="text-lg font-vedic text-vedic-dark">
              {displayTitle}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            {data && (
              <Badge variant="outline" className="text-xs bg-vedic-gold/20 text-vedic-gold border-vedic-gold">
                <Sparkles className="h-2 w-2 mr-1" />
                Active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-vedic-dark hover:bg-vedic-gold/10"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vedic-primary"></div>
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Card Content */}
            <div className="text-sm text-vedic-dark">
              {renderCardContent(data, language)}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-vedic-gold/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExplain?.(data, displayTitle)}
                className="text-vedic-primary border-vedic-primary hover:bg-vedic-primary hover:text-white"
              >
                <Info className="h-3 w-3 mr-1" />
                {getExplainButtonText()}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-vedic-gold hover:bg-vedic-gold/10"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-vedic-dark/60">
            <div className="text-4xl mb-2">🔮</div>
            <p className="text-sm font-vedic">{getEmptyStateMessage()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to render card content based on data type
const renderCardContent = (data: any, language: 'ne' | 'hi' | 'en') => {
  if (!data) return null;

  // Birth Summary Card
  if (data.birthDate || data.birthTime || data.birthPlace) {
    return (
      <div className="space-y-2">
        {data.birthDate && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-vedic-primary" />
            <span className="font-medium">Birth Date:</span>
            <span>{data.birthDate}</span>
          </div>
        )}
        {data.birthTime && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-vedic-gold" />
            <span className="font-medium">Birth Time:</span>
            <span>{data.birthTime}</span>
          </div>
        )}
        {data.birthPlace && (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-vedic-secondary" />
            <span className="font-medium">Birth Place:</span>
            <span>{data.birthPlace}</span>
          </div>
        )}
      </div>
    );
  }

  // Lagna Card
  if (data.ascendant || data.ascendantSign) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-vedic-gold" />
          <span className="font-medium">Ascendant:</span>
          <span className="font-vedic">{data.ascendant || data.ascendantSign}</span>
        </div>
        {data.ascendantLord && (
          <div className="text-sm text-vedic-dark/80">
            Lord: {data.ascendantLord}
          </div>
        )}
      </div>
    );
  }

  // Dasha Card
  if (data.currentDasha || data.dashaPeriod) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-vedic-saffron" />
          <span className="font-medium">Current Dasha:</span>
          <span className="font-vedic">{data.currentDasha || data.dashaPeriod}</span>
        </div>
        {data.dashaEndDate && (
          <div className="text-sm text-vedic-dark/80">
            Ends: {data.dashaEndDate}
          </div>
        )}
      </div>
    );
  }

  // Yoga Card
  if (data.yogas && Array.isArray(data.yogas)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Heart className="h-4 w-4 text-vedic-primary" />
          <span className="font-medium">Key Yogas:</span>
        </div>
        <div className="space-y-1">
          {data.yogas.slice(0, 3).map((yoga: string, index: number) => (
            <div key={index} className="text-sm text-vedic-dark/80">
              • {yoga}
            </div>
          ))}
          {data.yogas.length > 3 && (
            <div className="text-xs text-vedic-dark/60">
              +{data.yogas.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="text-sm text-vedic-dark/80">
      {JSON.stringify(data, null, 2)}
    </div>
  );
};

export default VedicCard;
