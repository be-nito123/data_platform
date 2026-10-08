import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: dataset, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !dataset) notFound();

  const features = [
    "Full dataset access",
    "Regular updates",
    "Secure dashboard access",
    "Structured data",
    "Download support",
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteNav active="datasets" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1600px] px-5 pt-7 lg:px-8">
        <div className="text-xs text-white/30">
          <Link href="/datasets" className="hover:text-white transition">
            Datasets
          </Link>
          <span className="mx-2">/</span>
          <span>{dataset.name}</span>
        </div>
      </div>

      {/* Main */}
      <section>
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 lg:grid-cols-[1fr_360px] lg:px-8">

          {/* Left */}
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] text-3xl">
              {dataset.icon}
            </div>

            <p className="mt-7 text-[10px] uppercase tracking-[.2em] text-[#0A84FF]">
              {dataset.category}
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {dataset.name}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
              {dataset.description}
            </p>

            <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[.02] px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#30D158]" />
              <span className="text-sm text-white/55">{dataset.update_frequency}</span>
            </div>

            {/* Features */}
            <div className="mt-14">
              <h2 className="text-xl font-semibold">What&apos;s included</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-[#1C1C1E] p-4"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007AFF]/10 text-xs text-[#0A84FF]">
                      ✓
                    </span>
                    <span className="text-sm text-white/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div className="mt-14">
              <h2 className="text-xl font-semibold">Data preview</h2>
              <p className="mt-2 text-sm text-white/40">
                Preview the structure of the dataset before purchasing.
              </p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/[.08]">
                <div className="grid grid-cols-4 border-b border-white/[.08] bg-white/[.03] text-[10px] uppercase tracking-[.12em] text-white/35">
                  {["Date", "Asset", "Value", "Change"].map((h) => (
                    <div key={h} className="p-4">{h}</div>
                  ))}
                </div>
                {[1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-4 border-b border-white/[.05] text-sm last:border-b-0 hover:bg-white/[.02]"
                  >
                    <div className="p-4 text-white/40">2026-08-{20 + row}</div>
                    <div className="p-4 text-white/70">{dataset.name}</div>
                    <div className="p-4 text-white/55">12,450</div>
                    <div className="p-4 text-[#30D158]">+2.41%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Purchase Card */}
          <aside>
            <div className="sticky top-24 rounded-2xl border border-white/[.08] bg-[#1C1C1E] p-7 shadow-2xl shadow-black/60">
              <p className="text-[10px] uppercase tracking-[.16em] text-white/35">
                Dataset Access
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold">{dataset.price}</span>
                <span className="pb-1 text-sm text-white/30">/ access</span>
              </div>

              <div className="my-6 h-px bg-white/[.08]" />

              <div className="space-y-3.5">
                {features.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="text-[#0A84FF]">✓</span>
                    <span className="text-sm text-white/55">{item}</span>
                  </div>
                ))}
              </div>

              <button className="mt-8 w-full rounded-full bg-[#007AFF] py-3.5 font-semibold text-white transition hover:bg-[#0A84FF]">
                Buy Access
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-white/25">
                Secure payment and authenticated access.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
