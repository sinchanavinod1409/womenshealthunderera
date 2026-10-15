import { invokeLLM } from "./_core/llm";
import {
  fallbackAnswer,
  matchesResponseLanguage,
  resolveLanguage,
  summarizeSymptoms,
  type Language,
} from "../shared/health";

const MODEL = "claude-sonnet-4-6"; // Present in the project's live Manus model catalog (verified 2026-10-15).
const LANGUAGE_LABEL: Record<Language, string> = {
  en: "English",
  kn: "Kannada",
  hi: "Hindi",
  ta: "Tamil",
};
const contentText = (content: unknown): string => {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content))
    return content
      .map(part =>
        typeof part === "object" && part && "text" in part
          ? String((part as { text: unknown }).text)
          : ""
      )
      .join("\n")
      .trim();
  return "";
};

export async function liveChatAnswer(input: {
  text: string;
  language: Language;
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const response = await invokeLLM({
    model: MODEL,
    maxTokens: 900,
    messages: [
      {
        role: "system",
        content: `You are a respectful, evidence-informed women’s health education assistant. Reply entirely in ${LANGUAGE_LABEL[input.language]} because that is the detected language of the latest message. Keep this language for follow-ups unless the user explicitly requests another. Understand the user's language directly; never ask for English translation. Do not diagnose, prescribe or claim certainty. Explain when causes overlap and what is unknown. Do not invent user history or symptoms. Encourage a qualified health professional where appropriate. If urgent symptoms are present, prioritize direct urgent-care guidance. Use plain, accessible language and clear paragraphs. This service provides education and care guidance, not a medical diagnosis or a substitute for professional care.`,
      },
      ...input.history
        .slice(-10)
        .map(message => ({ role: message.role, content: message.content })),
      { role: "user", content: input.text },
    ],
  });
  const answer = contentText(response.choices?.[0]?.message?.content);
  if (!answer)
    throw new Error("The live health model returned no usable answer");
  if (!matchesResponseLanguage(answer, input.language))
    throw new Error("The live model did not answer in the requested language");
  return answer;
}

function cleanJson(text: string): Record<string, unknown> {
  const noFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No structured symptom result");
  const parsed: unknown = JSON.parse(noFence.slice(start, end + 1));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Invalid structured symptom result");
  return parsed as Record<string, unknown>;
}
const safeText = (value: unknown, max = 1200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const safeList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === "string")
        .map(v => v.slice(0, 240))
        .slice(0, 12)
    : [];

export async function liveSymptomSummary(original: string, language: Language) {
  const label = LANGUAGE_LABEL[language];
  const response = await invokeLLM({
    model: MODEL,
    maxTokens: 900,
    messages: [
      {
        role: "system",
        content: `Organize only the symptoms explicitly stated by the user. Respond in ${label}. Do not diagnose, infer history, convert uncertainty into fact, or suggest medication. Unknown means not stated; never fill a missing value by guessing. Return one JSON object only with exactly these keys: reportedSymptoms (array of short strings), duration (string or null), frequency (string or null), severity (string or null), context (string or null), unknowns (array of strings), questions (array of at most 3 brief, respectful, relevant clarification questions), summary (string), nextSteps (string). All user-facing text must be in ${label}. The summary should preserve their description and mark unknown information. Ask no question when urgent symptoms are reported. Otherwise questions should only address information needed to understand their own description. nextSteps may invite them to correct a misunderstanding and suggest appropriate non-diagnostic care.`,
      },
      {
        role: "user",
        content: `Language: ${label}. Original description (preserve, do not alter):\n${original}`,
      },
    ],
  });
  const output = contentText(response.choices?.[0]?.message?.content);
  const data = cleanJson(output);
  const summary = safeText(data.summary);
  const nextSteps = safeText(data.nextSteps);
  if (!summary || !nextSteps)
    throw new Error("The live model returned an incomplete symptom summary");
  const result = {
    summary,
    nextSteps,
    reportedSymptoms: safeList(data.reportedSymptoms),
    duration: safeText(data.duration, 240) || null,
    frequency: safeText(data.frequency, 240) || null,
    severity: safeText(data.severity, 240) || null,
    context: safeText(data.context, 400) || null,
    unknowns: safeList(data.unknowns),
    questions: safeList(data.questions).slice(0, 3),
  };
  const userFacingText = [
    result.summary,
    result.nextSteps,
    ...result.reportedSymptoms,
    result.duration ?? "",
    result.frequency ?? "",
    result.severity ?? "",
    result.context ?? "",
    ...result.unknowns,
    ...result.questions,
  ].join("\n");
  if (!matchesResponseLanguage(userFacingText, language))
    throw new Error(
      "The live symptom summary did not use the requested language"
    );
  return result;
}

export function fallbackChatAnswer(text: string, language: Language) {
  return fallbackAnswer(text, language);
}
export function fallbackSymptomSummary(text: string, language: Language) {
  return summarizeSymptoms(text, language);
}
export function languageForMessage(
  text: string,
  preferred: Language,
  conversation?: Language
) {
  return resolveLanguage(text, preferred, conversation);
}
