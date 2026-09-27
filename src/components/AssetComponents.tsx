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

  const sizeClasses = {
    sm: "h-7 w-12",
    md: "h-10 w-16",
    lg: "h-14 w-24",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-card p-1 shadow-xs transition-shadow hover:shadow-soft",
        sizeClasses[size],
        className,
      )}
    >
      <img
        src={iconUrl}
        alt={method?.name || `${id} payment method`}
        className="h-full w-full object-contain"
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

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-pointer",
        className,
      )}
    >
      <div className="relative aspect-[1.58/1] w-full overflow-hidden rounded-xl bg-muted">
        <img
          src={cardData.imageUrl}
          alt={cardData.brand}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {cardData.popular && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-primary/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-primary-foreground uppercase shadow-xs">
            POPULAR
          </span>
        )}
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm tracking-tight">{cardData.brand}</h3>
          <span className="text-[11px] font-medium text-muted-foreground">{cardData.category}</span>
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
        "group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-soft transition-all cursor-pointer hover:border-primary/40 hover:bg-accent/40",
        active ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border/60",
      )}
    >
      <div className="flex items-center gap-4">
        <PaymentMethodIcon id={method.id} size="md" />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground text-sm">{method.name}</h4>
            {method.badge && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {method.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{method.description}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {method.speed}
        </span>
      </div>
    </div>
  );
}
