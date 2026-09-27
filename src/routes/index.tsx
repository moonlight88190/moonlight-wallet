import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { GoogleIcon } from "@/components/AuthLayout";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moonlight Wallet — Move money without the complexity" },
      { name: "description", content: "A calm, international wallet for India, the Philippines and beyond. Send, receive and track money in one place." },
      { property: "og:title", content: "Moonlight Wallet" },
      { property: "og:description", content: "Move money without the complexity." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSignedIn(!!s);
      if (s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <LogoMark className="mx-auto h-24 w-24 shadow-soft" />
          <p className="mt-8 text-[11px] font-medium tracking-[0.35em] text-muted-foreground">MOONLIGHT WALLET</p>
          <h1 className="mx-auto mt-6 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Move money without the complexity.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
            One quiet wallet for India, the Philippines and everywhere in between.
          </p>
          <div className="mx-auto mt-12 flex w-full max-w-xs flex-col gap-3">
            {signedIn ? (
              <Link to="/dashboard" className="rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Open your wallet
              </Link>
            ) : (
              <>
                <button
                  onClick={() => signInWithGoogle(() => navigate({ to: "/dashboard" }))}
                  className="flex items-center justify-center gap-2.5 rounded-full border bg-card px-6 py-3.5 text-[15px] font-medium transition-colors hover:bg-accent"
                >
                  <GoogleIcon /> Continue with Google
                </button>
                <Link to="/login" className="flex items-center justify-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  <Mail className="h-4 w-4" /> Continue with Email
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
      <footer className="flex justify-center gap-6 pb-10 text-xs text-muted-foreground">
        <Link to="/about" className="hover:text-foreground">About</Link>
        <span>A closed-loop simulation. No real funds move.</span>
      </footer>
    </div>
  );
}
