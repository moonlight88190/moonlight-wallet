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
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-[13px] font-semibold tracking-[0.2em]">MOONLIGHT</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-secondary !text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <MoreHorizontal className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{profile?.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{profile?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg"
                  onClick={() => navigate({ to: "/withdraw" })}
                >
                  <Landmark className="mr-2 h-4 w-4" /> Withdraw
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg" onClick={() => navigate({ to: "/about" })}>
                  <Info className="mr-2 h-4 w-4" /> About
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg text-destructive focus:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/receive"
              aria-label="Profile"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 animate-in fade-in duration-300">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground"
              activeProps={{ className: "!text-foreground" }}
            >
              <n.icon className="h-5 w-5" strokeWidth={1.5} />
              {n.label}
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
    <div className="mb-10">
      {eyebrow && (
        <p className="text-[11px] font-medium tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
      )}
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-3 text-muted-foreground">{children}</div>}
    </div>
  );
}
