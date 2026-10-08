/* Formatting helpers for bond 32nds prices and yield/bps values. */

function toTicks(price: number): number {
  return Math.round(price * 32);
}

/** 101.65625 -> "101'21"  (Treasury 32nds notation). */
export function formatBondPrice(price: number): string {
  const ticks = Math.abs(toTicks(price));
  const sign = price < 0 ? "-" : "";
  return `${sign}${Math.floor(ticks / 32)}'${String(ticks % 32).padStart(2, "0")}`;
}

/** Signed change in 32nds: +0.03125 -> "+0'01", -0.09375 -> "-0'03". */
export function formatBondDelta(delta: number): string {
  const ticks = Math.round(delta * 32);
  if (ticks === 0) return "0'00";
  const sign = ticks > 0 ? "+" : "-";
  const abs = Math.abs(ticks);
  return `${sign}${Math.floor(abs / 32)}'${String(abs % 32).padStart(2, "0")}`;
}

/** 4.82 -> "4.82%" */
export function formatYield(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/** Signed yield change in points: -0.05 -> "-0.050%" */
export function formatYieldChange(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}%`;
}

/** Signed basis points: +3 -> "+3.0", -1.5 -> "-1.5" */
export function formatBps(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}`;
}