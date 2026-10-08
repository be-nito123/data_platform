import { NextResponse } from "next/server";
import { getWeatherData } from "@/lib/supabase/google/weather";
import { getSheetData } from "@/lib/supabase/google/sheets";
import { processCotRows, getCotSource } from "@/lib/supabase/data/cot";
import { INSTRUMENTS } from "@/lib/instruments";

export async function GET(request: Request) {
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
    let weatherError: string | null = null;
    if (inst.weatherAssetKey) {
      try {
        weather = await getWeatherData(inst.weatherAssetKey);
      } catch (err) {
        weatherError = err instanceof Error ? err.message : String(err);
        console.error(`Weather fetch failed for ${instrumentId}:`, weatherError);
      }
    }

    let cot: unknown[][] = [];
    let cotError = false;
    if (cotSource) {
      try {
        cot = await getSheetData(cotSource.tab, cotSource.range, process.env.COT_GOOGLE_SHEET_ID);
      } catch (err) {
        cotError = true;
        console.error(`COT fetch failed for ${instrumentId}:`, err instanceof Error ? err.message : err);
      }
    }

    if (weatherError) {
      return NextResponse.json(
        { error: `Market data temporarily unavailable: ${weatherError}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      weatherData: weather,
      cotData: cot.length ? processCotRows(cot, instrumentId) : [],
      cotError,
    });
  } catch (e) {
    console.error("Fetch failed", e);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
