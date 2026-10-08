export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>© 2026 DataVault. Market data platform.</div>
        <div className="flex gap-6">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  );
}