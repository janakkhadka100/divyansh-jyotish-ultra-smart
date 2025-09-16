'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Lock, Calendar, Clock, MapPin, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  ayanamsa: number;
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    ayanamsa: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
    timezone: string;
    city: string;
    country: string;
  } | null>(null);

  // Nepali cities with coordinates (both Nepali and English names)
  const nepaliCitiesData = {
    'काठमाडौं': { latitude: 27.7172, longitude: 85.3240, timezone: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal' },
    'kathmandu': { latitude: 27.7172, longitude: 85.3240, timezone: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal' },
    'पोखरा': { latitude: 28.2096, longitude: 83.9856, timezone: 'Asia/Kathmandu', city: 'Pokhara', country: 'Nepal' },
    'pokhara': { latitude: 28.2096, longitude: 83.9856, timezone: 'Asia/Kathmandu', city: 'Pokhara', country: 'Nepal' },
    'ललितपुर': { latitude: 27.6710, longitude: 85.3250, timezone: 'Asia/Kathmandu', city: 'Lalitpur', country: 'Nepal' },
    'lalitpur': { latitude: 27.6710, longitude: 85.3250, timezone: 'Asia/Kathmandu', city: 'Lalitpur', country: 'Nepal' },
    'भक्तपुर': { latitude: 27.6710, longitude: 85.4298, timezone: 'Asia/Kathmandu', city: 'Bhaktapur', country: 'Nepal' },
    'bhaktapur': { latitude: 27.6710, longitude: 85.4298, timezone: 'Asia/Kathmandu', city: 'Bhaktapur', country: 'Nepal' },
    'बिराटनगर': { latitude: 26.4525, longitude: 87.2718, timezone: 'Asia/Kathmandu', city: 'Biratnagar', country: 'Nepal' },
    'biratnagar': { latitude: 26.4525, longitude: 87.2718, timezone: 'Asia/Kathmandu', city: 'Biratnagar', country: 'Nepal' },
    'बिरगंज': { latitude: 27.0000, longitude: 84.8667, timezone: 'Asia/Kathmandu', city: 'Birgunj', country: 'Nepal' },
    'birgunj': { latitude: 27.0000, longitude: 84.8667, timezone: 'Asia/Kathmandu', city: 'Birgunj', country: 'Nepal' },
    'नेपालगंज': { latitude: 28.0500, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Nepalgunj', country: 'Nepal' },
    'nepalgunj': { latitude: 28.0500, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Nepalgunj', country: 'Nepal' },
    'धरान': { latitude: 26.8167, longitude: 87.2833, timezone: 'Asia/Kathmandu', city: 'Dharan', country: 'Nepal' },
    'dharan': { latitude: 26.8167, longitude: 87.2833, timezone: 'Asia/Kathmandu', city: 'Dharan', country: 'Nepal' },
    'बुटवल': { latitude: 27.7000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Butwal', country: 'Nepal' },
    'butwal': { latitude: 27.7000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Butwal', country: 'Nepal' },
    'धनगढी': { latitude: 28.6833, longitude: 80.6167, timezone: 'Asia/Kathmandu', city: 'Dhangadhi', country: 'Nepal' },
    'dhangadhi': { latitude: 28.6833, longitude: 80.6167, timezone: 'Asia/Kathmandu', city: 'Dhangadhi', country: 'Nepal' },
    'महेन्द्रनगर': { latitude: 28.9167, longitude: 80.3333, timezone: 'Asia/Kathmandu', city: 'Mahendranagar', country: 'Nepal' },
    'mahendranagar': { latitude: 28.9167, longitude: 80.3333, timezone: 'Asia/Kathmandu', city: 'Mahendranagar', country: 'Nepal' },
    'हेटौडा': { latitude: 27.4167, longitude: 85.0333, timezone: 'Asia/Kathmandu', city: 'Hetauda', country: 'Nepal' },
    'hetauda': { latitude: 27.4167, longitude: 85.0333, timezone: 'Asia/Kathmandu', city: 'Hetauda', country: 'Nepal' },
    'जनकपुर': { latitude: 26.7288, longitude: 85.9254, timezone: 'Asia/Kathmandu', city: 'Janakpur', country: 'Nepal' },
    'janakpur': { latitude: 26.7288, longitude: 85.9254, timezone: 'Asia/Kathmandu', city: 'Janakpur', country: 'Nepal' },
    'इटहरी': { latitude: 26.6667, longitude: 87.2833, timezone: 'Asia/Kathmandu', city: 'Itahari', country: 'Nepal' },
    'itahari': { latitude: 26.6667, longitude: 87.2833, timezone: 'Asia/Kathmandu', city: 'Itahari', country: 'Nepal' },
    'कलैया': { latitude: 27.0333, longitude: 85.0167, timezone: 'Asia/Kathmandu', city: 'Kalaiya', country: 'Nepal' },
    'kalaiya': { latitude: 27.0333, longitude: 85.0167, timezone: 'Asia/Kathmandu', city: 'Kalaiya', country: 'Nepal' },
    'भरतपुर': { latitude: 27.6833, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Bharatpur', country: 'Nepal' },
    'bharatpur': { latitude: 27.6833, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Bharatpur', country: 'Nepal' },
    'सिद्धार्थनगर': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Siddharthanagar', country: 'Nepal' },
    'siddharthanagar': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Siddharthanagar', country: 'Nepal' },
    'तुलसीपुर': { latitude: 28.1333, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Tulsipur', country: 'Nepal' },
    'tulsipur': { latitude: 28.1333, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Tulsipur', country: 'Nepal' },
    'राजविराज': { latitude: 26.5333, longitude: 86.7500, timezone: 'Asia/Kathmandu', city: 'Rajbiraj', country: 'Nepal' },
    'rajbiraj': { latitude: 26.5333, longitude: 86.7500, timezone: 'Asia/Kathmandu', city: 'Rajbiraj', country: 'Nepal' },
    'लहान': { latitude: 26.7167, longitude: 86.4833, timezone: 'Asia/Kathmandu', city: 'Lahan', country: 'Nepal' },
    'lahan': { latitude: 26.7167, longitude: 86.4833, timezone: 'Asia/Kathmandu', city: 'Lahan', country: 'Nepal' },
    'पनौती': { latitude: 27.5833, longitude: 85.5167, timezone: 'Asia/Kathmandu', city: 'Panauti', country: 'Nepal' },
    'panauti': { latitude: 27.5833, longitude: 85.5167, timezone: 'Asia/Kathmandu', city: 'Panauti', country: 'Nepal' },
    'गोरखा': { latitude: 28.0000, longitude: 84.6333, timezone: 'Asia/Kathmandu', city: 'Gorkha', country: 'Nepal' },
    'gorkha': { latitude: 28.0000, longitude: 84.6333, timezone: 'Asia/Kathmandu', city: 'Gorkha', country: 'Nepal' },
    'बन्दीपुर': { latitude: 27.9333, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Bandipur', country: 'Nepal' },
    'bandipur': { latitude: 27.9333, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Bandipur', country: 'Nepal' },
    'मलंगवा': { latitude: 26.8667, longitude: 85.5667, timezone: 'Asia/Kathmandu', city: 'Malangwa', country: 'Nepal' },
    'malangwa': { latitude: 26.8667, longitude: 85.5667, timezone: 'Asia/Kathmandu', city: 'Malangwa', country: 'Nepal' },
    'बिरेन्द्रनगर': { latitude: 28.6000, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Birendranagar', country: 'Nepal' },
    'birendranagar': { latitude: 28.6000, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Birendranagar', country: 'Nepal' },
    'दमक': { latitude: 26.6500, longitude: 87.7000, timezone: 'Asia/Kathmandu', city: 'Damak', country: 'Nepal' },
    'damak': { latitude: 26.6500, longitude: 87.7000, timezone: 'Asia/Kathmandu', city: 'Damak', country: 'Nepal' },
    'बनेपा': { latitude: 27.6333, longitude: 85.5167, timezone: 'Asia/Kathmandu', city: 'Banepa', country: 'Nepal' },
    'banepa': { latitude: 27.6333, longitude: 85.5167, timezone: 'Asia/Kathmandu', city: 'Banepa', country: 'Nepal' },
    'किर्तिपुर': { latitude: 27.6667, longitude: 85.2833, timezone: 'Asia/Kathmandu', city: 'Kirtipur', country: 'Nepal' },
    'kirtipur': { latitude: 27.6667, longitude: 85.2833, timezone: 'Asia/Kathmandu', city: 'Kirtipur', country: 'Nepal' },
    'मध्यपुर': { latitude: 27.6667, longitude: 85.3500, timezone: 'Asia/Kathmandu', city: 'Madhyapur', country: 'Nepal' },
    'madhyapur': { latitude: 27.6667, longitude: 85.3500, timezone: 'Asia/Kathmandu', city: 'Madhyapur', country: 'Nepal' },
    'तिलोत्तमा': { latitude: 27.7000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Tilottama', country: 'Nepal' },
    'tilottama': { latitude: 27.7000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Tilottama', country: 'Nepal' },
    'रत्ननगर': { latitude: 27.6833, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Ratnanagar', country: 'Nepal' },
    'ratnanagar': { latitude: 27.6833, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Ratnanagar', country: 'Nepal' },
    'कपिलवस्तु': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Kapilvastu', country: 'Nepal' },
    'kapilvastu': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Kapilvastu', country: 'Nepal' },
    'लुम्बिनी': { latitude: 27.4667, longitude: 83.2667, timezone: 'Asia/Kathmandu', city: 'Lumbini', country: 'Nepal' },
    'lumbini': { latitude: 27.4667, longitude: 83.2667, timezone: 'Asia/Kathmandu', city: 'Lumbini', country: 'Nepal' },
    'तौलिहवा': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Taulihawa', country: 'Nepal' },
    'taulihawa': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Taulihawa', country: 'Nepal' },
    'रामग्राम': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Ramgram', country: 'Nepal' },
    'ramgram': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Ramgram', country: 'Nepal' },
    'देवदहा': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Devdaha', country: 'Nepal' },
    'devdaha': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Devdaha', country: 'Nepal' },
    'सैनामैना': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Sainamaina', country: 'Nepal' },
    'sainamaina': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Sainamaina', country: 'Nepal' },
    'परासी': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Parasi', country: 'Nepal' },
    'parasi': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Parasi', country: 'Nepal' },
    'सुनवल': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Sunwal', country: 'Nepal' },
    'sunwal': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Sunwal', country: 'Nepal' },
    'बर्दघाट': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Bardaghat', country: 'Nepal' },
    'bardaghat': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Bardaghat', country: 'Nepal' },
    'रामपुर': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Rampur', country: 'Nepal' },
    'rampur': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Rampur', country: 'Nepal' },
    'सरावल': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Sarawal', country: 'Nepal' },
    'sarawal': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Sarawal', country: 'Nepal' },
    'पाल्हिनन्दन': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Palhinandan', country: 'Nepal' },
    'palhinandan': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Palhinandan', country: 'Nepal' },
    'प्रतापपुर': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Pratappur', country: 'Nepal' },
    'pratappur': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Pratappur', country: 'Nepal' },
    'कोटहिमाई': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Kotahimai', country: 'Nepal' },
    'kotahimai': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Kotahimai', country: 'Nepal' },
    'मार्चावारी': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Marchawari', country: 'Nepal' },
    'marchawari': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Marchawari', country: 'Nepal' },
    'मायादेवी': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Mayadevi', country: 'Nepal' },
    'mayadevi': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Mayadevi', country: 'Nepal' },
    'सुद्धोधन': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Suddhodhan', country: 'Nepal' },
    'suddhodhan': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Suddhodhan', country: 'Nepal' },
    'अरिहवा': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Arihawa', country: 'Nepal' },
    'arihawa': { latitude: 27.5000, longitude: 83.4500, timezone: 'Asia/Kathmandu', city: 'Arihawa', country: 'Nepal' },
    'कोहलपुर': { latitude: 28.1000, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Kohalpur', country: 'Nepal' },
    'kohalpur': { latitude: 28.1000, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Kohalpur', country: 'Nepal' },
    'गुलरिया': { latitude: 28.2333, longitude: 81.3333, timezone: 'Asia/Kathmandu', city: 'Gulariya', country: 'Nepal' },
    'gulariya': { latitude: 28.2333, longitude: 81.3333, timezone: 'Asia/Kathmandu', city: 'Gulariya', country: 'Nepal' },
    'मध्यबिन्दु': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Madhyabindu', country: 'Nepal' },
    'madhyabindu': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Madhyabindu', country: 'Nepal' },
    'कवासोती': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Kawasoti', country: 'Nepal' },
    'kawasoti': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Kawasoti', country: 'Nepal' },
    'गैंडाकोट': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Gaindakot', country: 'Nepal' },
    'gaindakot': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Gaindakot', country: 'Nepal' },
    'देवचुली': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Devchuli', country: 'Nepal' },
    'devchuli': { latitude: 27.9167, longitude: 84.4167, timezone: 'Asia/Kathmandu', city: 'Devchuli', country: 'Nepal' },
    'बर्दिया': { latitude: 28.2333, longitude: 81.3333, timezone: 'Asia/Kathmandu', city: 'Bardiya', country: 'Nepal' },
    'bardiya': { latitude: 28.2333, longitude: 81.3333, timezone: 'Asia/Kathmandu', city: 'Bardiya', country: 'Nepal' },
    'बाँके': { latitude: 28.1000, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Banke', country: 'Nepal' },
    'banke': { latitude: 28.1000, longitude: 81.6167, timezone: 'Asia/Kathmandu', city: 'Banke', country: 'Nepal' },
    'दाङ': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Dang', country: 'Nepal' },
    'dang': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Dang', country: 'Nepal' },
    'प्यूठान': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Pyuthan', country: 'Nepal' },
    'pyuthan': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Pyuthan', country: 'Nepal' },
    'रोल्पा': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Rolpa', country: 'Nepal' },
    'rolpa': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Rolpa', country: 'Nepal' },
    'रुकुम': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Rukum', country: 'Nepal' },
    'rukum': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Rukum', country: 'Nepal' },
    'सल्यान': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Salyan', country: 'Nepal' },
    'salyan': { latitude: 28.1000, longitude: 82.3000, timezone: 'Asia/Kathmandu', city: 'Salyan', country: 'Nepal' },
    'डोल्पा': { latitude: 29.0000, longitude: 82.5000, timezone: 'Asia/Kathmandu', city: 'Dolpa', country: 'Nepal' },
    'dolpa': { latitude: 29.0000, longitude: 82.5000, timezone: 'Asia/Kathmandu', city: 'Dolpa', country: 'Nepal' },
    'हुम्ला': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Humla', country: 'Nepal' },
    'humla': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Humla', country: 'Nepal' },
    'जुम्ला': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Jumla', country: 'Nepal' },
    'jumla': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Jumla', country: 'Nepal' },
    'कालिकोट': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Kalikot', country: 'Nepal' },
    'kalikot': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Kalikot', country: 'Nepal' },
    'मुगु': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Mugu', country: 'Nepal' },
    'mugu': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Mugu', country: 'Nepal' },
    'बाजुरा': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Bajura', country: 'Nepal' },
    'bajura': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Bajura', country: 'Nepal' },
    'बझाङ': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Bajhang', country: 'Nepal' },
    'bajhang': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Bajhang', country: 'Nepal' },
    'अछाम': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Achham', country: 'Nepal' },
    'achham': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Achham', country: 'Nepal' },
    'डोटी': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Doti', country: 'Nepal' },
    'doti': { latitude: 29.5000, longitude: 82.0000, timezone: 'Asia/Kathmandu', city: 'Doti', country: 'Nepal' },
    'कैलाली': { latitude: 28.6833, longitude: 80.6167, timezone: 'Asia/Kathmandu', city: 'Kailali', country: 'Nepal' },
    'kailali': { latitude: 28.6833, longitude: 80.6167, timezone: 'Asia/Kathmandu', city: 'Kailali', country: 'Nepal' },
    'कञ्चनपुर': { latitude: 28.9167, longitude: 80.3333, timezone: 'Asia/Kathmandu', city: 'Kanchanpur', country: 'Nepal' },
    'kanchanpur': { latitude: 28.9167, longitude: 80.3333, timezone: 'Asia/Kathmandu', city: 'Kanchanpur', country: 'Nepal' },
    'दडेलधुरा': { latitude: 29.5000, longitude: 80.5000, timezone: 'Asia/Kathmandu', city: 'Dadeldhura', country: 'Nepal' },
    'dadeldhura': { latitude: 29.5000, longitude: 80.5000, timezone: 'Asia/Kathmandu', city: 'Dadeldhura', country: 'Nepal' },
    'बैतडी': { latitude: 29.5000, longitude: 80.5000, timezone: 'Asia/Kathmandu', city: 'Baitadi', country: 'Nepal' },
    'baitadi': { latitude: 29.5000, longitude: 80.5000, timezone: 'Asia/Kathmandu', city: 'Baitadi', country: 'Nepal' },
    'दार्चुला': { latitude: 29.5000, longitude: 80.5000, timezone: 'Asia/Kathmandu', city: 'Darchula', country: 'Nepal' },
    'darchula': { latitude: 29.5000, longitude: 80.5000, timezone: 'Asia/Kathmandu', city: 'Darchula', country: 'Nepal' }
  };

  const nepaliCities = Object.keys(nepaliCitiesData);

  const handleInputChange = (field: keyof SignupData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle location suggestions
    if (field === 'birthPlace') {
      const inputValue = value.toString().toLowerCase();
      if (inputValue.length > 0) {
        const filtered = nepaliCities.filter(city => 
          city.toLowerCase().includes(inputValue)
        );
        setLocationSuggestions(filtered.slice(0, 5));
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('पासवर्ड मेल खाँदैन');
      return;
    }

    if (formData.password.length < 6) {
      setError('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
      return;
    }

    if (!formData.name || !formData.email || !formData.birthDate || !formData.birthTime || !formData.birthPlace) {
      setError('कृपया सबै फिल्ड भर्नुहोस्');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          birthData: {
            birthDate: formData.birthDate,
            birthTime: formData.birthTime,
            birthPlace: formData.birthPlace,
            ayanamsa: formData.ayanamsa,
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Redirect to dashboard
        router.push('/ne/dashboard');
      } else {
        setError(data.error || 'साइन अप गर्नमा त्रुटि भयो');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('साइन अप गर्नमा त्रुटि भयो');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-slate-800/50 border-slate-700 shadow-2xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <span className="text-slate-900 font-bold text-2xl">दि</span>
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-400">
              खाता खोल्नुहोस्
            </CardTitle>
            <CardDescription className="text-white/80 text-lg">
              दिव्यांश ज्योतिषमा सामेल हुनुहोस्
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">व्यक्तिगत जानकारी</h3>
                
                <div className="space-y-2">
                  <label className="text-white font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    नाम
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="आफ्नो नाम लेख्नुहोस्"
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    इमेल
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="आफ्नो इमेल लेख्नुहोस्"
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      पासवर्ड
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="पासवर्ड लेख्नुहोस्"
                        className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      पासवर्ड पुष्टि
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="पासवर्ड फेरि लेख्नुहोस्"
                        className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Birth Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">जन्म विवरण</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-white font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      जन्म मिति
                    </label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-white font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      जन्म समय
                    </label>
                    <Input
                      type="time"
                      value={formData.birthTime}
                      onChange={(e) => handleInputChange('birthTime', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    जन्म स्थान
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.birthPlace}
                      onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                      onFocus={() => {
                        if (formData.birthPlace.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicking
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="जन्म स्थान (शहर, देश)"
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                      required
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {locationSuggestions.map((city, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, birthPlace: city }));
                              setSelectedCoordinates(nepaliCitiesData[city as keyof typeof nepaliCitiesData]);
                              setShowSuggestions(false);
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCoordinates && (
                    <div className="mt-2 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
                      <div className="text-sm text-gray-300">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-yellow-400 font-medium">स्थान:</span>
                          <span>{selectedCoordinates.city}, {selectedCoordinates.country}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-yellow-400 font-medium">अक्षांश:</span>
                          <span>{selectedCoordinates.latitude}°</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-yellow-400 font-medium">देशान्तर:</span>
                          <span>{selectedCoordinates.longitude}°</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400 font-medium">समय क्षेत्र:</span>
                          <span>{selectedCoordinates.timezone}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    अयनांश
                  </label>
                  <select
                    value={formData.ayanamsa}
                    onChange={(e) => handleInputChange('ayanamsa', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400 rounded-md px-3 py-2 w-full"
                    required
                  >
                    <option value={1}>लाहिरी (Lahiri)</option>
                    <option value={2}>रामन (Raman)</option>
                    <option value={3}>कृष्णमूर्ति (Krishnamurti)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold text-lg py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    खाता खोल्दै...
                  </>
                ) : (
                  'खाता खोल्नुहोस्'
                )}
              </Button>

              <div className="text-center">
                <p className="text-white/60">
                  पहिले नै खाता छ?{' '}
                  <Link href="/ne/auth/signin" className="text-yellow-400 hover:text-yellow-300 font-medium">
                    साइन इन गर्नुहोस्
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


