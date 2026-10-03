import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background text-foreground selection:bg-primary/10 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[100px] opacity-60" />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-6 sm:p-10 backdrop-blur-2xl shadow-soft">
          <Link to="/" className="mx-auto mb-8 flex w-fit flex-col items-center gap-2.5 group">
            <LogoMark className="h-12 w-12 group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col items-center text-center">
              <span className="text-[12px] font-semibold tracking-[0.28em] text-foreground">
                MOONLIGHT
              </span>
              <span className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Multi-Currency Financial Wallet
              </span>
            </div>
          </Link>

          <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-center text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-8 text-center text-xs text-muted-foreground pt-4 border-t border-border/40">
              {footer}
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
          <span>256-Bit SSL</span>
          <span>•</span>
          <span>EU Regulated Standard</span>
          <span>•</span>
          <span>Encrypted Ledger</span>
        </div>
      </div>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
