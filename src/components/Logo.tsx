import { cn } from "@/lib/utils";

/** Circular emblem using the real Moonlight brand asset. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 p-0.5 shadow-xs transition-transform",
        className,
      )}
    >
      <img
        src="/assets/brand/moonlight-emblem.png"
        alt="Moonlight Emblem"
        className="h-full w-full object-cover rounded-full"
      />
    </div>
  );
}

/** Full official logo mark using the real Moonlight logo asset. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden rounded-3xl border bg-card p-6 shadow-soft dark:bg-[oklch(0.18_0_0)]",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-1 shadow-soft">
          <img
            src="/assets/brand/moonlight-logo.png"
            alt="Moonlight Wallet Logo"
            className="h-full w-full object-contain rounded-xl"
          />
        </div>
        <span className="mt-3 text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          MOONLIGHT WALLET
        </span>
      </div>
    </div>
  );
}
