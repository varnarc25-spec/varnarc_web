import type { CSSProperties } from 'react';
import {
  Calculator,
  TrendingUp,
  Percent,
  Receipt,
  Home,
  Building2,
  Paintbrush,
  Sun,
  Car,
  Fuel,
  PiggyBank,
  Zap,
  LayoutGrid,
  Box,
  Layers,
  MoreHorizontal,
  Sofa,
  Droplets,
  PenTool,
  HardHat,
  BookOpen,
  Wallet,
  Users,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  calculator: Calculator,
  trending: TrendingUp,
  percent: Percent,
  receipt: Receipt,
  home: Home,
  building: Building2,
  paint: Paintbrush,
  sun: Sun,
  car: Car,
  fuel: Fuel,
  piggy: PiggyBank,
  zap: Zap,
  grid: LayoutGrid,
  box: Box,
  layers: Layers,
  more: MoreHorizontal,
  sofa: Sofa,
  droplet: Droplets,
  pen: PenTool,
  hardhat: HardHat,
  book: BookOpen,
  wallet: Wallet,
  users: Users,
};

export function HomeIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = map[name] ?? Calculator;
  return <Icon className={className} style={style} aria-hidden />;
}
