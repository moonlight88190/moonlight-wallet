/**
 * Geolocation & Account Region Capability Resolver.
 *
 * Provides a server-side abstraction for IP geolocation, country resolution,
 * and capability detection (e.g. Indian Account -> UPI, Indian Banks).
 */

export interface NormalizedGeography {
  countryCode: string;
  countryName: string;
  region: string;
  city?: string | null;
  timezone?: string | null;
  isIndia: boolean;
  isEurope: boolean;
  isUK: boolean;
  isUS: boolean;
  accountRegionLabel: string;
  capabilities: {
    supportsUPI: boolean;
    supportsIndianBanks: boolean;
    supportsSEPA: boolean;
    supportsFasterPayments: boolean;
    supportsGCash: boolean;
    supportsPix: boolean;
  };
  detectedAt?: string;
  provider?: string;
}

const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "CH",
]);

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  CZ: "Czech Republic",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  PH: "Philippines",
  BR: "Brazil",
  AE: "United Arab Emirates",
  CA: "Canada",
  AU: "Australia",
  SG: "Singapore",
  JP: "Japan",
};

/**
 * Resolves account capabilities and UI region labels given a country code.
 * Pure function: can be safely executed on client or server.
 */
export function resolveAccountGeography(
  countryCode?: string | null,
  city?: string | null,
  timezone?: string | null,
  rawRegion?: string | null,
): NormalizedGeography {
  const normRegion = (rawRegion || "").trim().toUpperCase();
  let code = (countryCode || "").trim().toUpperCase();

  // Handle explicit admin overrides in region (set exclusively via admin panel)
  if (normRegion === "INDIA") {
    code = "IN";
  } else if (normRegion === "PHILIPPINES") {
    code = "PH";
  } else if (normRegion === "EUROPE") {
    if (!code || !EU_COUNTRY_CODES.has(code)) {
      code = "DE";
    }
  } else {
    // Every single account defaults to Indian unless explicitly overridden by admin
    code = "IN";
  }

  const isIndia = code === "IN" || normRegion === "INDIA" || (!normRegion && code !== "PH" && !EU_COUNTRY_CODES.has(code));
  const isEurope = !isIndia && (normRegion === "EUROPE" || EU_COUNTRY_CODES.has(code));
  const isPH = !isIndia && (normRegion === "PHILIPPINES" || code === "PH");
  const isUK = !isIndia && (code === "GB" || code === "UK");
  const isUS = !isIndia && code === "US";
  const isBR = !isIndia && code === "BR";

  let accountRegionLabel = "Indian Account";
  let regionName = "India";

  if (isIndia) {
    accountRegionLabel = "Indian Account";
    regionName = "India";
  } else if (isEurope) {
    accountRegionLabel = "European Account";
    regionName = "Europe";
  } else if (isUK) {
    accountRegionLabel = "United Kingdom Account";
    regionName = "United Kingdom";
  } else if (isUS) {
    accountRegionLabel = "United States Account";
    regionName = "Americas";
  } else if (isPH) {
    accountRegionLabel = "Philippine Account";
    regionName = "Southeast Asia";
  } else if (isBR) {
    accountRegionLabel = "Brazilian Account";
    regionName = "South America";
  }

  const countryName = COUNTRY_NAMES[code] || (code ? code : "India");

  return {
    countryCode: code || "IN",
    countryName,
    region: regionName,
    city: city || null,
    timezone: timezone || null,
    isIndia,
    isEurope,
    isUK,
    isUS,
    accountRegionLabel,
    capabilities: {
      supportsUPI: isIndia,
      supportsIndianBanks: isIndia,
      supportsSEPA: isEurope,
      supportsFasterPayments: isUK,
      supportsGCash: isPH,
      supportsPix: isBR,
    },
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Server-side Geolocation Provider Interface.
 */
export interface GeolocationProviderResult {
  countryCode: string;
  countryName?: string | undefined;
  city?: string | undefined;
  region?: string | undefined;
  timezone?: string | undefined;
  provider: string;
}

export interface GeolocationProvider {
  name: string;
  lookupIp(ip: string): Promise<GeolocationProviderResult | null>;
}

/**
 * ipapi.is provider adapter with graceful handling and timeout.
 */
export class IpApiIsProvider implements GeolocationProvider {
  name = "ipapi.is";

  async lookupIp(ip: string): Promise<GeolocationProviderResult | null> {
    // Avoid lookup for local/private addresses
    if (
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.")
    ) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://api.ipapi.is?q=${encodeURIComponent(ip)}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeout);

      if (!res.ok) return null;
      const data = (await res.json()) as {
        location?: {
          country_code?: string;
          country?: string;
          city?: string;
          state?: string;
          timezone?: string;
        };
      };

      if (!data.location?.country_code) return null;

      return {
        countryCode: data.location.country_code.toUpperCase(),
        countryName: data.location.country,
        city: data.location.city,
        region: data.location.state,
        timezone: data.location.timezone,
        provider: this.name,
      };
    } catch {
      return null;
    }
  }
}
