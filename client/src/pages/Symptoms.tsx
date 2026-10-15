import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  ShieldAlert,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { LANGS, LANGUAGE_NAMES, UI, type Language } from "@shared/health";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

type Result = {
  id: number;
  originalDescription: string;
  language: Language;
  summary: string;
  nextSteps: string;
  source: "live" | "fallback" | "safety";
  urgent: boolean;
};
export default function Symptoms() {
  const { user } = useAuth();
  const language = (user?.preferredLanguage || "en") as Language;
  const t = UI[language];
  const [choice, setChoice] = useState<Language>(language);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const utils = trpc.useUtils();
  const reports = trpc.symptoms.list.useQuery();
  const analyze = trpc.symptoms.analyze.useMutation({
    onSuccess: r => {
      setResult(r as Result);
      void utils.symptoms.list.invalidate();
    },
  });
  const del = trpc.symptoms.delete.useMutation({
    onSuccess: () => utils.symptoms.list.invalidate(),
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim())
      analyze.mutate({
        description,
        preferredLanguage: choice,
        languageOverride: choice,
      });
  };
  return (
    <AppShell>
      <div className="page-content inner-page symptoms-page">
        <div className="page-kicker">
          <span className="eyebrow plum">NOTICE, ORGANIZE, REFLECT</span>
          <span className="privacy-chip">Private to your account</span>
        </div>
        <h1>
          Put your symptoms
          <br />
          <em>into your own words.</em>
        </h1>
        <p className="lead-copy">
          Share only what feels relevant. We’ll help organize the details you
          provide—without filling in anything you haven’t told us.
        </p>
        <div className="safety-inline">
          <ShieldAlert size={18} />
          <span>
            This isn’t a diagnostic tool. If your symptoms are severe or feel
            urgent, seek medical help now.
          </span>
        </div>
        <form className="symptom-form" onSubmit={submit}>
          <div className="form-head">
            <div>
              <span className="step-label">YOUR DESCRIPTION</span>
              <h2>What have you noticed?</h2>
            </div>
            <label className="compact-language">
              {t.language}
              <select
                value={choice}
                onChange={e => setChoice(e.target.value as Language)}
              >
                {LANGS.map(l => (
                  <option value={l} key={l}>
                    {LANGUAGE_NAMES[l]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="form-hint">
            You can mention timing, frequency, cycle changes or discomfort. Skip
            anything you’d rather not share.
          </p>
          <label className="sr-only" htmlFor="symptom-description">
            {t.symptomPrompt}
          </label>
          <textarea
            id="symptom-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={6000}
            rows={6}
            placeholder={t.symptomPrompt}
          />
          <div className="symptom-form-foot">
            <span>{description.length}/6000</span>
            <button
              className="button-primary"
              disabled={analyze.isPending || description.trim().length < 3}
            >
              {analyze.isPending ? (
                <>
                  <span className="spinner" />
                  Organizing…
                </>
              ) : (
                <>
                  {t.analyze}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
          {analyze.error && (
            <div role="alert" className="form-error">
              {analyze.error.message}
            </div>
          )}
        </form>
        {result && (
          <section
            className={`result-card ${result.urgent ? "result-urgent" : ""}`}
            aria-live="polite"
          >
            {result.urgent && (
              <div className="urgent-label">
                <ShieldAlert size={16} /> Seek urgent medical care now
              </div>
            )}
            <div className="section-heading">
              <div>
                <span className="eyebrow plum">YOUR NOTES, ORGANIZED</span>
                <h2>{t.summary}</h2>
              </div>
              <span className="source-badge">
                {result.source === "live"
                  ? t.live
                  : result.source === "safety"
                    ? "Safety guidance"
                    : t.fallback}
              </span>
            </div>
            <div className="original-quote">
              <span className="eyebrow">{t.original}</span>
              <p>“{result.originalDescription}”</p>
            </div>
            <div className="structured-summary">
              <pre>{result.summary}</pre>
            </div>
            <p className="next-step">
              <Check size={16} />
              {result.nextSteps}
            </p>
            <div className="result-disclaimer">
              Nothing here confirms a condition. You can edit your original
              description above and create a corrected summary.
            </div>
          </section>
        )}
        <section className="saved-reports">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ONLY YOU CAN SEE THESE</span>
              <h2>Saved symptom notes</h2>
            </div>
            <Stethoscope size={19} />
          </div>
          {reports.isLoading ? (
            <div className="loading-line">Loading…</div>
          ) : !reports.data?.length ? (
            <div className="empty-card">
              <span className="empty-icon">
                <Clock3 size={19} />
              </span>
              <div>
                <b>No saved notes yet.</b>
                <p>
                  When you create a summary, it will be kept privately in your
                  account.
                </p>
              </div>
            </div>
          ) : (
            reports.data.map(row => (
              <article className="saved-report" key={row.id}>
                <div>
                  <span className="report-date">
                    <Clock3 size={13} />
                    {new Date(row.createdAt).toLocaleDateString()}
                  </span>
                  <p>{row.originalDescription}</p>
                  <small>
                    {row.source === "fallback"
                      ? t.fallback
                      : row.source === "safety"
                        ? "Safety guidance"
                        : t.live}
                  </small>
                </div>
                <button
                  className="icon-button danger-hover"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this saved symptom report? This cannot be undone."
                      )
                    )
                      del.mutate({ id: row.id });
                  }}
                  title={t.delete}
                  aria-label={t.delete}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
