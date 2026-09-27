export interface CountryMeta {
  code: string;
  name: string;
  flagUrl: string;
  currency: string;
  region: "Europe" | "Asia" | "Americas" | "Middle East" | "Oceania";
}

export interface CurrencyMeta {
  code: string;
  symbol: string;
  name: string;
  flagCode: string;
  flagUrl: string;
}

export interface PaymentMethodMeta {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  region: "Europe" | "India" | "Philippines" | "International";
  speed: string;
  badge?: string;
}

export interface GiftCardMeta {
  id: string;
  brand: string;
  category: "Gaming" | "Shopping" | "Entertainment" | "Luxury" | "Travel";
  imageUrl: string;
  description: string;
  popular?: boolean;
}

export interface InvestmentMeta {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
}

export const COUNTRIES: Record<string, CountryMeta> = {
  CZ: {
    code: "CZ",
    name: "Czech Republic",
    flagUrl: "/assets/countries/cz.svg",
    currency: "CZK",
    region: "Europe",
  },
  DE: {
    code: "DE",
    name: "Germany",
    flagUrl: "/assets/countries/de.svg",
    currency: "EUR",
    region: "Europe",
  },
  FR: {
    code: "FR",
    name: "France",
    flagUrl: "/assets/countries/fr.svg",
    currency: "EUR",
    region: "Europe",
  },
  IT: {
    code: "IT",
    name: "Italy",
    flagUrl: "/assets/countries/it.svg",
    currency: "EUR",
    region: "Europe",
  },
  ES: {
    code: "ES",
    name: "Spain",
    flagUrl: "/assets/countries/es.svg",
    currency: "EUR",
    region: "Europe",
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    flagUrl: "/assets/countries/nl.svg",
    currency: "EUR",
    region: "Europe",
  },
  BE: {
    code: "BE",
    name: "Belgium",
    flagUrl: "/assets/countries/be.svg",
    currency: "EUR",
    region: "Europe",
  },
  AT: {
    code: "AT",
    name: "Austria",
    flagUrl: "/assets/countries/at.svg",
    currency: "EUR",
    region: "Europe",
  },
  PL: {
    code: "PL",
    name: "Poland",
    flagUrl: "/assets/countries/pl.svg",
    currency: "PLN",
    region: "Europe",
  },
  CH: {
    code: "CH",
    name: "Switzerland",
    flagUrl: "/assets/countries/ch.svg",
    currency: "CHF",
    region: "Europe",
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    flagUrl: "/assets/countries/gb.svg",
    currency: "GBP",
    region: "Europe",
  },
  US: {
    code: "US",
    name: "United States",
    flagUrl: "/assets/countries/us.svg",
    currency: "USD",
    region: "Americas",
  },
  CA: {
    code: "CA",
    name: "Canada",
    flagUrl: "/assets/countries/ca.svg",
    currency: "CAD",
    region: "Americas",
  },
  IN: {
    code: "IN",
    name: "India",
    flagUrl: "/assets/countries/in.svg",
    currency: "INR",
    region: "Asia",
  },
  PH: {
    code: "PH",
    name: "Philippines",
    flagUrl: "/assets/countries/ph.svg",
    currency: "PHP",
    region: "Asia",
  },
  SG: {
    code: "SG",
    name: "Singapore",
    flagUrl: "/assets/countries/sg.svg",
    currency: "SGD",
    region: "Asia",
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flagUrl: "/assets/countries/ae.svg",
    currency: "AED",
    region: "Middle East",
  },
  JP: {
    code: "JP",
    name: "Japan",
    flagUrl: "/assets/countries/jp.svg",
    currency: "JPY",
    region: "Asia",
  },
  AU: {
    code: "AU",
    name: "Australia",
    flagUrl: "/assets/countries/au.svg",
    currency: "AUD",
    region: "Oceania",
  },
  EU: {
    code: "EU",
    name: "European Union",
    flagUrl: "/assets/countries/eu.svg",
    currency: "EUR",
    region: "Europe",
  },
};

export const CURRENCIES_META: Record<string, CurrencyMeta> = {
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    flagCode: "EU",
    flagUrl: "/assets/countries/eu.svg",
  },
  CZK: {
    code: "CZK",
    symbol: "Kč",
    name: "Czech Koruna",
    flagCode: "CZ",
    flagUrl: "/assets/countries/cz.svg",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    flagCode: "US",
    flagUrl: "/assets/countries/us.svg",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    flagCode: "GB",
    flagUrl: "/assets/countries/gb.svg",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    flagCode: "IN",
    flagUrl: "/assets/countries/in.svg",
  },
  PHP: {
    code: "PHP",
    symbol: "₱",
    name: "Philippine Peso",
    flagCode: "PH",
    flagUrl: "/assets/countries/ph.svg",
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    flagCode: "SG",
    flagUrl: "/assets/countries/sg.svg",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    flagCode: "AU",
    flagUrl: "/assets/countries/au.svg",
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    flagCode: "CA",
    flagUrl: "/assets/countries/ca.svg",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    flagCode: "JP",
    flagUrl: "/assets/countries/jp.svg",
  },
  CHF: {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    flagCode: "CH",
    flagUrl: "/assets/countries/ch.svg",
  },
  AED: {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    flagCode: "AE",
    flagUrl: "/assets/countries/ae.svg",
  },
};

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  {
    id: "sepa",
    name: "SEPA Instant Transfer",
    description: "Eurozone instant bank payout (EUR)",
    iconUrl: "/assets/payment-methods/sepa.svg",
    region: "Europe",
    speed: "Instant",
    badge: "Europe Primary",
  },
  {
    id: "cz-bank",
    name: "Czech Bank Transfer & QR Platba",
    description: "Direct payout to Czech banks (CZK)",
    iconUrl: "/assets/payment-methods/cz-bank.svg",
    region: "Europe",
    speed: "Instant / Same-day",
    badge: "Czech Republic",
  },
  {
    id: "upi",
    name: "UPI Direct",
    description: "Instant payout via Virtual Payment Address (VPA)",
    iconUrl: "/assets/payment-methods/upi.svg",
    region: "India",
    speed: "Instant",
    badge: "NPCI Official",
  },
  {
    id: "upi-qr",
    name: "UPI QR Code",
    description: "Scan & pay via PhonePe, Google Pay or Paytm",
    iconUrl: "/assets/payment-methods/upi-qr.svg",
    region: "India",
    speed: "Instant",
  },
  {
    id: "in-bank",
    name: "Indian Bank Transfer (IMPS/NEFT)",
    description: "Direct to any Indian bank account",
    iconUrl: "/assets/payment-methods/in-bank.svg",
    region: "India",
    speed: "Instant (IMPS)",
  },
  {
    id: "gcash",
    name: "GCash Wallet",
    description: "Instant payout to GCash Mobile Wallet",
    iconUrl: "/assets/payment-methods/gcash.svg",
    region: "Philippines",
    speed: "Instant",
    badge: "Official",
  },
  {
    id: "ph-bank",
    name: "Philippine Bank Transfer (InstaPay)",
    description: "BDO, BPI, Metrobank & all PH banks",
    iconUrl: "/assets/payment-methods/ph-bank.svg",
    region: "Philippines",
    speed: "Instant (InstaPay)",
  },
  {
    id: "int-bank",
    name: "International Wire / SWIFT",
    description: "Global wire transfer to 150+ countries",
    iconUrl: "/assets/payment-methods/int-bank.svg",
    region: "International",
    speed: "1-2 business days",
  },
];

export const GIFT_CARDS: GiftCardMeta[] = [
  {
    id: "amazon",
    brand: "Amazon",
    category: "Shopping",
    imageUrl: "/assets/gift-cards/amazon.svg",
    description: "Digital voucher redeemable for millions of products worldwide",
    popular: true,
  },
  {
    id: "apple",
    brand: "Apple",
    category: "Entertainment",
    imageUrl: "/assets/gift-cards/apple.svg",
    description: "Valid for App Store, Apple Music, iCloud & Apple Store products",
    popular: true,
  },
  {
    id: "google-play",
    brand: "Google Play",
    category: "Entertainment",
    imageUrl: "/assets/gift-cards/google-play.svg",
    description: "Apps, games, movies and digital content on Android",
    popular: true,
  },
  {
    id: "steam",
    brand: "Steam",
    category: "Gaming",
    imageUrl: "/assets/gift-cards/steam.svg",
    description: "Steam Wallet credits for thousands of PC games and DLCs",
    popular: true,
  },
  {
    id: "playstation",
    brand: "PlayStation Store",
    category: "Gaming",
    imageUrl: "/assets/gift-cards/playstation.svg",
    description: "PSN funds for PlayStation consoles, subscriptions & games",
  },
  {
    id: "xbox",
    brand: "Xbox",
    category: "Gaming",
    imageUrl: "/assets/gift-cards/xbox.svg",
    description: "Xbox Game Pass, games and add-ons on console and PC",
  },
  {
    id: "luxury-lifestyle",
    brand: "Moonlight Private Luxury",
    category: "Luxury",
    imageUrl: "/assets/gift-cards/luxury-lifestyle.svg",
    description: "Fine timepieces, luxury fashion houses & bespoke concierge",
    popular: true,
  },
  {
    id: "shopping",
    brand: "Moonlight Global Retail",
    category: "Shopping",
    imageUrl: "/assets/gift-cards/shopping.svg",
    description: "European luxury boutiques, department stores & fine goods",
  },
  {
    id: "entertainment",
    brand: "Moonlight Media & Pass",
    category: "Entertainment",
    imageUrl: "/assets/gift-cards/entertainment.svg",
    description: "Premium streaming services, concert tickets and cultural events",
  },
  {
    id: "travel",
    brand: "Moonlight Escapes",
    category: "Travel",
    imageUrl: "/assets/gift-cards/travel.svg",
    description: "Boutique European hotel stays, flights & luxury travel vouchers",
  },
];

export const INVESTMENTS: InvestmentMeta[] = [
  {
    id: "global-markets",
    title: "European & Global Markets",
    category: "Wealth Management",
    subtitle: "Track diversified indices, FX rates and market portfolios",
    imageUrl: "/assets/investments/global-markets.svg",
    badge: "Yield & FX",
  },
  {
    id: "wealth-management",
    title: "Private Treasury & Allocation",
    category: "Financial Services",
    subtitle: "Automated multi-currency rebalancing with low friction",
    imageUrl: "/assets/investments/wealth-management.svg",
    badge: "Private Standard",
  },
];
