/* =========================================================
   NEWS — display formatting.

   The monthly sheet holds values only; every number the
   reader sees is formatted here so the cards, the table and
   the chart can never disagree about rounding.
   ========================================================= */

export type ChangeDirection = "up" | "down" | "flat";

/** Which way a delta points. Zero and gaps are "flat", not "down". */
export function changeDirection(value: number | null): ChangeDirection {
  if (value === null || !Number.isFinite(value) || value === 0) return "flat";

  return value > 0 ? "up" : "down";
}

/** The `is-up` / `is-down` modifier, or an empty string when flat. */
export function changeClass(value: number | null): string {
  const direction = changeDirection(value);

  return direction === "flat" ? "" : `is-${direction}`;
}

/** A plain value, or an em dash when the sheet has nothing. */
export function formatNewsValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits(value),
  }).format(value);
}

/** "+1,240" / "−86" / "—". */
export function formatNewsChange(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";

  return `${signOf(value)}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits(value),
  }).format(Math.abs(value))}`;
}

/** "+4.5%" / "−0.8%" / "—". */
export function formatNewsPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";

  return `${signOf(value)}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))}%`;
}

/** The arrow that fits inside a chip. */
export function newsArrow(value: number | null): string {
  const direction = changeDirection(value);

  if (direction === "up") return "▲";
  if (direction === "down") return "▼";

  return "•";
}

/* ========================================================= */
/* INTERNALS                                                 */
/* ========================================================= */

/** Magnitude-dependent precision: 1000+ reads better without decimals. */
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
