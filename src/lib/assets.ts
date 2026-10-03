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

export type AssetCategory =
  "payment-method" | "bank" | "upi" | "gift-card" | "luxury" | "flag" | "investment";

export interface BrandAssetMeta {
  id: string;
  name: string;
  category: AssetCategory;
  logoUrl: string;
  sourceRatio?: "square" | "wide" | "ultra-wide" | "card";
  renderMode?: "contain" | "cover";
  opticalScale?: number;
  badge?: string;
}

export interface BankMeta {
  id: string;
  name: string;
  logoUrl: string;
  /** preferred object-fit mode for the logo container */
  renderMode?: "contain" | "cover";
  /** w:h ratio hint for optical logo sizing */
  sourceRatio?: "wide" | "square" | "ultra-wide";
}

export interface PaymentMethodMeta {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  region: "Europe" | "India" | "Philippines" | "International";
  speed: string;
  badge?: string;
  sourceRatio?: "wide" | "square" | "ultra-wide";
}

export interface UPIProviderMeta {
  id: string;
  name: string;
  iconUrl: string;
  handles: string[];
  sourceRatio?: "wide" | "square" | "ultra-wide";
}

export interface GiftCardMeta {
  id: string;
  brand: string;
  category: "Gaming" | "Shopping" | "Entertainment" | "Luxury" | "Travel";
  imageUrl: string;
  logoUrl?: string;
  description: string;
  popular?: boolean;
  /** object-fit mode for the card image */
  imageFit?: "cover" | "contain";
  /** optional background color behind the card image */
  imageBg?: string;
}

export interface InvestmentMeta {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  imageUrl: string;
  badge?: string;
  imageFit?: "cover" | "contain";
}

export interface LuxuryBrandMeta {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  photoUrl?: string;
  /** If true, logo has a colored/non-white background and should NOT be inverted in dark mode */
  isColored?: boolean;
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
    sourceRatio: "wide",
  },
  {
    id: "cz-bank",
    name: "Czech Bank Transfer & QR Platba",
    description: "Direct payout to Czech banks (CZK)",
    iconUrl: "/assets/payment-methods/cz-bank.svg",
    region: "Europe",
    speed: "Instant / Same-day",
    badge: "Czech Republic",
    sourceRatio: "wide",
  },
  {
    id: "faster-payments",
    name: "UK Faster Payments",
    description: "UK bank account instant payout (GBP)",
    iconUrl: "/assets/payment-methods/faster-payments.svg",
    region: "Europe",
    speed: "Instant",
    badge: "Faster Payments",
    sourceRatio: "wide",
  },
  {
    id: "upi",
    name: "UPI Direct",
    description: "Instant payout via Virtual Payment Address (VPA / UPI ID)",
    iconUrl: "/assets/payment-methods/upi.svg",
    region: "India",
    speed: "Instant",
    badge: "UPI",
    sourceRatio: "wide",
  },
  {
    id: "upi-qr",
    name: "UPI QR Code",
    description: "Scan & pay via Google Pay, PhonePe or Paytm",
    iconUrl: "/assets/payment-methods/upi-qr.svg",
    region: "India",
    speed: "Instant",
    sourceRatio: "square",
  },
  {
    id: "in-bank",
    name: "Indian Bank Transfer (IMPS/NEFT)",
    description: "Direct to any Indian bank account",
    iconUrl: "/assets/payment-methods/in-bank.svg",
    region: "India",
    speed: "Instant (IMPS)",
    sourceRatio: "wide",
  },
  {
    id: "gcash",
    name: "GCash Wallet",
    description: "Instant payout to GCash Mobile Wallet",
    iconUrl: "/assets/payment-methods/gcash.svg",
    region: "Philippines",
    speed: "Instant",
    badge: "Official",
    sourceRatio: "wide",
  },
  {
    id: "ph-bank",
    name: "Philippine Bank Transfer (InstaPay)",
    description: "BDO, BPI, Metrobank & all PH banks",
    iconUrl: "/assets/payment-methods/ph-bank.svg",
    region: "Philippines",
    speed: "Instant (InstaPay)",
    sourceRatio: "wide",
  },
  {
    id: "paynow",
    name: "Singapore PayNow",
    description: "Instant payout via NRIC/FIN or Mobile (SGD)",
    iconUrl: "/assets/payment-methods/paynow.png",
    region: "International",
    speed: "Instant",
    badge: "Singapore Official",
    sourceRatio: "wide",
  },
  {
    id: "pix",
    name: "Brazil Pix",
    description: "Instant payout via Pix key or QR (BRL)",
    iconUrl: "/assets/payment-methods/pix.svg",
    region: "International",
    speed: "Instant",
    badge: "PIX",
    sourceRatio: "wide",
  },
  {
    id: "interac",
    name: "Canada Interac e-Transfer",
    description: "Instant Canadian bank payout (CAD)",
    iconUrl: "/assets/payment-methods/interac.svg",
    region: "International",
    speed: "Instant",
    badge: "Interac Official",
    sourceRatio: "wide",
  },
  {
    id: "jp-bank",
    name: "Japanese Local Bank (Zengin)",
    description: "Direct payout to Japanese banks (JPY)",
    iconUrl: "/assets/payment-methods/jp-bank.svg",
    region: "International",
    speed: "Instant / Same-day",
    badge: "Zengin Rail",
    sourceRatio: "wide",
  },
  {
    id: "aani",
    name: "UAE Aani Instant Payout",
    description: "Instant UAE payment via Al Etihad Payments (AED)",
    iconUrl: "/assets/payment-methods/aani.png",
    region: "International",
    speed: "Instant",
    badge: "UAE Official",
    sourceRatio: "wide",
  },
  {
    id: "int-bank",
    name: "International Wire / SWIFT",
    description: "Global wire transfer to 150+ countries",
    iconUrl: "/assets/payment-methods/int-bank.svg",
    region: "International",
    speed: "1-2 business days",
    badge: "Global Payout",
    sourceRatio: "wide",
  },
];

export const UPI_PROVIDERS: UPIProviderMeta[] = [
  {
    id: "google-pay",
    name: "Google Pay",
    iconUrl: "/assets/payment-methods/google-pay.svg",
    handles: ["@okaxis", "@okhdfcbank", "@okicici", "@oksbi", "@gpay"],
    sourceRatio: "wide",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    iconUrl: "/assets/payment-methods/phonepe.svg",
    handles: ["@ybl", "@ibl", "@axl"],
    sourceRatio: "wide",
  },
  {
    id: "paytm",
    name: "Paytm",
    iconUrl: "/assets/payment-methods/paytm.svg",
    handles: ["@paytm", "@paytmqr"],
    sourceRatio: "wide",
  },
  {
    id: "bhim",
    name: "BHIM UPI",
    iconUrl: "/assets/payment-methods/bhim.svg",
    handles: ["@upi", "@bhim"],
    sourceRatio: "wide",
  },
  {
    id: "amazon-pay",
    name: "Amazon Pay",
    iconUrl: "/assets/payment-methods/amazon-pay.svg",
    handles: ["@apl", "@amazon"],
    sourceRatio: "ultra-wide",
  },
];

export const GIFT_CARDS: GiftCardMeta[] = [
  {
    id: "amazon",
    brand: "Amazon",
    category: "Shopping",
    // Source: Generated professional card render (amazon brand colors, teal/navy)
    imageUrl: "/assets/gift-cards/amazon.jpg",
    description: "Digital voucher redeemable for millions of products worldwide",
    popular: true,
    imageFit: "cover",
  },
  {
    id: "apple",
    brand: "Apple",
    category: "Entertainment",
    // Source: Generated professional card render matching Apple's 2024 card design
    imageUrl: "/assets/gift-cards/apple.jpg",
    description: "Valid for App Store, Apple Music, iCloud & Apple Store products",
    popular: true,
    imageFit: "cover",
    imageBg: "#f5f5f7",
  },
  {
    id: "google-play",
    brand: "Google Play",
    category: "Entertainment",
    // Source: Generated professional card render with Google Play brand colors
    imageUrl: "/assets/gift-cards/google-play.jpg",
    description: "Apps, games, movies and digital content on Android",
    popular: true,
    imageFit: "cover",
  },
  {
    id: "steam",
    brand: "Steam",
    category: "Gaming",
    // Source: Original clean product render (kept, quality acceptable)
    imageUrl: "/assets/gift-cards/steam.jpg",
    description: "Steam Wallet credits for thousands of PC games and DLCs",
    popular: true,
    imageFit: "cover",
  },
  {
    id: "playstation",
    brand: "PlayStation Store",
    category: "Gaming",
    // Source: Original clean product render (kept, quality acceptable)
    imageUrl: "/assets/gift-cards/playstation.jpg",
    description: "PSN funds for PlayStation consoles, subscriptions & games",
    imageFit: "cover",
  },
  {
    id: "xbox",
    brand: "Xbox",
    category: "Gaming",
    // Source: Generated professional card render with Xbox green branding
    imageUrl: "/assets/gift-cards/xbox.jpg",
    description: "Xbox Game Pass, games and add-ons on console and PC",
    imageFit: "cover",
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
    isColored: true, // Has distinctive orange background
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
    // Source: Official State Bank of India brand emblem (transparent high-res)
    logoUrl: "/assets/banks/sbi.png",
    renderMode: "contain",
    sourceRatio: "square",
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    // Source: Official HDFC Bank vector (Wikimedia Commons)
    logoUrl: "/assets/banks/hdfc-bank.svg",
    renderMode: "contain",
    sourceRatio: "ultra-wide",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    // Source: Official ICICI Bank vector (Wikimedia Commons)
    logoUrl: "/assets/banks/icici-bank.svg",
    renderMode: "contain",
    sourceRatio: "ultra-wide",
  },
  {
    id: "axis",
    name: "Axis Bank",
    // Source: Official Axis Bank vector (Wikimedia Commons)
    logoUrl: "/assets/banks/axis-bank.svg",
    renderMode: "contain",
    sourceRatio: "ultra-wide",
  },
  {
    id: "yes-bank",
    name: "YES BANK",
    // Source: Official YES Bank vector (Wikimedia Commons)
    logoUrl: "/assets/banks/yes-bank.svg",
    renderMode: "contain",
    sourceRatio: "wide",
  },
];

export const INVESTMENTS: InvestmentMeta[] = [
  {
    id: "global-markets",
    title: "European & Global Markets",
    category: "Wealth Management",
    subtitle: "Track diversified indices, FX rates and market portfolios",
    // Source: Generated professional fintech card image (stock market data visualization)
    imageUrl: "/assets/investments/global-markets.jpg",
    badge: "Yield & FX",
    imageFit: "cover",
  },
  {
    id: "wealth-management",
    title: "Private Treasury & Allocation",
    category: "Financial Services",
    subtitle: "Automated multi-currency rebalancing with low friction",
    // Source: Generated professional private banking card image
    imageUrl: "/assets/investments/wealth-management.jpg",
    badge: "Private Standard",
    imageFit: "cover",
  },
];

export function getMethodTargetCurrency(methodId: string): string {
  const m = methodId.toLowerCase();
  if (
    m.includes("upi") ||
    m.includes("in-bank") ||
    m === "sbi" ||
    m === "hdfc" ||
    m === "icici" ||
    m === "axis" ||
    m === "yes-bank"
  )
    return "INR";
  if (m.includes("gcash") || m.includes("ph-bank")) return "PHP";
  if (m.includes("cz-bank") || m.includes("czech")) return "CZK";
  if (m.includes("faster-payments") || m.includes("uk")) return "GBP";
  if (m.includes("paynow")) return "SGD";
  if (m.includes("pix")) return "BRL";
  if (m.includes("interac")) return "CAD";
  if (m.includes("jp-bank") || m.includes("zengin")) return "JPY";
  if (m.includes("aani")) return "AED";
  if (m.includes("sepa")) return "EUR";
  return "EUR";
}

export interface ResolvedPaymentAsset {
  type: "gift" | "bank" | "upi" | "method";
  id: string;
  label: string;
  subtitle: string;
  sourceRatio?: "square" | "wide" | "ultra-wide" | "card";
  giftCard?: GiftCardMeta;
}

/**
 * Resolves transaction metadata to a display asset and label.
 * Prioritizes internal Moonlight transfers and credits before matching external
 * payment providers, banks, vouchers, and currency-based fallback rails.
 */
export function resolvePaymentAsset(
  methodName?: string,
  upiId?: string,
  providerName?: string,
  currency?: string,
  route?: string,
  kind?: string,
): ResolvedPaymentAsset {
  const m = (methodName || "").toLowerCase();
  const u = (upiId || "").toLowerCase();
  const p = (providerName || "").toLowerCase();
  const r = (route || "").toLowerCase();
  const k = (kind || "").toLowerCase();

  // 1. Internal Moonlight transfers ALWAYS resolve to Moonlight brand identity
  // Peer transfers and admin credits represent Moonlight's native rails.
  const isInternal =
    r === "moonlight" ||
    k === "transfer" ||
    k === "admin_credit" ||
    m === "moonlight transfer" ||
    m === "internal transfer" ||
    (!r && k !== "withdrawal");

  if (isInternal && k !== "withdrawal") {
    return {
      type: "method",
      id: "moonlight",
      label: k === "admin_credit" ? "Account Credit" : "Moonlight Transfer",
      subtitle: k === "admin_credit" ? "Balance Adjustment" : "Peer-to-Peer Transfer",
      sourceRatio: "square",
    };
  }

  // 2. Gift card match (for digital voucher withdrawals / redemptions)
  if (r === "gift-card" || k === "gift_card" || k === "redemption" || m.includes("voucher") || m.includes("gift")) {
    const matchedGift = GIFT_CARDS.find(
      (g) =>
        m.includes(g.id) ||
        m.includes(g.brand.toLowerCase()) ||
        p.includes(g.id) ||
        r === "gift-card",
    );
    if (matchedGift) {
      return {
        type: "gift",
        id: matchedGift.id,
        label: `${matchedGift.brand} Gift Card`,
        subtitle: "Digital Voucher Redemption",
        sourceRatio: "card",
        giftCard: matchedGift,
      };
    }
  }

  // 3. UPI Provider match (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay)
  if (r === "upi" || m.includes("upi") || u.length > 0) {
    const upiMatch = UPI_PROVIDERS.find(
      (prov) =>
        p.includes(prov.id) ||
        p.includes(prov.name.toLowerCase()) ||
        m.includes(prov.id) ||
        m.includes(prov.name.toLowerCase()) ||
        prov.handles.some((h) => u.includes(h)),
    );
    if (upiMatch) {
      return {
        type: "upi",
        id: upiMatch.id,
        label: upiMatch.name,
        subtitle: "Unified Payments Interface (UPI)",
        sourceRatio: upiMatch.sourceRatio || "wide",
      };
    }
    return {
      type: "upi",
      id: "upi",
      label: "UPI Direct",
      subtitle: "Unified Payments Interface",
      sourceRatio: "wide",
    };
  }

  // 4. Indian Bank match (SBI, HDFC, ICICI, Axis, YES Bank)
  if (r === "in-bank" || m.includes("bank") || m.includes("imps") || m.includes("neft")) {
    const bankMatch = INDIAN_BANKS.find(
      (b) =>
        m.includes(b.id) ||
        m.includes(b.name.toLowerCase()) ||
        p.includes(b.id) ||
        p.includes(b.name.toLowerCase()),
    );
    if (bankMatch) {
      return {
        type: "bank",
        id: bankMatch.id,
        label: bankMatch.name,
        subtitle: "Direct Bank Transfer (IMPS/NEFT)",
        sourceRatio: bankMatch.sourceRatio || "ultra-wide",
      };
    }
    return {
      type: "bank",
      id: "sbi",
      label: "Indian Bank Transfer",
      subtitle: "Direct Bank Transfer (IMPS/NEFT)",
      sourceRatio: "ultra-wide",
    };
  }

  // 5. Specific external payment rails (explicit by route or method name)
  if (r === "gcash" || m.includes("gcash")) {
    return {
      type: "method",
      id: "gcash",
      label: "GCash Wallet",
      subtitle: "Mobile Wallet Payout",
      sourceRatio: "wide",
    };
  }
  if (r === "paynow" || m.includes("paynow")) {
    return {
      type: "method",
      id: "paynow",
      label: "Singapore PayNow",
      subtitle: "National Instant Payout",
      sourceRatio: "wide",
    };
  }
  if (r === "pix" || m.includes("pix")) {
    return {
      type: "method",
      id: "pix",
      label: "Pix Instant",
      subtitle: "Central Bank of Brazil Rail",
      sourceRatio: "wide",
    };
  }
  if (r === "sepa" || m.includes("sepa")) {
    return {
      type: "method",
      id: "sepa",
      label: "SEPA Instant",
      subtitle: "Eurozone Interbank Network",
      sourceRatio: "wide",
    };
  }
  if (r === "faster-payments" || m.includes("faster") || m.includes("fps")) {
    return {
      type: "method",
      id: "faster-payments",
      label: "Faster Payments",
      subtitle: "UK Instant Bank Rail",
      sourceRatio: "wide",
    };
  }
  if (r === "interac" || m.includes("interac")) {
    return {
      type: "method",
      id: "interac",
      label: "Interac e-Transfer",
      subtitle: "Canadian Electronic Clearing",
      sourceRatio: "wide",
    };
  }
  if (r === "aani" || m.includes("aani")) {
    return {
      type: "method",
      id: "aani",
      label: "Aani Instant",
      subtitle: "UAE National Payment Platform",
      sourceRatio: "wide",
    };
  }
  if (r === "cz-bank" || m.includes("cz") || m.includes("czech")) {
    return {
      type: "method",
      id: "cz-bank",
      label: "Czech Bank Transfer",
      subtitle: "QR Platba / Local Clearing",
      sourceRatio: "wide",
    };
  }

  // 6. General payment method match
  const pm = PAYMENT_METHODS.find(
    (item) => m.includes(item.id) || m.includes(item.name.toLowerCase()) || r === item.id,
  );
  if (pm) {
    return {
      type: "method",
      id: pm.id,
      label: pm.name,
      subtitle: pm.description,
      sourceRatio: pm.sourceRatio || "wide",
    };
  }

  return {
    type: "method",
    id: "moonlight",
    label: methodName || "Moonlight Transfer",
    subtitle: "Internal Wallet Settlement",
    sourceRatio: "square",
  };
}

export function parseUPIHandle(vpa: string): {
  isVPA: boolean;
  providerId?: string;
  providerName?: string;
} {
  const trimmed = vpa.trim().toLowerCase();
  if (!trimmed.includes("@") || trimmed.startsWith("@") || trimmed.endsWith("@")) {
    return { isVPA: false };
  }
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { isVPA: false };
  }

  const handle = `@${parts[1]}`;
  const found = UPI_PROVIDERS.find((p) => p.handles.includes(handle));
  if (found) {
    return { isVPA: true, providerId: found.id, providerName: found.name };
  }

  return { isVPA: true, providerName: "UPI-compatible format" };
}
