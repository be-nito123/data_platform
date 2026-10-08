export function DatasetSkeleton() {
  return (
    <div className="ds-grid" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-[236px] rounded-2xl border border-[--color-border] bg-[--color-panel] p-[22px] animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[--color-bg-elevated]" />
            <div className="h-5 w-20 rounded-full bg-[--color-bg-elevated]" />
          </div>
          <div className="mt-5 h-4 w-2/3 rounded bg-[--color-bg-elevated]" />
          <div className="mt-3 h-3 w-full rounded bg-[--color-bg-elevated]" />
          <div className="mt-2 h-3 w-5/6 rounded bg-[--color-bg-elevated]" />
        </div>
      ))}
    </div>
  );
}