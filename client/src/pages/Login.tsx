import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { UI, type Language } from "@shared/health";

export default function Login() {
  const { user } = useAuth();
  const lang = (user?.preferredLanguage || "en") as Language;
  const t = UI[lang];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const mutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setError("");
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: e => setError(e.message),
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    mutation.mutate({ username, password, remember });
  };
  return (
    <div className="auth-page">
      <section className="auth-art">
        <div className="auth-art-top">
          <div className="brand brand-light">
            <span className="brand-mark">
              <svg viewBox="0 0 40 40">
                <path
                  d="M20 19C10 18 10 8 17 8c4 0 5 5 3 11Zm1 1c1-10 11-10 11-3 0 4-5 5-11 3Zm-1 1c10 1 10 11 3 11-4 0-5-5-3-11Zm-1-1c-1 10-11 10-11 3 0-4 5-5 11-3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="20" r="2.2" fill="currentColor" />
              </svg>
            </span>
            <span>
              <b>
                WOMEN’S
                <br />
                HEALTH
              </b>
              <small>CARE, IN YOUR WORDS</small>
            </span>
          </div>
          <span className="auth-edition">A little more room to ask.</span>
        </div>
        <div className="auth-art-copy">
          <span className="eyebrow">YOUR HEALTH. YOUR LANGUAGE.</span>
          <h1>
            There’s space
            <br />
            for every question.
          </h1>
          <p>
            Thoughtful women’s health education, in English, ಕನ್ನಡ, हिन्दी and
            தமிழ்.
          </p>
          <div className="art-orbit">
            <span className="orbit-center">
              care
              <br />
              for you
            </span>
            <span className="orbit-chip chip-one">listen</span>
            <span className="orbit-chip chip-two">learn</span>
            <span className="orbit-chip chip-three">understand</span>
            <svg viewBox="0 0 400 260">
              <ellipse
                cx="200"
                cy="130"
                rx="148"
                ry="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <ellipse
                cx="200"
                cy="130"
                rx="100"
                ry="130"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                transform="rotate(55 200 130)"
              />
            </svg>
          </div>
        </div>
        <div className="auth-art-foot">
          <ShieldCheck size={16} /> Private by design. Education, not diagnosis.
        </div>
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <span className="mobile-auth-mark">
            <span className="brand-mark">
              <svg viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 9v22M9 20h22"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            WOMEN’S HEALTH
          </span>
          <span className="eyebrow plum">YOUR PRIVATE HEALTH SPACE</span>
          <h2>{t.login}</h2>
          <p className="form-subtitle">Pick up where you left off.</p>
          <form onSubmit={submit} className="auth-form">
            <label>
              {t.username}
              <input
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={32}
                placeholder="e.g. ananya_28"
              />
            </label>
            <label>
              {t.password}
              <span className="password-wrap">
                <input
                  autoComplete="current-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span>{t.remember}</span>
              <small>Keep you signed in on this device</small>
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="button-primary auth-submit"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  {t.loginCta}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            New here?{" "}
            <Link href="/register">
              Create your private account <ArrowRight size={14} />
            </Link>
          </p>
          <div className="auth-disclaimer">
            <LockKeyhole size={15} />
            <span>
              Health details are saved only in your account. {t.safety}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
