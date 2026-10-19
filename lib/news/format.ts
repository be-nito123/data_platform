/* =========================================================
   NEWS — display formatting.

   The sheet holds figures with units ("197K", "4.20%"); the reader keeps that
   unit on the value. Everything the eye sees is formatted here, so the cards,
   the table, the matrix and the chart cannot disagree about rounding or about
   whether a number wears a percent sign.
   ========================================================= */

import type { NewsValue, ValueUnit } from "@/lib/supabase/data/news";

/** The unit as it is written back out: "197K", "4.20%" — but not "197". */
const UNIT_SUFFIX: Record<ValueUnit, string> = {
  number: "",
  percent: "%",
  thousand: "K",
  million: "M",
  billion: "B",
};

/* =========================================================
   DIRECTION
   ========================================================= */

type ChangeDirection = "up" | "down" | "flat";

/** Which way a delta points. Zero and gaps are "flat", not "down". */
function directionOf(amount: number | null): ChangeDirection {
  if (amount === null || !Number.isFinite(amount) || amount === 0) return "flat";

  return amount > 0 ? "up" : "down";
}

/** The `is-up` / `is-down` modifier, or an empty string when flat. */
export function classOf(amount: number | null): string {
  const direction = directionOf(amount);

  return direction === "flat" ? "" : `is-${direction}`;
}

/** The same modifier, for a figure rather than a bare number. */
export function changeClass(value: NewsValue | null): string {
  return classOf(value?.amount ?? null);
}

/* =========================================================
   VALUES
   ========================================================= */

/** "197K" / "4.20%" / "6,657B" / "—". */
export function formatNewsValue(value: NewsValue | null): string {
  if (!value || !Number.isFinite(value.amount)) return "—";

  return `${formatAmount(value.amount)}${UNIT_SUFFIX[value.unit]}`;
}

/** A bare figure in a known unit, for the parts that hold numbers apart. */
export function formatNewsAmount(amount: number | null, unit: ValueUnit): string {
  if (amount === null || !Number.isFinite(amount)) return "—";

  return `${formatAmount(amount)}${UNIT_SUFFIX[unit]}`;
}

/** "+2K" / "−0.4%" / "—". */
export function formatNewsDelta(value: NewsValue | null): string {
  if (!value || !Number.isFinite(value.amount)) return "—";

  return `${signOf(value.amount)}${formatAmount(Math.abs(value.amount))}${
    UNIT_SUFFIX[value.unit]
  }`;
}

/** "12" — a count, not a measured figure. */
export function formatNewsCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/* =========================================================
   INTERNALS
   ========================================================= */

/** Magnitude-dependent precision: 1000+ reads better without decimals. */
function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits(value),
  }).format(value);
}

function fractionDigits(value: number): number {
  const magnitude = Math.abs(value);

  if (magnitude >= 1000) return 0;
  if (magnitude >= 1) return 2;
  if (magnitude === 0) return 0;

  return 3;
}

/** Typographic minus, so it aligns with the plus. */
function signOf(value: number): string {
  if (value > 0) return "+";
  if (value < 0) return "−";

  return "";
}
