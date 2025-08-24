import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: "supabase-auth-token",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database helper functions
export const handleSupabaseError = (error) => {
  console.error("Supabase error:", error);

  if (error.code === "PGRST301") {
    return "You do not have permission to perform this action.";
  }

  if (error.code === "23505") {
    return "This record already exists.";
  }

  if (error.message.includes("JWT")) {
    return "Your session has expired. Please log in again.";
  }

  return error.message || "An unexpected error occurred.";
};
