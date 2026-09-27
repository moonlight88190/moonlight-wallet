import { cn } from "@/lib/utils";

/** Official Moonlight logo emblem. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl",
        className,
      )}
    >
      <img
        src="/assets/brand/moonlight-logo.svg"
        alt="Moonlight emblem"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/** Full official logo mark with brand typography. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden rounded-3xl border bg-card p-6 shadow-soft dark:bg-[oklch(0.18_0_0)]",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-soft">
          <img
            src="/assets/brand/moonlight-logo.svg"
            alt="Moonlight Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <span className="mt-4 text-xs font-semibold tracking-[0.25em] text-foreground uppercase">
          MOONLIGHT WALLET
        </span>
      </div>
    </div>
  );
}
