// This file is safe to be used in the browser
import { createBrowserClient } from '@supabase/ssr';

// Define the shape of your database tables
// This can be generated from your database schema
interface Database {
  // Define your tables here
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is not set. Sync functionality will be disabled.");
}

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;
