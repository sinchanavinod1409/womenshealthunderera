import { ArrowUpRight, BookOpenCheck, Leaf, ShieldCheck } from "lucide-react";
import { LANGS, LANGUAGE_NAMES, PCOS, UI, type Language } from "@shared/health";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";
export default function Pcos() {
  const { user } = useAuth();
  const lang = (user?.preferredLanguage || "en") as Language;
  const copy = PCOS[lang];
  const t = UI[lang];
  const setLanguage = trpc.auth.setLanguage.useMutation();
  const utils = trpc.useUtils();
  const change = (value: Language) =>
    setLanguage.mutate(
      { language: value },
      { onSuccess: () => utils.auth.me.invalidate() }
    );
  return (
    <AppShell>
      <div className="page-content inner-page pcos-page">
        <div className="page-kicker">
          <span className="eyebrow plum">A CLEARER PICTURE</span>
          <label className="compact-language">
            <span className="sr-only">{t.language}</span>
            <select
              value={lang}
              onChange={e => change(e.target.value as Language)}
              aria-label={t.language}
            >
              {LANGS.map(l => (
                <option value={l} key={l}>
                  {LANGUAGE_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="pcos-hero">
          <div className="pcos-hero-copy">
            <span className="eyebrow">LEARN AT YOUR OWN PACE</span>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
            <div className="pcos-hero-footer">
              <span>
                <BookOpenCheck size={16} /> Evidence-informed education
              </span>
              <span>
                <ShieldCheck size={16} /> No self-diagnosis
              </span>
            </div>
          </div>
          <div className="pcos-illustration" aria-hidden="true">
            <div className="sun-disc" />
            <svg viewBox="0 0 300 270">
              <path
                d="M150 220C136 178 112 158 89 151c-35-11-52-40-37-69 17-32 57-28 76-5 18-33 62-37 82-7 19 29 2 61-30 73-22 9-28 33-30 77Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M147 220c1-45 1-80 4-122M151 140l-40-35m42 59 45-41m-45 77-44-22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="150" cy="51" r="5" fill="currentColor" />
              <circle cx="71" cy="88" r="4" fill="currentColor" />
              <circle cx="230" cy="81" r="5" fill="currentColor" />
              <circle cx="77" cy="153" r="3" fill="currentColor" />
              <circle cx="226" cy="144" r="3" fill="currentColor" />
            </svg>
            <span className="illustration-caption">
              your body
              <br />
              is not a puzzle
              <br />
              to solve alone
            </span>
          </div>
        </div>
        <div className="pcos-contents">
          {copy.sections.map((section, index) => (
            <article className="education-section" key={section.heading}>
              <span className="education-index">0{index + 1}</span>
              <div>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </div>
              {index === 3 && <Leaf className="education-icon" size={20} />}
            </article>
          ))}
        </div>
        <div className="source-panel">
          <div>
            <span className="eyebrow plum">GROUNDED IN GUIDANCE</span>
            <h2>{t.sources}</h2>
            <p>
              This overview is educational and is not personal medical advice.
              Guidance can change; discuss your own health with a qualified
              professional.
            </p>
          </div>
          <div className="source-links">
            <a
              href="https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome"
              target="_blank"
              rel="noreferrer"
            >
              <span>World Health Organization · PCOS fact sheet</span>
              <ArrowUpRight size={16} />
            </a>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/37580314/"
              target="_blank"
              rel="noreferrer"
            >
              <span>
                2023 International Evidence-based PCOS Guideline · PubMed
              </span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
