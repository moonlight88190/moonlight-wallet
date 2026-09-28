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

export interface BankMeta {
  id: string;
  name: string;
  logoUrl: string;
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

export interface UPIProviderMeta {
  id: string;
  name: string;
  iconUrl: string;
  handles: string[];
}

export interface GiftCardMeta {
  id: string;
  brand: string;
  category: "Gaming" | "Shopping" | "Entertainment" | "Luxury" | "Travel";
  imageUrl: string;
  logoUrl?: string;
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

export interface LuxuryBrandMeta {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  photoUrl?: string;
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
    iconUrl: "/assets/payment-methods/sepa.png",
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
    id: "faster-payments",
    name: "UK Faster Payments",
    description: "UK bank account instant payout (GBP)",
    iconUrl: "/assets/payment-methods/faster-payments.svg",
    region: "Europe",
    speed: "Instant",
    badge: "UK Official",
  },
  {
    id: "upi",
    name: "UPI Direct",
    description: "Instant payout via Virtual Payment Address (VPA / UPI ID)",
    iconUrl: "/assets/payment-methods/upi.png",
    region: "India",
    speed: "Instant",
    badge: "NPCI Official",
  },
  {
    id: "upi-qr",
    name: "UPI QR Code",
    description: "Scan & pay via Google Pay, PhonePe or Paytm",
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
    iconUrl: "/assets/payment-methods/gcash.png",
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
    id: "paynow",
    name: "Singapore PayNow",
    description: "Instant payout via NRIC/FIN or Mobile (SGD)",
    iconUrl: "/assets/payment-methods/paynow.svg",
    region: "International",
    speed: "Instant",
    badge: "Singapore Official",
  },
  {
    id: "pix",
    name: "Brazil Pix",
    description: "Instant payout via Pix key or QR (BRL)",
    iconUrl: "/assets/payment-methods/pix.svg",
    region: "International",
    speed: "Instant",
    badge: "Bacen Official",
  },
  {
    id: "interac",
    name: "Canada Interac e-Transfer",
    description: "Instant Canadian bank payout (CAD)",
    iconUrl: "/assets/payment-methods/interac.svg",
    region: "International",
    speed: "Instant",
    badge: "Interac Official",
  },
  {
    id: "jp-bank",
    name: "Japanese Local Bank (Zengin)",
    description: "Direct payout to Japanese banks (JPY)",
    iconUrl: "/assets/payment-methods/jp-bank.svg",
    region: "International",
    speed: "Instant / Same-day",
    badge: "Zengin Rail",
  },
  {
    id: "aani",
    name: "UAE Aani Instant Payout",
    description: "Instant UAE payment via Al Etihad Payments (AED)",
    iconUrl: "/assets/payment-methods/aani.svg",
    region: "International",
    speed: "Instant",
    badge: "UAE Official",
  },
  {
    id: "int-bank",
    name: "International Wire / SWIFT",
    description: "Global wire transfer to 150+ countries",
    iconUrl: "/assets/payment-methods/int-bank.svg",
    region: "International",
    speed: "1-2 business days",
    badge: "Global Payout",
  },
];

export const UPI_PROVIDERS: UPIProviderMeta[] = [
  {
    id: "google-pay",
    name: "Google Pay",
    iconUrl: "/assets/payment-methods/google-pay.png",
    handles: ["@okaxis", "@okhdfcbank", "@okicici", "@oksbi", "@gpay"],
  },
  {
    id: "phonepe",
    name: "PhonePe",
    iconUrl: "/assets/payment-methods/phonepe.png",
    handles: ["@ybl", "@ibl", "@axl"],
  },
  {
    id: "paytm",
    name: "Paytm",
    iconUrl: "/assets/payment-methods/paytm.png",
    handles: ["@paytm", "@paytmqr"],
  },
  {
    id: "bhim",
    name: "BHIM UPI",
    iconUrl: "/assets/payment-methods/bhim.png",
    handles: ["@upi", "@bhim"],
  },
  {
    id: "amazon-pay",
    name: "Amazon Pay",
    iconUrl: "/assets/payment-methods/amazon-pay.png",
    handles: ["@apl", "@amazon"],
  },
];

export const GIFT_CARDS: GiftCardMeta[] = [
  {
    id: "amazon",
    brand: "Amazon",
    category: "Shopping",
    imageUrl: "/assets/gift-cards/amazon.svg",
    logoUrl: "/assets/gift-cards/amazon.svg",
    description: "Digital voucher redeemable for millions of products worldwide",
    popular: true,
  },
  {
    id: "apple",
    brand: "Apple",
    category: "Entertainment",
    imageUrl: "/assets/gift-cards/apple.svg",
    logoUrl: "/assets/gift-cards/apple.svg",
    description: "Valid for App Store, Apple Music, iCloud & Apple Store products",
    popular: true,
  },
  {
    id: "google-play",
    brand: "Google Play",
    category: "Entertainment",
    imageUrl: "/assets/gift-cards/google-play.svg",
    logoUrl: "/assets/gift-cards/google-play.svg",
    description: "Apps, games, movies and digital content on Android",
    popular: true,
  },
  {
    id: "steam",
    brand: "Steam",
    category: "Gaming",
    imageUrl: "/assets/gift-cards/steam.svg",
    logoUrl: "/assets/gift-cards/steam.svg",
    description: "Steam Wallet credits for thousands of PC games and DLCs",
    popular: true,
  },
  {
    id: "playstation",
    brand: "PlayStation Store",
    category: "Gaming",
    imageUrl: "/assets/gift-cards/playstation.svg",
    logoUrl: "/assets/gift-cards/playstation.svg",
    description: "PSN funds for PlayStation consoles, subscriptions & games",
  },
  {
    id: "xbox",
    brand: "Xbox",
    category: "Gaming",
    imageUrl: "/assets/gift-cards/xbox.svg",
    logoUrl: "/assets/gift-cards/xbox.svg",
    description: "Xbox Game Pass, games and add-ons on console and PC",
  },
];

export const LUXURY_BRANDS: LuxuryBrandMeta[] = [
  {
    id: "louis-vuitton",
    name: "Louis Vuitton",
    category: "Haute Couture & Leather",
    logoUrl: "/assets/luxury/brands/louis-vuitton.png",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "rolex",
    name: "Rolex",
    category: "Fine Horology",
    logoUrl: "/assets/luxury/brands/rolex.png",
    photoUrl: "/assets/luxury/photos/timepieces.jpg",
  },
  {
    id: "prada",
    name: "Prada",
    category: "High Fashion",
    logoUrl: "/assets/luxury/brands/prada.png",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "gucci",
    name: "Gucci",
    category: "Italian Luxury",
    logoUrl: "/assets/luxury/brands/gucci.png",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "cartier",
    name: "Cartier",
    category: "High Jewellery",
    logoUrl: "/assets/luxury/brands/cartier.png",
    photoUrl: "/assets/luxury/photos/timepieces.jpg",
  },
  {
    id: "dior",
    name: "Dior",
    category: "Parisian Elegance",
    logoUrl: "/assets/luxury/brands/dior.png",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "hermes",
    name: "Hermès",
    category: "L'Art de Vivre",
    logoUrl: "/assets/luxury/brands/hermes.png",
    photoUrl: "/assets/luxury/photos/boutiques.jpg",
  },
  {
    id: "tiffany",
    name: "Tiffany & Co.",
    category: "Diamond Jewellery",
    logoUrl: "/assets/luxury/brands/tiffany.png",
    photoUrl: "/assets/luxury/photos/timepieces.jpg",
  },
  {
    id: "armani",
    name: "Giorgio Armani",
    category: "Bespoke Tailoring",
    logoUrl: "/assets/luxury/brands/armani.png",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "chanel",
    name: "Chanel",
    category: "Haute Couture",
    logoUrl: "/assets/luxury/brands/chanel.svg",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "burberry",
    name: "Burberry",
    category: "Heritage Outerwear",
    logoUrl: "/assets/luxury/brands/burberry.svg",
    photoUrl: "/assets/luxury/photos/boutiques.jpg",
  },
  {
    id: "versace",
    name: "Versace",
    category: "Glamour & Couture",
    logoUrl: "/assets/luxury/brands/versace.svg",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "balenciaga",
    name: "Balenciaga",
    category: "Avant-garde Fashion",
    logoUrl: "/assets/luxury/brands/balenciaga.svg",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "saint-laurent",
    name: "Saint Laurent",
    category: "Parisian Fashion",
    logoUrl: "/assets/luxury/brands/saint-laurent.svg",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "bvlgari",
    name: "Bvlgari",
    category: "Italian Jewellery",
    logoUrl: "/assets/luxury/brands/bvlgari.svg",
    photoUrl: "/assets/luxury/photos/timepieces.jpg",
  },
  {
    id: "fendi",
    name: "Fendi",
    category: "Italian Luxury House",
    logoUrl: "/assets/luxury/brands/fendi.svg",
    photoUrl: "/assets/luxury/photos/boutiques.jpg",
  },
  {
    id: "valentino",
    name: "Valentino",
    category: "Roman Couture",
    logoUrl: "/assets/luxury/brands/valentino.svg",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
  {
    id: "ralph-lauren",
    name: "Ralph Lauren",
    category: "American Luxury",
    logoUrl: "/assets/luxury/brands/ralph-lauren.svg",
    photoUrl: "/assets/luxury/photos/boutiques.jpg",
  },
  {
    id: "tom-ford",
    name: "Tom Ford",
    category: "Modern Elegance",
    logoUrl: "/assets/luxury/brands/tom-ford.svg",
    photoUrl: "/assets/luxury/photos/fashion.jpg",
  },
];

export const INDIAN_BANKS: BankMeta[] = [
  {
    id: "sbi",
    name: "State Bank of India",
    logoUrl: "/assets/banks/sbi.png",
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    logoUrl: "/assets/banks/hdfc-bank.png",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    logoUrl: "/assets/banks/icici-bank.png",
  },
  {
    id: "axis",
    name: "Axis Bank",
    logoUrl: "/assets/banks/axis-bank.png",
  },
  {
    id: "yes-bank",
    name: "YES BANK",
    logoUrl: "/assets/banks/yes-bank.jpg",
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
