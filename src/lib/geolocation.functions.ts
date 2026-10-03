import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveAccountGeography, type NormalizedGeography } from "./geolocation";

interface ProfileGeographyRow {
  country_code?: string | null;
  city?: string | null;
  timezone?: string | null;
  region?: string | null;
  geography_updated_at?: string | null;
  admin_region_override?: boolean | null;
}

/**
 * Resolves account geography. Every single account defaults to Indian Account (INR, UPI, Indian Banks)
 * unless an administrator explicitly changed the account's region via the admin panel.
 * Eliminates flaky external IP geolocation and header lookups.
 */
export const syncAccountGeography = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NormalizedGeography> => {
    const { supabase, userId } = context;

    // 1. Fetch current profile safely
    let profile: ProfileGeographyRow | null = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("country_code, city, timezone, region, geography_updated_at, admin_region_override")
        .eq("id", userId)
        .maybeSingle();
      profile = data as ProfileGeographyRow | null;
    } catch {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("country_code, city, timezone, region, geography_updated_at")
          .eq("id", userId)
          .maybeSingle();
        profile = data as ProfileGeographyRow | null;
      } catch {
        // ignore
      }
    }

    // 2. Check if an administrator explicitly set the region via the admin panel
    if (profile?.admin_region_override === true) {
      const regUpper = (profile.region || "").trim().toUpperCase();
      const overrideCountry =
        regUpper === "EUROPE"
          ? (profile.country_code && profile.country_code !== "IN" ? profile.country_code : "DE")
          : regUpper === "PHILIPPINES"
            ? "PH"
            : regUpper === "GLOBAL"
              ? (profile.country_code || "IN")
              : "IN";

      return resolveAccountGeography(
        overrideCountry,
        profile.city,
        profile.timezone,
        regUpper,
      );
    }

    // 3. Every single account defaults to Indian Account.
    // Ensure DB profile reflects country_code = 'IN' and region = 'INDIA'
    if (profile?.country_code !== "IN" || profile?.region !== "INDIA") {
      try {
        await supabase
          .from("profiles")
          .update({
            country_code: "IN",
            region: "INDIA",
            admin_region_override: false,
            geography_updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch {
        try {
          await supabase
            .from("profiles")
            .update({
              country_code: "IN",
              region: "INDIA",
              geography_updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        } catch {
          // ignore
        }
      }
    }

    return resolveAccountGeography("IN", profile?.city, profile?.timezone, "INDIA");
  });

