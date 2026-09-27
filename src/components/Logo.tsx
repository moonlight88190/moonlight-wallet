import { cn } from "@/lib/utils";

/** Official Moonlight Emblem mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-slate-950 p-1 shadow-xs transition-transform hover:scale-105",
        className,
      )}
    >
      <img
        src="/assets/brand/emblem.svg"
        alt="Moonlight Emblem"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/** Full official Moonlight logo. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-soft dark:bg-[oklch(0.18_0_0)]",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-slate-950 p-2 shadow-soft">
          <img
            src="/assets/brand/emblem.svg"
            alt="Moonlight"
            className="h-full w-full object-contain"
          />
        </div>
        <span className="mt-3.5 text-xs font-semibold tracking-[0.25em] text-foreground uppercase">
          MOONLIGHT WALLET
        </span>
      </div>
    </div>
  );
}
