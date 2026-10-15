import { FormEvent, useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowUp,
  BookOpen,
  LoaderCircle,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { LANGS, LANGUAGE_NAMES, UI, type Language } from "@shared/health";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

const suggestions: Record<Language, string[]> = {
  en: [
    "What is PCOS?",
    "What can cause irregular periods?",
    "Which symptoms need urgent care?",
    "What may support menstrual health?",
  ],
  kn: [
    "PCOS ಎಂದರೇನು?",
    "ಅನಿಯಮಿತ ಪೀರಿಯಡ್ಸ್‌ಗೆ ಏನು ಕಾರಣವಾಗಬಹುದು?",
    "ಯಾವ ಲಕ್ಷಣಗಳಿಗೆ ತುರ್ತು ಆರೈಕೆ ಬೇಕು?",
    "ಮಾಸಿಕ ಆರೋಗ್ಯಕ್ಕೆ ಏನು ಸಹಾಯವಾಗಬಹುದು?",
  ],
  hi: [
    "PCOS क्या है?",
    "अनियमित पीरियड के कारण क्या हो सकते हैं?",
    "किन लक्षणों में तुरंत सहायता लें?",
    "मासिक स्वास्थ्य में क्या सहायक हो सकता है?",
  ],
  ta: [
    "PCOS என்றால் என்ன?",
    "ஒழுங்கற்ற மாதவிடாய்க்கு என்ன காரணம்?",
    "எந்த அறிகுறிகளுக்கு அவசர உதவி தேவை?",
    "மாதவிடாய் நலனுக்கு எது உதவலாம்?",
  ],
};
export default function Chat() {
  const { user } = useAuth();
  const language = (user?.preferredLanguage || "en") as Language;
  const t = UI[language];
  const [match, params] = useRoute("/chat/:id");
  const id = match && params?.id !== "new" ? Number(params?.id) : undefined;
  const [, setLocation] = useLocation();
  const [text, setText] = useState("");
  const [languageChoice, setLanguageChoice] = useState<Language>(language);
  const [languageManuallySet, setLanguageManuallySet] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const msgs = trpc.chat.messages.useQuery(
    { conversationId: id! },
    { enabled: Boolean(id), retry: false }
  );
  const send = trpc.chat.send.useMutation({
    onSuccess: async result => {
      setText("");
      if (!id) setLocation(`/chat/${result.conversationId}`);
      else await utils.chat.messages.invalidate({ conversationId: id });
      await utils.chat.list.invalidate();
    },
    onError: () => {},
  });
  const remove = trpc.chat.remove.useMutation({
    onSuccess: async () => {
      await utils.chat.list.invalidate();
      setLocation("/chat");
    },
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.data?.length, send.isPending]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    send.mutate({
      conversationId: id,
      text: text.trim(),
      preferredLanguage: languageChoice,
      languageOverride: languageManuallySet ? languageChoice : undefined,
    });
  };
  const sendPrompt = (question: string) => {
    setText(question);
  };
  return (
    <AppShell>
      <div className="chat-layout page-content">
        <section className="chat-main">
          <div className="chat-header">
            <div>
              <span className="eyebrow plum">A PRIVATE CONVERSATION</span>
              <h1>
                {id ? "A little more understanding." : "What’s on your mind?"}
              </h1>
              <p>Ask naturally. You can switch languages as you go.</p>
            </div>
            <div className="chat-tools">
              {id && (
                <button
                  className="icon-button danger-hover"
                  title="Delete this conversation"
                  aria-label="Delete this conversation"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this conversation and its saved messages? This cannot be undone."
                      )
                    )
                      remove.mutate({ conversationId: id });
                  }}
                >
                  <Trash2 size={17} />
                </button>
              )}
              <label className="chat-language">
                <span>{t.language}</span>
                <select
                  value={languageChoice}
                  onChange={e => {
                    setLanguageChoice(e.target.value as Language);
                    setLanguageManuallySet(true);
                  }}
                >
                  {LANGS.map(code => (
                    <option value={code} key={code}>
                      {LANGUAGE_NAMES[code]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="chat-feed" aria-live="polite">
            {!id && (
              <div className="chat-welcome">
                <div className="assistant-orb">
                  <Sparkles size={19} />
                </div>
                <span className="eyebrow">A GENTLE PLACE TO BEGIN</span>
                <h2>Ask in your own words.</h2>
                <p>
                  English, ಕನ್ನಡ, हिन्दी or தமிழ். We’ll do our best to meet you
                  there.
                </p>
                <div className="suggestion-grid">
                  {suggestions[language].map(q => (
                    <button key={q} onClick={() => sendPrompt(q)}>
                      {q}
                      <ArrowUp size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {id && msgs.isLoading && (
              <div className="loading-line">
                <LoaderCircle className="spin" size={17} /> Loading your
                conversation…
              </div>
            )}
            {msgs.data?.map(m => (
              <article
                key={m.id}
                className={`message-row ${m.role === "user" ? "message-user" : "message-assistant"}`}
              >
                <div className="message-avatar">
                  {m.role === "user" ? (
                    (user?.name || "You").slice(0, 1).toUpperCase()
                  ) : (
                    <span className="mini-flower">✳</span>
                  )}
                </div>
                <div className="message-stack">
                  <div className="message-name">
                    {m.role === "user"
                      ? user?.name || "You"
                      : "Health companion"}
                    <time>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <div
                    className={`message-bubble ${m.source === "safety" ? "urgent-bubble" : ""}`}
                  >
                    {m.source === "safety" && (
                      <div className="urgent-label">
                        <ShieldAlert size={15} /> Seek urgent medical care
                      </div>
                    )}
                    {m.content}
                  </div>
                  {m.role === "assistant" && m.source === "fallback" && (
                    <span className="response-mode fallback-label">
                      {t.fallback}
                    </span>
                  )}
                  {m.role === "assistant" && m.source === "live" && (
                    <span className="response-mode">
                      <Sparkles size={12} />
                      {t.live}
                    </span>
                  )}
                </div>
              </article>
            ))}
            {send.isPending && (
              <div className="message-row message-assistant">
                <div className="message-avatar">
                  <span className="mini-flower">✳</span>
                </div>
                <div className="message-stack">
                  <div className="message-name">Health companion</div>
                  <div className="message-bubble thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            {send.error && (
              <div className="inline-error" role="alert">
                {send.error.message} Your message is still here—please try
                again.
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form onSubmit={submit} className="composer">
            <label className="sr-only" htmlFor="chat-message">
              Your health question
            </label>
            <textarea
              id="chat-message"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
              rows={2}
              maxLength={6000}
              placeholder={t.placeholder}
            />
            <div className="composer-tools">
              <span>Shift + Enter for a new line · {text.length}/6000</span>
              <button
                className="send-button"
                disabled={!text.trim() || send.isPending}
                aria-label={t.send}
              >
                {send.isPending ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <ArrowUp size={19} />
                )}
              </button>
            </div>
          </form>
          <div className="chat-disclaimer">{t.safety}</div>
        </section>
        <aside className="chat-aside">
          <div className="aside-card">
            <span className="aside-icon">
              <BookOpen size={17} />
            </span>
            <span className="eyebrow">A QUICK NOTE</span>
            <h3>Information, not a diagnosis.</h3>
            <p>
              Health questions deserve care. A qualified professional can
              consider your full history and help you decide what to do next.
            </p>
          </div>
          <div className="aside-suggest">
            <span className="eyebrow">YOUR LANGUAGE</span>
            <p>
              Responses follow the language you use. Choose a different one
              above any time.
            </p>
            <span className="language-pill">
              EN&nbsp;&nbsp; ಕನ್ನಡ&nbsp;&nbsp; हिन्दी&nbsp;&nbsp; தமிழ்
            </span>
          </div>
          <div className="aside-urgent">
            <ShieldAlert size={17} />
            <div>
              <b>If something feels urgent</b>
              <p>
                Seek local medical help now for severe or rapidly worsening
                symptoms.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
