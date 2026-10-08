import { getSheetData } from "@/lib/supabase/google/sheets";
import { processEthRows } from "@/lib/supabase/data/eth";
import EthCombinedChart from "@/components/EthCombinedChart";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default async function EthCotReportPage() {
  const rows = await getSheetData("COT BTC / ETH!A:U").catch(() => null);

  if (!rows || rows.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <SiteNav />
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-xl font-semibold">Data Unavailable</h1>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const data = processEthRows(rows);
  const latest = data[data.length - 1];

  return (
    <main className="min-h-screen bg-black text-[#FFFFFF]">
      <SiteNav />
      {latest && (
        <section className="mx-auto max-w-[1600px] px-5 py-8">
          <h1 className="text-2xl font-semibold">ETH COT Report</h1>
          <div className="mt-8 rounded-2xl border border-white/[.10] bg-[#1C1C1E] p-4 shadow-xl">
            <EthCombinedChart data={data} />
          </div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}
