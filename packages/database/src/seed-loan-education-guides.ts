import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const loansCat =
    (await prisma.financeCategory.findFirst({
      where: { slug: 'personal-loan', deletedAt: null },
    })) ||
    (await prisma.financeCategory.findFirst({
      where: { loanHubEnabled: true, deletedAt: null },
    }));

  if (!loansCat) {
    console.log('No loan category found — skip guide seed');
    await prisma.$disconnect();
    return;
  }

  const guides = [
    {
      slug: 'loan-fees-and-charges-explained',
      title: 'Loan fees and charges explained',
      summary: 'Processing, foreclosure, late fees, and how they affect total cost.',
      body: 'Compare processing fees, prepayment or foreclosure charges, and late-payment penalties alongside the interest rate. Confirm the final schedule with the lender.',
    },
    {
      slug: 'loan-eligibility-basics',
      title: 'Loan eligibility basics',
      summary: 'How income, credit profile, and obligations shape indicative eligibility.',
      body: 'Lenders weigh income stability, existing EMIs, credit history, and product limits. Online checkers are estimates only — final approval rests with the lender.',
    },
    {
      slug: 'secured-vs-unsecured-loans',
      title: 'Secured vs unsecured loans',
      summary: 'Collateral, pricing tendencies, and borrower trade-offs in plain language.',
      body: 'Secured loans use an asset as security; unsecured loans rely more on profile and capacity. Neither structure guarantees a lower rate for every applicant.',
    },
    {
      slug: 'loan-tenure-and-total-cost',
      title: 'How loan tenure affects total cost',
      summary: 'Why longer tenures can lower EMI but raise total interest paid.',
      body: 'Model EMI and total interest for different tenures with an EMI calculator. Choose a repayment period you can sustain without stretching obligations.',
    },
    {
      slug: 'loan-prepayment-basics',
      title: 'Loan prepayment basics',
      summary: 'Tenure reduction vs EMI reduction, and charges to watch for.',
      body: 'Partial or full prepayment may cut interest or shorten tenure depending on lender rules. Check foreclosure and part-prepayment charges before you pay ahead.',
    },
  ] as const;

  for (const g of guides) {
    await prisma.financeGuide.upsert({
      where: { slug: g.slug },
      update: {
        title: g.title,
        summary: g.summary,
        body: g.body,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: loansCat.id,
      },
      create: {
        ...g,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: loansCat.id,
      },
    });
  }

  console.log(`Seeded ${guides.length} loan education guides`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
