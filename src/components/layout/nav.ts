import { LucideIcon, LayoutDashboard, TrendingUp, Activity, AlertTriangle, MapPin, UtensilsCrossed, Users, ShoppingBasket, Tag, Lightbulb, GitCompareArrows, Package, SlidersHorizontal, ShieldCheck, Cpu, FileText, Settings } from 'lucide-react';
import type { Role } from '../../api/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Navigation grouped by purpose (system modules mapped into 6 sections). */
export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Command Center', icon: LayoutDashboard }],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/performance', label: 'Performance', icon: TrendingUp },
      { to: '/forecast', label: 'Demand Forecast', icon: Activity },
      { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
      { to: '/locations', label: 'Locations & Channels', icon: MapPin },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/menu', label: 'Menu Intelligence', icon: UtensilsCrossed },
      { to: '/customers', label: 'Customer Intelligence', icon: Users },
      { to: '/basket', label: 'Market Basket', icon: ShoppingBasket },
      { to: '/pricing', label: 'Pricing & Promotions', icon: Tag },
      { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
      { to: '/model-lab', label: 'Model Lab · Spark vs Python', icon: GitCompareArrows },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/wastage', label: 'Inventory & Wastage', icon: Package },
      { to: '/what-if', label: 'What-If Simulator', icon: SlidersHorizontal },
      { to: '/data-quality', label: 'Data Quality', icon: ShieldCheck },
      { to: '/jobs', label: 'Spark Jobs', icon: Cpu },
    ],
  },
  {
    label: 'Reports',
    items: [{ to: '/reports', label: 'Reports & Export', icon: FileText }],
  },
  {
    label: 'Settings',
    items: [{ to: '/settings', label: 'Preferences', icon: Settings }],
  },
];

const ROLE_ROUTES: Record<Role, string[]> = {
  administrator: NAV.flatMap((group) => group.items.map((item) => item.to)),
  regional_manager: [
    '/',
    '/performance',
    '/locations',
    '/menu',
    '/customers',
    '/pricing',
    '/wastage',
    '/anomalies',
    '/recommendations',
    '/what-if',
    '/reports',
    '/settings',
  ],
  manager: [
    '/',
    '/performance',
    '/menu',
    '/customers',
    '/pricing',
    '/wastage',
    '/recommendations',
    '/settings',
  ],
  analyst: [
    '/',
    '/performance',
    '/forecast',
    '/anomalies',
    '/locations',
    '/menu',
    '/customers',
    '/basket',
    '/pricing',
    '/recommendations',
    '/model-lab',
    '/wastage',
    '/what-if',
    '/data-quality',
    '/reports',
    '/settings',
  ],
};

export function navigationForRole(role?: Role | null): NavGroup[] {
  const allowed = ROLE_ROUTES[role ?? 'analyst'];
  return NAV.map((group) => ({ ...group, items: group.items.filter((item) => allowed.includes(item.to)) }))
    .filter((group) => group.items.length > 0);
}
