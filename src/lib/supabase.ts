// src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON;

if (!url) console.error("❌ Missing VITE_SUPABASE_URL");
if (!anon) console.error("❌ Missing VITE_SUPABASE_ANON");

let supabase: SupabaseClient | null = null;

if (url && anon) {
  supabase = createClient(url, anon);
  // exported as non-null below
} else {
  // Fallback stub: minimal safe API used by Chat.tsx
  // - .from().select/insert return objects like { data: [], error: null }
  // - .channel(...).on(...).subscribe() returns a dummy subscription object
  // - removeChannel is a noop
  const stubFrom = (table: string) => {
    return {
      select: async () => ({ data: [], error: null }),
      insert: async (_payload: any) => ({ data: [], error: null }),
      order: () => ({
        limit: () => ({ select: async () => ({ data: [], error: null }) })
      })
    };
  };

  const stubChannel = (_name: string) => {
    const handlers: any[] = [];
    return {
      on: (_event: string, _filter: any, cb: (p: any) => void) => {
        handlers.push(cb);
        return { on: () => {} }; // chainable
      },
      subscribe: () => ({ id: "stub" }),
      _emit: (payload: any) => handlers.forEach((h) => h(payload))
    };
  };

  console.log("VITE_SUPABASE_URL:", url ? "SET" : "MISSING");
  console.log("VITE_SUPABASE_ANON:", anon ? "SET" : "MISSING");

  // small object to mimic the supabase client
  // only the pieces used in Chat.tsx are necessary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase = {
    from: (table: string) => stubFrom(table),
    channel: (name: string) => stubChannel(name),
    removeChannel: (_sub: any) => {}
  } as unknown as SupabaseClient;
}

export { supabase };
