import type { PrismaClient } from '@prisma/client';

export async function seedPremiumPlans(prisma: PrismaClient) {
  const plans = [
    {
      slug: 'free',
      name: 'Free',
      description: 'Core calculators, articles, and directory access.',
      priceMonthly: 0,
      priceYearly: 0,
      features: ['Public calculators', 'Article reading', 'Directory browse'],
      isActive: true,
    },
    {
      slug: 'pro',
      name: 'Pro',
      description: 'Ad-free experience, premium calculators, and downloadable reports.',
      priceMonthly: 299,
      priceYearly: 2990,
      features: [
        'Everything in Free',
        'Ad-free browsing',
        'Premium calculators',
        'PDF report downloads',
        'Priority email support',
      ],
      isActive: true,
    },
    {
      slug: 'business',
      name: 'Business',
      description: 'Team features, API access, and advanced analytics exports.',
      priceMonthly: 999,
      priceYearly: 9990,
      features: [
        'Everything in Pro',
        'API access',
        'Bulk analytics export',
        'Dedicated onboarding',
      ],
      isActive: true,
    },
  ] as const;

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        features: plan.features,
        isActive: plan.isActive,
        deletedAt: null,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        features: plan.features,
        isActive: plan.isActive,
      },
    });
  }
}
