import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  preset: process.env.VERCEL || process.env.VERCEL_ENV ? "vercel" : "cloudflare-module",
  compatibilityDate: "2024-11-01",
});
