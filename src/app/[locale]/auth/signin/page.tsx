'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface SigninData {
  email: string;
  password: string;
}

export default function SigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SigninData>({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof SigninData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('कृपया सबै फिल्ड भर्नुहोस्');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Redirect to dashboard
        router.push('/ne/dashboard');
      } else {
        setError(data.error || 'साइन इन गर्नमा त्रुटि भयो');
      }
    } catch (error) {
      console.error('Signin error:', error);
      setError('साइन इन गर्नमा त्रुटि भयो');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 shadow-2xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <span className="text-slate-900 font-bold text-2xl">दि</span>
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-400">
              साइन इन गर्नुहोस्
            </CardTitle>
            <CardDescription className="text-white/80 text-lg">
              दिव्यांश ज्योतिषमा फर्किनुहोस्
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    साइन इन गर्दै...
                  </>
                ) : (
                  'साइन इन गर्नुहोस्'
                )}
              </Button>

              <div className="text-center">
                <p className="text-white/60">
                  खाता छैन?{' '}
                  <Link href="/ne/auth/signup" className="text-yellow-400 hover:text-yellow-300 font-medium">
                    खाता खोल्नुहोस्
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




