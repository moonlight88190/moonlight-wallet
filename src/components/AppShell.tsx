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
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-wallet";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <span className="text-xs sm:text-[13px] font-bold tracking-[0.25em] text-foreground">
              MOONLIGHT
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-secondary !text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More Options"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-hidden"
              >
                <MoreHorizontal className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="text-xs font-semibold text-foreground">{profile?.full_name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{profile?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl text-xs font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/withdraw" })}
                >
                  <Landmark className="mr-2 h-4 w-4" /> Withdraw &amp; Redeem
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl text-xs font-medium cursor-pointer"
                  onClick={() => navigate({ to: "/about" })}
                >
                  <Info className="mr-2 h-4 w-4" /> About Moonlight
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl text-xs font-medium text-destructive focus:text-destructive cursor-pointer"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/receive"
              aria-label="Profile"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground border border-border/40"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area with Header & Safe-Area Padding */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-24 pb-32 md:pb-16 animate-in fade-in duration-300">
        {children}
      </main>

      {/* Sticky Mobile Bottom Navigation with iPhone Safe Area Support */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 md:hidden">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "!text-primary font-semibold" }}
            >
              <n.icon className="h-5 w-5" strokeWidth={1.75} />
              <span>{n.label}</span>
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
        <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1.5 text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {children && (
        <div className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
