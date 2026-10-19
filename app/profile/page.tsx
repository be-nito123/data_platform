import type { Metadata } from "next";
import { getViewer } from "@/lib/access";
import { hasNewsAccess } from "@/lib/news-access";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Your profile",
  description:
    "Manage the details on your DataVault account and review your saved datasets.",
  // Reached only when signed in; no reason for it to appear in an index.
  robots: { index: false, follow: false },
};

/**
 * A server shell around the profile screen.
 *
 * The screen itself stays a client component — it is interactive and reads the
 * browser session — but "may this viewer open the news room?" is a server
 * question, and the access helpers are the one place that answers it: an
 * `admin` role passes, and so does a live news access cookie.
 */
export default async function ProfilePage() {
  const viewer = await getViewer();
  const canOpenNews = viewer.isAdmin || (await hasNewsAccess());

  return <ProfileClient canOpenNews={canOpenNews} />;
}
