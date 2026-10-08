import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    console.log("Coupon redemption:", {
      userId: user.id,
      code: code.toUpperCase(),
    });

    const { data, error } = await supabase.rpc("redeem_coupon", {
      p_code: code.toUpperCase(),
    });

    if (error) {
      console.error("SUPABASE COUPON ERROR:", error);

      return NextResponse.json(
        {
          error: error.message || "Coupon could not be redeemed.",
        },
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
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while redeeming the coupon.",
      },
      { status: 500 }
    );
  }
}