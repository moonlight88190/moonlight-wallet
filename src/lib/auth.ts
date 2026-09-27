import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export async function signInWithGoogle(onSignedIn: () => void) {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) {
    toast.error("Google sign-in didn't complete. Please try again.");
    return;
  }
  if (result.redirected) return;
  onSignedIn();
}
