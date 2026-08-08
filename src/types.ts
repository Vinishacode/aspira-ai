export type IncomeType = 'daily' | 'monthly';

export type PaymentMethod = 'cash' | 'wallet' | 'upi';

export interface ExpenseCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
}

export interface UserProfile {
  name: string;
  age: string;
  city: string;
  incomeType: IncomeType;
  incomeAmount: number;
  dependents: string;
  dreamGoal: string;
  goalCost: number;
  targetMonth: number; // 1-12
  targetYear: number;
  currentSavings: number;
}

export interface Transaction {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  note: string;
  date: string; // ISO
  type: 'expense' | 'income' | 'saving';
  // expense-specific
  expenseName?: string;
  paymentMethod?: PaymentMethod;
}

export interface BillItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string | null; // matched category
}

export interface SampleBill {
  id: string;
  store: string;
  date: string;
  items: { name: string; amount: number; hint: string }[];
}

export interface AppState {
  onboarded: boolean;
  profile: UserProfile | null;
  categories: ExpenseCategory[];
  transactions: Transaction[];
  monthlyContribution: number; // user-set saving this month
  savingsUsed: number; // total savings withdrawn
  walletBalance: number; // available spending balance
}

export const DREAM_OPTIONS = [
  { label: 'Bike', emoji: '🏍️' },
  { label: 'House', emoji: '🏠' },
  { label: 'Laptop', emoji: '💻' },
  { label: 'Car', emoji: '🚗' },
  { label: 'Vacation', emoji: '✈️' },
  { label: 'Higher Studies', emoji: '🎓' },
  { label: 'Wedding', emoji: '💍' },
  { label: 'Business', emoji: '🏪' },
] as const;

export const SUGGESTED_CATEGORIES = [
  'Rent', 'Groceries', 'Shopping', 'Fuel', 'Medical', 'Bills', 'Others',
];

export const CATEGORY_COLORS = [
  '#10b981', '#f97316', '#fbbf24', '#38bdf8', '#a78bfa', '#f43f5e', '#34d399', '#fb923c',
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'wallet', label: 'Wallet', emoji: '👛' },
  { value: 'upi', label: 'Demo UPI', emoji: '📱' },
];

export const SAMPLE_BILLS: SampleBill[] = [
  {
    id: 'bill1',
    store: 'FreshMart Groceries',
    date: '2026-08-06',
    items: [
      { name: 'Rice 5kg', amount: 320, hint: 'Groceries' },
      { name: 'Vegetables', amount: 180, hint: 'Groceries' },
      { name: 'Milk & Dairy', amount: 120, hint: 'Groceries' },
      { name: 'Cleaning Supplies', amount: 240, hint: 'Bills' },
    ],
  },
  {
    id: 'bill2',
    store: 'CityFuel Station',
    date: '2026-08-06',
    items: [
      { name: 'Petrol 2L', amount: 420, hint: 'Fuel' },
      { name: 'Engine Oil', amount: 350, hint: 'Fuel' },
    ],
  },
  {
    id: 'bill3',
    store: 'StyleStore',
    date: '2026-08-06',
    items: [
      { name: 'Cotton Shirt', amount: 899, hint: 'Shopping' },
      { name: 'Jeans', amount: 1499, hint: 'Shopping' },
      { name: 'Snacks (cafe)', amount: 250, hint: 'Others' },
    ],
  },
];
