export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "RentFlow";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);
export const demoMode = process.env.DEMO_MODE !== "false" || !isSupabaseConfigured;
