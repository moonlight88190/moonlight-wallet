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
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useAccountGeography, getAccountRegionLabel } from "@/hooks/use-wallet";
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
  { to: "/send", label: "Send", icon: ArrowUpRight },
  { to: "/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/withdraw", label: "Withdraw", icon: Landmark },
  { to: "/transactions", label: "Activity", icon: List },
] as const;

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/send", label: "Send", icon: ArrowUpRight },
  { to: "/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/withdraw", label: "Withdraw", icon: Landmark },
  { to: "/transactions", label: "Activity", icon: List },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const geography = useAccountGeography();

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
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-accent/60"
                activeProps={{ className: "bg-secondary text-foreground font-semibold" }}
              >
                {n.label}
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
                  <div className="text-[13px] font-semibold text-foreground">{profile?.full_name}</div>
                  <div className="truncate text-[11px] text-muted-foreground mt-0.5">{profile?.email}</div>
                  <div
                    className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${geography.data?.isIndia || geography.data?.isEurope ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}
                  >
                    {geography.data?.isIndia || geography.data?.isEurope ? (
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Globe className="h-3 w-3 text-blue-500" />
                    )}
                    <span>{getAccountRegionLabel(geography.data)}</span>
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
                  <Landmark className="mr-2.5 h-4 w-4 text-muted-foreground" /> Withdraw &amp; Payouts
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2.5 text-[12px] font-medium cursor-pointer text-destructive focus:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="mr-2.5 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

      {/* ─── Main Content ─── */}
      <main className="mx-auto w-full min-w-0 max-w-5xl px-4 sm:px-6 py-5 sm:py-8 flex-1 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-10 animate-in fade-in duration-200">
        {children}
      </main>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/40 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5 py-0.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground min-h-[48px] touch-manipulation"
              activeProps={{ className: "text-foreground font-semibold" }}
            >
              <n.icon className="h-[20px] w-[20px]" strokeWidth={1.6} />
              <span className="truncate max-w-[56px]">{n.label}</span>
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
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {eyebrow && (
        <p className="text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1 text-[26px] sm:text-[32px] font-semibold tracking-tight text-foreground leading-tight">
        {title}
      </h1>
      {children && <div className="mt-2 text-[13px] text-muted-foreground max-w-xl leading-relaxed">{children}</div>}
    </div>
  );
}
