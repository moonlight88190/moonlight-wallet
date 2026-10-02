import React from "react";
import { Landmark, Gift, Building2, CreditCard } from "lucide-react";
import {
  COUNTRIES,
  CURRENCIES_META,
  GIFT_CARDS,
  INDIAN_BANKS,
  PAYMENT_METHODS,
  UPI_PROVIDERS,
  type CountryMeta,
  type GiftCardMeta,
  type PaymentMethodMeta,
} from "@/lib/assets";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Country flags
// ─────────────────────────────────────────────

export interface CountryFlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  code: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  circle?: boolean;
}

const SIZE_MAP = {
  xs: "w-4 h-3",
  sm: "w-5 h-3.5",
  md: "w-6 h-4",
  lg: "w-8 h-5.5",
  xl: "w-10 h-7",
};

const CIRCLE_SIZE_MAP = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
};

export function CountryFlag({
  code,
  size = "md",
  circle = false,
  className,
  alt,
  ...props
}: CountryFlagProps) {
  const countryKey = code.toUpperCase();
  const country: CountryMeta | undefined =
    COUNTRIES[countryKey] ||
    (CURRENCIES_META[countryKey] ? COUNTRIES[CURRENCIES_META[countryKey].flagCode] : undefined);
  const flagUrl = country?.flagUrl || `/assets/countries/${code.toLowerCase()}.svg`;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/40 shadow-2xs transition-transform",
        circle ? "rounded-full object-cover" : "rounded-xs object-cover",
        circle ? CIRCLE_SIZE_MAP[size] : SIZE_MAP[size],
        className,
      )}
    >
      <img
        src={flagUrl}
        alt={alt || country?.name || `${code} flag`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
        {...props}
      />
    </div>
  );
}

export function CountryIcon({
  code,
  showName = true,
  className,
}: {
  code: string;
  showName?: boolean;
  className?: string;
}) {
  const countryKey = code.toUpperCase();
  const country =
    COUNTRIES[countryKey] ||
    (CURRENCIES_META[countryKey] ? COUNTRIES[CURRENCIES_META[countryKey].flagCode] : undefined);

  if (!country) return null;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <CountryFlag code={country.code} size="sm" />
      {showName && <span className="text-sm font-medium">{country.name}</span>}
    </div>
  );
}

export function CurrencyIcon({
  code,
  showCode = true,
  className,
}: {
  code: string;
  showCode?: boolean;
  className?: string;
}) {
  const currencyKey = code.toUpperCase();
  const curMeta = CURRENCIES_META[currencyKey];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <CountryFlag code={curMeta?.flagCode || currencyKey} circle size="sm" />
      {showCode && <span className="text-sm font-semibold">{currencyKey}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Base BrandAsset — Optically-Sized Presentation
// ─────────────────────────────────────────────

export interface BrandAssetProps {
  id: string;
  name?: string | undefined;
  category?: "payment-method" | "bank" | "upi" | "gift-card" | "luxury" | undefined;
  iconUrl?: string | undefined;
  size?: "xs" | "sm" | "md" | "lg" | undefined;
  sourceRatio?: "square" | "wide" | "ultra-wide" | "card" | undefined;
  className?: string | undefined;
  imgClassName?: string | undefined;
}

export function BrandAsset({
  id,
  name,
  iconUrl: customUrl,
  size = "md",
  sourceRatio,
  className,
  imgClassName,
}: BrandAssetProps) {
  const cleanId = id
    .toLowerCase()
    .replace(/.*[/\\]/, "")
    .replace(/\.(png|jpg|jpeg|svg|webp)$/, "");

  const method = PAYMENT_METHODS.find((m) => m.id === cleanId || m.id === id);
  const provider = UPI_PROVIDERS.find((p) => p.id === cleanId || p.id === id);
  const bank = INDIAN_BANKS.find((b) => b.id === cleanId || b.id === id);

  const resolvedUrl =
    customUrl ||
    method?.iconUrl ||
    provider?.iconUrl ||
    bank?.logoUrl ||
    `/assets/payment-methods/${cleanId}.svg`;

  const displayName = name || method?.name || provider?.name || bank?.name || cleanId;
  const ratio =
    sourceRatio ||
    method?.sourceRatio ||
    provider?.sourceRatio ||
    bank?.sourceRatio ||
    (cleanId === "sbi" || cleanId.includes("qr") ? "square" : "wide");

  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  // Optical container sizing
  let containerDimensions = "";
  let imgMaxDimensions = "";

  if (ratio === "square") {
    containerDimensions =
      size === "xs"
        ? "h-6 w-6"
        : size === "sm"
          ? "h-8 w-8"
          : size === "lg"
            ? "h-12 w-12"
            : "h-10 w-10";
    imgMaxDimensions = "max-h-full max-w-full";
  } else if (ratio === "ultra-wide") {
    containerDimensions =
      size === "xs"
        ? "h-5 w-auto min-w-[50px] max-w-[80px]"
        : size === "sm"
          ? "h-7 w-auto min-w-[70px] max-w-[110px]"
          : size === "lg"
            ? "h-10 w-auto min-w-[110px] max-w-[160px]"
            : "h-8 w-auto min-w-[90px] max-w-[135px]";
    imgMaxDimensions = "h-full w-auto object-contain";
  } else {
    // Standard wide wordmark or badge
    containerDimensions =
      size === "xs"
        ? "h-5 w-auto min-w-[40px] max-w-[70px]"
        : size === "sm"
          ? "h-7 w-auto min-w-[55px] max-w-[95px]"
          : size === "lg"
            ? "h-10 w-auto min-w-[85px] max-w-[140px]"
            : "h-8 w-auto min-w-[70px] max-w-[115px]";
    imgMaxDimensions = "h-full w-auto object-contain";
  }

  if (failed) {
    return (
      <div
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground px-2 text-[10px] font-semibold",
          containerDimensions,
          className,
        )}
      >
        <Building2 className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden transition-opacity",
        containerDimensions,
        className,
      )}
    >
      <img
        src={resolvedUrl}
        alt={displayName}
        className={cn("object-contain object-center transition-transform", imgMaxDimensions, imgClassName)}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Payment method icon
// ─────────────────────────────────────────────

export function PaymentMethodIcon({
  id,
  className,
  size = "md",
}: {
  id: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return <BrandAsset id={id} category="payment-method" size={size} className={className} />;
}

// ─────────────────────────────────────────────
// Bank logo component
// ─────────────────────────────────────────────

export function BankLogo({
  bankId,
  className,
  size = "md",
}: {
  bankId: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const bank = INDIAN_BANKS.find((b) => b.id === bankId);
  return (
    <BrandAsset
      id={bankId}
      name={bank?.name}
      iconUrl={bank?.logoUrl}
      category="bank"
      sourceRatio={bank?.sourceRatio}
      size={size}
      className={className}
    />
  );
}

// ─────────────────────────────────────────────
// UPI Provider Logo
// ─────────────────────────────────────────────

export function UPIProviderLogo({
  providerId,
  className,
  size = "md",
}: {
  providerId: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const provider = UPI_PROVIDERS.find((p) => p.id === providerId);
  return (
    <BrandAsset
      id={providerId}
      name={provider?.name}
      iconUrl={provider?.iconUrl}
      category="upi"
      sourceRatio={provider?.sourceRatio}
      size={size}
      className={className}
    />
  );
}

// ─────────────────────────────────────────────
// Gift card image component (3:2 Aspect Ratio)
// ─────────────────────────────────────────────

export function GiftCardImage({
  imageUrl,
  alt,
  className,
  aspectRatio = "3/2",
}: {
  imageUrl: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-xl bg-card border border-border/40", className)}
      style={{ aspectRatio }}
    >
      {!failed ? (
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-3 text-center">
          <Gift className="h-6 w-6 text-primary mb-1" />
          <span className="text-xs font-semibold">{alt}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Gift card interactive card brand component
// ─────────────────────────────────────────────

export function GiftCardBrand({
  card,
  cardId,
  className,
  onClick,
}: {
  card?: GiftCardMeta;
  cardId?: string;
  className?: string;
  onClick?: () => void;
}) {
  const cardData = card || GIFT_CARDS.find((g) => g.id === cardId) || GIFT_CARDS[0]!;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-2 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98] cursor-pointer touch-manipulation",
        className,
      )}
    >
      {/* Card image area — genuine 3:2 digital voucher render */}
      <div className="relative w-full overflow-hidden rounded-xl">
        <GiftCardImage imageUrl={cardData.imageUrl} alt={cardData.brand} />
        {cardData.popular && (
          <span className="absolute top-2 right-2 rounded-full bg-primary/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary-foreground uppercase shadow-xs z-10">
            POPULAR
          </span>
        )}
      </div>

      {/* Card metadata row */}
      <div className="mt-2 px-1 min-w-0">
        <div className="flex items-center justify-between gap-1 min-w-0">
          <h3 className="font-semibold text-foreground text-xs sm:text-sm tracking-tight truncate min-w-0 flex-1">
            {cardData.brand}
          </h3>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full shrink-0">
            {cardData.category}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-snug break-words">
          {cardData.description}
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Transfer method card
// ─────────────────────────────────────────────

export function TransferMethodCard({
  method,
  onClick,
  active = false,
}: {
  method: PaymentMethodMeta;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-card p-3.5 sm:p-4 shadow-soft transition-all cursor-pointer hover:border-primary/40 hover:bg-accent/40 active:scale-[0.98]",
        active ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border/60",
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <PaymentMethodIcon id={method.id} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-semibold text-foreground text-xs sm:text-sm tracking-tight truncate">
              {method.name}
            </h4>
            {method.badge && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {method.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {method.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-border/40">
        <span className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {method.speed}
        </span>
      </div>
    </div>
  );
}
