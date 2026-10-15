import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { LANGS, LANGUAGE_NAMES, UI, type Language } from "@shared/health";

export default function Register() {
  const { user } = useAuth();
  const lang = (user?.preferredLanguage || "en") as Language;
  const t = UI[lang];
  const [name, setName] = useState("Akhila");
  const [username, setUsername] = useState("akhila");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState<Language>(lang);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const mutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: e => setError(e.message),
  });
  const strong =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!strong) {
      setError(
        "Use 8+ characters with uppercase, lowercase, a number and a special character."
      );
      return;
    }
    mutation.mutate({
      name,
      username,
      password,
      confirmPassword,
      preferredLanguage: language,
    });
  };
  return (
    <div className="register-page">
      <header className="auth-topbar">
        <Link href="/login" className="brand">
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
        </Link>
        <span className="secure-label">
          <ShieldCheck size={16} /> Private by design
        </span>
      </header>
      <main className="register-main">
        <aside className="register-intro">
          <span className="eyebrow plum">A SPACE THAT’S YOURS</span>
          <h1>
            Make room for
            <br />
            <em>your questions.</em>
          </h1>
          <p>
            Your personal, multilingual place for clear women’s health
            education. Start with only the details needed to keep your account
            private.
          </p>
          <div className="register-quote">
            <span>“</span>
            <p>Understanding can start with one honest question.</p>
          </div>
          <div className="register-language-note">
            <span className="language-dots">EN · ಕ · हि · த</span>
            <span>Ask in the language that feels natural to you.</span>
          </div>
        </aside>
        <section className="register-card">
          <div className="eyebrow plum">CREATE YOUR PRIVATE ACCOUNT</div>
          <h2>{t.register}</h2>
          <p className="form-subtitle">No email or outside service required.</p>
          <form className="auth-form" onSubmit={submit}>
            <label>
              {t.name}
              <input
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                placeholder="Your name"
              />
            </label>
            <label>
              {t.username}
              <input
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, ""))}
                required
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_.-]+"
                placeholder="Choose a unique username"
              />
              <small>
                3–32 characters. Letters, numbers, dot, dash or underscore.
              </small>
            </label>
            <label>
              {t.language}
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as Language)}
              >
                {LANGS.map(code => (
                  <option key={code} value={code}>
                    {LANGUAGE_NAMES[code]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.password}
              <span className="password-wrap">
                <input
                  autoComplete="new-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  maxLength={128}
                  placeholder="Create a strong password"
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
              <small
                className={password ? (strong ? "rule-good" : "rule-note") : ""}
              >
                {strong
                  ? "Password meets all requirements."
                  : "At least 8 characters, uppercase, lowercase, number and special character."}
              </small>
            </label>
            <label>
              {t.confirm}
              <input
                autoComplete="new-password"
                type={show ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                maxLength={128}
                placeholder="Enter it once more"
              />
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="button-primary auth-submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <span className="spinner" />
                  Creating account…
                </>
              ) : (
                <>
                  {t.create}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/login">
              Sign in <ArrowRight size={14} />
            </Link>
          </p>
          <p className="auth-legal">
            By continuing, you understand this app offers education and care
            guidance—not diagnosis.
          </p>
        </section>
      </main>
    </div>
  );
}
