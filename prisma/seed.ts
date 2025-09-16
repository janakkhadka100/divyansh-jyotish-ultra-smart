import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      name: 'दिव्यांश शर्मा',
      locale: 'ne',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      locale: 'en',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'राम कुमार',
      locale: 'hi',
    },
  });

  console.log('✅ Created users:', { user1: user1.id, user2: user2.id, user3: user3.id });

  // Create sample sessions with birth inputs
  const session1 = await prisma.session.create({
    data: {
      userId: user1.id,
      birth: {
        create: {
          name: 'दिव्यांश शर्मा',
          date: new Date('1990-01-15T10:30:00Z'),
          rawDate: '1990-01-15',
          rawTime: '10:30',
          location: 'काठमाडौं, नेपाल',
          lat: 27.7172,
          lon: 85.3240,
          tzId: 'Asia/Kathmandu',
          tzOffsetMinutes: 345, // UTC+5:45
        },
      },
    },
  });

  const session2 = await prisma.session.create({
    data: {
      userId: user2.id,
      birth: {
        create: {
          name: 'Priya Sharma',
          date: new Date('1985-06-20T14:15:00Z'),
          rawDate: '1985-06-20',
          rawTime: '14:15',
          location: 'Mumbai, India',
          lat: 19.0760,
          lon: 72.8777,
          tzId: 'Asia/Kolkata',
          tzOffsetMinutes: 330, // UTC+5:30
        },
      },
    },
  });

  console.log('✅ Created sessions:', { session1: session1.id, session2: session2.id });

  // Create sample horoscope results
  await prisma.horoscopeResult.create({
    data: {
      sessionId: session1.id,
      provider: 'prokerala',
      payload: {
        kundli: {
          sun: { sign: 'Capricorn', degree: 25.5, house: 10 },
          moon: { sign: 'Cancer', degree: 12.3, house: 4 },
          mars: { sign: 'Scorpio', degree: 8.7, house: 8 },
          mercury: { sign: 'Aquarius', degree: 15.2, house: 11 },
          jupiter: { sign: 'Sagittarius', degree: 22.1, house: 9 },
          venus: { sign: 'Capricorn', degree: 18.9, house: 10 },
          saturn: { sign: 'Aquarius', degree: 5.4, house: 11 },
        },
        dasha: {
          current: 'Jupiter',
          startDate: '2020-01-15',
          endDate: '2026-01-15',
        },
        yogas: ['Gaj Kesari Yoga', 'Dharma Karma Adhipati Yoga'],
      },
      summary: {
        personality: 'रचनात्मक र नेतृत्व गुण भएका व्यक्ति',
        career: 'प्रशासनिक क्षेत्रमा सफलता',
        health: 'सामान्य स्वास्थ्य',
        relationships: 'प्रेम जीवनमा स्थिरता',
      },
    },
  });

  await prisma.horoscopeResult.create({
    data: {
      sessionId: session2.id,
      provider: 'prokerala',
      payload: {
        kundli: {
          sun: { sign: 'Gemini', degree: 8.2, house: 3 },
          moon: { sign: 'Leo', degree: 15.6, house: 5 },
          mars: { sign: 'Aries', degree: 22.3, house: 1 },
          mercury: { sign: 'Gemini', degree: 12.1, house: 3 },
          jupiter: { sign: 'Pisces', degree: 18.7, house: 12 },
          venus: { sign: 'Taurus', degree: 25.4, house: 2 },
          saturn: { sign: 'Capricorn', degree: 9.8, house: 10 },
        },
        dasha: {
          current: 'Mercury',
          startDate: '2022-03-10',
          endDate: '2025-03-10',
        },
        yogas: ['Budh Aditya Yoga', 'Kala Sarpa Yoga'],
      },
      summary: {
        personality: 'बुद्धिमान र संवाद कुशल',
        career: 'शिक्षा र लेखन क्षेत्रमा सफलता',
        health: 'मानसिक स्वास्थ्यको ध्यान दिनुपर्छ',
        relationships: 'विवाहमा विलम्ब हुन सक्छ',
      },
    },
  });

  console.log('✅ Created horoscope results');

  // Create sample chat messages
  await prisma.chatMessage.createMany({
    data: [
      {
        sessionId: session1.id,
        role: 'user',
        content: 'मेरो करियरको भविष्य के छ?',
        lang: 'ne',
      },
      {
        sessionId: session1.id,
        role: 'assistant',
        content: 'तपाईंको जन्मकुण्डली अनुसार, अगाडि ६ महिनामा तपाईंको करियरमा राम्रो अवसर आउनेछ। विशेष गरी मार्च-अप्रिल महिनामा नयाँ कामको प्रस्ताव आउन सक्छ।',
        lang: 'ne',
      },
      {
        sessionId: session1.id,
        role: 'user',
        content: 'मेरो प्रेम जीवन कस्तो हुनेछ?',
        lang: 'ne',
      },
      {
        sessionId: session1.id,
        role: 'assistant',
        content: 'तपाईंको वर्तमान दशा अनुसार, यस वर्ष प्रेम सम्बन्धमा स्थिरता आउनेछ। अगस्त-सेप्टेम्बर महिनामा विवाहको सम्भावना छ।',
        lang: 'ne',
      },
      {
        sessionId: session2.id,
        role: 'user',
        content: 'What does my birth chart say about my career?',
        lang: 'en',
      },
      {
        sessionId: session2.id,
        role: 'assistant',
        content: 'Your birth chart indicates strong potential in education and writing fields. Mercury in Gemini gives you excellent communication skills. Consider careers in teaching, journalism, or content creation.',
        lang: 'en',
      },
    ],
  });

  console.log('✅ Created chat messages');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



