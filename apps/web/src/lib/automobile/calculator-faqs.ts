export const AUTOMOBILE_CALCULATOR_FAQS: Record<
  string,
  Array<{ question: string; answer: string }>
> = {
  'car-loan': [
    {
      question: 'Is this car loan EMI a bank offer?',
      answer:
        'No. Results are educational estimates based on the inputs you enter. Final EMI depends on the lender’s rate, fees and eligibility.',
    },
    {
      question: 'Should I use ex-showroom or on-road price?',
      answer:
        'Prefer an estimated on-road amount for your city (tax, insurance, dealer charges). Using only ex-showroom understates the financed amount.',
    },
  ],
  fuel: [
    {
      question: 'How accurate is the fuel cost estimate?',
      answer:
        'It depends on real mileage, traffic and fuel price. Use recent local fuel rates and your typical monthly kilometres for a closer plan.',
    },
    {
      question: 'Can I compare petrol vs diesel running cost?',
      answer:
        'Run the calculator twice with each fuel price and mileage claim, then compare monthly totals alongside insurance and maintenance.',
    },
  ],
  mileage: [
    {
      question: 'Why does real mileage differ from brochure figures?',
      answer:
        'Test-cycle mileage often differs from city/highway mix, load and driving style. Track a few tanks for a personal baseline.',
    },
    {
      question: 'How do I use mileage in ownership planning?',
      answer:
        'Combine calculated km/l with monthly distance in the fuel cost calculator to estimate running spend before buying.',
    },
  ],
  'car-insurance': [
    {
      question: 'Is this insurance premium a binding quote?',
      answer:
        'No. It is an indicative planner. Insurers price by IDV, location, NCB, add-ons and underwriting — always get a formal quote.',
    },
    {
      question: 'What should I budget besides premium?',
      answer:
        'Include compulsory personal accident cover and any add-ons you need. Renewals and no-claim bonus affect year-two cost.',
    },
  ],
  depreciation: [
    {
      question: 'Does depreciation equal resale value?',
      answer:
        'Depreciation estimates help plan total cost of ownership. Actual resale depends on demand, condition, service history and market timing.',
    },
    {
      question: 'How many years should I model?',
      answer:
        'Many buyers plan 3–5 years of ownership. Try a few horizons and include EMI + fuel + insurance for a fuller picture.',
    },
  ],
  'maintenance-cost': [
    {
      question: 'Are service costs the same everywhere?',
      answer:
        'Labour and parts vary by city and authorised vs independent workshops. Use estimates as a budget band, then confirm locally.',
    },
    {
      question: 'What else belongs in ownership cost?',
      answer:
        'Add EMI (if financed), fuel, insurance, tyres and unexpected repairs. Pair this tool with the other automobile calculators.',
    },
  ],
};
