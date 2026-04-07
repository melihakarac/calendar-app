import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function day(offset: number, hour: number, min = 0): Date {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(base.getTime() + offset * 86400000 + hour * 3600000 + min * 60000);
}

async function main() {
  await prisma.event.deleteMany();

  const recurringEvents = [
    {
      title: 'Weekly Team Sync',
      startUtc: day(0, 8, 0),
      endUtc: day(0, 8, 30),
      timezone: 'America/New_York',
      isRecurring: true,
      recurrenceEndUtc: day(28, 8, 30),
    },
    {
      title: 'Yoga Class',
      startUtc: day(2, 6, 0),
      endUtc: day(2, 7, 0),
      timezone: 'Europe/London',
      isRecurring: true,
      recurrenceEndUtc: day(21, 7, 0),
    },
  ];

  for (const event of recurringEvents) {
    await prisma.event.create({ data: event });
  }

  const events = [
    { title: 'Morning Standup', startUtc: day(0, 9, 0), endUtc: day(0, 9, 30), timezone: 'America/New_York' },
    { title: 'Design Review', startUtc: day(0, 10, 0), endUtc: day(0, 11, 0), timezone: 'Europe/London' },
    { title: 'Lunch with Team', startUtc: day(0, 12, 0), endUtc: day(0, 13, 0), timezone: 'America/Chicago' },
    { title: 'Client Call — Tokyo', startUtc: day(0, 14, 0), endUtc: day(0, 15, 0), timezone: 'Asia/Tokyo' },
    { title: 'Code Review', startUtc: day(0, 15, 30), endUtc: day(0, 16, 15), timezone: 'Europe/Berlin' },
    { title: 'Evening Yoga', startUtc: day(0, 18, 0), endUtc: day(0, 19, 0), timezone: 'America/Los_Angeles' },

    { title: 'Sprint Planning', startUtc: day(1, 9, 0), endUtc: day(1, 10, 30), timezone: 'America/New_York' },
    { title: 'Marketing Sync', startUtc: day(1, 11, 0), endUtc: day(1, 11, 45), timezone: 'Europe/Paris' },
    { title: 'Investor Update', startUtc: day(1, 13, 0), endUtc: day(1, 14, 0), timezone: 'Asia/Singapore' },
    { title: 'Product Demo', startUtc: day(1, 15, 0), endUtc: day(1, 16, 0), timezone: 'Australia/Sydney' },
    { title: 'Therapy Session', startUtc: day(1, 17, 0), endUtc: day(1, 18, 0), timezone: 'America/Denver' },

    { title: 'Board Meeting', startUtc: day(2, 8, 0), endUtc: day(2, 10, 0), timezone: 'Europe/London' },
    { title: 'Lunch & Learn', startUtc: day(2, 12, 0), endUtc: day(2, 13, 0), timezone: 'America/New_York' },
    { title: 'São Paulo Sync', startUtc: day(2, 14, 0), endUtc: day(2, 14, 45), timezone: 'America/Sao_Paulo' },
    { title: 'Hiring Panel', startUtc: day(2, 15, 0), endUtc: day(2, 16, 30), timezone: 'Asia/Dubai' },
    { title: 'Piano Practice', startUtc: day(2, 19, 0), endUtc: day(2, 20, 0), timezone: 'Europe/Rome' },

    { title: 'All Hands', startUtc: day(3, 10, 0), endUtc: day(3, 11, 0), timezone: 'America/New_York' },
    { title: 'Design Critique', startUtc: day(3, 11, 30), endUtc: day(3, 12, 30), timezone: 'Europe/Berlin' },
    { title: 'Seoul Partner Call', startUtc: day(3, 13, 0), endUtc: day(3, 14, 0), timezone: 'Asia/Seoul' },
    { title: 'Retro', startUtc: day(3, 15, 0), endUtc: day(3, 15, 45), timezone: 'America/Chicago' },
    { title: 'Date Night Dinner', startUtc: day(3, 19, 0), endUtc: day(3, 21, 0), timezone: 'America/New_York' },

    { title: 'Focus Time', startUtc: day(4, 9, 0), endUtc: day(4, 12, 0), timezone: 'Pacific/Auckland' },
    { title: 'Cairo Kickoff', startUtc: day(4, 12, 0), endUtc: day(4, 13, 0), timezone: 'Africa/Cairo' },
    { title: 'Weekly Wrap-up', startUtc: day(4, 14, 0), endUtc: day(4, 15, 0), timezone: 'Europe/London' },
    { title: 'Happy Hour', startUtc: day(4, 17, 0), endUtc: day(4, 18, 30), timezone: 'America/Los_Angeles' },

    { title: 'Farmers Market', startUtc: day(5, 8, 0), endUtc: day(5, 10, 0), timezone: 'America/New_York' },
    { title: 'Brunch', startUtc: day(5, 11, 0), endUtc: day(5, 12, 30), timezone: 'Europe/Madrid' },
    { title: 'Hiking', startUtc: day(5, 14, 0), endUtc: day(5, 17, 0), timezone: 'America/Denver' },

    { title: 'Meditation', startUtc: day(6, 7, 0), endUtc: day(6, 7, 30), timezone: 'Asia/Kolkata' },
    { title: 'Family Call', startUtc: day(6, 11, 0), endUtc: day(6, 12, 0), timezone: 'Asia/Hong_Kong' },
    { title: 'Meal Prep', startUtc: day(6, 15, 0), endUtc: day(6, 16, 30), timezone: 'America/Vancouver' },
    { title: 'Week Planning', startUtc: day(6, 18, 0), endUtc: day(6, 19, 0), timezone: 'Europe/Istanbul' },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  console.log(`Seeded ${recurringEvents.length} recurring + ${events.length} one-off events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
