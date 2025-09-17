'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Om, 
  Languages, 
  Settings, 
  Moon, 
  Sun, 
  Star,
  Menu,
  X,
  Home,
  BookOpen,
  MessageSquare,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VedicHeaderProps {
  currentLanguage?: 'ne' | 'hi' | 'en';
  onLanguageChange?: (lang: 'ne' | 'hi' | 'en') => void;
  showLanguageToggle?: boolean;
  showNavigation?: boolean;
}

const VedicHeader: React.FC<VedicHeaderProps> = ({
  currentLanguage = 'ne',
  onLanguageChange,
  showLanguageToggle = true,
  showNavigation = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  const languages = {
    ne: { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
    hi: { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    en: { code: 'en', name: 'English', flag: '🇺🇸' },
  };

  const currentLang = languages[currentLanguage];

  const navigation = [
    { name: 'Home', ne: 'घर', hi: 'घर', en: 'Home', href: '/', icon: Home },
    { name: 'Horoscope', ne: 'जन्मकुण्डली', hi: 'जन्मकुंडली', en: 'Horoscope', href: '/horoscope', icon: BookOpen },
    { name: 'Chat', ne: 'च्याट', hi: 'चैट', en: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Profile', ne: 'प्रोफाइल', hi: 'प्रोफाइल', en: 'Profile', href: '/profile', icon: User },
  ];

  const handleLanguageChange = (lang: 'ne' | 'hi' | 'en') => {
    onLanguageChange?.(lang);
    // Store in localStorage for persistence
    localStorage.setItem('preferred-language', lang);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Toggle dark mode class on document
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="bg-gradient-to-r from-vedic-primary to-vedic-secondary shadow-vedic-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Om className="h-8 w-8 text-vedic-gold group-hover:animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <Star className="h-3 w-3 text-vedic-gold animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white font-vedic">
                  Divyansh Jyotish
                </h1>
                <p className="text-xs text-vedic-gold font-devanagari">
                  वैदिक ज्योतिष
                </p>
              </div>
            </Link>
            <Badge variant="outline" className="bg-vedic-gold/20 text-vedic-gold border-vedic-gold">
              <Star className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>

          {/* Desktop Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 group"
                  >
                    <Icon className="h-4 w-4 group-hover:text-vedic-gold" />
                    <span className="font-vedic">
                      {item[currentLanguage as keyof typeof item]}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            {showLanguageToggle && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  <span className="font-vedic">{currentLang.flag} {currentLang.name}</span>
                </Button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-vedic-gold/20 z-50">
                    <div className="py-1">
                      {Object.values(languages).map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            handleLanguageChange(lang.code as 'ne' | 'hi' | 'en');
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-vedic-gold/10 flex items-center space-x-2 ${
                            currentLanguage === lang.code ? 'bg-vedic-gold/20 text-vedic-primary' : 'text-gray-700'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span className="font-vedic">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="text-white hover:bg-white/10"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && showNavigation && (
          <div className="md:hidden border-t border-white/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-vedic">
                      {item[currentLanguage as keyof typeof item]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default VedicHeader;




