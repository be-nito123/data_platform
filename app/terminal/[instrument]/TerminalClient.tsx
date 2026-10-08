"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TerminalShell } from "@/components/terminal/TerminalShell";
import { MetricTabs } from "@/components/terminal/MetricTabs";
import { MarketStats } from "@/components/terminal/MarketStats";
import { DateRangeSlider } from "@/components/terminal/DateRangeSlider";
import { PriceChart } from "@/components/market/PriceChart";
import { VolumeChart } from "@/components/market/VolumeChart";
import { OpenInterestChart } from "@/components/market/OpenInterestChart";
import { OverviewChart, type OverviewMode } from "@/components/market/OverviewChart";
import { BpsChart } from "@/components/market/BpsChart";
import { COTTable } from "@/components/market/COTTable";
import { RawDataTable, type RawTableRow, type RawCell } from "@/components/market/RawDataTable";
import { INSTRUMENTS } from "@/lib/instruments";
import { getCotSource } from "@/lib/supabase/data/cot";
import { WeatherRow } from "@/lib/supabase/google/weather";
import { CotRow } from "@/lib/supabase/data/cot";
import { formatBondPrice, formatBps } from "@/lib/market/format";

interface TerminalClientProps {
  initialInstrument: string;
  initialWeatherData: WeatherRow[];
  initialCotData: CotRow[];
}

interface CachedData {
  weather: WeatherRow[];
  cot: CotRow[];
  ts: number | null; // null = server-rendered seed, stamped on mount
}

const CACHE_TTL_MS = 5 * 60 * 1000;

function parseNum(text: string): number | null {
  const cleaned = text.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function dirClass(open: number | null, close: number | null): RawCell["cls"] {
  if (open === null || close === null) return undefined;
  if (close > open) return "positive";
  if (close < open) return "negative";
  return undefined;
}

function signedPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function TerminalClient({ initialInstrument, initialWeatherData, initialCotData }: TerminalClientProps) {
  const [activeInstrument, setActiveInstrument] = useState(initialInstrument);
  const [activeMetric, setActiveMetric] = useState("overview");

  const [weatherData, setWeatherData] = useState<WeatherRow[]>(initialWeatherData);
  const [cotData, setCotData] = useState<CotRow[]>(initialCotData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Date-range selection, keyed to the active dataset so it resets on switch/reload.
  const [rangeState, setRangeState] = useState<{ key: string; value: [number, number] }>(() => {
    const len = initialWeatherData.reduce((n, r) => (r.price !== null ? n + 1 : n), 0);
    return { key: `${initialInstrument}:${len}`, value: [0, Math.max(0, len - 1)] };
  });

  // Per-instrument cache so switching back never shows another instrument's data.
  const dataCache = useRef<Record<string, CachedData>>(
    initialWeatherData.length > 0
      ? { [initialInstrument]: { weather: initialWeatherData, cot: initialCotData, ts: null } }
      : {}
  );
  // Monotonic sequence: any in-flight response from a previous switch is discarded.
  const fetchSeq = useRef(0);
  // Tracks the last instrument the effect acted on, so we fetch on EVERY change
  // (including returning to the original server-rendered instrument).
  const prevInstrument = useRef(initialInstrument);

  // Stamp the server-rendered seed so it follows the same TTL as fetched data.
  useEffect(() => {
    const entry = dataCache.current[initialInstrument];
    if (entry && entry.ts === null) {
      entry.ts = Date.now();
    }
  }, [initialInstrument]);

  const instrument = useMemo(() => INSTRUMENTS[activeInstrument], [activeInstrument]);

  const fetchData = useCallback(async (instrumentId: string) => {
    const seq = ++fetchSeq.current;

    const cached = dataCache.current[instrumentId];
    if (cached && (cached.ts === null || Date.now() - cached.ts < CACHE_TTL_MS)) {
      setWeatherData(cached.weather);
      setCotData(cached.cot);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setWeatherData([]);
    setCotData([]);
    setError(null);
    try {
      const response = await fetch(`/api/terminal-data?instrument=${instrumentId}`);
      if (!response.ok) {
        let detail = "Failed to fetch";
        try {
          const body = await response.json();
          if (body?.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const data = await response.json();
      if (seq !== fetchSeq.current) return; // superseded by a newer switch
      const weather: WeatherRow[] = data.weatherData || [];
      const cot: CotRow[] = data.cotData || [];
      // Only cache real results; never cache an empty weather payload.
      if (weather.length > 0) {
        dataCache.current[instrumentId] = { weather, cot, ts: Date.now() };
      }
      setWeatherData(weather);
      setCotData(cot);
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      const detail = err instanceof Error ? err.message : "Unable to load market data";
      setError("Unable to load market data for " + (INSTRUMENTS[instrumentId]?.displayName || instrumentId) + ` — ${detail}`);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeInstrument === prevInstrument.current) return;
    prevInstrument.current = activeInstrument;
    fetchData(activeInstrument);
  }, [activeInstrument, fetchData]);

  // Indices of rows with real (non-placeholder) data. The sheet pads its tail
  // with empty rows, so the slider and stats key off filled rows only.
  const filledIndices = useMemo(
    () => weatherData.reduce<number[]>((acc, row, i) => (row.price !== null ? (acc.push(i), acc) : acc), []),
    [weatherData]
  );

  const rangeKey = `${activeInstrument}:${filledIndices.length}`;
  const fullRange: [number, number] = [0, Math.max(0, filledIndices.length - 1)];
  const range: [number, number] = rangeState.key === rangeKey ? rangeState.value : fullRange;
  const setRange = useCallback(
    (value: [number, number]) => setRangeState({ key: rangeKey, value }),
    [rangeKey]
  );

  const rangeStart = Math.min(range[0], Math.max(0, filledIndices.length - 1));
  const rangeEnd = Math.min(range[1], Math.max(0, filledIndices.length - 1));

  // The filled rows inside the selected range — drives every chart and table below the slider.
  const activeWeather = useMemo(
    () => filledIndices.slice(rangeStart, rangeEnd + 1).map((i) => weatherData[i]),
    [filledIndices, rangeStart, rangeEnd, weatherData]
  );

  const rangeLabels = useMemo(() => filledIndices.map((i) => weatherData[i].date), [filledIndices, weatherData]);

  const latestWeatherIndex = activeWeather.length - 1;
  const latestWeather = latestWeatherIndex >= 0 ? activeWeather[latestWeatherIndex] : undefined;

  const latestStats = useMemo(() => {
    if (!latestWeather) return null;
    const prevWeather: WeatherRow | null = activeWeather.length > 1 ? activeWeather[activeWeather.length - 2] : null;
    const prevPrice = prevWeather?.price ?? null;

    return {
      price: latestWeather.price,
      change: latestWeather.price !== null && prevPrice !== null ? latestWeather.price - prevPrice : null,
      changePercent: latestWeather.price !== null && prevPrice !== null && prevPrice !== 0 ? ((latestWeather.price - prevPrice) / prevPrice) * 100 : null,
      volume: latestWeather.volume,
      volumeChange: latestWeather.volume !== null && prevWeather?.volume != null && prevWeather.volume !== 0 ? ((latestWeather.volume - prevWeather.volume) / prevWeather.volume) * 100 : null,
      openInterest: latestWeather.oi,
      oiChange: latestWeather.oiChange,
      oiChangePercent: latestWeather.oiPercent,
      dailyBps: latestWeather.dailyBps,
      weeklyBps: latestWeather.weeklyBps,
      date: latestWeather.date,
    };
  }, [latestWeather, activeWeather]);

  const priceChartData = useMemo(() => activeWeather.map(d => ({ date: d.date, value: d.price })), [activeWeather]);
  const volumeChartData = useMemo(() => activeWeather.map((d, i) => {
    const prev = activeWeather[i+1];
    return {
        date: d.date,
        volume: d.volume,
        volumeChange: (d.volume !== null && prev?.volume) ? ((d.volume - prev.volume) / prev.volume) * 100 : null
      };
    }), [activeWeather]);
  const oiChartData = useMemo(() => activeWeather.map(d => ({ date: d.date, oi: d.oi })), [activeWeather]);
  const dailyBpsChartData = useMemo(() => activeWeather.map(d => ({ date: d.date, value: d.dailyBps })), [activeWeather]);
  const weeklyBpsChartData = useMemo(() => activeWeather.map(d => ({ date: d.date, value: d.weeklyBps })), [activeWeather]);
  const overviewRows = useMemo(
    () => activeWeather.map(d => ({ date: d.date, price: d.price, volume: d.volume, oi: d.oi, dailyBps: d.dailyBps, weeklyBps: d.weeklyBps })),
    [activeWeather]
  );

  // Price rows: OPEN / CLOSE from the sheet's "3887/3897" format, colored by direction.
  const priceRows = useMemo<RawTableRow[]>(
    () =>
      activeWeather.map((d) => {
        const raw = d.priceRaw || "";
        const [openRaw = "", closeRaw = ""] = raw.split("/").map((s) => s.trim());
        const closeText = closeRaw || openRaw;
        const cls = dirClass(parseNum(openRaw), parseNum(closeText));
        return {
          date: d.date,
          cells: [
            { text: openRaw || "—", cls },
            { text: closeText || "—", cls },
          ],
        };
      }),
    [activeWeather]
  );

  // Volume rows: value + day-over-day % change, colored.
  const volumeRows = useMemo<RawTableRow[]>(
    () =>
      activeWeather.map((d, i) => {
        const prev = i > 0 ? activeWeather[i - 1] : null;
        const chg =
          d.volume !== null && prev?.volume != null && prev.volume !== 0
            ? ((d.volume - prev.volume) / prev.volume) * 100
            : null;
        const cls: RawCell["cls"] = chg === null ? undefined : chg >= 0 ? "positive" : "negative";
        return {
          date: d.date,
          cells: [
            { text: d.volume !== null ? d.volume.toLocaleString() : "—" },
            { text: chg !== null ? signedPct(chg) : "—", cls },
          ],
        };
      }),
    [activeWeather]
  );

  // Open interest rows: value, change, % change — colored.
  const oiRows = useMemo<RawTableRow[]>(
    () =>
      activeWeather.map((d) => {
        const clsOf = (v: number | null): RawCell["cls"] =>
          v === null ? undefined : v >= 0 ? "positive" : "negative";
        return {
          date: d.date,
          cells: [
            { text: d.oi !== null ? d.oi.toLocaleString() : "—" },
            { text: d.oiChange !== null ? d.oiChange.toLocaleString() : "—", cls: clsOf(d.oiChange) },
            { text: d.oiPercent !== null ? signedPct(d.oiPercent) : "—", cls: clsOf(d.oiPercent) },
          ],
        };
      }),
    [activeWeather]
  );

  // Daily / weekly basis-point change rows — colored by sign.
  const bpsRowsOf = useCallback(
    (pick: (row: WeatherRow) => number | null): RawTableRow[] =>
      activeWeather.map((d) => {
        const v = pick(d);
        const cls: RawCell["cls"] = v === null ? undefined : v >= 0 ? "positive" : "negative";
        return {
          date: d.date,
          cells: [{ text: v !== null ? formatBps(v) : "—", cls }],
        };
      }),
    [activeWeather]
  );

  const dailyBpsRows = useMemo(() => bpsRowsOf((d) => d.dailyBps), [bpsRowsOf]);
  const weeklyBpsRows = useMemo(() => bpsRowsOf((d) => d.weeklyBps), [bpsRowsOf]);

  // Historical: full combined sheet. Yields use bps columns instead of volume/OI.
  const historicalRows = useMemo<RawTableRow[]>(
    () =>
      activeWeather.map((d) => {
        const raw = d.priceRaw || "";
        const [openRaw = "", closeRaw = ""] = raw.split("/").map((s) => s.trim());
        const closeText = closeRaw || openRaw;
        const priceCls = dirClass(parseNum(openRaw), parseNum(closeText));
        const clsOf = (v: number | null): RawCell["cls"] =>
          v === null ? undefined : v >= 0 ? "positive" : "negative";
        if (instrument.isYield) {
          return {
            date: d.date,
            cells: [
              { text: openRaw || "—", cls: priceCls },
              { text: closeText || "—", cls: priceCls },
              { text: d.dailyBps !== null ? formatBps(d.dailyBps) : "—", cls: clsOf(d.dailyBps) },
              { text: d.weeklyBps !== null ? formatBps(d.weeklyBps) : "—", cls: clsOf(d.weeklyBps) },
            ],
          };
        }
        return {
          date: d.date,
          cells: [
            { text: openRaw || "—", cls: priceCls },
            { text: closeText || "—", cls: priceCls },
            { text: d.volume !== null ? d.volume.toLocaleString() : "—" },
            { text: d.oi !== null ? d.oi.toLocaleString() : "—" },
            { text: d.oiChange !== null ? d.oiChange.toLocaleString() : "—", cls: clsOf(d.oiChange) },
            { text: d.oiPercent !== null ? signedPct(d.oiPercent) : "—", cls: clsOf(d.oiPercent) },
          ],
        };
      }),
    [activeWeather, instrument]
  );

  const overviewMode: OverviewMode = instrument.isYield ? "yield" : "market";
  const priceTickFormatter =
    instrument.priceNotation === "bond32" ? formatBondPrice : undefined;

  const cotVariant = getCotSource(activeInstrument)?.variant ?? "standard";

  if (!instrument) return null;

  return (
    <TerminalShell activeInstrument={activeInstrument} onInstrumentChange={setActiveInstrument}>
      <div className="terminal-content" key={activeInstrument}>
        <div className="dataset-header">
            <span className="dataset-category">{instrument.category.toUpperCase()}</span>
            <h1 className="instrument-title">
              <span className="instrument-symbol">{instrument.symbol}</span>
              {instrument.displayName}
            </h1>
        </div>

        <MetricTabs instrument={instrument} activeMetric={activeMetric} onMetricChange={setActiveMetric} />

        {loading ? (
            <div className="p-10 text-center">Loading {instrument.displayName} data...</div>
        ) : error ? (
            <div className="p-10 text-center text-red-500">{error} <button onClick={() => fetchData(activeInstrument)}>Retry</button></div>
        ) : (
        <>
        {activeMetric !== "cot" && filledIndices.length > 1 && (
          <DateRangeSlider labels={rangeLabels} value={[rangeStart, rangeEnd]} onChange={setRange} />
        )}
        <div className="terminal-grid">
          <div className="chart-panel">
            {activeMetric === "overview" && (
              <OverviewChart data={overviewRows} mode={overviewMode} priceFormat={priceTickFormatter} />
            )}
            {activeMetric === "price" && (
                <>
                    <PriceChart
                      data={priceChartData}
                      color="#007bff"
                      height={420}
                      label={instrument.isYield ? "Yield" : "Price"}
                      tickFormatter={priceTickFormatter}
                      tooltipFormatter={priceTickFormatter}
                    />
                    <RawDataTable title="Price sheet" columns={["OPEN", "CLOSE"]} rows={priceRows} />
                </>
            )}
            {activeMetric === "volume" && (
                <>
                    <VolumeChart data={volumeChartData} height={420} />
                    <RawDataTable title="Volume sheet" columns={["VOLUME", "CHG %"]} rows={volumeRows} />
                </>
            )}
            {activeMetric === "openInterest" && (
                <>
                    <OpenInterestChart data={oiChartData} height={420} />
                    <RawDataTable columns={["OPEN INTEREST", "CHG", "CHG %"]} rows={oiRows} title="Open interest" />
                </>
            )}
            {activeMetric === "cot" && (
                instrument.hasCOT ? (
                  <COTTable data={cotData} variant={cotVariant} />
                ) : (
                  <div className="cot-empty">COT data is not available for {instrument.displayName} — no COT source is configured for this instrument.</div>
                )
            )}
            {activeMetric === "yield" && (
                <>
                    <PriceChart
                      data={priceChartData}
                      color="#00c851"
                      height={420}
                      label="Yield"
                      tickFormatter={(v: number) => v.toFixed(2)}
                      tooltipFormatter={(v: number) => `${v.toFixed(2)}%`}
                    />
                    <RawDataTable columns={["OPEN", "CLOSE"]} rows={priceRows} title="Yield sheet" />
                </>
            )}
            {activeMetric === "dailyBps" && (
                <>
                    <BpsChart data={dailyBpsChartData} color="#007bff" height={420} />
                    <RawDataTable title="Daily change (bps)" columns={["DAILY BPS"]} rows={dailyBpsRows} />
                </>
            )}
            {activeMetric === "weeklyBps" && (
                <>
                    <BpsChart data={weeklyBpsChartData} color="#ffb800" height={420} />
                    <RawDataTable title="Weekly change (bps)" columns={["WEEKLY BPS"]} rows={weeklyBpsRows} />
                </>
            )}
            {activeMetric === "historical" && (
                <RawDataTable
                  title="Historical sheet"
                  columns={
                    instrument.isYield
                      ? ["OPEN", "CLOSE", "DAILY BPS", "WEEKLY BPS"]
                      : ["OPEN", "CLOSE", "VOLUME", "OI", "OI CHG", "OI CHG %"]
                  }
                  rows={historicalRows}
                />
            )}
          </div>
          <div className="stats-panel">
            <MarketStats instrument={instrument} latestData={latestStats} />
          </div>
        </div>
        </>
        )}
      </div>
    </TerminalShell>
  );
}
