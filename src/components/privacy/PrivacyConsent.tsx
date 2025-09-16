'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Database, 
  Trash2, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react';

interface PrivacyConsentProps {
  onConsentChange: (consent: boolean) => void;
  initialConsent?: boolean;
  language: 'ne' | 'hi' | 'en';
}

const PrivacyConsent: React.FC<PrivacyConsentProps> = ({
  onConsentChange,
  initialConsent = false,
  language,
}) => {
  const [consent, setConsent] = useState(initialConsent);
  const [showDetails, setShowDetails] = useState(false);

  const translations = {
    ne: {
      title: 'डेटा गोपनीयता र सहमति',
      subtitle: 'तपाईंको व्यक्तिगत जानकारी सुरक्षित राख्न',
      consentLabel: 'मेरो विवरण भविष्यका लागि तेजीले लोड गर्न भण्डारण गर्नुहोस्',
      consentDescription: 'यो विकल्पले तपाईंको जन्म विवरण र ज्योतिष परिणामहरू सुरक्षित रूपमा भण्डारण गर्छ।',
      details: 'विस्तृत जानकारी',
      whatWeStore: 'हामी के भण्डारण गर्छौं',
      whatWeStoreItems: [
        'जन्म मिति, समय र स्थान',
        'ज्योतिष गणना परिणामहरू',
        'च्याट संवादहरू',
        'प्रयोगकर्ता प्राथमिकताहरू',
      ],
      howWeUse: 'हामी यसलाई कसरी प्रयोग गर्छौं',
      howWeUseItems: [
        'ज्योतिष विश्लेषण प्रदान गर्न',
        'व्यक्तिगत अनुभव सुधार गर्न',
        'तपाईंको सहमतिमा मात्र',
      ],
      yourRights: 'तपाईंको अधिकारहरू',
      yourRightsItems: [
        'कुनै पनि समयमा डेटा मेटाउन',
        'डेटा पहुँच र सुधार गर्न',
        'सहमति फिर्ता लिन',
        'डेटा निर्यात गर्न',
      ],
      security: 'सुरक्षा',
      securityItems: [
        'एन्क्रिप्शन सहित सुरक्षित भण्डारण',
        'केवल आवश्यक डेटा भण्डारण',
        'तृतीय पक्षसँग साझेदारी नगर्ने',
        'नियमित सुरक्षा अडिट',
      ],
      privacyPolicy: 'गोपनीयता नीति',
      termsOfService: 'सेवा सर्तहरू',
      accept: 'स्वीकार गर्नुहोस्',
      decline: 'अस्वीकार गर्नुहोस्',
      learnMore: 'थप जान्नुहोस्',
    },
    hi: {
      title: 'डेटा गोपनीयता और सहमति',
      subtitle: 'आपकी व्यक्तिगत जानकारी को सुरक्षित रखना',
      consentLabel: 'मेरे विवरण को भविष्य के लिए तेजी से लोड करने के लिए स्टोर करें',
      consentDescription: 'यह विकल्प आपके जन्म विवरण और ज्योतिष परिणामों को सुरक्षित रूप से स्टोर करता है।',
      details: 'विस्तृत जानकारी',
      whatWeStore: 'हम क्या स्टोर करते हैं',
      whatWeStoreItems: [
        'जन्म तिथि, समय और स्थान',
        'ज्योतिष गणना परिणाम',
        'चैट संवाद',
        'उपयोगकर्ता प्राथमिकताएं',
      ],
      howWeUse: 'हम इसे कैसे उपयोग करते हैं',
      howWeUseItems: [
        'ज्योतिष विश्लेषण प्रदान करने के लिए',
        'व्यक्तिगत अनुभव सुधारने के लिए',
        'आपकी सहमति पर ही',
      ],
      yourRights: 'आपके अधिकार',
      yourRightsItems: [
        'किसी भी समय डेटा मिटाने का',
        'डेटा तक पहुंच और सुधार का',
        'सहमति वापस लेने का',
        'डेटा निर्यात करने का',
      ],
      security: 'सुरक्षा',
      securityItems: [
        'एन्क्रिप्शन के साथ सुरक्षित स्टोरेज',
        'केवल आवश्यक डेटा स्टोर करना',
        'तीसरे पक्ष के साथ साझा नहीं करना',
        'नियमित सुरक्षा ऑडिट',
      ],
      privacyPolicy: 'गोपनीयता नीति',
      termsOfService: 'सेवा शर्तें',
      accept: 'स्वीकार करें',
      decline: 'अस्वीकार करें',
      learnMore: 'और जानें',
    },
    en: {
      title: 'Data Privacy & Consent',
      subtitle: 'Keeping your personal information secure',
      consentLabel: 'Store my details for faster future loads',
      consentDescription: 'This option securely stores your birth details and astrological results.',
      details: 'Detailed Information',
      whatWeStore: 'What We Store',
      whatWeStoreItems: [
        'Birth date, time and location',
        'Astrological calculation results',
        'Chat conversations',
        'User preferences',
      ],
      howWeUse: 'How We Use It',
      howWeUseItems: [
        'To provide astrological analysis',
        'To improve personal experience',
        'Only with your consent',
      ],
      yourRights: 'Your Rights',
      yourRightsItems: [
        'Delete data at any time',
        'Access and modify data',
        'Withdraw consent',
        'Export data',
      ],
      security: 'Security',
      securityItems: [
        'Secure storage with encryption',
        'Store only necessary data',
        'No sharing with third parties',
        'Regular security audits',
      ],
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      accept: 'Accept',
      decline: 'Decline',
      learnMore: 'Learn More',
    },
  };

  const t = translations[language];

  const handleConsentChange = (checked: boolean) => {
    setConsent(checked);
    onConsentChange(checked);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-vedic-light border-vedic-gold/30">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="h-6 w-6 text-vedic-primary" />
          <CardTitle className="text-xl font-vedic text-vedic-dark">
            {t.title}
          </CardTitle>
        </div>
        <p className="text-vedic-dark/80 font-vedic">
          {t.subtitle}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Consent Checkbox */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy-consent"
              checked={consent}
              onCheckedChange={handleConsentChange}
              className="mt-1"
            />
            <div className="space-y-2">
              <label
                htmlFor="privacy-consent"
                className="text-sm font-medium text-vedic-dark cursor-pointer"
              >
                {t.consentLabel}
              </label>
              <p className="text-xs text-vedic-dark/70">
                {t.consentDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-vedic-primary border-vedic-primary hover:bg-vedic-primary hover:text-white"
          >
            {showDetails ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide {t.details}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show {t.details}
              </>
            )}
          </Button>

          {showDetails && (
            <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-vedic-gold/20">
              {/* What We Store */}
              <div>
                <h4 className="font-medium text-vedic-dark mb-2 flex items-center">
                  <Database className="h-4 w-4 mr-2 text-vedic-primary" />
                  {t.whatWeStore}
                </h4>
                <ul className="space-y-1 text-sm text-vedic-dark/80">
                  {t.whatWeStoreItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-vedic-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* How We Use */}
              <div>
                <h4 className="font-medium text-vedic-dark mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-vedic-secondary" />
                  {t.howWeUse}
                </h4>
                <ul className="space-y-1 text-sm text-vedic-dark/80">
                  {t.howWeUseItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-vedic-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Your Rights */}
              <div>
                <h4 className="font-medium text-vedic-dark mb-2 flex items-center">
                  <Trash2 className="h-4 w-4 mr-2 text-vedic-saffron" />
                  {t.yourRights}
                </h4>
                <ul className="space-y-1 text-sm text-vedic-dark/80">
                  {t.yourRightsItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-vedic-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security */}
              <div>
                <h4 className="font-medium text-vedic-dark mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-vedic-primary" />
                  {t.security}
                </h4>
                <ul className="space-y-1 text-sm text-vedic-dark/80">
                  {t.securityItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-vedic-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleConsentChange(true)}
            className={`flex-1 ${
              consent
                ? 'bg-vedic-primary text-white'
                : 'bg-vedic-primary/10 text-vedic-primary border-vedic-primary'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t.accept}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleConsentChange(false)}
            className={`flex-1 ${
              !consent
                ? 'border-vedic-primary text-vedic-primary'
                : 'border-vedic-dark/30 text-vedic-dark/70'
            }`}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t.decline}
          </Button>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-2 text-xs text-vedic-dark/60">
          <a
            href="/privacy-policy"
            className="flex items-center hover:text-vedic-primary transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t.privacyPolicy}
          </a>
          <a
            href="/terms-of-service"
            className="flex items-center hover:text-vedic-primary transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t.termsOfService}
          </a>
        </div>

        {/* Status Badge */}
        <div className="text-center">
          <Badge
            variant={consent ? 'default' : 'outline'}
            className={
              consent
                ? 'bg-vedic-gold text-vedic-dark'
                : 'border-vedic-dark/30 text-vedic-dark/70'
            }
          >
            {consent ? 'Consent Given' : 'No Consent'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacyConsent;



