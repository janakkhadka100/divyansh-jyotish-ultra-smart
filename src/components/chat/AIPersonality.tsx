'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Star, 
  Heart, 
  Zap, 
  BookOpen, 
  Shield,
  Lightbulb,
  Target,
  Users,
  MessageSquare
} from 'lucide-react';

interface AIPersonality {
  id: string;
  name: string;
  description: string;
  traits: string[];
  responseStyle: 'formal' | 'casual' | 'friendly' | 'professional' | 'mystical';
  expertise: string[];
  language: 'ne' | 'hi' | 'en';
  temperature: number; // 0-1
  maxTokens: number;
  systemPrompt: string;
  customInstructions: string;
  isActive: boolean;
}

interface AIPersonalityProps {
  currentPersonality: AIPersonality;
  onPersonalityChange: (personality: AIPersonality) => void;
  onSave: (personality: AIPersonality) => void;
  onReset: () => void;
  language: 'ne' | 'hi' | 'en';
}

const AIPersonality: React.FC<AIPersonalityProps> = ({
  currentPersonality,
  onPersonalityChange,
  onSave,
  onReset,
  language,
}) => {
  const [personality, setPersonality] = useState<AIPersonality>(currentPersonality);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const translations = {
    ne: {
      title: 'AI व्यक्तित्व',
      description: 'AI सहायकको व्यक्तित्व र प्रतिक्रिया शैली अनुकूलन गर्नुहोस्',
      name: 'नाम',
      namePlaceholder: 'AI सहायकको नाम',
      description: 'विवरण',
      descriptionPlaceholder: 'AI सहायकको विवरण',
      traits: 'गुणहरू',
      responseStyle: 'प्रतिक्रिया शैली',
      expertise: 'विशेषज्ञता',
      language: 'भाषा',
      temperature: 'तापमान',
      temperatureDescription: 'उच्च तापमान = अधिक रचनात्मक, निम्न तापमान = अधिक सुसंगत',
      maxTokens: 'अधिकतम टोकन',
      systemPrompt: 'सिस्टम प्रोम्प्ट',
      customInstructions: 'कस्टम निर्देशहरू',
      edit: 'सम्पादन गर्नुहोस्',
      save: 'बचत गर्नुहोस्',
      cancel: 'रद्द गर्नुहोस्',
      reset: 'रिसेट गर्नुहोस्',
      advanced: 'उन्नत सेटिङहरू',
      basic: 'आधारभूत सेटिङहरू',
      responseStyles: {
        formal: 'औपचारिक',
        casual: 'अनौपचारिक',
        friendly: 'मित्रवत',
        professional: 'व्यावसायिक',
        mystical: 'रहस्यमय',
      },
      traits: {
        knowledgeable: 'ज्ञानी',
        patient: 'धैर्यवान',
        wise: 'बुद्धिमान',
        helpful: 'सहायक',
        creative: 'रचनात्मक',
        analytical: 'विश्लेषणात्मक',
        spiritual: 'आध्यात्मिक',
        practical: 'व्यावहारिक',
        empathetic: 'सहानुभूतिपूर्ण',
        inspiring: 'प्रेरणादायक',
      },
      expertise: {
        astrology: 'ज्योतिष',
        vedic: 'वैदिक ज्योतिष',
        numerology: 'अंकशास्त्र',
        palmistry: 'हस्तरेखा',
        tarot: 'तारो',
        meditation: 'ध्यान',
        yoga: 'योग',
        philosophy: 'दर्शन',
        psychology: 'मनोविज्ञान',
        counseling: 'परामर्श',
      },
      saveSuccess: 'AI व्यक्तित्व सफलतापूर्वक बचत भयो!',
      saveError: 'AI व्यक्तित्व बचत गर्नमा त्रुटि भयो।',
      resetConfirm: 'के तपाईं AI व्यक्तित्व रिसेट गर्न चाहनुहुन्छ?',
    },
    hi: {
      title: 'AI व्यक्तित्व',
      description: 'AI सहायक के व्यक्तित्व और प्रतिक्रिया शैली को अनुकूलित करें',
      name: 'नाम',
      namePlaceholder: 'AI सहायक का नाम',
      description: 'विवरण',
      descriptionPlaceholder: 'AI सहायक का विवरण',
      traits: 'गुण',
      responseStyle: 'प्रतिक्रिया शैली',
      expertise: 'विशेषज्ञता',
      language: 'भाषा',
      temperature: 'तापमान',
      temperatureDescription: 'उच्च तापमान = अधिक रचनात्मक, निम्न तापमान = अधिक सुसंगत',
      maxTokens: 'अधिकतम टोकन',
      systemPrompt: 'सिस्टम प्रोम्प्ट',
      customInstructions: 'कस्टम निर्देश',
      edit: 'संपादित करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      reset: 'रीसेट करें',
      advanced: 'उन्नत सेटिंग्स',
      basic: 'बुनियादी सेटिंग्स',
      responseStyles: {
        formal: 'औपचारिक',
        casual: 'अनौपचारिक',
        friendly: 'मित्रवत',
        professional: 'व्यावसायिक',
        mystical: 'रहस्यमय',
      },
      traits: {
        knowledgeable: 'ज्ञानी',
        patient: 'धैर्यवान',
        wise: 'बुद्धिमान',
        helpful: 'सहायक',
        creative: 'रचनात्मक',
        analytical: 'विश्लेषणात्मक',
        spiritual: 'आध्यात्मिक',
        practical: 'व्यावहारिक',
        empathetic: 'सहानुभूतिपूर्ण',
        inspiring: 'प्रेरणादायक',
      },
      expertise: {
        astrology: 'ज्योतिष',
        vedic: 'वैदिक ज्योतिष',
        numerology: 'अंकशास्त्र',
        palmistry: 'हस्तरेखा',
        tarot: 'तारो',
        meditation: 'ध्यान',
        yoga: 'योग',
        philosophy: 'दर्शन',
        psychology: 'मनोविज्ञान',
        counseling: 'परामर्श',
      },
      saveSuccess: 'AI व्यक्तित्व सफलतापूर्वक सहेजा गया!',
      saveError: 'AI व्यक्तित्व सहेजने में त्रुटि हुई।',
      resetConfirm: 'क्या आप AI व्यक्तित्व को रीसेट करना चाहते हैं?',
    },
    en: {
      title: 'AI Personality',
      description: 'Customize your AI assistant\'s personality and response style',
      name: 'Name',
      namePlaceholder: 'AI assistant name',
      description: 'Description',
      descriptionPlaceholder: 'AI assistant description',
      traits: 'Traits',
      responseStyle: 'Response Style',
      expertise: 'Expertise',
      language: 'Language',
      temperature: 'Temperature',
      temperatureDescription: 'Higher temperature = more creative, Lower temperature = more consistent',
      maxTokens: 'Max Tokens',
      systemPrompt: 'System Prompt',
      customInstructions: 'Custom Instructions',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      reset: 'Reset',
      advanced: 'Advanced Settings',
      basic: 'Basic Settings',
      responseStyles: {
        formal: 'Formal',
        casual: 'Casual',
        friendly: 'Friendly',
        professional: 'Professional',
        mystical: 'Mystical',
      },
      traits: {
        knowledgeable: 'Knowledgeable',
        patient: 'Patient',
        wise: 'Wise',
        helpful: 'Helpful',
        creative: 'Creative',
        analytical: 'Analytical',
        spiritual: 'Spiritual',
        practical: 'Practical',
        empathetic: 'Empathetic',
        inspiring: 'Inspiring',
      },
      expertise: {
        astrology: 'Astrology',
        vedic: 'Vedic Astrology',
        numerology: 'Numerology',
        palmistry: 'Palmistry',
        tarot: 'Tarot',
        meditation: 'Meditation',
        yoga: 'Yoga',
        philosophy: 'Philosophy',
        psychology: 'Psychology',
        counseling: 'Counseling',
      },
      saveSuccess: 'AI personality saved successfully!',
      saveError: 'Error saving AI personality.',
      resetConfirm: 'Are you sure you want to reset the AI personality?',
    },
  };

  const t = translations[language];

  const predefinedPersonalities: AIPersonality[] = [
    {
      id: 'mystical_guide',
      name: language === 'ne' ? 'रहस्यमय गाइड' : language === 'hi' ? 'रहस्यमय गाइड' : 'Mystical Guide',
      description: language === 'ne' ? 'एक रहस्यमय र आध्यात्मिक गाइड जसले गहिरो ज्योतिष ज्ञान प्रदान गर्छ' :
                   language === 'hi' ? 'एक रहस्यमय और आध्यात्मिक गाइड जो गहरा ज्योतिष ज्ञान प्रदान करता है' :
                   'A mystical and spiritual guide who provides deep astrological wisdom',
      traits: ['wise', 'spiritual', 'mystical', 'patient'],
      responseStyle: 'mystical',
      expertise: ['vedic', 'astrology', 'philosophy'],
      language,
      temperature: 0.8,
      maxTokens: 1000,
      systemPrompt: '',
      customInstructions: '',
      isActive: false,
    },
    {
      id: 'practical_advisor',
      name: language === 'ne' ? 'व्यावहारिक सल्लाहकार' : language === 'hi' ? 'व्यावहारिक सलाहकार' : 'Practical Advisor',
      description: language === 'ne' ? 'एक व्यावहारिक सल्लाहकार जसले व्यावहारिक ज्योतिष सल्लाह प्रदान गर्छ' :
                   language === 'hi' ? 'एक व्यावहारिक सलाहकार जो व्यावहारिक ज्योतिष सलाह प्रदान करता है' :
                   'A practical advisor who provides practical astrological advice',
      traits: ['practical', 'analytical', 'helpful', 'knowledgeable'],
      responseStyle: 'professional',
      expertise: ['astrology', 'psychology', 'counseling'],
      language,
      temperature: 0.6,
      maxTokens: 800,
      systemPrompt: '',
      customInstructions: '',
      isActive: false,
    },
    {
      id: 'friendly_mentor',
      name: language === 'ne' ? 'मित्रवत गुरु' : language === 'hi' ? 'मित्रवत गुरु' : 'Friendly Mentor',
      description: language === 'ne' ? 'एक मित्रवत गुरु जसले सहज रूपमा ज्योतिष ज्ञान साझा गर्छ' :
                   language === 'hi' ? 'एक मित्रवत गुरु जो आसानी से ज्योतिष ज्ञान साझा करता है' :
                   'A friendly mentor who shares astrological knowledge in an approachable way',
      traits: ['friendly', 'empathetic', 'helpful', 'inspiring'],
      responseStyle: 'friendly',
      expertise: ['astrology', 'meditation', 'yoga'],
      language,
      temperature: 0.7,
      maxTokens: 900,
      systemPrompt: '',
      customInstructions: '',
      isActive: false,
    },
  ];

  useEffect(() => {
    setPersonality(currentPersonality);
  }, [currentPersonality]);

  const handleInputChange = (field: keyof AIPersonality, value: any) => {
    setPersonality(prev => ({ ...prev, [field]: value }));
  };

  const handleTraitToggle = (trait: string) => {
    const newTraits = personality.traits.includes(trait)
      ? personality.traits.filter(t => t !== trait)
      : [...personality.traits, trait];
    handleInputChange('traits', newTraits);
  };

  const handleExpertiseToggle = (expertise: string) => {
    const newExpertise = personality.expertise.includes(expertise)
      ? personality.expertise.filter(e => e !== expertise)
      : [...personality.expertise, expertise];
    handleInputChange('expertise', newExpertise);
  };

  const handleSave = () => {
    onSave(personality);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPersonality(currentPersonality);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (confirm(t.resetConfirm)) {
      onReset();
    }
  };

  const handlePersonalitySelect = (personality: AIPersonality) => {
    setPersonality(personality);
    onPersonalityChange(personality);
  };

  const generateSystemPrompt = () => {
    const traitsText = personality.traits.map(trait => t.traits[trait as keyof typeof t.traits]).join(', ');
    const expertiseText = personality.expertise.map(exp => t.expertise[exp as keyof typeof t.expertise]).join(', ');
    
    return `You are ${personality.name}, ${personality.description}. 

Your traits: ${traitsText}
Your expertise: ${expertiseText}
Response style: ${t.responseStyles[personality.responseStyle]}

${personality.customInstructions}

Always respond in ${language === 'ne' ? 'Nepali' : language === 'hi' ? 'Hindi' : 'English'} and maintain your personality consistently.`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {t.edit}
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                {t.cancel}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                {t.save}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Predefined Personalities */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Predefined Personalities</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {predefinedPersonalities.map(personality => (
            <Card
              key={personality.id}
              className={`cursor-pointer transition-colors ${
                personality.id === currentPersonality.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handlePersonalitySelect(personality)}
            >
              <CardContent className="p-3">
                <h5 className="font-medium text-sm">{personality.name}</h5>
                <p className="text-xs text-muted-foreground mt-1">{personality.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {personality.traits.slice(0, 2).map(trait => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {t.traits[trait as keyof typeof t.traits]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personality Editor */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.basic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.name}</label>
              <Input
                value={personality.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t.namePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.description}</label>
              <Input
                value={personality.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            {/* Response Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.responseStyle}</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(t.responseStyles).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={personality.responseStyle === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('responseStyle', key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Traits */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.traits}</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(t.traits).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={personality.traits.includes(key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTraitToggle(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Expertise */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.expertise}</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(t.expertise).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={personality.expertise.includes(key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleExpertiseToggle(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? t.basic : t.advanced}
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t">
                {/* Temperature */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.temperature}</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={personality.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">{personality.temperature}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.temperatureDescription}</p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.maxTokens}</label>
                  <Input
                    type="number"
                    value={personality.maxTokens}
                    onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                    min="100"
                    max="2000"
                  />
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.customInstructions}</label>
                  <textarea
                    value={personality.customInstructions}
                    onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    rows={3}
                    placeholder="Enter custom instructions for the AI..."
                  />
                </div>

                {/* Generated System Prompt */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.systemPrompt}</label>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    <pre className="whitespace-pre-wrap">{generateSystemPrompt()}</pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Personality Display */}
      {!isEditing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h4 className="font-medium">{personality.name}</h4>
                <p className="text-sm text-muted-foreground">{personality.description}</p>
                <div className="flex flex-wrap gap-1">
                  {personality.traits.map(trait => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {t.traits[trait as keyof typeof t.traits]}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>{t.responseStyles[personality.responseStyle]}</div>
                <div>Temp: {personality.temperature}</div>
                <div>Tokens: {personality.maxTokens}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.reset}
        </Button>
      </div>
    </div>
  );
};

export default AIPersonality;
