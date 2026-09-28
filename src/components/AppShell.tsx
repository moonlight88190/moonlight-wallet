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
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, getAccountStatusLabel, isEuropeanVerified } from "@/hooks/use-wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/10">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <LogoMark className="h-8 w-8 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold tracking-[0.22em] text-foreground">
                MOONLIGHT
              </span>
              <span className="text-[9px] font-semibold tracking-[0.15em] text-muted-foreground uppercase -mt-0.5">
                European Fintech
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-accent/50"
                activeProps={{ className: "bg-secondary text-foreground font-semibold shadow-2xs" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More options"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-hidden"
              >
                <MoreHorizontal className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-soft">
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <div className="text-sm font-semibold text-foreground">{profile?.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{profile?.email}</div>
                  <div
                    className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${isEuropeanVerified(profile?.email) ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}
                  >
                    {isEuropeanVerified(profile?.email) ? (
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Globe className="h-3 w-3 text-blue-500" />
                    )}
                    <span>{getAccountStatusLabel(profile?.email)}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/withdraw" })}
                >
                  <Landmark className="mr-2 h-4 w-4" /> Withdraw &amp; Payouts
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/about" })}
                >
                  <Info className="mr-2 h-4 w-4" /> About Moonlight
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl px-3 py-2 text-xs font-medium cursor-pointer text-destructive focus:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/receive"
              aria-label="Profile Details"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border/50 text-xs font-bold text-foreground transition-transform hover:scale-105"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-10 flex-1 pb-28 md:pb-12 animate-in fade-in duration-300">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg">
        <div className="grid grid-cols-5 py-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground min-h-[48px]"
              activeProps={{ className: "text-foreground font-semibold" }}
            >
              <n.icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="truncate max-w-[64px]">{n.label}</span>
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
    <div className="mb-8 sm:mb-10">
      {eyebrow && (
        <p className="text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1.5 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {children && <div className="mt-2 text-sm text-muted-foreground max-w-xl">{children}</div>}
    </div>
  );
}
