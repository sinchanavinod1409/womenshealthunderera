import { randomBytes } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import mysql from "mysql2/promise";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const base = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);
const statePath = "/tmp/womenshealth-e2e-state.json";
const langPattern = {
  en: /[A-Za-z]/,
  kn: /[\u0C80-\u0CFF]/,
  hi: /[\u0900-\u097F]/,
  ta: /[\u0B80-\u0BFF]/,
};
function matchesLanguageScript(text, language) {
  const letters = Array.from(text).filter(character =>
    /\p{L}/u.test(character)
  );
  return (
    letters.length > 0 &&
    letters.filter(character => langPattern[language].test(character)).length /
      letters.length >=
      0.6
  );
}
const check = (condition, label, detail = "") => {
  if (!condition)
    throw new Error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  console.log(`PASS: ${label}${detail ? ` — ${detail}` : ""}`);
};
function makeClient(initialCookie, origin = new URL(base).origin) {
  let cookie = initialCookie;
  let cookieHeader;
  const client = createTRPCClient({
    links: [
      httpBatchLink({
        url: `${base}/api/trpc`,
        transformer: superjson,
        async fetch(input, init) {
          const headers = new Headers(init?.headers || {});
          if (origin) headers.set("origin", origin);
          if (cookie) headers.set("cookie", cookie);
          const response = await globalThis.fetch(input, { ...init, headers });
          const setCookie = response.headers.get("set-cookie");
          if (setCookie) {
            cookieHeader = setCookie;
            cookie = setCookie.split(";")[0];
          }
          return response;
        },
      }),
    ],
  });
  return {
    client,
    cookie: () => cookie,
    cookieHeader: () => cookieHeader,
  };
}
async function expectError(run, part, label) {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    check(
      message.toLowerCase().includes(part.toLowerCase()),
      label,
      message.slice(0, 110)
    );
    return;
  }
  throw new Error(`FAIL: ${label} — request unexpectedly succeeded`);
}
async function database() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required for this end-to-end check.");
  return mysql.createConnection(process.env.DATABASE_URL);
}
async function cleanup(names) {
  const c = await database();
  try {
    await c.execute("DELETE FROM users WHERE username IN (?, ?)", names);
  } finally {
    await c.end();
  }
}
async function verifyAfterRestart() {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const { client, cookie } = makeClient(state.cookie);
  try {
    const me = await client.auth.me.query();
    check(
      me?.username === state.username,
      "session survives server-process restart"
    );
    const chatList = await client.chat.list.query();
    check(
      chatList.some(row => row.id === state.conversationId),
      "conversation persists after restart"
    );
    const messages = await client.chat.messages.query({
      conversationId: state.conversationId,
    });
    check(
      messages.length > 0,
      "message history remains available after restart"
    );
    const reports = await client.symptoms.list.query();
    check(
      reports.some(row => row.id === state.reportId),
      "symptom report persists after restart"
    );
    await client.auth.logout.mutate();
    check(
      (await client.auth.me.query()) === null,
      "logout revokes the application session"
    );
    await expectError(
      () => client.chat.list.query(),
      "please login",
      "logout blocks later private-data access"
    );
  } finally {
    await cleanup([state.username, state.otherUsername]);
    await unlink(statePath).catch(() => {});
  }
  console.log(
    "E2E restart verification complete; only the two temporary test accounts and their rows were removed."
  );
}
async function createAndTest() {
  const suffix = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
  const username = `wh_${suffix}`.slice(0, 32);
  const otherUsername = `wh_b_${suffix}`.slice(0, 32);
  const password = "CareForHer@2026";
  const a = makeClient();
  const b = makeClient();
  const guest = makeClient();
  let keepForRestart = false;
  try {
    const status = await a.client.health.query();
    check(status.status === "ok", "application health endpoint is reachable");
    await expectError(
      () => guest.client.chat.list.query(),
      "please login",
      "private data requires an authenticated session"
    );

    const me = await a.client.auth.register.mutate({
      name: "Smoke Test User",
      username,
      password,
      confirmPassword: password,
      preferredLanguage: "en",
    });
    check(me.username === username, "registration creates a username account");
    check(
      Boolean(a.cookie()?.startsWith("women_health_session=")),
      "registration issues the app session cookie"
    );
    check(
      /;\s*httponly/i.test(a.cookieHeader() || ""),
      "session cookie is HttpOnly"
    );
    if (new URL(base).protocol === "https:") {
      check(
        /;\s*secure/i.test(a.cookieHeader() || ""),
        "HTTPS preview session cookie is Secure"
      );
      check(
        /;\s*samesite=none/i.test(a.cookieHeader() || ""),
        "HTTPS preview session cookie supports embedded Preview"
      );
    }
    await expectError(
      () =>
        guest.client.auth.register.mutate({
          name: "Duplicate",
          username,
          password,
          confirmPassword: password,
          preferredLanguage: "en",
        }),
      "already in use",
      "duplicate usernames are rejected"
    );
    await expectError(
      () =>
        a.client.auth.login.mutate({
          username,
          password: "WrongPassword@5",
          remember: false,
        }),
      "incorrect",
      "invalid credentials are rejected"
    );
    const afterInvalid = await a.client.auth.me.query();
    check(
      afterInvalid?.username === username,
      "failed login does not replace an existing session"
    );

    const c = await database();
    try {
      const [rows] = await c.execute(
        "SELECT passwordHash FROM users WHERE username = ? LIMIT 1",
        [username]
      );
      check(
        rows.length === 1 &&
          rows[0].passwordHash.startsWith("scrypt$") &&
          rows[0].passwordHash !== password,
        "database stores a salted scrypt hash, not the password"
      );
    } finally {
      await c.end();
    }

    const prompts = [
      ["en", "What is PCOS in simple terms?"],
      ["kn", "PCOS ಎಂದರೇನು? ಕನ್ನಡದಲ್ಲಿ ಸರಳವಾಗಿ ತಿಳಿಸಿ."],
      ["hi", "PCOS क्या है? सरल हिंदी में बताइए।"],
      ["ta", "PCOS என்றால் என்ன? எளிய தமிழில் சொல்லுங்கள்."],
    ];
    let englishConversationId;
    let tamilConversationId;
    for (const [language, text] of prompts) {
      const result = await a.client.chat.send.mutate({
        text,
        preferredLanguage: "en",
      });
      check(
        result.language === language,
        `message language detected as ${language}`
      );
      check(
        ["live", "fallback"].includes(result.source),
        `${language} answer source is honestly identified`,
        result.source
      );
      check(
        matchesLanguageScript(result.answer, language),
        `${language} answer is predominantly in the expected writing system`,
        result.source
      );
      if (language === "en") englishConversationId = result.conversationId;
      if (language === "ta") tamilConversationId = result.conversationId;
      if (language === "ta") {
        const follow = await a.client.chat.send.mutate({
          conversationId: result.conversationId,
          text: "And what can I ask a clinician?",
          preferredLanguage: "en",
        });
        check(
          follow.language === "ta" &&
            matchesLanguageScript(follow.answer, "ta"),
          "Latin-script follow-up preserves the Tamil conversation language",
          follow.source
        );
        const switched = await a.client.chat.send.mutate({
          conversationId: result.conversationId,
          text: "Tell me one useful next step.",
          preferredLanguage: "ta",
          languageOverride: "hi",
        });
        check(
          switched.language === "hi" &&
            matchesLanguageScript(switched.answer, "hi"),
          "manual mid-conversation switch responds in Hindi",
          switched.source
        );
      }
    }

    if (!englishConversationId)
      throw new Error(
        "The English conversation required for the CSRF checks was not created."
      );
    const messagesBeforeCsrf = await a.client.chat.messages.query({
      conversationId: englishConversationId,
    });
    const headerless = makeClient(a.cookie(), null);
    await expectError(
      () =>
        headerless.client.chat.send.mutate({
          conversationId: englishConversationId,
          text: "This headerless write should not be stored.",
          preferredLanguage: "en",
        }),
      "origin",
      "authenticated mutations without Origin are rejected"
    );
    const forgedOrigin = makeClient(a.cookie(), "https://attacker.example");
    await expectError(
      () =>
        forgedOrigin.client.chat.send.mutate({
          conversationId: englishConversationId,
          text: "This forged cross-origin write should not be stored.",
          preferredLanguage: "en",
        }),
      "origin",
      "cross-origin mutations are rejected"
    );
    check(
      (
        await a.client.chat.messages.query({
          conversationId: englishConversationId,
        })
      ).length === messagesBeforeCsrf.length,
      "rejected CSRF attempts do not append messages"
    );

    const urgentPrompts = [
      ["en", "I have severe pelvic pain and feel faint."],
      ["kn", "ನನಗೆ ತೀವ್ರ ಹೊಟ್ಟೆ ನೋವು ಇದೆ"],
      ["hi", "मुझे तेज़ पेट दर्द है"],
      ["ta", "எனக்கு கடுமையான வயிறு வலி"],
    ];
    for (const [language, text] of urgentPrompts) {
      const result = await a.client.chat.send.mutate({
        text,
        preferredLanguage: "en",
      });
      check(
        result.source === "safety" && result.language === language,
        `${language} urgent warning bypasses the model`
      );
      check(
        matchesLanguageScript(result.answer, language),
        `${language} urgent guidance is translated`
      );
    }
    const symptomText =
      "  ನನಗೆ ಎರಡು ತಿಂಗಳಿಂದ ಪೀರಿಯಡ್ಸ್ ಸರಿಯಾಗಿ ಬರುತ್ತಿಲ್ಲ, ಮೊಡವೆ ಇದೆ.  ";
    const symptom = await a.client.symptoms.analyze.mutate({
      description: symptomText,
      preferredLanguage: "kn",
      languageOverride: "kn",
    });
    check(
      symptom.originalDescription === symptomText && symptom.language === "kn",
      "symptom workflow preserves the original Kannada description"
    );
    check(
      matchesLanguageScript(symptom.summary, "kn"),
      "symptom summary uses the selected Kannada language",
      symptom.source
    );
    const urgentSymptom = await a.client.symptoms.analyze.mutate({
      description: "मुझे तेज़ पेट दर्द है",
      preferredLanguage: "hi",
      languageOverride: "hi",
    });
    check(
      urgentSymptom.urgent &&
        urgentSymptom.source === "safety" &&
        matchesLanguageScript(urgentSymptom.summary, "hi"),
      "symptom safety warning runs before ordinary interpretation"
    );

    const createdOther = await b.client.auth.register.mutate({
      name: "Other Smoke User",
      username: otherUsername,
      password,
      confirmPassword: password,
      preferredLanguage: "en",
    });
    check(
      createdOther.username === otherUsername,
      "second independent account can register"
    );
    check(
      (await b.client.chat.list.query()).length === 0,
      "second account sees no first-user conversations"
    );
    await expectError(
      () =>
        b.client.chat.messages.query({ conversationId: englishConversationId }),
      "not found",
      "another user's conversation cannot be read by URL or ID"
    );
    const failedDelete = await b.client.chat.remove.mutate({
      conversationId: englishConversationId,
    });
    check(
      !failedDelete.deleted,
      "another user cannot delete a private conversation"
    );
    const failedReportDelete = await b.client.symptoms.delete.mutate({
      id: symptom.id,
    });
    check(
      !failedReportDelete.deleted,
      "another user cannot delete a private symptom report"
    );
    check(
      (await a.client.symptoms.list.query()).some(row => row.id === symptom.id),
      "the report remains with its owner"
    );

    await b.client.auth.logout.mutate();
    check(
      (await b.client.auth.me.query()) === null,
      "logout clears the second account session"
    );
    const loggedBackIn = await b.client.auth.login.mutate({
      username: otherUsername,
      password,
      remember: false,
    });
    check(
      loggedBackIn.username === otherUsername,
      "valid username/password login succeeds after registration"
    );

    if (!englishConversationId || !tamilConversationId)
      throw new Error(
        "Expected multilingual conversation identifiers were missing."
      );
    const state = {
      username,
      otherUsername,
      cookie: a.cookie(),
      conversationId: englishConversationId,
      reportId: symptom.id,
    };
    await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
    keepForRestart = true;
    console.log(
      "Restart verification is pending. The test has left two clearly prefixed disposable accounts and their rows in the shared database; restart the dev server, then run `pnpm test:e2e -- verify` to verify persistence and safely remove only those rows."
    );
  } finally {
    if (!keepForRestart) await cleanup([username, otherUsername]);
  }
}
async function verifyFallbackMode() {
  const suffix = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
  const username = `wh_f_${suffix}`.slice(0, 32);
  const otherUsername = `wh_fb_${suffix}`.slice(0, 32);
  const password = "CareForHer@2026";
  const { client } = makeClient();
  try {
    const status = await client.health.query();
    check(
      status.ai === "unavailable",
      "health endpoint accurately reports unavailable live AI",
      status.ai
    );
    await client.auth.register.mutate({
      name: "Fallback Smoke User",
      username,
      password,
      confirmPassword: password,
      preferredLanguage: "en",
    });
    const result = await client.chat.send.mutate({
      text: "PCOS என்றால் என்ன?",
      preferredLanguage: "en",
    });
    check(
      result.language === "ta",
      "fallback detects the Tamil question language"
    );
    check(
      result.source === "fallback",
      "unavailable AI is never presented as a live answer",
      result.source
    );
    check(
      matchesLanguageScript(result.answer, "ta"),
      "curated fallback remains predominantly Tamil"
    );
    check(
      result.answer.includes("PCOD"),
      "Tamil fallback addresses PCOS-versus-PCOD terminology"
    );
    await client.auth.logout.mutate();
  } finally {
    await cleanup([username, otherUsername]);
  }
  console.log(
    "Fallback-mode verification complete; temporary records were removed."
  );
}
async function verifyPreviewCookie() {
  if (new URL(base).protocol !== "https:")
    throw new Error(
      "Use SMOKE_BASE_URL with the public HTTPS Preview URL for this check."
    );
  const suffix = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
  const username = `wh_p_${suffix}`.slice(0, 32);
  const otherUsername = `wh_pb_${suffix}`.slice(0, 32);
  const password = "CareForHer@2026";
  const smoke = makeClient();
  try {
    await smoke.client.auth.register.mutate({
      name: "Preview Cookie User",
      username,
      password,
      confirmPassword: password,
      preferredLanguage: "en",
    });
    const header = smoke.cookieHeader() || "";
    check(/;\s*httponly/i.test(header), "Preview auth cookie is HttpOnly");
    check(/;\s*secure/i.test(header), "Preview auth cookie is Secure");
    check(
      /;\s*samesite=none/i.test(header),
      "Preview auth cookie uses SameSite=None"
    );
    check(
      (await smoke.client.auth.me.query())?.username === username,
      "HTTPS Preview session is accepted by a subsequent request"
    );
    await smoke.client.auth.logout.mutate();
    check(
      (await smoke.client.auth.me.query()) === null,
      "HTTPS Preview logout revokes and clears the session"
    );
  } finally {
    await cleanup([username, otherUsername]);
  }
  console.log(
    "HTTPS Preview cookie verification complete; temporary rows were removed."
  );
}
const mode = process.argv.slice(2).find(argument => argument !== "--");
if (mode === "verify") await verifyAfterRestart();
else if (mode === "cleanup") {
  const state = JSON.parse(await readFile(statePath, "utf8"));
  await cleanup([state.username, state.otherUsername]);
  await unlink(statePath).catch(() => {});
  console.log(
    "Temporary end-to-end test accounts and their rows were removed."
  );
} else if (mode === "fallback") await verifyFallbackMode();
else if (mode === "preview-cookie") await verifyPreviewCookie();
else await createAndTest();
