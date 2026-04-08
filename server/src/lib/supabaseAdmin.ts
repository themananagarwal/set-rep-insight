import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from the root .env file if running locally
dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL is missing.");
  console.warn("Backend requires a service role key to securely bypass RLS rules.");
}

// Instantiate the secure service role client for backend operations
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceKey || "placeholder_key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
