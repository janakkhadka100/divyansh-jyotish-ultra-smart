import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const locales = ['ne', 'hi', 'en'];

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return (
    <div>
      <LanguageSwitcher currentLocale={locale} />
      {children}
    </div>
  );
}
