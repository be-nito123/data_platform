import { DatasetSkeleton } from "@/components/DatasetSkeleton";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default function DatasetsLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteNav active="datasets" />

      <section className="border-b border-white/[.08]">
        <div className="mx-auto max-w-[1600px] px-5 py-14 lg:px-8">
          <div className="h-3 w-24 animate-pulse rounded bg-white/[.05]" />
          <div className="mt-5 h-10 w-2/3 animate-pulse rounded bg-white/[.05]" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-white/[.05]" />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1600px] px-5 py-12 lg:px-8">
          <div className="mb-7 flex gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-24 animate-pulse rounded-full bg-white/[.05]"
              />
            ))}
          </div>
          <DatasetSkeleton />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
