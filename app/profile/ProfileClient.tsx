"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { INSTRUMENTS } from "@/lib/instruments";

/**
 * Resolve a stored `saved_datasets.dataset_code` (a symbol such as "XAU")
 * to a row in the instrument registry, so bookmarks always point at a live URL.
 */
function findInstrumentByCode(code: string) {
  const normalized = code.trim().toUpperCase();

  return Object.values(INSTRUMENTS).find(
    (instrument) =>
      instrument.symbol.toUpperCase() === normalized ||
      instrument.id.toUpperCase() === normalized
  );
}

/**
 * The profile screen.
 *
 * `isAdmin` is resolved on the server (see `page.tsx`) rather than here, so the
 * one place that decides who is an administrator stays `lib/access.ts` and the
 * admin-only doorways are never rendered for anyone else.
 */
export default function ProfileClient({ isAdmin }: { isAdmin: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [savedDatasets, setSavedDatasets] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, country, phone_code, phone_number, company, job_title")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setCountry(profile.country ?? "");
        setPhoneCode(profile.phone_code ?? "");
        setPhoneNumber(profile.phone_number ?? "");
        setCompany(profile.company ?? "");
        setJobTitle(profile.job_title ?? "");
      }

      const { data: savedData, error: savedError } = await supabase
        .from("saved_datasets")
        .select("dataset_code")
        .eq("user_id", user.id);

      if (savedError) {
        console.error("Could not load saved datasets:", savedError.message);
      } else if (savedData) {
        setSavedDatasets(savedData.map((item) => item.dataset_code).filter(Boolean));
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        country,
        phone_code: phoneCode,
        phone_number: phoneNumber,
        company,
        job_title: jobTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Profile update failed:", error.message);
      setErrorMessage("We could not save your changes. Please try again.");
      setSaving(false);
      return;
    }

    setMessage("Profile updated.");
    setEditMode(false);
    setSaving(false);
  }

  function handleCancel() {
    setEditMode(false);
    setMessage("");
    setErrorMessage("");
  }

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "DV";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Loading profile…
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />

      <main className="flex-1">
        <section className="mx-auto max-w-[1100px] px-4 py-10 lg:px-6">
          {/* PAGE HEADER */}
          <div className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Account
              </div>
              <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-text">
                Your profile
              </h1>
              <p className="mt-2 max-w-md text-[13px] leading-6 text-text-dim">
                Manage the details on your DataVault account and review your saved datasets.
              </p>
            </div>

            {editMode ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-border px-4 py-2.5 text-[12px] font-semibold text-text-dim transition hover:border-border-strong hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg border border-accent bg-accent px-4 py-2.5 text-[12px] font-semibold text-white transition hover:border-accent-strong hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditMode(true);
                  setMessage("");
                  setErrorMessage("");
                }}
                className="rounded-lg border border-accent px-4 py-2.5 text-[12px] font-semibold text-accent transition hover:bg-accent hover:text-white"
              >
                Edit profile
              </button>
            )}
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="mt-5 rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-[12px] text-green"
            >
              {message}
            </p>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-[12px] text-red"
            >
              {errorMessage}
            </p>
          )}

          {/* IDENTITY CARD */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-xl font-semibold text-accent">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  Signed in as
                </div>
                <h2 className="mt-1 truncate text-[20px] font-semibold text-text">
                  {fullName || "DataVault user"}
                </h2>
                <p className="mt-1 truncate text-[12px] text-text-dim">{email}</p>
              </div>

              <div className="rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-center sm:ml-auto">
                <div className="text-[9px] uppercase tracking-[0.15em] text-text-muted">
                  Session
                </div>
                <div className="mt-1 text-[12px] font-semibold text-green">Active</div>
              </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoCard title="Personal information">
              <EditableRow
                label="Full name"
                value={fullName}
                editing={editMode}
                onChange={setFullName}
              />

              <InfoRow label="Email" value={email} />

              <EditableRow
                label="Country"
                value={country}
                editing={editMode}
                onChange={setCountry}
              />

              <div className="flex items-center justify-between gap-6 px-5 py-3.5">
                <span className="shrink-0 text-[12px] text-text-dim">Phone</span>

                {editMode ? (
                  <div className="flex max-w-[62%] gap-2">
                    <input
                      value={phoneCode}
                      onChange={(event) => setPhoneCode(event.target.value)}
                      placeholder="+91"
                      aria-label="Country dialling code"
                      className="w-16 rounded-md border border-border bg-bg-elevated px-2 py-2 text-center text-[13px] text-text"
                    />
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="Phone number"
                      aria-label="Phone number"
                      inputMode="tel"
                      className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text focus:border-accent"
                    />
                  </div>
                ) : (
                  <span className="truncate text-right text-[13px] text-text">
                    {phoneNumber ? `${phoneCode || ""} ${phoneNumber}`.trim() : "Not provided"}
                  </span>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Professional information">
              <EditableRow
                label="Company"
                value={company}
                editing={editMode}
                onChange={setCompany}
              />

              <EditableRow
                label="Job title"
                value={jobTitle}
                editing={editMode}
                onChange={setJobTitle}
              />

              <InfoRow label="Account email" value={email} />

              <InfoRow label="Account ID" value={userId} mono />
            </InfoCard>
          </div>

          {/* SAVED DATASETS */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="border-b border-border px-6 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-accent">
                Saved datasets
              </div>
              <p className="mt-1 text-[12px] text-text-dim">
                Your bookmarked markets, ready to open in the terminal.
              </p>
            </div>

            <div className="p-6">
              {savedDatasets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
                  <p className="text-[13px] text-text-dim">No saved datasets yet.</p>
                  <Link
                    href="/datasets"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-accent px-4 py-2 text-[12px] font-semibold text-accent transition hover:bg-accent hover:text-white"
                  >
                    Explore datasets
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {savedDatasets.map((code) => {
                    const instrument = findInstrumentByCode(code);
                    if (!instrument) return null;

                    return (
                      <Link
                        key={code}
                        href={`/terminal/${instrument.id}`}
                        className="group rounded-xl border border-border bg-bg-elevated p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel font-mono text-[10px] font-bold text-accent">
                            {instrument.symbol}
                          </div>
                          <span aria-hidden="true" className="text-accent">
                            ★
                          </span>
                        </div>

                        <div className="mt-4 text-[13px] font-semibold text-text">
                          {instrument.displayName}
                        </div>
                        <div className="mt-1 text-[10px] text-text-muted">
                          {instrument.description}
                        </div>
                        <div className="mt-4 border-t border-border pt-3 text-[10px] uppercase tracking-[0.12em] text-text-muted transition group-hover:text-accent">
                          Open terminal →
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/*
            Operator tooling. Rendered only for administrators, and the news room
            itself checks the same role server-side — this card is a doorway, not
            the lock.
          */}
          {isAdmin && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-accent/40 bg-panel">
              <div className="border-b border-border px-6 py-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-accent">
                  Admin
                </div>
              </div>

              <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-text">
                    Monthly Data News
                  </div>
                  <p className="mt-1 max-w-xl text-[12px] leading-5 text-text-dim">
                    What moved each month, and by how much — the month-on-month and
                    year-on-year change for every figure. Kept off the public site and
                    out of search engines.
                  </p>
                </div>

                <Link
                  href="/news"
                  className="shrink-0 rounded-lg border border-accent bg-accent px-4 py-2.5 text-[12px] font-semibold text-white transition hover:border-accent-strong hover:bg-accent-strong"
                >
                  Open news room
                </Link>
              </div>
            </div>
          )}

          {/* SECURITY */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="border-b border-border px-6 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-accent">
                Security
              </div>
            </div>

            <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[13px] font-semibold text-text">Password</div>
                <p className="mt-1 max-w-xl text-[12px] leading-5 text-text-dim">
                  Password changes are handled through a secure email verification link, so your
                  credentials are never exposed in the browser.
                </p>
              </div>

              <Link
                href="/forgot-password"
                className="shrink-0 rounded-lg border border-accent px-4 py-2.5 text-[12px] font-semibold text-accent transition hover:bg-accent hover:text-white"
              >
                Reset password
              </Link>
            </div>
          </div>

          {userId && (
            <p className="mt-6 text-center font-mono text-[10px] text-text-muted">
              Account reference: {userId}
            </p>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel">
      <div className="border-b border-border px-6 py-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-accent">{title}</div>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function EditableRow({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4">
      <span className="shrink-0 text-[12px] text-text-dim">{label}</span>

      {editing ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="w-[60%] rounded-lg border border-border bg-bg px-3 py-2 text-right text-[13px] text-text transition focus:border-accent"
        />
      ) : (
        <span className="max-w-[60%] truncate text-right text-[13px] text-text">
          {value || "Not provided"}
        </span>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4">
      <span className="shrink-0 text-[12px] text-text-dim">{label}</span>
      <span
        className={`max-w-[60%] truncate text-right text-text ${
          mono ? "font-mono text-[10px] text-text-muted" : "text-[13px]"
        }`}
      >
        {value || "Not provided"}
      </span>
    </div>
  );
}
