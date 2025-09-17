import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo data for testing
const demoUsers = [
  {
    id: 'demo-user-1',
    name: 'राम शर्मा',
    locale: 'ne',
  },
  {
    id: 'demo-user-2',
    name: 'Priya Patel',
    locale: 'en',
  },
  {
    id: 'demo-user-3',
    name: 'अर्जुन सिंह',
    locale: 'hi',
  },
];

const demoSessions = [
  {
    id: 'demo-session-1',
    userId: 'demo-user-1',
    birth: {
      name: 'राम शर्मा',
      date: new Date('1990-05-15T10:30:00Z'),
      rawDate: '1990-05-15',
      rawTime: '10:30',
      location: 'Kathmandu, Nepal',
      lat: 27.7172,
      lon: 85.3240,
      tzId: 'Asia/Kathmandu',
      tzOffsetMinutes: 345,
    },
    result: {
      provider: 'prokerala',
      payload: {
        kundli: {
          charts: [
            {
              chartId: 'd1',
              chartName: 'Rashi Chart',
              chartType: 'd1',
              positions: [
                { planet: 'Sun', sign: 'Taurus', degree: 15.5, house: 2 },
                { planet: 'Moon', sign: 'Cancer', degree: 8.2, house: 4 },
                { planet: 'Mars', sign: 'Aries', degree: 22.1, house: 1 },
                { planet: 'Mercury', sign: 'Taurus', degree: 18.7, house: 2 },
                { planet: 'Jupiter', sign: 'Sagittarius', degree: 12.3, house: 9 },
                { planet: 'Venus', sign: 'Gemini', degree: 25.8, house: 3 },
                { planet: 'Saturn', sign: 'Capricorn', degree: 5.4, house: 10 },
                { planet: 'Rahu', sign: 'Leo', degree: 14.6, house: 5 },
                { planet: 'Ketu', sign: 'Aquarius', degree: 14.6, house: 11 },
              ],
            },
          ],
        },
        dasha: {
          vimshottari: {
            currentDasha: {
              planet: 'Jupiter',
              startDate: '2020-01-01',
              endDate: '2036-01-01',
            },
            antardasha: {
              planet: 'Saturn',
              startDate: '2023-01-01',
              endDate: '2025-01-01',
            },
          },
        },
        yoga: {
          yogas: [
            { name: 'Gajakesari Yoga', strength: 8, description: 'Jupiter-Moon combination' },
            { name: 'Hamsa Yoga', strength: 7, description: 'Jupiter in Kendra' },
            { name: 'Bhadra Yoga', strength: 6, description: 'Mercury in own sign' },
          ],
        },
        panchang: {
          tithi: 'Purnima',
          nakshatra: 'Rohini',
          yoga: 'Siddhi',
          karana: 'Vishti',
        },
      },
      summary: {
        ascendant: { sign: 'Aries', degree: 15.5 },
        moonSign: { sign: 'Cancer', degree: 8.2 },
        sunSign: { sign: 'Taurus', degree: 15.5 },
        currentDasha: {
          vimshottari: 'Jupiter',
          antardasha: 'Saturn',
          pratyantardasha: 'Mercury',
        },
        keyYogas: [
          { name: 'Gajakesari Yoga', strength: 8 },
          { name: 'Hamsa Yoga', strength: 7 },
          { name: 'Bhadra Yoga', strength: 6 },
        ],
        panchang: {
          tithi: 'Purnima',
          nakshatra: 'Rohini',
          yoga: 'Siddhi',
          karana: 'Vishti',
        },
      },
    },
    chats: [
      {
        role: 'user',
        content: 'मेरो वर्तमान दशा के हो?',
        lang: 'ne',
      },
      {
        role: 'assistant',
        content: 'तपाईंको वर्तमान दशा जुपिटरको हो, जुन २०२० देखि २०३६ सम्म चलिरहेको छ। यो दशा ज्ञान, धर्म, र समृद्धिको दशा हो।',
        lang: 'ne',
      },
      {
        role: 'user',
        content: 'मेरो जन्मकुण्डलीमा के के योगहरू छन्?',
        lang: 'ne',
      },
      {
        role: 'assistant',
        content: 'तपाईंको जन्मकुण्डलीमा धेरै राम्रा योगहरू छन्। मुख्य योगहरू: गजकेसरी योग (८/१०), हंस योग (७/१०), र भद्र योग (६/१०)।',
        lang: 'ne',
      },
    ],
  },
  {
    id: 'demo-session-2',
    userId: 'demo-user-2',
    birth: {
      name: 'Priya Patel',
      date: new Date('1985-08-22T14:15:00Z'),
      rawDate: '1985-08-22',
      rawTime: '14:15',
      location: 'Mumbai, India',
      lat: 19.0760,
      lon: 72.8777,
      tzId: 'Asia/Kolkata',
      tzOffsetMinutes: 330,
    },
    result: {
      provider: 'prokerala',
      payload: {
        kundli: {
          charts: [
            {
              chartId: 'd1',
              chartName: 'Rashi Chart',
              chartType: 'd1',
              positions: [
                { planet: 'Sun', sign: 'Leo', degree: 6.8, house: 1 },
                { planet: 'Moon', sign: 'Pisces', degree: 18.3, house: 8 },
                { planet: 'Mars', sign: 'Scorpio', degree: 12.7, house: 6 },
                { planet: 'Mercury', sign: 'Virgo', degree: 25.1, house: 2 },
                { planet: 'Jupiter', sign: 'Aquarius', degree: 8.9, house: 11 },
                { planet: 'Venus', sign: 'Cancer', degree: 14.2, house: 7 },
                { planet: 'Saturn', sign: 'Sagittarius', degree: 22.5, house: 9 },
                { planet: 'Rahu', sign: 'Taurus', degree: 16.4, house: 3 },
                { planet: 'Ketu', sign: 'Scorpio', degree: 16.4, house: 9 },
              ],
            },
          ],
        },
        dasha: {
          vimshottari: {
            currentDasha: {
              planet: 'Venus',
              startDate: '2022-01-01',
              endDate: '2042-01-01',
            },
            antardasha: {
              planet: 'Sun',
              startDate: '2024-01-01',
              endDate: '2025-01-01',
            },
          },
        },
        yoga: {
          yogas: [
            { name: 'Raja Yoga', strength: 9, description: 'Venus in Kendra' },
            { name: 'Dhana Yoga', strength: 8, description: 'Jupiter in 11th house' },
            { name: 'Viparita Raja Yoga', strength: 7, description: 'Saturn in 9th house' },
          ],
        },
        panchang: {
          tithi: 'Ashtami',
          nakshatra: 'Uttara Phalguni',
          yoga: 'Vajra',
          karana: 'Bava',
        },
      },
      summary: {
        ascendant: { sign: 'Leo', degree: 6.8 },
        moonSign: { sign: 'Pisces', degree: 18.3 },
        sunSign: { sign: 'Leo', degree: 6.8 },
        currentDasha: {
          vimshottari: 'Venus',
          antardasha: 'Sun',
          pratyantardasha: 'Moon',
        },
        keyYogas: [
          { name: 'Raja Yoga', strength: 9 },
          { name: 'Dhana Yoga', strength: 8 },
          { name: 'Viparita Raja Yoga', strength: 7 },
        ],
        panchang: {
          tithi: 'Ashtami',
          nakshatra: 'Uttara Phalguni',
          yoga: 'Vajra',
          karana: 'Bava',
        },
      },
    },
    chats: [
      {
        role: 'user',
        content: 'What is my current dasha?',
        lang: 'en',
      },
      {
        role: 'assistant',
        content: 'Your current dasha is Venus, which started in 2022 and will continue until 2042. This is a period of luxury, relationships, and artistic pursuits.',
        lang: 'en',
      },
    ],
  },
];

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');

  try {
    // Clear existing demo data
    await prisma.chatMessage.deleteMany({
      where: {
        session: {
          userId: {
            in: demoUsers.map(u => u.id),
          },
        },
      },
    });

    await prisma.horoscopeResult.deleteMany({
      where: {
        session: {
          userId: {
            in: demoUsers.map(u => u.id),
          },
        },
      },
    });

    await prisma.birthInput.deleteMany({
      where: {
        session: {
          userId: {
            in: demoUsers.map(u => u.id),
          },
        },
      },
    });

    await prisma.session.deleteMany({
      where: {
        userId: {
          in: demoUsers.map(u => u.id),
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: demoUsers.map(u => u.id),
        },
      },
    });

    // Create demo users
    for (const user of demoUsers) {
      await prisma.user.create({
        data: user,
      });
    }

    // Create demo sessions with birth data and results
    for (const sessionData of demoSessions) {
      const { birth, result, chats, ...session } = sessionData;

      // Create session
      const createdSession = await prisma.session.create({
        data: {
          ...session,
          birth: {
            create: birth,
          },
          result: {
            create: result,
          },
        },
      });

      // Create chat messages
      for (const chat of chats) {
        await prisma.chatMessage.create({
          data: {
            ...chat,
            sessionId: createdSession.id,
          },
        });
      }
    }

    console.log('✅ Demo data seeded successfully!');
    console.log(`📊 Created ${demoUsers.length} users`);
    console.log(`📊 Created ${demoSessions.length} sessions`);
    console.log(`📊 Created ${demoSessions.reduce((acc, s) => acc + s.chats.length, 0)} chat messages`);

    // Display demo session IDs for testing
    console.log('\n🔗 Demo Session IDs for testing:');
    for (const session of demoSessions) {
      console.log(`  - ${session.id} (${session.birth.name})`);
    }

    console.log('\n🚀 You can now test the application with these demo sessions!');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('🎉 Demo data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo data seeding failed:', error);
      process.exit(1);
    });
}

export default seedDemoData;




