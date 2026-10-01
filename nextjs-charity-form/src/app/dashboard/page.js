"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, 'Helvetica Neue', Arial, sans-serif";

const SECTIONS = [
  { id: "personal",   label: "Personal",  title: "Personal Information",       helper: "How we can identify and reach you." },
  { id: "academic",   label: "Academic",  title: "Academic & School Info",     helper: "Your school details and supporting documents." },
  { id: "financial",  label: "Financial", title: "Financial & Family Context", helper: "Help us understand your household's financial need." },
  { id: "leadership", label: "Leadership",title: "Leadership & Experience",    helper: "Roles and activities you've taken part in." },
  { id: "vision",     label: "Vision",    title: "Vision & Story",             helper: "Your story, in your own words." },
  { id: "references", label: "References",title: "References",                 helper: "People who can speak to your character and work." },
];

const initialFormData = {
  personal:  { fullName: "", email: "", phone: "" },
  academic:  { school: "", studentGovt: "", portfolioLink: "" },
  financial: { familyIncome: "", financialNeed: "" },
  leadership:{ leadershipRoles: "", pastActivities: "" },
  vision:    { personalStory: "", futureGoals: "" },
};


function LogoMark() {
  return (
    <Image
      src="/lolo.png"
      alt="APP Logo"
      width={36}
      height={36}
      className="h-9 w-9 object-contain"
    />
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
      <path d="M15.5 8V6.2A2.2 2.2 0 0 0 13.3 4H6.2A2.2 2.2 0 0 0 4 6.2v11.6A2.2 2.2 0 0 0 6.2 20h7.1a2.2 2.2 0 0 0 2.2-2.2V16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h11m0 0-3.2-3.2M20 12l-3.2 3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 15V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15v3.2A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8V15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ size = "sm" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7h14M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M7 7l.8 12A1.6 1.6 0 0 0 9.4 20.5h5.2a1.6 1.6 0 0 0 1.6-1.5L17 7" strokeLinecap="round" strokeLinejoin="round" />
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

function SpinnerIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4.5" strokeLinecap="round" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


const inputClasses =
  "w-full rounded-2xl border border-transparent bg-zinc-100/80 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/40 dark:bg-zinc-800/60 dark:text-zinc-100 dark:focus:bg-zinc-800";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
    </div>
  );
}


function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("app-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored !== null ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("app-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle };
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}


function getInitials(displayName, email) {
  if (displayName) {
    const parts = displayName.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

function getApplicationStatus(uid) {
  // Placeholder: in production, derive from a Firestore query.
  // Returns a status string: "draft" | "submitted" | "under-review" | "awarded"
  if (!uid) return "draft";
  return "draft";
}

const STATUS_LABELS = {
  draft:         { label: "Draft",        color: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" },
  submitted:     { label: "Submitted",    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  "under-review":{ label: "Under Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  awarded:       { label: "Awarded 🎉",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

function ProfileDrawer({ user, onClose, onSignOut, signingOut }) {
  const drawerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const status = getApplicationStatus(user?.uid);
  const badge = STATUS_LABELS[status] || STATUS_LABELS.draft;
  const initials = getInitials(user?.displayName, user?.email);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function copyUid() {
    navigator.clipboard.writeText(user?.uid || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div
      ref={drawerRef}
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95"
    >
      <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-indigo-50 to-white px-6 pb-5 pt-6 dark:from-indigo-950/40 dark:to-zinc-900/0">
        <div className="relative mb-1">
          {user?.photoURL ? (
  <img
    src={user.photoURL}
    alt={user.displayName || "User avatar"}
    className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-lg dark:ring-zinc-900"
    referrerPolicy="no-referrer"
  />
) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-xl font-semibold text-white shadow-lg ring-2 ring-white dark:ring-zinc-900">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-zinc-900">
            <svg viewBox="0 0 10 10" fill="white" className="h-2.5 w-2.5">
              <circle cx="5" cy="5" r="3" />
            </svg>
          </span>
        </div>
        <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
          {user?.displayName || "Student"}
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="divide-y divide-zinc-100 px-5 py-1 dark:divide-zinc-800">
        <InfoRow label="Email" value={user?.email || "—"} />
        <InfoRow
          label="User ID"
          value={user?.uid ? `${user.uid.slice(0, 16)}…` : "—"}
          action={
            <button
              onClick={copyUid}
              className="ml-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-400 transition hover:bg-zinc-100 hover:text-indigo-500 dark:hover:bg-zinc-800"
            >
              <CopyIcon />
              {copied ? "Copied!" : "Copy"}
            </button>
          }
        />
        <InfoRow label="Application" value={badge.label} />
      </div>

      <div className="px-5 pb-5 pt-3">
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-2.5 text-[13px] font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:hover:bg-red-950/30"
        >
          {signingOut ? <SpinnerIcon className="h-3.5 w-3.5" /> : <SignOutIcon />}
          Sign Out
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, action }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="flex items-center text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
        {value}
        {action}
      </span>
    </div>
  );
}

function UserProfileButton({ user, onClick }) {
  const initials = getInitials(user?.displayName, user?.email);
  return (
    <button
      onClick={onClick}
      aria-label="Open profile"
      className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 transition hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800"
    >
      {user?.photoURL ? (
  <img
    src={user.photoURL}
    alt="Avatar"
    className="h-7 w-7 rounded-full object-cover"
    referrerPolicy="no-referrer"
  />
) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-[11px] font-bold text-white">
          {initials}
        </div>
      )}
      <span className="hidden max-w-[100px] truncate text-[12px] font-medium text-zinc-600 dark:text-zinc-300 sm:block">
        {user?.displayName || user?.email?.split("@")[0] || "Profile"}
      </span>
    </button>
  );
}

function SavedLinksWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [urlError, setUrlError] = useState("");

const userId = user?.uid;

  const fetchLinks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const linksCol = collection(db, "users", userId, "saved_links");
      const snap = await getDocs(linksCol);
      setLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchLinks();
    }
  }, [open, userId, fetchLinks]);

  function validateUrl(raw) {
    try {
      const u = raw.startsWith("http") ? raw : `https://${raw}`;
      new URL(u);
      return u;
    } catch {
      return null;
    }
  }

  async function handleAddLink() {
    setUrlError("");
    const resolved = validateUrl(newUrl.trim());
    if (!resolved) {
      setUrlError("Enter a valid URL (e.g. https://example.com)");
      return;
    }
    if (!linksCol) return;
    setAdding(true);
    try {
      const docRef = await addDoc(linksCol, {
        title: newTitle.trim() || resolved,
        url: resolved,
        createdAt: serverTimestamp(),
      });
      setLinks((prev) => [...prev, { id: docRef.id, title: newTitle.trim() || resolved, url: resolved }]);
      setNewTitle("");
      setNewUrl("");
      setShowForm(false);
    } catch {
      setUrlError("Failed to save. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "saved_links", id));
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {
      // silently fail
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/70 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
  
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/60">
            <BookmarkIcon />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">Saved Resources</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {links.length > 0 ? `${links.length} bookmark${links.length !== 1 ? "s" : ""}` : "No bookmarks yet"}
            </p>
          </div>
        </div>
        <ChevronDownIcon open={open} />
      </button>

    
{open && (
  <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
       
          {loading ? (
            <div className="flex justify-center py-6">
              <SpinnerIcon className="h-5 w-5 text-indigo-400" />
            </div>
          ) : links.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[13px] text-zinc-400 dark:text-zinc-500">
                Bookmark scholarship resources, guides, or documents here for quick access.
              </p>
            </div>
          ) : (
            <ul className="mb-3 max-h-52 space-y-1.5 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="group flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-[13px] transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                >
                  <span className="shrink-0 text-zinc-400">
                    <LinkIcon />
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-1 truncate font-medium text-zinc-700 hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400"
                  >
                    <span className="truncate">{link.title}</span>
                    <span className="shrink-0 opacity-0 transition group-hover:opacity-100">
                      <ExternalLinkIcon />
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    className="shrink-0 rounded-lg p-1 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    aria-label="Remove bookmark"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showForm ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Label (optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputClasses}
              />
              <input
                type="text"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => { setNewUrl(e.target.value); setUrlError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLink(); } }}
                className={`${inputClasses} ${urlError ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : ""}`}
              />
              {urlError && <p className="text-[12px] text-red-500">{urlError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddLink}
                  disabled={adding || !newUrl.trim()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
                >
                  {adding ? <SpinnerIcon className="h-3.5 w-3.5" /> : <PlusIcon />}
                  Save link
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewTitle(""); setNewUrl(""); setUrlError(""); }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 py-2.5 text-[13px] font-medium text-zinc-500 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            >
              <PlusIcon size="sm" /> Add bookmark
            </button>
          )}
        </div>
      )}
    </div>
  );
}


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { isDark, toggle: toggleTheme } = useTheme();

  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [recommenders, setRecommenders] = useState([{ name: "", contact: "" }]);
  const [transcripts, setTranscripts] = useState(null);
  const [certificates, setCertificates] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setFormData((prev) => ({
          ...prev,
          personal: { ...prev.personal, email: prev.personal.email || firebaseUser.email || "" },
        }));
        setCheckingAuth(false);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  function showToast(type, message) {
    setToast({ show: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 4000);
  }

  async function handleSignOut() {
    setSigningOut(true);
    setProfileOpen(false);
    try {
      await signOut(auth);
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  }

  function updateField(section, field, value) {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }

  function updateRecommender(index, field, value) {
    setRecommenders((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRecommender() {
    if (recommenders.length >= 3) return;
    setRecommenders((prev) => [...prev, { name: "", contact: "" }]);
  }

  function removeRecommender(index) {
    setRecommenders((prev) => prev.filter((_, i) => i !== index));
  }

  const isLastSection = activeSection === SECTIONS.length - 1;
  const isFirstSection = activeSection === 0;

  function goNext() { if (!isLastSection) setActiveSection((s) => s + 1); }
  function goBack() { if (!isFirstSection) setActiveSection((s) => s - 1); }

  async function uploadIfPresent(file, path) {
    if (!file) return null;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLastSection) { goNext(); return; }

    setSubmitting(true);
    try {
      const uid = user.uid;
      const transcriptUrl = await uploadIfPresent(transcripts, `transcripts/${uid}/${transcripts?.name}`);
      const certUrls = await Promise.all(
        certificates.map((f) => uploadIfPresent(f, `certificates/${uid}/${f.name}`))
      );

      await addDoc(collection(db, "applications"), {
        uid,
        submittedAt: serverTimestamp(),
        personal: formData.personal,
        academic: {
          school: formData.academic.school,
          studentGovt: formData.academic.studentGovt,
          portfolioLink: formData.academic.portfolioLink,
          transcriptUrl: transcriptUrl || null,
          certificateUrls: certUrls.filter(Boolean),
        },
        financial: formData.financial,
        leadership: formData.leadership,
        vision: formData.vision,
        recommenders,
      });

      showToast("success", "Scholarship Application Submitted Successfully!");
      setFormData({ ...initialFormData, personal: { ...initialFormData.personal, email: user.email || "" } });
      setRecommenders([{ name: "", contact: "" }]);
      setTranscripts(null);
      setCertificates([]);
      setActiveSection(0);
    } catch {
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div
        style={{ fontFamily: FONT_STACK }}
        className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#050505]"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="text-sm text-zinc-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const section = SECTIONS[activeSection];

  return (
  <div style={{ fontFamily: FONT_STACK }} className="min-h-screen overflow-y-scroll bg-zinc-50 dark:bg-[#050505]">
    
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-8">
       
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">APP</p>
              <p className="hidden text-[11px] text-zinc-400 dark:text-zinc-500 sm:block">Amra Poropokari Poribar</p>
            </div>
          </div>

       
<div className="flex items-center gap-2">

            <div className="relative" ref={profileRef}>
              <UserProfileButton user={user} onClick={() => setProfileOpen((o) => !o)} />
              {profileOpen && (
                <ProfileDrawer
                  user={user}
                  onClose={() => setProfileOpen(false)}
                  onSignOut={handleSignOut}
                  signingOut={signingOut}
                />
              )}
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="hidden items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-[12px] font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex"
            >
              {signingOut ? <SpinnerIcon /> : <SignOutIcon />}
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-indigo-500">Scholarship Application</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Amra Poropokari Poribar (APP) — Student Scholarship Application
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Tell us about yourself so we can understand your journey and needs.
          </p>
        </div>

        <div className="mb-6">
          <SavedLinksWidget user={user} />
        </div>

        <div className="mb-3 flex gap-1.5 overflow-x-auto rounded-2xl bg-zinc-100 p-1.5 dark:bg-zinc-800/70 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(i)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors ${
                i === activeSection
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <span className="mr-1.5 text-zinc-400 dark:text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500 ease-out"
            style={{ width: `${((activeSection + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="min-h-[480px] rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50 sm:p-8">
            <div className="mb-6">
              <p className="text-[12px] font-semibold text-indigo-500">{String(activeSection + 1).padStart(2, "0")}</p>
              <h2 className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{section.title}</h2>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{section.helper}</p>
            </div>

            {section.id === "personal" && (
              <div className="space-y-4">
                <Field label="Full Name">
                  <input
                    required
                    className={inputClasses}
                    placeholder="Your full name"
                    value={formData.personal.fullName}
                    onChange={(e) => updateField("personal", "fullName", e.target.value)}
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    type="email"
                    required
                    className={inputClasses}
                    placeholder="Enter Your Mail"
                    value={formData.personal.email}
                    onChange={(e) => updateField("personal", "email", e.target.value)}
                  />
                </Field>
                <Field label="Contact Number">
                  <input
                    type="tel"
                    required
                    className={inputClasses}
                    placeholder="+8801*******"
                    value={formData.personal.phone}
                    onChange={(e) => updateField("personal", "phone", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {section.id === "academic" && (
              <div className="space-y-4">
                <Field label="School / College Details" hint="Name, address, and current class or year.">
                  <textarea
                    required
                    rows={3}
                    className={inputClasses}
                    placeholder="e.g. Dhaka City College, HSC 2nd Year"
                    value={formData.academic.school}
                    onChange={(e) => updateField("academic", "school", e.target.value)}
                  />
                </Field>
                <Field label="Student Government Involvement" hint="Positions held or committees you're part of, if any.">
                  <textarea
                    rows={2}
                    className={inputClasses}
                    placeholder="e.g. General Secretary, Student Council 2025"
                    value={formData.academic.studentGovt}
                    onChange={(e) => updateField("academic", "studentGovt", e.target.value)}
                  />
                </Field>

            

                <Field label="Portfolio Link" hint="Optional — a website, blog, or drive folder showcasing your work.">
                  <input
                    type="url"
                    className={inputClasses}
                    placeholder="https://"
                    value={formData.academic.portfolioLink}
                    onChange={(e) => updateField("academic", "portfolioLink", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {section.id === "financial" && (
              <div className="space-y-4">
                <Field label="Family Income Details" hint="Approximate monthly or annual household income and occupation of earners.">
                  <textarea
                    required
                    rows={3}
                    className={inputClasses}
                    placeholder="Describe your family's income sources and approximate amount"
                    value={formData.financial.familyIncome}
                    onChange={(e) => updateField("financial", "familyIncome", e.target.value)}
                  />
                </Field>
                <Field label="Financial Need Statement" hint="Explain why this scholarship would make a difference for you.">
                  <textarea
                    required
                    rows={5}
                    className={inputClasses}
                    placeholder="Share your financial situation and what support would mean to you"
                    value={formData.financial.financialNeed}
                    onChange={(e) => updateField("financial", "financialNeed", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {section.id === "leadership" && (
              <div className="space-y-4">
                <Field label="Leadership Roles" hint="Clubs, teams, or community roles where you've led others.">
                  <textarea
                    rows={4}
                    className={inputClasses}
                    placeholder="e.g. Captain of debate team, Youth volunteer coordinator"
                    value={formData.leadership.leadershipRoles}
                    onChange={(e) => updateField("leadership", "leadershipRoles", e.target.value)}
                  />
                </Field>
                <Field label="Past Activities" hint="Extracurriculars, volunteering, or projects you're proud of.">
                  <textarea
                    rows={4}
                    className={inputClasses}
                    placeholder="Describe activities and what you learned from them"
                    value={formData.leadership.pastActivities}
                    onChange={(e) => updateField("leadership", "pastActivities", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {section.id === "vision" && (
              <div className="space-y-4">
                <Field label="Personal Story" hint="Tell us about your journey, challenges, and what drives you.">
                  <textarea
                    required
                    rows={6}
                    className={inputClasses}
                    placeholder="Share your story in your own words"
                    value={formData.vision.personalStory}
                    onChange={(e) => updateField("vision", "personalStory", e.target.value)}
                  />
                </Field>
                <Field label="Future Goals" hint="What do you hope to achieve with this scholarship's support?">
                  <textarea
                    required
                    rows={4}
                    className={inputClasses}
                    placeholder="Describe your academic and career goals"
                    value={formData.vision.futureGoals}
                    onChange={(e) => updateField("vision", "futureGoals", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {section.id === "references" && (
              <div className="space-y-4">
                {recommenders.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-zinc-800/40"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Recommender {i + 1}</p>
                      {recommenders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecommender(i)}
                          className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <TrashIcon /> Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        required
                        className={inputClasses}
                        placeholder="Full name"
                        value={rec.name}
                        onChange={(e) => updateRecommender(i, "name", e.target.value)}
                      />
                      <input
                        required
                        className={inputClasses}
                        placeholder="Email or phone number"
                        value={rec.contact}
                        onChange={(e) => updateRecommender(i, "contact", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {recommenders.length < 3 && (
                  <button
                    type="button"
                    onClick={addRecommender}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-zinc-300 py-2.5 text-[13px] font-medium text-zinc-500 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    <PlusIcon /> Add another recommender
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirstSection}
              className="rounded-2xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Back
            </button>

            {isLastSection ? (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <SpinnerIcon />}
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-2xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </main>

      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
          toast.show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div
          className={`flex items-center gap-2.5 rounded-full px-5 py-3 text-[13px] font-medium shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900"
              : "bg-red-600/95 text-white"
          }`}
        >
          {toast.type === "success" && <CheckCircleIcon />}
          {toast.message}
        </div>
      </div>
    </div>
  );
}
