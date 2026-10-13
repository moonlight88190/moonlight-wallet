import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  List,
  LogOut,
  MoreHorizontal,
  Info,
  Landmark,
  ShieldCheck,
  Globe,
  TrendingUp,
  Gift,
  Snowflake,
  Lock,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useWallet, useAccountGeography, getAccountRegionLabel } from "@/hooks/use-wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DESKTOP_NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/markets", label: "Markets", icon: TrendingUp },
  { to: "/send", label: "Send", icon: ArrowUpRight, lockable: true },
  { to: "/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/withdraw", label: "Withdraw", icon: Landmark, lockable: true },
  { to: "/transactions", label: "Activity", icon: List },
] as const;

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/send", label: "Send", icon: ArrowUpRight, lockable: true },
  { to: "/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/withdraw", label: "Withdraw", icon: Landmark, lockable: true },
  { to: "/transactions", label: "Activity", icon: List },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: wallet } = useWallet();
  const geography = useAccountGeography();

  const isFrozen = wallet?.status === "frozen";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* ─── Top Navigation Bar ─── */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid h-14 max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6">
          {/* Brand */}
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5 group">
            <LogoMark className="h-8 w-8 group-hover:scale-[1.03] transition-transform duration-200" />
            <div className="flex flex-col">
              <span className="truncate text-[12px] font-semibold tracking-[0.24em] text-foreground">
                MOONLIGHT
              </span>
              <span className="text-[8px] font-medium tracking-[0.16em] text-muted-foreground uppercase -mt-0.5">
                Financial Technology
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {DESKTOP_NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-accent/60 inline-flex items-center gap-1.5"
                activeProps={{ className: "bg-secondary text-foreground font-semibold" }}
              >
                <span>{n.label}</span>
                {isFrozen && "lockable" in n && n.lockable && (
                  <Lock className="h-3 w-3 text-destructive opacity-80" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More options"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-hidden"
              >
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-elevated">
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <div className="text-[13px] font-semibold text-foreground">
                    {profile?.full_name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground mt-0.5">
                    {profile?.email}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1 text-[10px]">
                    <div
                      className={`flex items-center gap-1 font-semibold ${geography.data?.isIndia || geography.data?.isEurope ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}
                    >
                      {geography.data?.isIndia || geography.data?.isEurope ? (
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Globe className="h-3 w-3 text-blue-500" />
                      )}
                      <span>{getAccountRegionLabel(geography.data)}</span>
                    </div>

                    {isFrozen ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                        <Snowflake className="h-2.5 w-2.5" /> Frozen
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 font-semibold text-[9px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-[12px] font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/markets" })}
                >
                  <TrendingUp className="mr-2.5 h-4 w-4 text-muted-foreground" /> Global Markets
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-[12px] font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/withdraw" })}
                >
                  <Landmark className="mr-2.5 h-4 w-4 text-muted-foreground" /> Withdraw &amp;
                  Payouts
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-[12px] font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/redeem" })}
                >
                  <Gift className="mr-2.5 h-4 w-4 text-gold" /> Redeem Voucher
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-[12px] font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/about" })}
                >
                  <Info className="mr-2.5 h-4 w-4 text-muted-foreground" /> About Moonlight
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-[12px] font-medium cursor-pointer text-destructive focus:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="mr-2.5 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <Link
              to="/receive"
              aria-label="Profile Details"
              className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Global Freeze Security Banner ─── */}
      {isFrozen && (
        <div className="bg-destructive/10 dark:bg-destructive/15 border-b border-destructive/30 px-4 py-2.5 text-xs text-destructive dark:text-rose-300">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive font-bold text-[11px]">
                <Snowflake className="h-3 w-3 animate-pulse" />
              </span>
              <span className="font-semibold text-foreground">
                Account Freeze Active: Outgoing transfers, withdrawals, and redemptions are locked. Your assets remain secure.
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-destructive/20 border border-destructive/30 font-bold uppercase tracking-wider text-destructive">
              Read-Only
            </span>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="mx-auto w-full min-w-0 max-w-5xl px-4 sm:px-6 py-4 sm:py-6 flex-1 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-8 animate-in fade-in duration-200">
        {children}
      </main>

      {/* ─── Mobile Bottom Navigation (Native App Feel) ─── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-2xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] md:hidden shadow-elevated"
      >
        <div className="grid grid-cols-5 py-1 px-1 max-w-md mx-auto">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              className="group flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-2xl text-[10px] font-medium text-muted-foreground transition-all active:scale-90 min-h-[48px] touch-manipulation relative"
              activeProps={{
                className: "text-foreground font-bold [&>div]:bg-primary/10 [&>div]:text-primary",
              }}
            >
              <div className="flex h-7 w-12 items-center justify-center rounded-full transition-colors group-hover:bg-muted/60 relative">
                <n.icon className="h-[19px] w-[19px]" strokeWidth={2} />
                {isFrozen && "lockable" in n && n.lockable && (
                  <span className="absolute top-0.5 right-2 h-2 w-2 rounded-full bg-destructive" />
                )}
              </div>
              <span className="truncate max-w-[58px] tracking-tight">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
                {eyebrow}
              </span>
            </div>
          )}
          <h1 className="text-[24px] sm:text-[30px] font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
      {children && (
        <div className="mt-1.5 text-[13px] text-muted-foreground max-w-xl leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
