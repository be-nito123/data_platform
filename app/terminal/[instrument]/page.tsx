import { TerminalClient } from "./TerminalClient";
import { getWeatherData, type WeatherRow } from "@/lib/supabase/google/weather";
import { getSheetData } from "@/lib/supabase/google/sheets";
import { processCotRows, getCotSource, type CotRow } from "@/lib/supabase/data/cot";
import { getInstrument } from "@/lib/instruments";
import { notFound } from "next/navigation";

export default async function TerminalPage({ params }: { params: Promise<{ instrument: string }> }) {
  const { instrument } = await params;
  const inst = getInstrument(instrument);
  if (!inst) notFound();

  let weatherData: WeatherRow[] = [];
  let cotData: CotRow[] = [];

  const cotSource = getCotSource(instrument);

  try {
    const [weather, cot] = await Promise.all([
      inst.weatherAssetKey ? getWeatherData(inst.weatherAssetKey).catch(() => []) : Promise.resolve([]),
      cotSource
        ? getSheetData(cotSource.tab, cotSource.range, process.env.COT_GOOGLE_SHEET_ID).catch(() => [])
        : Promise.resolve([]),
    ]);
    weatherData = weather;
    cotData = cot.length ? processCotRows(cot, instrument) : [];
  } catch (e) {
    console.error("Fetch failed", e);
  }

  return (
    <TerminalClient
      initialInstrument={instrument}
      initialWeatherData={weatherData}
      initialCotData={cotData}
    />
  );
}
