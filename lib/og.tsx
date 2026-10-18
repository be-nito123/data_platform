import { getAllInstruments } from "@/lib/instruments";
import { SITE_NAME } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = `${SITE_NAME} — market data terminal for futures, COT positioning and macro`;
export const ogContentType = "image/png";

const BG = "#0c0d0e";
const PANEL = "#181b1e";
const BORDER = "#2a2d31";
const ACCENT = "#0a84ff";
const TEXT = "#e8e9ea";
const MUTED = "#9aa0a6";

function buildStats(): { value: string; label: string }[] {
  const instruments = getAllInstruments();
  const categories = new Set(instruments.map((instrument) => instrument.category)).size;
  const dataTypes = new Set(instruments.flatMap((instrument) => instrument.availableDataTypes)).size;

  return [
    { value: String(instruments.length), label: "Instruments" },
    { value: String(categories), label: "Categories" },
    { value: String(dataTypes), label: "Data types" },
    { value: "Daily", label: "Updates" },
  ];
}

/**
 * Shared Open Graph / Twitter card artwork.
 *
 * Rendered by Satori through next/og, so every element is styled inline with
 * flexbox — no CSS variables, class names or descendant selectors.
 */
export function renderOgImage() {
  const stats = buildStats();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 64,
        background: BG,
        borderTop: `6px solid ${ACCENT}`,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            border: `1px solid ${ACCENT}`,
            borderRadius: 14,
            background: "rgba(10, 132, 255, 0.12)",
            color: ACCENT,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          ›_
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 18,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: TEXT,
          }}
        >
          DATA<span style={{ color: ACCENT }}>VAULT</span>
        </div>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ACCENT,
          }}
        >
          Market data terminal
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 62,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: TEXT,
          }}
        >
          Futures, COT positioning
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: MUTED,
          }}
        >
          and macro data in one place
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              flexDirection: "column",
              marginRight: 28,
              paddingRight: 28,
              borderRight: index === stats.length - 1 ? "none" : `1px solid ${BORDER}`,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700, color: TEXT }}>{stat.value}</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            padding: "14px 24px",
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            background: PANEL,
            fontSize: 17,
            fontWeight: 600,
            color: TEXT,
          }}
        >
          Open the terminal →
        </div>
      </div>
    </div>
  );
}
