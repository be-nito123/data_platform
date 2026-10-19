import type { Metadata } from "next";
import { getViewer } from "@/lib/access";
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
 * browser session — but "is this viewer an administrator?" is a server question,
 * and `getViewer` is the one place that answers it.
 */
export default async function ProfilePage() {
  const viewer = await getViewer();

  return <ProfileClient isAdmin={viewer.isAdmin} />;
}
