/**
 * Idempotent upsert of loan-hub FAQs for /finance/loans.
 * Run: pnpm --filter @varnarc/database exec tsx src/seed-loan-hub-faqs.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOAN_HUB_FAQS: Array<{ question: string; answer: string; sortOrder: number }> = [
  {
    question: 'What is a loan?',
    answer:
      'A loan is money borrowed from a lender that you agree to repay over time, usually with interest, according to the loan terms. Product rules, fees and repayment schedules vary by lender.',
    sortOrder: 1,
  },
  {
    question: 'What is an EMI?',
    answer:
      'EMI (Equated Monthly Instalment) is the amount paid each month toward a loan. On many reducing-balance loans it covers both principal and interest, and the split between them can change over the tenure.',
    sortOrder: 2,
  },
  {
    question: 'How is loan EMI calculated?',
    answer:
      'For a standard reducing-balance loan, EMI is usually calculated from principal, monthly interest rate and tenure in months. Zero-interest cases are typically principal divided by months. Always confirm the method used in the lender’s offer.',
    sortOrder: 3,
  },
  {
    question: 'What affects loan eligibility?',
    answer:
      'Lenders commonly consider factors such as income, employment type, existing obligations, credit profile, age and product-specific criteria. Listed criteria on comparison sites are indicative — final underwriting rests with the lender.',
    sortOrder: 4,
  },
  {
    question: 'How does a credit score affect a loan?',
    answer:
      'Many lenders use credit scores as one input among several. A stronger history may improve access or pricing for some applicants, but scores alone do not guarantee approval or a specific rate.',
    sortOrder: 5,
  },
  {
    question: 'Can I get a loan with a low credit score?',
    answer:
      'It depends on the lender and product. Some lenders may still consider applications with additional checks, collateral or co-applicants. Outcomes are not guaranteed and policies differ.',
    sortOrder: 6,
  },
  {
    question: 'What is a loan processing fee?',
    answer:
      'A processing fee is an upfront charge some lenders apply when processing a loan. How it is calculated (flat, percentage, with GST, etc.) and whether it is deducted from disbursement varies by product — check the offer document.',
    sortOrder: 7,
  },
  {
    question: 'What is loan tenure?',
    answer:
      'Tenure is the agreed repayment period, usually in months or years. Longer tenures can lower EMI but may increase total interest paid over the life of the loan.',
    sortOrder: 8,
  },
  {
    question: 'Can I repay a loan early?',
    answer:
      'Many products allow part-prepayment or full foreclosure, sometimes after a lock-in period and sometimes with charges. Confirm the current rules with the lender before relying on early repayment.',
    sortOrder: 9,
  },
  {
    question: 'What are prepayment and foreclosure charges?',
    answer:
      'Prepayment charges may apply when you pay part of the outstanding principal early. Foreclosure charges may apply when you close the loan fully before the scheduled end. Amounts and conditions are lender- and product-specific.',
    sortOrder: 10,
  },
  {
    question: 'What happens if I miss an EMI?',
    answer:
      'Missing an EMI can lead to late fees, negative marks on your credit history and follow-up from the lender. Exact consequences depend on the loan agreement and lender policy — contact the lender promptly if you expect difficulty paying.',
    sortOrder: 11,
  },
  {
    question: 'How should I compare two loans?',
    answer:
      'Compare more than the headline rate: total repayment, fees, tenure options, prepayment rules, eligibility criteria and documentation. Prefer offers with clear sources and last-verified dates, then confirm terms with the lender.',
    sortOrder: 12,
  },
  {
    question: 'What documents are commonly required?',
    answer:
      'Common requests include identity proof, address proof, income proof, bank statements and employment or business proofs. Secured loans may also need property or asset documents. Exact lists vary by lender and loan type.',
    sortOrder: 13,
  },
  {
    question: 'What is the difference between secured and unsecured loans?',
    answer:
      'Secured loans are backed by collateral such as property or gold, depending on the product. Unsecured loans generally rely more on income and credit profile. Secured loans may have lower rates depending on lender and borrower profile — they do not always cost less.',
    sortOrder: 14,
  },
  {
    question: 'What is the difference between fixed and floating interest rates?',
    answer:
      'A fixed rate stays constant for the applicable period in the loan terms. A floating rate can change based on lender or benchmark rules, and EMI or tenure may change when the rate resets. Suitability depends on loan type, tenure, rate outlook and preference for predictability.',
    sortOrder: 15,
  },
];

async function main() {
  const loansCat = await prisma.financeCategory.findFirst({
    where: { slug: 'loans', deletedAt: null },
  });

  // Soft-remove unrelated seeded FAQs from the public catalog.
  await prisma.financeFaq.updateMany({
    where: {
      deletedAt: null,
      question: {
        in: ['How is SIP different from lump sum investing?', 'Are credit card rewards taxable?'],
      },
    },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });

  for (const faq of LOAN_HUB_FAQS) {
    const existing = await prisma.financeFaq.findFirst({
      where: { question: faq.question, deletedAt: null },
    });
    if (existing) {
      await prisma.financeFaq.update({
        where: { id: existing.id },
        data: {
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          entityType: 'loan_hub',
          categoryId: loansCat?.id ?? existing.categoryId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
      });
    } else {
      await prisma.financeFaq.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          entityType: 'loan_hub',
          categoryId: loansCat?.id ?? null,
          status: 'PUBLISHED',
        },
      });
    }
  }

  const count = await prisma.financeFaq.count({
    where: { entityType: 'loan_hub', deletedAt: null, status: 'PUBLISHED' },
  });
  console.log(`Loan hub FAQs ready: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
