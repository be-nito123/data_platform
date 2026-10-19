import Link from "next/link";
import type { Viewer } from "@/lib/access";

/*
  Shown instead of the news room when the viewer is not an admin.

  The important part is what this does NOT do: it never receives sheet data.
  The caller returns this before reading the spreadsheet, so a locked-out
  visitor has nothing to find in the page source or the network tab.
*/
export default function NewsLocked({ viewer }: { viewer: Viewer }) {
  const signedIn = Boolean(viewer.userId);

  return (
    <div className="news-container">
      <div className="news-locked">
        <div className="news-locked-card">
          <span className="news-locked-badge">Restricted</span>

          <h1 className="news-locked-title">Admins only</h1>

          <p className="news-locked-desc">
            The monthly news sheet is not part of the public site. Access is
            limited to DataVault administrators while the section is being
            built.
          </p>

          <p className="news-locked-desc">
            {signedIn ? (
              <>
                You are signed in as{" "}
                <strong className="text-text">{viewer.email ?? "an account"}</strong>.
                If you expected access, ask an administrator to set your role to{" "}
                <code className="news-code">admin</code>.
              </>
            ) : (
              <>
                Sign in with an administrator account to continue.
              </>
            )}
          </p>

          <div className="news-locked-actions">
            {signedIn ? (
              <Link href="/profile" className="site-btn is-primary">
                Go to profile
              </Link>
            ) : (
              <Link href="/login" className="site-btn is-primary">
                Sign in
              </Link>
            )}

            <Link href="/" className="site-btn is-ghost">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
