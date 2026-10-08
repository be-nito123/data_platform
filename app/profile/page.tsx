"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SiteNav from "@/components/SiteNav";

const SAVED_DATASET_INFO: Record<string, { title: string; subtitle: string; href: string }> = {
  XAU: { title: "Gold Market Data", subtitle: "Gold / XAUUSD", href: "/weather-condition/gold" },
  XAG: { title: "Silver Market Data", subtitle: "Silver / XAGUSD", href: "/weather-condition/silver" },
  BTC: { title: "Bitcoin Market Data", subtitle: "Bitcoin / BTCUSD", href: "/weather-condition/btc" },
  OIL: { title: "Crude Oil Data", subtitle: "WTI Crude Oil", href: "/weather-condition/oil" },
  DXY: { title: "Dollar Index Data", subtitle: "U.S. Dollar Index", href: "/weather-condition/dxy" },
  NDX: { title: "NASDAQ 100 Data", subtitle: "NASDAQ 100 Index", href: "/datasets" },
};

export default function ProfilePage() {
  const supabase = createClient();

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
        window.location.assign("/login"); // eslint-disable-line
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name, email, country, phone_code, phone_number, company, job_title"
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setEmail(profile.email ?? user.email ?? "");
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

      if (!savedError && savedData) {
        setSavedDatasets(savedData.map((item) => item.dataset_code));
      }

      setLoading(false);
    }

    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile updated successfully.");
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
      <main className="flex min-h-screen items-center justify-center bg-[#000000] text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-[#007AFF]">
          Loading DataVault Profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#000000] text-white">

      <SiteNav />

      {/* PAGE */}
      <section className="mx-auto max-w-[1100px] px-5 py-12 lg:px-8">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end">

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#007AFF]">
              Account Management
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Profile
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Manage your DataVault account information.
            </p>
          </div>

          {!editMode ? (
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                setMessage("");
                setErrorMessage("");
              }}
              className="border border-[#007AFF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#007AFF] transition hover:bg-[#000000] hover:text-black"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white/50 transition hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="border border-[#007AFF] bg-[#000000] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-[#0A84FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

        </div>

        {/* SUCCESS / ERROR */}
        {message && (
          <div className="mt-5 border border-[#0A84FF]/20 bg-[#007AFF]/[0.06] px-4 py-3 text-xs text-[#007AFF]">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* PROFILE HEADER CARD */}
        <div className="mt-8 border border-white/[0.1] bg-[#1C1C1E]">

          <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center">

            {/* AVATAR */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#007AFF]/50 bg-[#000000]/10 text-2xl font-semibold text-[#007AFF]">
              {initials}
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                Authenticated User
              </div>

              <h2 className="mt-1 text-2xl font-semibold">
                {fullName || "DataVault User"}
              </h2>

              <p className="mt-1 text-xs text-white/40">
                {email}
              </p>
            </div>

            <div className="sm:ml-auto">
              <div className="border border-[#0A84FF]/20 bg-[#007AFF]/[0.06] px-3 py-2 text-center">

                <div className="text-[9px] uppercase tracking-[0.15em] text-[#0A84FF]">
                  Account Status
                </div>

                <div className="mt-1 text-xs font-semibold text-[#007AFF]">
                  ACTIVE
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* INFORMATION */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">

          {/* PERSONAL */}
          <div className="border border-white/[0.1] bg-[#1C1C1E]">

            <div className="border-b border-white/[0.08] px-6 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#007AFF]">
                Personal Information
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">

              <EditableRow
                label="Full Name"
                value={fullName}
                editing={editMode}
                onChange={setFullName}
              />

              <InfoRow
                label="Email"
                value={email}
              />

              <EditableRow
                label="Country"
                value={country}
                editing={editMode}
                onChange={setCountry}
              />

              <div className="flex items-center justify-between gap-6 px-6 py-4">

                <span className="shrink-0 text-xs text-white/35">
                  Phone
                </span>

                {editMode ? (
                  <div className="flex max-w-[60%] gap-2">
                    <input
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="+91"
                      className="w-16 border border-white/10 bg-black px-2 py-2 text-sm text-white outline-none focus:border-[#007AFF]"
                    />

                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      className="w-full border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#007AFF]"
                    />
                  </div>
                ) : (
                  <span className="text-right text-sm text-white/80">
                    {phoneNumber
                      ? `${phoneCode || ""} ${phoneNumber}`
                      : "Not provided"}
                  </span>
                )}

              </div>

            </div>
          </div>

          {/* PROFESSIONAL */}
          <div className="border border-white/[0.1] bg-[#1C1C1E]">

            <div className="border-b border-white/[0.08] px-6 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#007AFF]">
                Professional Information
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">

              <EditableRow
                label="Company / Organization"
                value={company}
                editing={editMode}
                onChange={setCompany}
              />

              <EditableRow
                label="Job Title"
                value={jobTitle}
                editing={editMode}
                onChange={setJobTitle}
              />

              <InfoRow
                label="Account Email"
                value={email}
              />

              <InfoRow
                label="User ID"
                value={userId}
                mono
              />

            </div>
          </div>

        </div>
        {/* SAVED DATASETS */}
        <div className="mt-8 border border-white/[0.1] bg-[#1C1C1E]">
          <div className="border-b border-white/[0.08] px-6 py-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#007AFF]">
              Saved Datasets
            </div>
            <p className="mt-1 text-xs text-white/35">Your bookmarked market datasets.</p>
          </div>

          <div className="p-6">
            {savedDatasets.length === 0 ? (
              <div className="border border-dashed border-white/[0.1] px-5 py-8 text-center">
                <div className="text-sm text-white/40">No saved datasets yet.</div>
                <Link href="/#datasets" className="mt-3 inline-block text-[10px] uppercase tracking-[0.15em] text-[#007AFF] hover:underline">
                  Explore Datasets →
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {savedDatasets.map((code) => {
                  const dataset = SAVED_DATASET_INFO[code];
                  if (!dataset) return null;
                  return (
                    <Link key={code} href={dataset.href} className="group border border-white/[0.1] bg-[#1C1C1E] p-4 transition hover:-translate-y-1 hover:border-[#007AFF]/50">
                      <div className="flex items-start justify-between">
                        <div className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.03] text-[10px] font-bold text-[#007AFF]">{code}</div>
                        <span className="text-[#007AFF]">★</span>
                      </div>
                      <div className="mt-5 text-sm font-semibold text-white">{dataset.title}</div>
                      <div className="mt-1 text-[10px] text-white/30">{dataset.subtitle}</div>
                      <div className="mt-5 border-t border-white/[0.08] pt-3 text-[10px] text-white/35 group-hover:text-[#007AFF]">OPEN TERMINAL →</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECURITY */}
<div className="mt-8 border border-white/[0.1] bg-[#1C1C1E]">

  <div className="border-b border-white/[0.08] px-6 py-4">
    <div className="text-[10px] uppercase tracking-[0.18em] text-[#007AFF]">
      Security & Account
    </div>
  </div>

  <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <div className="text-sm font-semibold text-white">
        Password
      </div>

      <p className="mt-1 max-w-xl text-xs leading-5 text-white/40">
        Password changes are handled through a secure email verification link.
        This keeps your account credentials protected.
      </p>
    </div>

    <Link
      href="/forgot-password"
      className="shrink-0 border border-[#007AFF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#007AFF] transition hover:bg-[#000000] hover:text-black"
    >
      Reset Password
    </Link>

  </div>

</div>

        {/* FOOTER */}
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center">

          <div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-white/25">
              DataVault Security
            </div>

            <p className="mt-1 text-xs text-white/35">
              Your account is protected by Supabase authentication.
            </p>
          </div>

          <Link
            href="/"
            className="border border-[#007AFF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#007AFF] transition hover:bg-[#000000] hover:text-black"
          >
            Return to DataVault
          </Link>

        </div>

      </section>
    </main>
  );
}

/* =========================================================
   EDITABLE ROW
========================================================= */

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

      <span className="shrink-0 text-xs text-white/35">
        {label}
      </span>

      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-[60%] border border-white/10 bg-black px-3 py-2 text-right text-sm text-white outline-none transition focus:border-[#007AFF]"
        />
      ) : (
        <span className="max-w-[60%] truncate text-right text-sm text-white/80">
          {value || "Not provided"}
        </span>
      )}

    </div>
  );
}

/* =========================================================
   INFORMATION ROW
========================================================= */

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

      <span className="text-xs text-white/35">
        {label}
      </span>

      <span
        className={`max-w-[60%] truncate text-right text-sm text-white/80 ${
 mono ? " text-[10px] text-white/30" : ""
 }`}
      >
        {value || "Not provided"}
      </span>

    </div>
  );
}