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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-background text-foreground overflow-x-hidden">
      {/* Premium ambient background lighting */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 h-[400px] w-[400px] rounded-full bg-gold/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] animate-fade-up">
        {/* Auth card with premium surface */}
        <div className="rounded-3xl border border-border/50 bg-card/80 p-7 sm:p-10 backdrop-blur-2xl shadow-card">
          {/* Logo & Brand */}
          <Link to="/" className="mx-auto mb-10 flex w-fit flex-col items-center gap-3 group">
            <LogoMark className="h-14 w-14 group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col items-center text-center">
              <span className="text-[13px] font-semibold tracking-[0.3em] text-foreground">
                MOONLIGHT
              </span>
              <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
                Financial Technology
              </span>
            </div>
          </Link>

          {/* Heading */}
          <h1 className="text-center text-[22px] sm:text-[26px] font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2.5 text-center text-[13px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              {subtitle}
            </p>
          )}

          {/* Content */}
          <div className="mt-8">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="mt-8 text-center text-[13px] text-muted-foreground pt-5 border-t border-border/40">
              {footer}
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium tracking-[0.12em] text-muted-foreground/60 uppercase">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-emerald-500/70" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a4 4 0 0 0-4 4v2H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a4 4 0 0 0-4-4zm2 6V4a2 2 0 1 0-4 0v2h4z"/></svg>
            256-Bit SSL
          </span>
          <span className="text-border">·</span>
          <span>EU Regulated</span>
          <span className="text-border">·</span>
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
