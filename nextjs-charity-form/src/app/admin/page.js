"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, 'Helvetica Neue', Arial, sans-serif";

// Client-side gate only — this hides the UI, it does not secure the data.
// Firestore security rules must independently restrict reads/writes on
// `applications` to these same emails.
const ADMIN_EMAILS = ["mdaslam2025678@gmail.com"];

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

/* ---------- Icons ---------- */

function SpinnerIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10.5" cy="10.5" r="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m20 20-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.3 12.2 1.9 1.9 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" className="fill-emerald-400" />
      <path d="m7.5 12.5 3 3 6-6.2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ filled, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m12 3.5 2.6 5.6 6.1.6-4.6 4.2 1.3 6.1L12 16.9l-5.4 3.1 1.3-6.1-4.6-4.2 6.1-.6L12 3.5Z"
      />
    </svg>
  );
}

function PrinterIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M7 8V4h10v4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 14h10v6H7v-6Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18v1.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Small presentational pieces ---------- */

function StatusBadge({ status }) {
  const s = status || "pending";
  const styles = {
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  };
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[s] || styles.pending}`}>
      {label}
    </span>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
      <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
        {value && String(value).trim() ? value : <span className="text-zinc-400 dark:text-zinc-600">Not provided</span>}
      </p>
    </div>
  );
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "Just now";
  return timestamp.toDate().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* ---------- CSV helpers ---------- */

function csvField(value) {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ---------- Printable summary (plain HTML, no Tailwind dependency) ---------- */

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function buildPrintableHTML(app) {
  const p = app.personal || {};
  const a = app.academic || {};
  const f = app.financial || {};
  const l = app.leadership || {};
  const v = app.vision || {};
  const recommenders = app.recommenders || [];
  const rating = app.rating || 0;
  const starsDisplay = "★".repeat(rating) + "☆".repeat(5 - rating);

  const section = (title, rows) => `
    <section>
      <h2>${escapeHtml(title)}</h2>
      ${rows
        .map(
          ([label, value]) => `
        <div class="field">
          <p class="label">${escapeHtml(label)}</p>
          <p class="value">${value && String(value).trim() ? escapeHtml(value) : "Not provided"}</p>
        </div>`
        )
        .join("")}
    </section>`;

  const recommendersHtml = recommenders.length
    ? recommenders
        .map(
          (r) =>
            `<div class="rec"><strong>${escapeHtml(r.name || "Unnamed")}</strong> — ${escapeHtml(
              r.contact || "No contact provided"
            )}</div>`
        )
        .join("")
    : `<p class="value">No recommenders provided</p>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(p.fullName || "Applicant")} — Application Summary</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; color: #18181b; margin: 0; padding: 32px; }
  header { border-bottom: 2px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #71717a; font-size: 13px; margin: 0; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #f4f4f5; color: #52525b; text-transform: capitalize; }
  .stars { font-size: 16px; color: #f59e0b; letter-spacing: 2px; }
  section { margin-bottom: 20px; page-break-inside: avoid; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6366f1; margin: 0 0 10px; }
  .field { margin-bottom: 10px; }
  .label { font-size: 11px; color: #71717a; margin: 0 0 2px; font-weight: 600; }
  .value { font-size: 13px; margin: 0; white-space: pre-wrap; }
  .rec { font-size: 13px; margin-bottom: 4px; }
  .notes-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px 14px; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(p.fullName || "Unnamed applicant")}</h1>
      <p class="meta">${escapeHtml(p.email || "")}${p.phone ? " · " + escapeHtml(p.phone) : ""}</p>
      <p class="meta">Submitted ${escapeHtml(formatDate(app.submittedAt))}</p>
    </div>
    <div style="text-align:right;">
      <span class="badge">${escapeHtml(app.status || "pending")}</span>
      <div class="stars" style="margin-top:6px;">${starsDisplay}</div>
    </div>
  </header>

  ${section("Academic & School", [
    ["School / College", a.school],
    ["Student Government Involvement", a.studentGovt],
    ["Portfolio Link", a.portfolioLink],
  ])}

  ${section("Financial & Family Context", [
    ["Family Income Details", f.familyIncome],
    ["Financial Need Statement", f.financialNeed],
  ])}

  ${section("Leadership & Experience", [
    ["Leadership Roles", l.leadershipRoles],
    ["Past Activities", l.pastActivities],
  ])}

  ${section("Vision & Story", [
    ["Personal Story", v.personalStory],
    ["Future Goals", v.futureGoals],
  ])}

  <section>
    <h2>References</h2>
    ${recommendersHtml}
  </section>

  <section>
    <h2>Internal Admin Notes</h2>
    <div class="notes-box">
      <p class="value">${
        app.adminNotes && String(app.adminNotes).trim() ? escapeHtml(app.adminNotes) : "No notes recorded"
      }</p>
    </div>
  </section>
</body>
</html>`;
}

/* ---------- Access denied ---------- */

function AccessDenied({ user, onSignOut, onReturn }) {
  return (
    <div style={{ fontFamily: FONT_STACK }} className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-[#050505]">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200/70 bg-white/80 p-8 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <ShieldIcon />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Admin Access Only</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {user
            ? `This page is restricted to APP administrators. You're signed in as ${user.email}.`
            : "Sign in with an authorized admin account to view this page."}
        </p>
        <button
          onClick={onReturn}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-400 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 active:scale-[0.98]"
        >
          Return to Login
        </button>
        {user && (
          <button
            onClick={onSignOut}
            className="mt-3 w-full rounded-2xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out and try another account
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Star rating widget ---------- */

function StarRating({ value = 0, onChange, disabled }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Application rating">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="p-0.5 text-amber-400 transition hover:scale-110 disabled:opacity-50"
        >
          <StarIcon filled={star <= value} />
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={disabled}
          className="ml-1 text-[11px] font-medium text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/* ---------- Applicant detail modal ---------- */

function ApplicantModal({
  app,
  onClose,
  onStatusChange,
  updating,
  onRatingChange,
  ratingUpdating,
  onSaveNotes,
  savingNotes,
  onPrint,
}) {
  const [notesDraft, setNotesDraft] = useState(app?.adminNotes || "");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    setNotesDraft(app?.adminNotes || "");
    setNotesDirty(false);
  }, [app?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!app) return null;
  const p = app.personal || {};
  const a = app.academic || {};
  const f = app.financial || {};
  const l = app.leadership || {};
  const v = app.vision || {};
  const recommenders = app.recommenders || [];

  async function handleSaveNotesClick() {
    try {
      await onSaveNotes(app, notesDraft);
      setNotesDirty(false);
    } catch {
      // error toast is handled by the parent
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-200/70 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{p.fullName || "Unnamed applicant"}</h2>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
              {p.email} {p.phone ? `· ${p.phone}` : ""}
            </p>
            <p className="mt-0.5 text-[12px] text-zinc-400 dark:text-zinc-600">Submitted {formatDate(app.submittedAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-500">Academic & School</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="School / College" value={a.school} />
              <DetailBlock label="Student Government Involvement" value={a.studentGovt} />
              <DetailBlock label="Portfolio Link" value={a.portfolioLink} />
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-500">Financial & Family Context</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Family Income Details" value={f.familyIncome} />
              <DetailBlock label="Financial Need Statement" value={f.financialNeed} />
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-500">Leadership & Experience</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Leadership Roles" value={l.leadershipRoles} />
              <DetailBlock label="Past Activities" value={l.pastActivities} />
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-500">Vision & Story</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Personal Story" value={v.personalStory} />
              <DetailBlock label="Future Goals" value={v.futureGoals} />
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-500">References</p>
            {recommenders.length > 0 ? (
              <div className="space-y-2">
                {recommenders.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-4 py-2.5 text-sm dark:bg-zinc-800/50"
                  >
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{r.name || "Unnamed"}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{r.contact || "No contact provided"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">No recommenders provided</p>
            )}
          </section>

          <section>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-500">
              Admin Scoring &amp; Notes
            </p>
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-zinc-800/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">Rating</p>
                  <div className="mt-1">
                    <StarRating value={app.rating || 0} onChange={(val) => onRatingChange(app, val)} disabled={ratingUpdating} />
                  </div>
                </div>
                {ratingUpdating && (
                  <span className="flex items-center gap-1.5 text-[12px] text-zinc-400">
                    <SpinnerIcon className="h-3 w-3" /> Saving…
                  </span>
                )}
              </div>

              <div className="mt-4">
                <label className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400" htmlFor="admin-notes">
                  Private Notes (admin-only)
                </label>
                <textarea
                  id="admin-notes"
                  value={notesDraft}
                  onChange={(e) => {
                    setNotesDraft(e.target.value);
                    setNotesDirty(true);
                  }}
                  rows={3}
                  placeholder="Add internal notes about this applicant…"
                  className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveNotesClick}
                    disabled={!notesDirty || savingNotes}
                    className="rounded-full bg-indigo-500 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {savingNotes ? "Saving…" : "Save Notes"}
                  </button>
                  {!notesDirty && !savingNotes && <span className="text-[11px] text-zinc-400">Saved</span>}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-zinc-200/70 pt-5 dark:border-white/10">
          <button
            onClick={() => onStatusChange(app, "approved")}
            disabled={updating}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {updating ? <SpinnerIcon className="h-3.5 w-3.5" /> : <CheckIcon />}
            Approve
          </button>
          <button
            onClick={() => onStatusChange(app, "rejected")}
            disabled={updating}
            className="flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {updating ? <SpinnerIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
            Reject
          </button>
          <button
            onClick={() => onStatusChange(app, "pending")}
            disabled={updating}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {updating ? <SpinnerIcon className="h-3.5 w-3.5" /> : <ClockIcon />}
            Mark Pending
          </button>
          <button
            onClick={() => onPrint(app)}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-[13px] font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PrinterIcon />
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Scoring & notes
  const [ratingUpdatingId, setRatingUpdatingId] = useState(null);
  const [savingNotesId, setSavingNotesId] = useState(null);

  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingApps(true);
    const q = query(collection(db, "applications"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setApplications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingApps(false);
      },
      (err) => {
        console.error("Error fetching applications:", err);
        setLoadingApps(false);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  function showToast(message) {
    setToast({ show: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }

  async function handleStatusChange(app, newStatus) {
    setUpdatingId(app.id);
    try {
      await updateDoc(doc(db, "applications", app.id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
      });
      showToast(`Marked "${app.personal?.fullName || "Applicant"}" as ${newStatus}.`);
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("Something went wrong. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBulkStatusChange(newStatus) {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "applications", id), {
          status: newStatus,
          reviewedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      showToast(`Updated ${selectedIds.size} application${selectedIds.size === 1 ? "" : "s"} to ${newStatus}.`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk update failed:", err);
      showToast("Bulk update failed. Please try again.");
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleRatingChange(app, newRating) {
    setRatingUpdatingId(app.id);
    try {
      await updateDoc(doc(db, "applications", app.id), { rating: newRating });
    } catch (err) {
      console.error("Error updating rating:", err);
      showToast("Failed to update rating.");
    } finally {
      setRatingUpdatingId(null);
    }
  }

  async function handleSaveNotes(app, notes) {
    setSavingNotesId(app.id);
    try {
      await updateDoc(doc(db, "applications", app.id), { adminNotes: notes });
      showToast("Notes saved.");
    } catch (err) {
      console.error("Error saving notes:", err);
      showToast("Failed to save notes.");
      throw err;
    } finally {
      setSavingNotesId(null);
    }
  }

  function handlePrintSummary(app) {
    const html = buildPrintableHTML(app);
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      showToast("Please allow pop-ups to print the summary.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      if (filteredApps.length > 0 && filteredApps.every((a) => prev.has(a.id))) {
        return new Set();
      }
      return new Set(filteredApps.map((a) => a.id));
    });
  }

  function handleExportCSV() {
    if (filteredApps.length === 0) {
      showToast("No applications to export.");
      return;
    }
    const header = [
      "Name",
      "Email",
      "Phone",
      "School",
      "Status",
      "Rating",
      "Family Income",
      "Financial Need",
      "Admin Notes",
      "Submitted Date",
    ];
    const rows = filteredApps.map((app) => {
      const p = app.personal || {};
      const a = app.academic || {};
      const f = app.financial || {};
      return [
        p.fullName || "",
        p.email || "",
        p.phone || "",
        a.school || "",
        app.status || "pending",
        app.rating || "",
        f.familyIncome || "",
        f.financialNeed || "",
        app.adminNotes || "",
        formatDate(app.submittedAt),
      ];
    });
    const csv = [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`app-applications-${statusFilter}-${stamp}.csv`, csv);
    showToast(`Exported ${filteredApps.length} application${filteredApps.length === 1 ? "" : "s"} to CSV.`);
  }

  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => (a.status || "pending") === "pending").length;
    const approved = applications.filter((a) => a.status === "approved").length;
    return { total, pending, approved };
  }, [applications]);

  const filteredApps = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return applications.filter((app) => {
      const status = app.status || "pending";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !term ||
        [app.personal?.fullName, app.personal?.email, app.academic?.school]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [applications, searchTerm, statusFilter]);

  const selectedApp = selectedId ? applications.find((a) => a.id === selectedId) || null : null;

  async function handleSignOut() {
    await signOut(auth);
    router.push("/");
  }

  if (checkingAuth) {
    return (
      <div style={{ fontFamily: FONT_STACK }} className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-700 dark:border-t-indigo-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied user={user} onSignOut={handleSignOut} onReturn={() => router.push("/")} />;
  }

  const allVisibleSelected = filteredApps.length > 0 && filteredApps.every((a) => selectedIds.has(a.id));

  return (
    <div style={{ fontFamily: FONT_STACK }} className="min-h-screen bg-zinc-50 dark:bg-[#050505]">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/lolo.png"
              alt="Amra Poropokari Poribar Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div className="leading-tight">
              <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">Admin Dashboard</p>
              <p className="hidden text-[11px] text-zinc-400 dark:text-zinc-500 sm:block">Amra Poropokari Poribar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate rounded-full bg-zinc-100 px-3 py-1.5 text-[12px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:inline-block">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-zinc-200 px-3.5 py-1.5 text-[12px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard label="Total Applications Received" value={metrics.total} />
          <MetricCard label="Pending Reviews" value={metrics.pending} />
          <MetricCard label="Approved Applicants" value={metrics.approved} />
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-2.5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
            <span className="text-zinc-400"><SearchIcon /></span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or school"
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-2.5 text-sm text-zinc-700 outline-none backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-200"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-2.5 text-sm font-medium text-zinc-600 backdrop-blur-xl transition hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <DownloadIcon />
            Export CSV
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <span className="text-[13px] font-semibold text-indigo-700 dark:text-indigo-300">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange("approved")}
                disabled={bulkUpdating}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {bulkUpdating ? <SpinnerIcon className="h-3.5 w-3.5" /> : <CheckIcon />}
                Approve
              </button>
              <button
                onClick={() => handleBulkStatusChange("rejected")}
                disabled={bulkUpdating}
                className="flex items-center gap-1.5 rounded-full bg-red-500 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {bulkUpdating ? <SpinnerIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                Reject
              </button>
              <button
                onClick={() => handleBulkStatusChange("pending")}
                disabled={bulkUpdating}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {bulkUpdating ? <SpinnerIcon className="h-3.5 w-3.5" /> : <ClockIcon />}
                Mark Pending
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkUpdating}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loadingApps ? (
          <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
            <SpinnerIcon className="mr-2 h-4 w-4" /> Loading applications…
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No applications match your filters.
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="h-4 w-4 rounded border-zinc-300 accent-indigo-500 dark:border-zinc-600"
                aria-label="Select all visible applications"
              />
              <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                Select all visible ({filteredApps.length})
              </span>
            </div>

            <div className="space-y-3">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(app.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(app.id);
                    }
                  }}
                  className="flex w-full cursor-pointer flex-col gap-2 rounded-2xl border border-zinc-200/70 bg-white/70 p-5 text-left backdrop-blur-xl transition hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-indigo-500/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(app.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 accent-indigo-500 dark:border-zinc-600 sm:mt-0"
                      aria-label={`Select ${app.personal?.fullName || "applicant"}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                          {app.personal?.fullName || "Unnamed applicant"}
                        </p>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                        {app.personal?.email} {app.academic?.school ? `· ${app.academic.school}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {app.rating ? (
                      <span className="flex items-center gap-1 text-[12px] font-medium text-amber-500">
                        <StarIcon filled className="h-3.5 w-3.5" />
                        {app.rating}/5
                      </span>
                    ) : null}
                    <p className="text-[12px] text-zinc-400 dark:text-zinc-600">{formatDate(app.submittedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <ApplicantModal
        app={selectedApp}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
        updating={updatingId === selectedApp?.id}
        onRatingChange={handleRatingChange}
        ratingUpdating={ratingUpdatingId === selectedApp?.id}
        onSaveNotes={handleSaveNotes}
        savingNotes={savingNotesId === selectedApp?.id}
        onPrint={handlePrintSummary}
      />

      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
          toast.show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2.5 rounded-full bg-zinc-900/90 px-5 py-3 text-[13px] font-medium text-white shadow-2xl backdrop-blur-xl dark:bg-white/90 dark:text-zinc-900">
          <CheckCircleIcon />
          {toast.message}
        </div>
      </div>
    </div>
  );
}