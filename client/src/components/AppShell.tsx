import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { LANGS, LANGUAGE_NAMES, UI, type Language } from "@shared/health";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const language = (user?.preferredLanguage || "en") as Language;
  const copy = UI[language];
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/login");
    },
  });
  const setLanguage = trpc.auth.setLanguage.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
  });
  const activePath = location.startsWith("/chat") ? "/chat" : location;
  const nav = [
    { href: "/dashboard", label: copy.dashboard, icon: Sparkles },
    { href: "/chat", label: copy.chat, icon: MessageCircle },
    { href: "/symptoms", label: copy.symptoms, icon: Stethoscope },
    { href: "/pcos", label: copy.pcos, icon: BookOpen },
    { href: "/settings", label: copy.settings, icon: Settings2 },
  ];
  return (
    <div className="app-shell">
      <aside className={`side-panel ${mobileOpen ? "side-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
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
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>
        <Link
          href="/chat"
          className="new-chat-button"
          onClick={() => setMobileOpen(false)}
        >
          <Plus size={17} />
          {copy.newChat}
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`nav-link ${activePath === href ? "nav-active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {activePath === href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={17} />
          <p>Your conversations stay private to your account.</p>
        </div>
        <div className="sidebar-spacer" />
        <div className="language-control">
          <label htmlFor="language-side">{copy.language}</label>
          <span className="select-wrap">
            <select
              id="language-side"
              value={language}
              onChange={e =>
                setLanguage.mutate({ language: e.target.value as Language })
              }
            >
              {LANGS.map(code => (
                <option key={code} value={code}>
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </span>
        </div>
        <div className="profile-row">
          <div className="avatar-mark">
            {(user?.name || user?.username || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-name">
            <b>{user?.name || user?.username}</b>
            <small>@{user?.username}</small>
          </div>
          <button
            className="icon-button logout-button"
            title={copy.logout}
            aria-label={copy.logout}
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut size={17} />
          </button>
        </div>
        <div className="sidebar-footer">
          <CircleHelp size={13} /> <span>Not medical advice</span>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main className="main-area">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <span className="mobile-wordmark">
            WOMEN’S <i>HEALTH</i>
          </span>
          <button
            className="icon-button"
            onClick={() => setLocation("/chat")}
            aria-label={copy.newChat}
          >
            <Plus size={20} />
          </button>
        </header>
        {children}
        <footer className="content-footer">
          <span>WOMEN’S HEALTH · EDUCATION & CARE GUIDANCE</span>
          <span>Your story stays yours.</span>
        </footer>
      </main>
    </div>
  );
}
