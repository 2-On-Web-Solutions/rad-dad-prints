// src/lib/supabase/serverService.ts

// IMPORTANT: server only. Do NOT import this file in any Client Component.
// It's allowed to use the service_role key because it only runs in API routes / server actions.

import { createClient } from '@supabase/supabase-js';

export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,          // same URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!,         // service role key (never expose to client!)
  {
    auth: {
      persistSession: false,
    },
  }
);