import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

/** Never log a full redemption code — it is a bearer credential. */
function maskCode(code: string): string {
  if (code.length <= 4) return "*".repeat(code.length);
  return `${code.slice(0, 2)}${"*".repeat(code.length - 4)}${code.slice(-2)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code = String(body?.code || "").trim();

    if (!code) {
      return NextResponse.json(
        { error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("AUTH ERROR:", userError);

      return NextResponse.json(
        { error: "Unable to verify your account." },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please log in before using a coupon." },
        { status: 401 }
      );
    }

    // Cap redemption attempts per account so codes cannot be brute-forced.
    const limit = rateLimit({
      key: `coupon-redeem:${user.id}`,
      limit: 10,
      windowMs: 5 * 60_000,
    });

    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many redemption attempts. Please try again in a few minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    console.log("Coupon redemption attempt:", {
      userId: user.id,
      code: maskCode(code.toUpperCase()),
    });

    const { data, error } = await supabase.rpc("redeem_coupon", {
      p_code: code.toUpperCase(),
    });

    if (error) {
      console.error("SUPABASE COUPON ERROR:", error);

      // Do not forward raw Postgres errors — they can disclose schema details.
      return NextResponse.json(
        { error: "Coupon could not be redeemed. Please try again." },
        { status: 400 }
      );
    }

    if (!data || data.success !== true) {
      console.error("INVALID COUPON RESPONSE:", data);

      return NextResponse.json(
        {
          error: data?.error || "Invalid or expired coupon.",
        },
        { status: 400 }
      );
    }

    console.log("Coupon redeemed successfully:", data);

    return NextResponse.json({
      success: true,
      code: data.code,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error("COUPON API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while redeeming the coupon." },
      { status: 500 }
    );
  }
}