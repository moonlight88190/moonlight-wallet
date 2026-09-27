import emblem from "@/assets/moonlight-emblem.png.asset.json";
import full from "@/assets/moonlight-logo.png.asset.json";
import { cn } from "@/lib/utils";

/** Circular emblem cropped from the official logo (no redraw). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={emblem.url}
      alt="Moonlight Wallet"
      className={cn("rounded-full object-cover ring-1 ring-border", className)}
      width={256}
      height={256}
    />
  );
}

/** Full official logo, shown on a light tile so it reads in dark mode too. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl bg-card shadow-soft dark:bg-[oklch(1_0_0)]", className)}>
      <img src={full.url} alt="Premium Moonlight Wealth Management" className="h-full w-full object-contain" />
    </div>
  );
}
