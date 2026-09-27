import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Check session first
    let {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session exists, check if auth tokens exist in the URL
    if (!session && typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const hasAuthTokens =
        hash.includes("access_token=") ||
        hash.includes("code=") ||
        search.includes("code=");

      if (hasAuthTokens) {
        // Wait briefly for Supabase to hydrate auth tokens from URL
        session = await new Promise((resolve) => {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
              subscription.unsubscribe();
              resolve(newSession);
            }
          });

          setTimeout(async () => {
            subscription.unsubscribe();
            const {
              data: { session: retrySession },
            } = await supabase.auth.getSession();
            resolve(retrySession);
          }, 2000);
        });
      }
    }

    // Only redirect to /login if no valid session/user exists after hydration
    if (!session?.user) {
      throw redirect({ to: "/login" });
    }

    return { user: session.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
