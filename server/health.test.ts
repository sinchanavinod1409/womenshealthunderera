import { describe, expect, it } from "vitest";
import {
  hashPassword,
  meetsPasswordPolicy,
  verifyPassword,
  hashSessionToken,
} from "./auth";
import {
  detectScriptLanguage,
  fallbackAnswer,
  matchesResponseLanguage,
  resolveLanguage,
  summarizeSymptoms,
  urgentWarning,
} from "../shared/health";

describe("account security", () => {
  it("enforces the requested password composition", () => {
    expect(meetsPasswordPolicy("Strong@123")).toBe(true);
    expect(meetsPasswordPolicy("shortA1!")).toBe(true);
    expect(meetsPasswordPolicy("alllower1!")).toBe(false);
    expect(meetsPasswordPolicy("NoNumber!x")).toBe(false);
    expect(meetsPasswordPolicy("NoSpecial12")).toBe(false);
    expect(meetsPasswordPolicy("Aa1!")).toBe(false);
  });
  it("stores a salted scrypt hash and verifies only the original secret", async () => {
    const password = "Private@123";
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("Different@123", hash)).toBe(false);
    expect(await verifyPassword(password, null)).toBe(false);
  });
  it("keeps session token material one-way", () => {
    expect(hashSessionToken("random-session-token")).not.toBe(
      "random-session-token"
    );
    expect(hashSessionToken("random-session-token")).toHaveLength(64);
  });
});

describe("multilingual health handling", () => {
  it.each([
    ["What are PCOS symptoms?", "en"],
    ["PCOS ಲಕ್ಷಣಗಳು ಯಾವುವು?", "kn"],
    ["PCOS के सामान्य लक्षण क्या हैं?", "hi"],
    ["PCOS அறிகுறிகள் என்ன?", "ta"],
  ] as const)("detects script for %s", (text, expected) => {
    expect(detectScriptLanguage(text)).toBe(expected);
    expect(resolveLanguage(text, "en")).toBe(expected);
  });
  it("preserves conversation language for ambiguous follow-ups and honors a clear language switch", () => {
    expect(resolveLanguage("And what can help?", "en", "ta")).toBe("ta");
    expect(resolveLanguage("Please answer in Hindi", "en", "en")).toBe("hi");
    expect(detectScriptLanguage("Nanage periods sariyagi baruttilla")).toBe(
      "kn"
    );
    expect(detectScriptLanguage("Mujhe periods regular nahi hain")).toBe("hi");
    expect(detectScriptLanguage("Enakku period varala")).toBe("ta");
  });
  it("accepts the requested writing system and rejects materially wrong-language output", () => {
    expect(matchesResponseLanguage("தமிழில் தெளிவான பதில். PCOS", "ta")).toBe(
      true
    );
    expect(
      matchesResponseLanguage("Tamil language answer: தமிழில் உதவி", "ta")
    ).toBe(false);
    expect(matchesResponseLanguage("English answer about PCOS", "en")).toBe(
      true
    );
    expect(matchesResponseLanguage("An English-only response", "hi")).toBe(
      false
    );
    expect(matchesResponseLanguage("தமிழ் பதில் மட்டும்", "en")).toBe(false);
  });
  it.each([
    ["I have severe pelvic pain", "en"],
    ["I am fainting and have very heavy bleeding", "en"],
    ["Possible pregnancy with severe pain", "en"],
    ["ನನಗೆ ತೀವ್ರ ಹೊಟ್ಟೆ ನೋವು ಇದೆ", "kn"],
    ["ಗರ್ಭಧಾರಣೆ ಸಾಧ್ಯವಾಗಿರುವಾಗ ತೀವ್ರ ನೋವು", "kn"],
    ["मुझे तेज़ पेट दर्द है", "hi"],
    ["संभावित गर्भावस्था में तेज़ दर्द", "hi"],
    ["எனக்கு கடுமையான வயிறு வலி", "ta"],
    ["கர்ப்பம் இருக்கக்கூடும் நிலையில் வலி", "ta"],
  ] as const)("detects an urgent pattern for %s", (text, _language) => {
    expect(urgentWarning(text)).toBe(true);
  });
  it("provides translated fallback material rather than silently answering in English", () => {
    expect(fallbackAnswer("What is PCOS?", "en")).toContain("PCOS");
    expect(fallbackAnswer("ಪಿಸಿಒಎಸ್ ಎಂದರೇನು?", "kn")).toContain("ಹಾರ್ಮೋನ್");
    expect(fallbackAnswer("पीसीओएस क्या है?", "hi")).toContain("हार्मोनल");
    expect(fallbackAnswer("பிசிஓஎஸ் என்றால் என்ன?", "ta")).toContain(
      "ஹார்மோன்"
    );
    expect(
      fallbackAnswer("What is the difference between PCOS and PCOD?", "en")
    ).toContain("PCOD");
    expect(fallbackAnswer("PCOS ಅಥವಾ PCOD ಏನು?", "kn")).toContain("PCOD");
    expect(fallbackAnswer("PCOS और PCOD में क्या अंतर है?", "hi")).toContain(
      "PCOD"
    );
    expect(fallbackAnswer("PCOS மற்றும் PCOD வேறுபாடு என்ன?", "ta")).toContain(
      "PCOD"
    );
  });
  it("marks missing information rather than inventing it in symptom fallback summaries", () => {
    const result = summarizeSymptoms(
      "My periods skip months and I have pimples",
      "en"
    );
    expect(result.summary).toContain("menstrual changes");
    expect(result.summary).toContain("acne or skin changes");
    expect(result.summary).toContain("Not provided");
    expect(result.summary).toContain("not a diagnosis");
  });
});
