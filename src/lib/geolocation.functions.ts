import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { IpApiIsProvider, resolveAccountGeography, type NormalizedGeography } from "./geolocation";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface ProfileGeographyRow {
  country_code?: string | null;
  city?: string | null;
  timezone?: string | null;
  region?: string | null;
  geography_updated_at?: string | null;
}

export const syncAccountGeography = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NormalizedGeography> => {
    const { supabase, userId } = context;

    // 1. Fetch current profile geography safely
    let profile: ProfileGeographyRow | null = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("country_code, city, timezone, region, geography_updated_at")
        .eq("id", userId)
        .maybeSingle();
      profile = data as ProfileGeographyRow | null;
    } catch {
      // Columns might not yet exist in un-migrated environments
    }

    const lastUpdated = profile?.geography_updated_at
      ? new Date(profile.geography_updated_at).getTime()
      : 0;

    // If already resolved and fresh (within 30 days), return cached geography
    if (profile?.country_code && Date.now() - lastUpdated < THIRTY_DAYS_MS) {
      return resolveAccountGeography(
        profile.country_code,
        profile.city,
        profile.timezone,
        profile.region,
      );
    }

    // 2. Extract client IP from headers
    const req = getRequest();
    let clientIp = "";
    let headerCountry = "";

    if (req?.headers) {
      headerCountry = req.headers.get("cf-ipcountry") || "";
      const forwarded = req.headers.get("x-forwarded-for");
      if (forwarded) {
        clientIp = forwarded.split(",")[0]?.trim() || "";
      } else {
        clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
      }
    }

    // 3. Resolve via geolocation provider
    const provider = new IpApiIsProvider();
    const result = clientIp ? await provider.lookupIp(clientIp) : null;

    const detectedCountry =
      result?.countryCode ||
      (headerCountry && headerCountry !== "XX" ? headerCountry.toUpperCase() : null) ||
      profile?.country_code ||
      "IN"; // Safe default if on local machine without external IP

    const detectedCity = result?.city || profile?.city || null;
    const detectedTz = result?.timezone || profile?.timezone || null;
    const detectedRegion = result?.region || profile?.region || null;

    // 4. Persist normalized geography back to profile
    try {
      await supabase
        .from("profiles")
        .update({
          country_code: detectedCountry,
          city: detectedCity,
          timezone: detectedTz,
          geography_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (e) {
      console.warn("Failed to persist geography to profile", e);
    }

    return resolveAccountGeography(detectedCountry, detectedCity, detectedTz, detectedRegion);
  });
