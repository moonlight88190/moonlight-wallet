import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export async function signInWithGoogle(onSignedIn: () => void) {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // Direct Supabase Google OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });

    if (error) {
      // Fallback to brokered auth if direct Supabase OAuth redirect throws
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: origin,
      });
      if (result.error) {
        toast.error("Google sign-in could not be completed. Please use email sign-in.");
        return;
      }
      if (result.redirected) return;
      onSignedIn();
    }
  } catch (e) {
    console.error("OAuth sign-in error", e);
    toast.error("Google sign-in could not be completed.");
  }
}
