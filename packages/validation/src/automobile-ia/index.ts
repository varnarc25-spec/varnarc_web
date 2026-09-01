/**
 * Public Automobile information architecture.
 * `available` means a real page or directory/calculator exists — not a placeholder href.
 */

export type AutomobileIaLeaf = {
  label: string;
  href: string;
  available: boolean;
};

export type AutomobileIaGroup = {
  title: string;
  items: AutomobileIaLeaf[];
};

export const AUTOMOBILE_IA: AutomobileIaGroup[] = [
  {
    title: 'Cars',
    items: [
      { label: 'New Cars', href: '/automobile/new-cars', available: true },
      { label: 'Used Cars', href: '/automobile/used-cars', available: true },
      { label: 'Electric Cars', href: '/automobile/ev', available: true },
      { label: 'Hybrid Cars', href: '/automobile/hybrid', available: true },
      { label: 'CNG Cars', href: '/automobile/cng', available: true },
      { label: 'Upcoming Cars', href: '/automobile/upcoming-cars', available: true },
      { label: 'Discontinued Cars', href: '/automobile/discontinued-cars', available: true },
    ],
  },
  {
    title: 'Two Wheelers',
    items: [
      { label: 'Bikes', href: '/automobile/bikes', available: true },
      { label: 'Scooters', href: '/automobile/scooters', available: true },
      { label: 'Electric Bikes', href: '/automobile/electric-bikes', available: true },
      { label: 'Electric Scooters', href: '/automobile/electric-scooters', available: true },
    ],
  },
  {
    title: 'Commercial',
    items: [
      { label: 'Trucks', href: '/automobile/trucks', available: true },
      { label: 'Mini Trucks', href: '/automobile/mini-trucks', available: true },
      { label: 'Vans', href: '/automobile/vans', available: true },
      { label: 'Buses', href: '/automobile/buses', available: true },
      { label: 'Three Wheelers', href: '/automobile/three-wheelers', available: true },
    ],
  },
  {
    title: 'Research',
    items: [
      { label: 'Compare', href: '/automobile/compare', available: true },
      { label: 'Mileage', href: '/automobile/calculators/mileage', available: true },
      { label: 'Specifications', href: '/automobile/specifications', available: true },
      { label: 'Prices', href: '/automobile/prices', available: true },
      { label: 'Safety', href: '/automobile/safety', available: true },
      { label: 'Reviews', href: '/automobile/reviews', available: true },
      { label: 'Guides', href: '/automobile/guides', available: true },
    ],
  },
  {
    title: 'Ownership',
    items: [
      { label: 'EMI Calculator', href: '/automobile/calculators/car-loan', available: true },
      { label: 'Fuel Cost', href: '/automobile/calculators/fuel', available: true },
      { label: 'Insurance', href: '/automobile/calculators/car-insurance', available: true },
      { label: 'Depreciation', href: '/automobile/calculators/depreciation', available: true },
      { label: 'Service Cost', href: '/automobile/calculators/maintenance-cost', available: true },
      { label: 'Resale Value', href: '/automobile/calculators/resale-value', available: true },
      { label: 'Total Cost of Ownership', href: '/automobile/calculators/tco', available: true },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: 'Dealers', href: '/automobile/dealers', available: true },
      { label: 'Service Centers', href: '/directory/service-centers', available: true },
      { label: 'Mechanics', href: '/directory?q=mechanic&category=service-centers', available: true },
      { label: 'Car Wash', href: '/directory?q=car+wash', available: true },
      { label: 'Detailing', href: '/directory/detailing-centres', available: true },
      { label: 'Tyres', href: '/directory/tyre-shops', available: true },
      { label: 'Batteries', href: '/directory?q=car+battery', available: true },
      { label: 'Accessories', href: '/directory?q=car+accessories', available: true },
    ],
  },
  {
    title: 'EV',
    items: [
      { label: 'EV Cars', href: '/automobile/ev', available: true },
      { label: 'EV Bikes', href: '/automobile/electric-bikes', available: true },
      { label: 'Charging Stations', href: '/directory/charging-stations', available: true },
      { label: 'Charging Cost', href: '/automobile/calculators/charging-cost', available: true },
      { label: 'Range Calculator', href: '/automobile/calculators/range', available: true },
      { label: 'EV vs Petrol', href: '/automobile/calculators/ev-vs-petrol', available: true },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Car Loan EMI', href: '/automobile/calculators/car-loan', available: true },
      { label: 'Fuel Cost', href: '/automobile/calculators/fuel', available: true },
      { label: 'Mileage', href: '/automobile/calculators/mileage', available: true },
      { label: 'Road Tax', href: '/automobile/calculators/road-tax', available: true },
      { label: 'On-road Price', href: '/automobile/calculators/on-road-price', available: true },
      { label: 'Depreciation', href: '/automobile/calculators/depreciation', available: true },
      { label: 'Resale Value', href: '/automobile/calculators/resale-value', available: true },
      { label: 'Vehicle Comparison', href: '/automobile/compare', available: true },
    ],
  },
];
