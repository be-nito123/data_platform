import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* =========================================================
   POST /api/auth/register

   Creates an already-confirmed account, because the Supabase project
   currently has no SMTP delivery configured (otherwise
   `supabase.auth.signUp` returns an 'error sending confirmation email'
   response before the row ever exists).

   Runs server-side with the service-role key so that the schemas/RLS
   expectations in `lib/access.ts` and `app/profile/page.tsx` keep working.

   On success the client is expected to call `signInWithPassword` itself,
   since a confirmed account needs no email link.
   ========================================================= */

type RegisterBody = {
  email?: string;
  password?: string;
  full_name?: string;
  country?: string;
  phone_code?: string;
  phone_number?: string;
  company?: string;
  job_title?: string;
};

const REQUIRED: (keyof RegisterBody)[] = [
  "email",
  "password",
  "full_name",
  "country",
  "phone_number",
  "company",
  "job_title",
];

function isAdminEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 }
    );
  }

  for (const key of REQUIRED) {
    const value = body[key];
    if (typeof value !== "string" || value.trim() === "") {
      return NextResponse.json(
        { error: `Missing required field: ${key}.` },
        { status: 400 }
      );
    }
  }

  if (body.password!.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const email = body.email!.trim().toLowerCase();
  const password = body.password!;
  const profile = {
    full_name: body.full_name!.trim(),
    country: body.country!.trim(),
    phone_code: (body.phone_code ?? "").trim(),
    phone_number: body.phone_number!.trim(),
    company: body.company!.trim(),
    job_title: body.job_title!.trim(),
    role: isAdminEmail(email) ? "admin" : "user",
  };

  if (body.country !== "other" && profile.phone_code === "") {
    return NextResponse.json(
      { error: "Country requires a phone code." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[register] admin client unavailable:", error);
    return NextResponse.json(
      {
        error:
          "Registration is not configured. Please contact the site operator.",
      },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name,
        country: profile.country,
        phone_code: profile.phone_code,
        phone_number: profile.phone_number,
        company: profile.company,
        job_title: profile.job_title,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("already") && message.includes("register"))
        return NextResponse.json(
          { error: "An account already exists for this email." },
          { status: 409 }
        );
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Account could not be created. Please try again." },
        { status: 500 }
      );
    }

    // Auto-confirm already ran; per-call guard so a missing profiles table
    // does not block registration — the database side is owned by the project
    // schema (see README / docs/setup.md).
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: profile.full_name,
          country: profile.country,
          phone_code: profile.phone_code,
          phone_number: profile.phone_number,
          company: profile.company,
          job_title: profile.job_title,
          role: profile.role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[register] profile upsert failed:", profileError.message);
      // Do not fail registration: the user exists and is confirmed; profile can
      // be back-filled through the profile screen by the user.
    }

    return NextResponse.json({ ok: true });
  } catch (exception: unknown) {
    console.error("[register] unexpected error:", exception);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
