import { createClient } from "@/lib/supabase/server";

/* ========================================================= */
/* TYPES                                                     */
/* ========================================================= */

/**
 * Who is making the current request.
 *
 * Resolved once per render so every gate answers the same question the same
 * way. The previous version of this check lived inline in
 * `app/weather-condition/page.tsx`, and a second copy is how two surfaces end
 * up disagreeing about who is allowed in.
 */
export type Viewer = {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
};

const ANONYMOUS: Viewer = { userId: null, email: null, isAdmin: false };

/* ========================================================= */
/* VIEWER                                                    */
/* ========================================================= */

/** Identify the signed-in user and whether they are an admin. */
export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return ANONYMOUS;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    isAdmin: profile?.role === "admin",
  };
}

/* ========================================================= */
/* DAILY ACCESS                                              */
/* ========================================================= */

/**
 * True when the viewer has a paid Daily Access purchase, or an unexpired
 * coupon redemption.
 *
 * Admins bypass this entirely — the caller ORs in `viewer.isAdmin` so that
 * removing an entitlement can never lock an operator out of their own tool.
 */
export async function hasDailyAccess(viewer: Viewer): Promise<boolean> {
  if (!viewer.userId) return false;

  const supabase = await createClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", viewer.userId)
    .eq("dataset_code", "DAILY")
    .eq("status", "paid")
    .maybeSingle();

  if (purchase) return true;

  const { data: couponAccess } = await supabase
    .from("coupon_redemptions")
    .select("id")
    .eq("user_id", viewer.userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return Boolean(couponAccess);
}
