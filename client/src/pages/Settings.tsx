import { useState } from "react";
import { Check, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";
import { LANGS, LANGUAGE_NAMES, UI, type Language } from "@shared/health";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";
export default function Settings() {
  const { user } = useAuth();
  const initial = (user?.preferredLanguage || "en") as Language;
  const [lang, setLang] = useState<Language>(initial);
  const [saved, setSaved] = useState(false);
  const t = UI[initial];
  const utils = trpc.useUtils();
  const update = trpc.auth.setLanguage.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });
  return (
    <AppShell>
      <div className="page-content inner-page settings-page">
        <span className="eyebrow plum">YOUR ACCOUNT, YOUR CHOICES</span>
        <h1>Settings</h1>
        <p className="lead-copy">
          A few simple preferences for how this space works for you.
        </p>
        <section className="settings-card">
          <span className="setting-icon">
            <Globe2 size={19} />
          </span>
          <div className="setting-copy">
            <h2>{t.language}</h2>
            <p>
              Chat replies follow the language of your message when we can
              detect it. This preference is used when a message is ambiguous and
              for the interface.
            </p>
            <div className="setting-controls">
              <select
                value={lang}
                onChange={e => {
                  setLang(e.target.value as Language);
                  setSaved(false);
                }}
                aria-label={t.language}
              >
                {LANGS.map(l => (
                  <option value={l} key={l}>
                    {LANGUAGE_NAMES[l]}
                  </option>
                ))}
              </select>
              <button
                className="button-primary"
                onClick={() => update.mutate({ language: lang })}
                disabled={update.isPending}
              >
                {update.isPending ? "Saving…" : t.save}
              </button>
              {saved && (
                <span className="save-confirm">
                  <Check size={15} />
                  {t.prefsSaved}
                </span>
              )}
            </div>
          </div>
        </section>
        <section className="settings-card">
          <span className="setting-icon">
            <LockKeyhole size={19} />
          </span>
          <div className="setting-copy">
            <h2>Your saved information</h2>
            <p>
              Your conversations and symptom notes are kept in your account. You
              can delete your own records from their pages. This app does not
              ask for a medical history beyond what you choose to share.
            </p>
          </div>
        </section>
        <section className="settings-card">
          <span className="setting-icon">
            <ShieldCheck size={19} />
          </span>
          <div className="setting-copy">
            <h2>What this service can—and cannot—do</h2>
            <p>
              It provides general education and care guidance. It cannot
              diagnose a condition, prescribe treatment, or replace a qualified
              healthcare professional. For urgent symptoms, seek local medical
              care now.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
