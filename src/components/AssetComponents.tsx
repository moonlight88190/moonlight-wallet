import React from "react";
import {
  COUNTRIES,
  CURRENCIES_META,
  GIFT_CARDS,
  PAYMENT_METHODS,
  type CountryMeta,
  type GiftCardMeta,
  type PaymentMethodMeta,
} from "@/lib/assets";
import { cn } from "@/lib/utils";

interface CountryFlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
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
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/40 shadow-xs transition-transform",
        circle ? "rounded-full object-cover" : "rounded-xs object-cover",
        circle ? CIRCLE_SIZE_MAP[size] : SIZE_MAP[size],
        className,
      )}
    >
      <img
        src={flagUrl}
        alt={alt || country?.name || `${code} flag`}
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback to text badge if missing
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

export function PaymentMethodIcon({
  id,
  className,
  size = "md",
}: {
  id: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const method = PAYMENT_METHODS.find((m) => m.id === id);
  const iconUrl = method?.iconUrl || `/assets/payment-methods/${id}.svg`;

  const containerSizes = {
    sm: "w-9 h-9 p-1.5 rounded-xl",
    md: "w-12 h-12 p-2.5 rounded-2xl",
    lg: "w-14 h-14 p-3 rounded-2xl",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-border/40 bg-secondary/60 shadow-xs transition-all hover:shadow-soft",
        containerSizes[size],
        className,
      )}
    >
      <img
        src={iconUrl}
        alt={method?.name || `${id} payment method`}
        className="h-full w-full object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
    </div>
  );
}

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
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card via-card to-secondary/30 p-3.5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 cursor-pointer",
        className,
      )}
    >
      {/* 1.58:1 Aspect Ratio Voucher Pass Container */}
      <div className="relative aspect-[1.58/1] w-full overflow-hidden rounded-xl border border-border/40 bg-slate-950/90 dark:bg-slate-900/90 p-3.5 shadow-inner flex flex-col justify-between">
        {/* Background glow or subtle voucher graphic */}
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />

        {/* Top Header: Category + Moonlight Verified Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase bg-slate-800/80 backdrop-blur-md border border-slate-700/50 px-2 py-0.5 rounded-full">
            {cardData.category}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Moonlight Verified
          </span>
        </div>

        {/* Center: Brand Logo or Text Fallback Badge */}
        <div className="relative z-10 flex items-center justify-center my-auto py-2">
          {!hasError ? (
            <img
              src={cardData.imageUrl}
              alt={cardData.brand}
              onError={() => setHasError(true)}
              className="max-h-12 max-w-[140px] object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-10 items-center justify-center rounded-lg bg-primary/20 px-4 text-xs font-bold text-primary tracking-wide">
              {cardData.brand}
            </div>
          )}
        </div>

        {/* Bottom Bar inside Card: Digital Pass tag */}
        <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
          <span>Digital Voucher</span>
          <span className="font-mono text-slate-400">INSTANT PASS</span>
        </div>
      </div>

      {/* Footer Info below card graphic */}
      <div className="mt-3 px-0.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm tracking-tight">{cardData.brand}</h3>
          {cardData.popular && (
            <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              Popular
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{cardData.description}</p>
      </div>
    </div>
  );
}

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
        "group flex items-center justify-between rounded-2xl border bg-card p-3.5 shadow-soft transition-all cursor-pointer hover:border-primary/40 hover:bg-accent/40 active:scale-[0.99]",
        active ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border/60",
      )}
    >
      <div className="flex items-center gap-3.5">
        <PaymentMethodIcon id={method.id} size="md" />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
              {method.name}
            </h4>
            {method.badge && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {method.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{method.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {method.speed}
        </span>
      </div>
    </div>
  );
}
