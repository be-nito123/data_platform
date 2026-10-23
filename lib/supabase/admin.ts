import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SERVER-ONLY SUPABASE ADMIN CLIENT
   =========================================================
   Built on `@supabase/supabase-js` with the project's *secret* key, which
   bypasses RLS and can create users with `email_confirm: true`. This is what
   makes registration usable right now, because the project has no SMTP
   delivery configured — `supabase.auth.signUp` would fail with
   "error sending confirmation email" before the account is ever created.

   Hard rule: `SUPABASE_SECRET_KEY` must never cross the network to the
   browser. This file is imported *only* from a Next.js Route Handler. If the
   env var is missing we throw rather than fall back to the publishable key —
   a registration request must not be served without an admin credential.
   ========================================================= */

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    // fallback for the older shape that some templates use:
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  if (!secretKey)
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured — cannot create accounts without " +
        "SMTP-driven email confirmation. See .env.example."
    );

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
