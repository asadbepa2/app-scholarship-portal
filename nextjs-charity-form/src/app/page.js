"use client";

import Image from "next/image"; // MUST BE AT THE VERY TOP
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// ... rest of your code

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, 'Helvetica Neue', Arial, sans-serif";

const googleProvider = new GoogleAuthProvider();

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
      <path d="M3.5 6.5h17a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3.5 7 8.5 6.2L20.5 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
      <path d="M3.5 3.5 20.5 20.5" strokeLinecap="round" />
      <path d="M6.4 6.6C3.9 8.2 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.8 0 3.3-.4 4.6-1.1M9.9 5.9A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.3 15.3 0 0 1-2.5 3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.8 10a2.6 2.6 0 0 0 3.7 3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.85-.08-1.66-.22-2.45H12v4.63h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1C3.25 21.3 7.28 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.31A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.39-2.31v-3.1H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.41l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.6 4.6 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.25 2.7 1.28 6.59l4.01 3.1C6.23 6.86 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isSignup && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err?.code));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      style={{ fontFamily: FONT_STACK }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-12 dark:bg-[#050505]"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400 to-sky-300 opacity-20 blur-3xl dark:opacity-10" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-gradient-to-tr from-sky-300 to-emerald-300 opacity-20 blur-3xl dark:opacity-10" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-300 to-indigo-300 opacity-10 blur-3xl dark:opacity-[0.06]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] sm:p-10">
          {/* Brand */}
          <div className="flex flex-col items-center text-center">
           
<img
  src="/lolo.png"
  alt="Amra Poropokari Poribar Logo"
  className="h-16 w-16 object-contain"
/>
            <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Amra Poropokari Poribar
            </h1>
            <p className="mt-1 text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
              APP · We are each other&rsquo;s family
            </p>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {googleLoading ? <SpinnerIcon /> : <GoogleIcon />}
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            <span className="text-[12px] font-medium text-zinc-400 dark:text-zinc-600">or continue with email</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
          </div>

          {/* Segmented control */}
          <div className="relative grid grid-cols-2 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/70">
            <div
              className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm shadow-zinc-900/5 transition-transform duration-300 ease-out dark:bg-zinc-700 ${
                isSignup ? "translate-x-[calc(100%+8px)]" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`relative z-10 rounded-xl py-2 text-sm font-medium transition-colors ${
                !isSignup ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`relative z-10 rounded-xl py-2 text-sm font-medium transition-colors ${
                isSignup ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                Email address
              </label>
              <div className="flex items-center gap-2.5 rounded-2xl border border-transparent bg-zinc-100/80 px-4 py-3 text-sm text-zinc-900 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/40 dark:bg-zinc-800/60 dark:text-zinc-100 dark:focus-within:bg-zinc-800">
                <span className="text-zinc-400 dark:text-zinc-500">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                Password
              </label>
              <div className="flex items-center gap-2.5 rounded-2xl border border-transparent bg-zinc-100/80 px-4 py-3 text-sm text-zinc-900 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/40 dark:bg-zinc-800/60 dark:text-zinc-100 dark:focus-within:bg-zinc-800">
                <span className="text-zinc-400 dark:text-zinc-500">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
                  Confirm password
                </label>
                <div className="flex items-center gap-2.5 rounded-2xl border border-transparent bg-zinc-100/80 px-4 py-3 text-sm text-zinc-900 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/40 dark:bg-zinc-800/60 dark:text-zinc-100 dark:focus-within:bg-zinc-800">
                  <span className="text-zinc-400 dark:text-zinc-500">
                    <LockIcon />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <SpinnerIcon />}
              {loading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-zinc-400 dark:text-zinc-600">
          Amra Poropokari Poribar (APP) · Student Scholarship Portal
        </p>
      </div>
    </div>
  );
}