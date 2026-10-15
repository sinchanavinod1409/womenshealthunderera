import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  MessageCircle,
  Plus,
  Sparkles,
  Stethoscope,
  BookOpen,
  Clock3,
} from "lucide-react";
import { Link } from "wouter";
import { UI, type Language } from "@shared/health";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

export default function Dashboard() {
  const { user } = useAuth();
  const language = (user?.preferredLanguage || "en") as Language;
  const t = UI[language];
  const chats = trpc.chat.list.useQuery();
  const reports = trpc.symptoms.list.useQuery();
  const date = new Intl.DateTimeFormat(
    language === "kn"
      ? "kn-IN"
      : language === "hi"
        ? "hi-IN"
        : language === "ta"
          ? "ta-IN"
          : "en",
    { weekday: "long", month: "long", day: "numeric" }
  ).format(new Date());
  return (
    <AppShell>
      <div className="page-content dashboard-page">
        <div className="dashboard-topline">
          <span className="eyebrow plum">A SPACE FOR YOUR WELLBEING</span>
          <span className="today-date">
            <CalendarDays size={15} />
            {date}
          </span>
        </div>
        <section className="welcome-block">
          <div>
            <h1>
              {user?.name
                ? `Hello, ${user.name.split(" ")[0]}.`
                : "Hello there."}
              <br />
              <em>{t.welcome}</em>
            </h1>
            <p>
              Ask what’s on your mind. Learn at your own pace. Your health story
              is yours to tell.
            </p>
          </div>
          <span className="welcome-stamp">
            <span>
              YOUR
              <br />
              HEALTH
              <br />
              JOURNAL
            </span>
            <Sparkles size={14} />
          </span>
        </section>
        <div className="quick-actions">
          <Link href="/chat" className="action-card action-chat">
            <span className="action-icon">
              <MessageCircle size={19} />
            </span>
            <span className="action-copy">
              <small>START HERE</small>
              <b>{t.start}</b>
              <span>Ask a question in the language you prefer.</span>
            </span>
            <ArrowUpRight size={18} className="action-arrow" />
          </Link>
          <Link href="/symptoms" className="action-card">
            <span className="action-icon blush">
              <Stethoscope size={19} />
            </span>
            <span className="action-copy">
              <small>MAKE SENSE OF IT</small>
              <b>{t.symptoms}</b>
              <span>Organize what you’ve been noticing.</span>
            </span>
            <ArrowUpRight size={18} className="action-arrow" />
          </Link>
          <Link href="/pcos" className="action-card">
            <span className="action-icon sage">
              <BookOpen size={19} />
            </span>
            <span className="action-copy">
              <small>LEARN, GENTLY</small>
              <b>{t.pcos}</b>
              <span>Explore clear, evidence-informed basics.</span>
            </span>
            <ArrowUpRight size={18} className="action-arrow" />
          </Link>
        </div>
        <section className="history-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR PRIVATE NOTES</span>
              <h2>Recent conversations</h2>
            </div>
            <Link href="/chat" className="text-link">
              <Plus size={16} />
              {t.newChat}
            </Link>
          </div>
          {chats.isLoading ? (
            <div className="loading-line">
              <span className="spinner" /> Loading…
            </div>
          ) : !chats.data?.length ? (
            <div className="empty-card">
              <span className="empty-icon">
                <MessageCircle size={20} />
              </span>
              <div>
                <b>{t.empty}</b>
                <p>
                  Questions are a good place to begin. You can delete saved
                  conversations whenever you like.
                </p>
              </div>
              <Link href="/chat" className="text-link">
                Start one <ChevronRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="conversation-list">
              {chats.data.slice(0, 5).map((c, i) => (
                <Link
                  href={`/chat/${c.id}`}
                  key={c.id}
                  className="conversation-row"
                >
                  <span className="history-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="conversation-title">{c.title}</span>
                  <span className="history-meta">
                    <Clock3 size={14} />
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <div className="dashboard-bottom">
          <div className="support-note">
            <span className="support-icon">✳</span>
            <div>
              <b>Curiosity is a good first step.</b>
              <p>
                This space shares health education and care guidance. It cannot
                diagnose or replace a clinician.
              </p>
            </div>
          </div>
          <div className="report-mini">
            <span className="eyebrow">SYMPTOM NOTES</span>
            <b>
              {reports.data?.length ?? 0} saved{" "}
              {reports.data?.length === 1 ? "summary" : "summaries"}
            </b>
            <Link href="/symptoms" className="subtle-link">
              Review your notes <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
