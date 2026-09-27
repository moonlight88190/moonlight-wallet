import { cn } from "@/lib/utils";

/** Circular emblem cropped from the official logo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white shadow-xs dark:from-slate-100 dark:to-slate-300 dark:text-slate-900", className)}>
      <span className="font-bold text-xs tracking-wider">ML</span>
    </div>
  );
}

/** Full official logo mark. */
export function LogoFull({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden rounded-3xl border bg-card p-6 shadow-soft dark:bg-[oklch(0.18_0_0)]",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-xl font-bold text-white shadow-soft dark:from-slate-100 dark:to-slate-300 dark:text-slate-900">
          ML
        </div>
        <span className="mt-3 text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          MOONLIGHT WALLET
        </span>
      </div>
    </div>
  );
}
