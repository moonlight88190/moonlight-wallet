import React from "react";
import { Landmark, Gift } from "lucide-react";
import {
  COUNTRIES,
  CURRENCIES_META,
  GIFT_CARDS,
  PAYMENT_METHODS,
  UPI_PROVIDERS,
  type CountryMeta,
  type GiftCardMeta,
  type PaymentMethodMeta,
  type UPIProviderMeta,
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

export function PaymentMethodIcon({
  id,
  className,
  size = "md",
}: {
  id: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const cleanId = id
    .toLowerCase()
    .replace(/.*[\/\\]/, "")
    .replace(/\.(png|jpg|jpeg|svg|webp)$/, "");
  const method = PAYMENT_METHODS.find((m) => m.id === cleanId || m.id === id);
  const provider = UPI_PROVIDERS.find((p) => p.id === cleanId || p.id === id);

  let iconUrl = method?.iconUrl || provider?.iconUrl;
  if (!iconUrl) {
    if (id.startsWith("/") || id.startsWith("assets/")) {
      iconUrl = id.startsWith("/") ? id : `/${id}`;
    } else if (cleanId === "yes-bank") {
      iconUrl = "/assets/banks/yes-bank.jpg";
    } else if (["sbi", "hdfc-bank", "icici-bank", "axis-bank"].includes(cleanId)) {
      iconUrl = `/assets/banks/${cleanId}.png`;
    } else {
      iconUrl = `/assets/payment-methods/${cleanId}.png`;
    }
  }

  const name = method?.name || provider?.name || `${cleanId} payment method`;
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [iconUrl]);

  // CATEGORIZATION BY NATIVE ASPECT RATIO
  const SQUARE_IDS = [
    "sepa",
    "sbi",
    "gcash",
    "upi-qr",
    "cz-bank",
    "in-bank",
    "ph-bank",
    "int-bank",
    "pix",
    "whatsapp",
    "steam",
    "moonlight-logo",
    "moonlight-emblem",
  ];
  const ULTRA_WIDE_IDS = [
    "hdfc-bank",
    "icici-bank",
    "axis-bank",
    "airtel-payments-bank",
    "amazon-pay",
    "xbox",
  ];

  const isSquare = SQUARE_IDS.includes(cleanId);
  const isUltraWide = ULTRA_WIDE_IDS.includes(cleanId);

  let containerDims = "";
  if (isSquare) {
    containerDims =
      size === "sm"
        ? "h-8 w-8 p-1"
        : size === "lg"
          ? "h-12 w-12 sm:h-14 sm:w-14 p-2"
          : "h-10 w-10 sm:h-11 sm:w-11 p-1.5";
  } else if (isUltraWide) {
    containerDims =
      size === "sm"
        ? "h-7 px-2 py-0.5 w-auto min-w-[70px] max-w-[100px]"
        : size === "lg"
          ? "h-11 sm:h-12 px-3.5 py-1.5 w-auto min-w-[110px] max-w-[150px]"
          : "h-9 sm:h-10 px-2.5 py-1 w-auto min-w-[85px] max-w-[130px]";
  } else {
    // Standard horizontal wordmark (UPI, GPay, PhonePe, Paytm, BHIM, Yes Bank, etc.)
    containerDims =
      size === "sm"
        ? "h-8 px-2 py-0.5 w-auto min-w-[60px] max-w-[90px]"
        : size === "lg"
          ? "h-11 sm:h-12 px-3 py-1 w-auto min-w-[95px] max-w-[130px]"
          : "h-9 sm:h-10 px-2.5 py-1 w-auto min-w-[75px] max-w-[115px]";
  }

  const baseContainer =
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white dark:bg-slate-900/90 shadow-2xs transition-all hover:border-primary/40";

  if (failed) {
    return (
      <div
        className={cn(
          baseContainer,
          containerDims,
          "bg-secondary text-muted-foreground",
          className,
        )}
      >
        <Landmark className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className={cn(baseContainer, containerDims, className)}>
      <img
        src={iconUrl}
        alt={name}
        className="max-h-full max-w-full object-contain object-center transition-transform group-hover:scale-105"
        onError={() => setFailed(true)}
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
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [cardData.imageUrl, cardData.logoUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-2.5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:scale-[0.98] cursor-pointer touch-manipulation",
        className,
      )}
    >
      <div className="bg-slate-900/90 rounded-xl overflow-hidden aspect-[1.5/1] flex items-center justify-center p-2 relative w-full">
        {!imgFailed ? (
          <img
            src={cardData.imageUrl}
            alt={cardData.brand}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white font-bold text-sm p-2">
            <Gift className="h-6 w-6 text-amber-400 mb-1" />
            <span>{cardData.brand}</span>
          </div>
        )}
        {cardData.logoUrl && !imgFailed && (
          <div className="absolute top-2 left-2 h-6 w-6 rounded-lg bg-black/60 backdrop-blur-md p-1 border border-white/20 flex items-center justify-center shadow-xs">
            <img src={cardData.logoUrl} alt="" className="h-full w-full object-contain" />
          </div>
        )}
        {cardData.popular && (
          <span className="absolute top-2 right-2 rounded-full bg-primary/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary-foreground uppercase shadow-xs z-10">
            POPULAR
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5 min-w-0">
        <div className="flex items-center justify-between gap-1 min-w-0">
          <h3 className="font-semibold text-foreground text-xs sm:text-sm tracking-tight truncate min-w-0 flex-1">
            {cardData.brand}
          </h3>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
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
