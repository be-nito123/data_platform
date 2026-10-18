export function DatasetSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="ds-grid" aria-hidden="true">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-[236px] animate-pulse rounded-2xl border border-border bg-panel p-[22px]"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-bg-elevated" />
            <div className="h-5 w-20 rounded-full bg-bg-elevated" />
          </div>
          <div className="mt-5 h-4 w-2/3 rounded bg-bg-elevated" />
          <div className="mt-3 h-3 w-full rounded bg-bg-elevated" />
          <div className="mt-2 h-3 w-5/6 rounded bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
}
