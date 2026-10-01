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

    if (!session && typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const hasTokens =
        hash.includes("access_token=") || hash.includes("code=") || search.includes("code=");

      // Wait up to 1.5s for auth state change if tokens are present or recent login occurred
      session = await new Promise((resolve) => {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            subscription.unsubscribe();
            resolve(newSession);
          }
        });

        setTimeout(
          async () => {
            subscription.unsubscribe();
            const {
              data: { session: retrySession },
            } = await supabase.auth.getSession();
            resolve(retrySession);
          },
          hasTokens ? 2000 : 400,
        );
      });
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
