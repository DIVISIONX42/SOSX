// src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON;

console.log("VITE_SUPABASE_URL:", url ? "SET" : "MISSING");
console.log("VITE_SUPABASE_ANON:", anon ? "SET" : "MISSING");

let supabase: SupabaseClient;

// If both vars exist → real client
if (url && anon) {
  supabase = createClient(url, anon);
} else {
  console.error("🚨 Supabase ENV missing — running in SAFE MODE stub.");

  // FULL STUB compatible with:
  // .from().select().order().limit()
  // .from().insert()
  // .channel().on().subscribe()
  const stubSelectChain = {
    order: () => ({
      limit: () => ({
        select: async () => ({ data: [], error: null }),
      }),
    }),
  };

  const stubFrom = () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    order: stubSelectChain.order,
    limit: stubSelectChain.limit,
  });

  const stubChannel = () => ({
    on: () => ({
      on: () => ({}),
      subscribe: () => ({ id: "stub" }),
    }),
    subscribe: () => ({ id: "stub" }),
  });

  // @ts-ignore
  supabase = {
    from: () => stubFrom(),
    channel: () => stubChannel(),
    removeChannel: () => {},
  };
}

export { supabase };
