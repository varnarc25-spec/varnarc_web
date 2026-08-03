import { PrismaClient } from '@prisma/client';
import { upsertCalculator } from './seed-calculators';

const prisma = new PrismaClient();

async function main() {
  const general = await prisma.calculatorCategory.findUniqueOrThrow({ where: { slug: 'general' } });

  await upsertCalculator(prisma, {
    slug: 'age',
    name: 'Age Calculator',
    description: 'Calculate exact age in years, months, and days from date of birth.',
    categoryId: general.id,
    formula: {
      type: 'age',
      outputs: {
        ageYears: 'ageYears',
        ageMonths: 'ageMonths',
        ageDays: 'ageDays',
        totalDays: 'totalDays',
        nextBirthdayDays: 'nextBirthdayDays',
      },
    },
    resultTemplate: {
      cards: [
        { key: 'ageYears', label: 'Age (years)', format: 'number' },
        { key: 'ageMonths', label: 'Age (months)', format: 'number' },
        { key: 'ageDays', label: 'Age (days)', format: 'number' },
        { key: 'totalDays', label: 'Total days', format: 'number' },
      ],
    },
    settings: {
      layout: 'single',
      faq: [
        {
          q: 'How is age calculated?',
          a: 'We compare your date of birth to the end date and return years, months, and days between them.',
        },
        {
          q: 'What end date should I use?',
          a: 'Today is selected by default. Change it to calculate age as of any past or future date.',
        },
      ],
    },
    fields: [
      {
        key: 'dateOfBirth',
        label: 'Date of birth',
        fieldType: 'date',
        sortOrder: 0,
        defaultValue: '1990-06-15',
      },
      {
        key: 'endDate',
        label: 'End date',
        fieldType: 'date',
        sortOrder: 1,
      },
    ],
  });

  console.log('Age calculator seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
