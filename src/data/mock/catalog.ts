/**
 * DEVELOPMENT / DEMO DATA — shared catalog.
 * Mirrors the dataset structure (locations, categories, items, channels,
 * segments, promotions). Not verified DineIQ output.
 */

import { PerformanceClass } from '../../api/types';

export const LOCATIONS = [
  { id: 'REST01', name: 'DineIQ New York Downtown', city: 'New York, NY' },
  { id: 'REST02', name: 'DineIQ Chicago Financial', city: 'Chicago, IL' },
  { id: 'REST03', name: 'DineIQ San Francisco Uptown', city: 'San Francisco, CA' },
  { id: 'REST04', name: 'DineIQ Austin Waterfront', city: 'Austin, TX' },
  { id: 'REST05', name: 'DineIQ Seattle Suburban', city: 'Seattle, WA' },
  { id: 'REST06', name: 'DineIQ Boston Airport', city: 'Boston, MA' },
  { id: 'REST07', name: 'DineIQ Miami Tech', city: 'Miami, FL' },
  { id: 'REST08', name: 'DineIQ Denver Historic', city: 'Denver, CO' },
  { id: 'REST09', name: 'DineIQ Los Angeles Fashion', city: 'Los Angeles, CA' },
  { id: 'REST10', name: 'DineIQ Atlanta Downtown', city: 'Atlanta, GA' },
  { id: 'REST11', name: 'DineIQ New York Financial', city: 'New York, NY' },
  { id: 'REST12', name: 'DineIQ Chicago Uptown', city: 'Chicago, IL' },
  { id: 'REST13', name: 'DineIQ San Francisco Waterfront', city: 'San Francisco, CA' },
  { id: 'REST14', name: 'DineIQ Austin Suburban', city: 'Austin, TX' },
  { id: 'REST15', name: 'DineIQ Seattle Airport', city: 'Seattle, WA' },
  { id: 'REST16', name: 'DineIQ Boston Tech', city: 'Boston, MA' },
  { id: 'REST17', name: 'DineIQ Miami Historic', city: 'Miami, FL' },
  { id: 'REST18', name: 'DineIQ Denver Fashion', city: 'Denver, CO' },
  { id: 'REST19', name: 'DineIQ Los Angeles Downtown', city: 'Los Angeles, CA' },
  { id: 'REST20', name: 'DineIQ Atlanta Financial', city: 'Atlanta, GA' },
  { id: 'REST21', name: 'DineIQ New York Uptown', city: 'New York, NY' },
  { id: 'REST22', name: 'DineIQ Chicago Waterfront', city: 'Chicago, IL' },
  { id: 'REST23', name: 'DineIQ San Francisco Suburban', city: 'San Francisco, CA' },
  { id: 'REST24', name: 'DineIQ Austin Airport', city: 'Austin, TX' },
  { id: 'REST25', name: 'DineIQ Seattle Tech', city: 'Seattle, WA' },
] as const;

export const CATEGORIES = [
  'Starters', 'Soups', 'Salads', 'Burgers', 'Pizza', 'Pasta',
  'Grill', 'Seafood', 'Mains', 'Sides', 'Desserts', 'Beverages',
] as const;

export const CHANNELS = [
  'Dine-in', 'Takeaway', 'Website / App', 'Third-Party Delivery',
] as const;

export const SEGMENTS = [
  'High-Value Loyal', 'Frequent', 'Promotion-Driven',
  'At-Risk', 'New', 'Occasional',
] as const;

export interface MockItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  baseCost: number;
  classification: PerformanceClass;
  flags: string[];
}

/** 64 menu items with the "tricky cases" explicitly represented. */
function buildItems(): MockItem[] {
  const names: Record<string, string[]> = {
    Starters: ['Crispy Corn Bites', 'Chicken Satay', 'Loaded Nachos', 'Paneer Chilli'],
    Soups: ['Tom Yum Bowl', 'Chicken Corn Soup', 'Minestrone'],
    Salads: ['Quinoa Garden', 'Caesar Classic', 'Greek Feta'],
    Burgers: ['Smash Burger', 'Truffle Mushroom Burger', 'Zinger Deluxe', 'Ahi Tuna Bun'],
    Pizza: ['Margherita Stone-Baked', 'Pepperoni Crown', 'BBQ Chicken', 'Truffle Four-Cheese', 'Tandoori Paneer Pizza'],
    Pasta: ['Alfredo Penne', 'Arrabbiata', 'Seafood Linguine', 'Baked Mac'],
    Grill: ['Charcoal Ribeye', 'Peri Peri Chicken', 'Lamb Chops', 'Grilled Vegetables', 'BBQ Platter'],
    Seafood: ['Grilled Prawns', 'Crispy Calamari', 'Lemon Butter Salmon', 'Fish Tacos'],
    Mains: ['Beef Stroganoff', 'Chicken Steak', 'Malai Boti Platter', 'Mushroom Risotto', 'Roast Chicken'],
    Sides: ['Truffle Fries', 'Garlic Bread', 'Coleslaw', 'Mashed Potato', 'Grilled Corn'],
    Desserts: ['Molten Lava Cake', 'New York Cheesecake', 'Lotus Biscoff Bowl', 'Gulab Jamun Fusion'],
    Beverages: ['Cold Brew Float', 'Mango Lassi', 'Berry Mojito', 'Salted Caramel Shake', 'Classic Lemonade'],
  };
  const classPlan: PerformanceClass[] = [
    'profit_driver', 'profit_driver', 'volume_driver', 'hidden_opportunity', 'low_performer',
  ];
  const out: MockItem[] = [];
  let n = 0;
  for (const cat of CATEGORIES) {
    for (const nm of names[cat] ?? []) {
      n += 1;
      const id = `M${String(n).padStart(3, '0')}`;
      const r = (n * 2654435761) % 1000 / 1000;
      out.push({
        id,
        name: nm,
        category: cat,
        basePrice: Math.round((6 + r * 38) * 4) / 4,
        baseCost: Math.round((2 + r * 16) * 4) / 4,
        classification: classPlan[n % 5],
        flags: [],
      });
    }
  }
  // Step 11 — explicitly seed tricky cases
  const flag = (idx: number, f: string) => { if (out[idx]) out[idx].flags.push(f); };
  flag(11, 'High-selling but loss-making');
  flag(4, 'Highly profitable but rarely purchased');
  flag(21, 'Popular dish with excessive wastage');
  flag(1, 'Highly rated dish with poor profitability');
  flag(26, 'Low-rated dish with high sales');
  flag(17, 'Promotion-dependent dish');
  flag(30, 'Dish performing differently across locations');
  flag(9, 'Dish performing well only during weekends');
  flag(44, 'Seasonal menu item');
  flag(58, 'New menu item with insufficient history');
  return out;
}

export const ITEMS: MockItem[] = buildItems();

export const PROMOTIONS = [
  { id: 'P01', name: 'Monsoon Burger Fest', type: 'Percentage discount' },
  { id: 'P02', name: 'Family Feast Bundle', type: 'Combo bundle' },
  { id: 'P03', name: 'Late Night 20%', type: 'Time-based discount' },
  { id: 'P04', name: 'Weekend Grill BOGO', type: 'BOGO' },
  { id: 'P05', name: 'Loyalty Double Points', type: 'Loyalty' },
  { id: 'P06', name: 'Delivery App Cashback', type: 'Channel promo' },
  { id: 'P07', name: 'Student Tuesdays', type: 'Segment discount' },
  { id: 'P08', name: 'New Store Opening', type: 'Grand opening' },
] as const;

export const CLASS_LABELS: Record<PerformanceClass, string> = {
  profit_driver: 'Profit Driver',
  volume_driver: 'Volume Driver',
  hidden_opportunity: 'Hidden Opportunity',
  low_performer: 'Low Performer',
};
