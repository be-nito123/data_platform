import { NextResponse } from "next/server";
import { getWeatherData } from "@/lib/supabase/google/weather";
import { getSheetData } from "@/lib/supabase/google/sheets";
import { processCotRows, getCotSource } from "@/lib/supabase/data/cot";
import { INSTRUMENTS } from "@/lib/instruments";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/** How long responses may be reused by a browser or CDN, in seconds. */
const CLIENT_CACHE_SECONDS = 300;

export async function GET(request: Request) {
  const limit = rateLimit({
    key: `terminal-data:${getClientIp(request)}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const instrumentId = searchParams.get("instrument");
  if (!instrumentId || !INSTRUMENTS[instrumentId]) {
    return NextResponse.json({ error: "Invalid instrument" }, { status: 400 });
  }

  const inst = INSTRUMENTS[instrumentId];
  const cotSource = getCotSource(instrumentId);

  try {
    // Never turn a transient sheet failure into a silent empty result: the client
    // would cache it and the UI would look like "data not available".
    let weather: Awaited<ReturnType<typeof getWeatherData>> = [];
    let weatherFailed = false;
    if (inst.weatherAssetKey) {
      try {
        weather = await getWeatherData(inst.weatherAssetKey);
      } catch (err) {
        weatherFailed = true;
        console.error(
          `Weather fetch failed for ${instrumentId}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    let cot: unknown[][] = [];
    let cotError = false;
    if (cotSource) {
      try {
        cot = await getSheetData(cotSource.tab, cotSource.range, process.env.COT_GOOGLE_SHEET_ID);
      } catch (err) {
        cotError = true;
        console.error(
          `COT fetch failed for ${instrumentId}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    // Upstream detail stays in the server logs; the client only gets a stable message.
    if (weatherFailed) {
      return NextResponse.json(
        { error: "Market data is temporarily unavailable. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        weatherData: weather,
        cotData: cot.length ? processCotRows(cot, instrumentId) : [],
        cotError,
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CLIENT_CACHE_SECONDS}, stale-while-revalidate=${CLIENT_CACHE_SECONDS * 2}`,
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      }
    );
  } catch (error) {
    console.error(`Terminal data request failed for ${instrumentId}:`, error);

    return NextResponse.json(
      { error: "Market data is temporarily unavailable. Please try again shortly." },
      { status: 502 }
    );
  }
}
