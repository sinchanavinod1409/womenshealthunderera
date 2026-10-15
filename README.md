# WOMEN’S HEALTH AI

A multilingual women’s health education and care-guidance web app for English, Kannada, Hindi and Tamil. It includes username/password accounts, private saved conversations and symptom notes, PCOS education, urgent-symptom guidance, and live Manus AI responses when the managed AI service is available.

> This application provides health education and care guidance only. It does not diagnose, prescribe, assess emergencies, or replace a qualified healthcare professional. Urgent warning signs are routed to translated emergency guidance before a model call.

## Features

- Account registration and login with unique normalized usernames, password-composition validation, salted `scrypt` password hashes, server-side hashed/revocable session tokens and protected user data.
- Live multilingual chat and structured symptom understanding. Each answer is checked for the requested writing system; if the live model is unavailable or returns an unsuitable language, the app uses a clearly labelled curated fallback rather than silently changing languages.
- Follow-up language preservation, manual language switching, preferred-language settings, saved conversation history and per-record deletion.
- A private symptom workflow that retains the exact original text, marks missing fields unknown, provides a correctable structured summary, and never diagnoses or prescribes.
- PCOS education in four languages, including common symptoms, contributing factors, clinician assessment, general self-care, clinician questions, myths and facts, and a careful PCOS/PCOD terminology note in curated fallback responses.
- Server-side urgent guidance in the user’s language for severe abdominal/pelvic pain, fainting, very heavy bleeding and severe pain/bleeding when pregnancy is possible.
- Responsive accessible pages for sign-in, registration, dashboard, chat, symptom notes, PCOS education and account settings.

## Managed runtime and prerequisites

This Webdev project is provisioned with its Manus server and persistent managed database. The platform supplies the database connection and, when enabled, the built-in Manus AI service at runtime. The application does not require a separate database account, model-provider key, email provider or external API setup. Never copy managed secrets into source files or frontend code.

Use the project’s pinned Node/pnpm toolchain and run commands from this directory. Install dependencies from the checked-in lockfile when preparing a fresh workspace:

```sh
pnpm install --frozen-lockfile
```

The initialized project must have the managed server and database capabilities enabled. Runtime configuration provides `DATABASE_URL`; live AI uses the platform-provided `MANUS_API_URL` and `MANUS_API_KEY`. If AI is unavailable, the application reports that honestly and uses curated fallback content.

For standalone local development without `DATABASE_URL`, the app uses a persistent SQLite file at `~/.local/share/womenshealth/health.sqlite`. Override the path with `WOMENS_HEALTH_SQLITE_PATH` if needed. This local fallback is disabled in production; production requires the managed MySQL `DATABASE_URL`. Do not enter real patient data into a local development database.

## Database migrations

The schema is defined in `drizzle/schema.ts`; the additive migration is in `drizzle/0001_dear_patch.sql`. It creates/extends the user-account fields and creates persistent session, conversation, message and symptom-report records, with owner relationships and cascading deletion.

Apply committed migrations with:

```sh
pnpm db:migrate
```

`pnpm db:push` generates a migration and applies it; use it only when you intend to change the schema. The managed database is shared by development, verification and production. Never place real patient data in smoke tests.

## Run and validate

Start the managed development server on the project’s configured port:

```sh
pnpm dev
```

The service listens on `PORT` (3000 by default); the unauthenticated readiness endpoint is `GET /api/health`. The static page manifest is `GET /manus-routes.json`.

Run the static checks and build:

```sh
pnpm check
pnpm test
pnpm build
```

### End-to-end verification

With the app server running and `DATABASE_URL` available in the project environment:

```sh
pnpm test:e2e
```

This creates two clearly prefixed temporary accounts in the shared managed database. It tests registration and username conflicts, valid/invalid login, salted password hashes, session-cookie attributes, protected data, rejection of missing/forged mutation origins, multilingual live-or-fallback responses and script quality, follow-up language preservation, manual switching, translated urgent guidance, exact original symptom-text retention, cross-account privacy and logout. The test intentionally leaves its temporary rows for the restart phase.

Restart the application process, then verify persisted sessions and records and clean up only those two temporary accounts:

```sh
pnpm test:e2e -- verify
```

If the first phase was interrupted before restart verification, remove its pending temporary accounts using:

```sh
pnpm test:e2e -- cleanup
```

To verify cookie flags and session reuse through the real HTTPS Preview proxy, pass its origin explicitly:

```sh
SMOKE_BASE_URL="https://<preview-host>" pnpm test:e2e -- preview-cookie
```

Replace `<preview-host>` with the current public Preview hostname. This probe creates and removes one temporary account.

To exercise the unavailable-AI fallback path, stop the current development server, start it in a terminal with the two AI variables removed, then run the fallback-only probe in another terminal:

```sh
env -u MANUS_API_URL -u MANUS_API_KEY pnpm dev
pnpm test:e2e -- fallback
```

The fallback-only test checks that `/api/health` reports AI as unavailable, the answer is stored/labeled as fallback, the response remains predominantly in Tamil, and PCOS-versus-PCOD fallback content is present. Restart the normal managed server after this test.

## Account and privacy behavior

- Passwords are never stored as plaintext. Session tokens are random and only their hashes are persisted; cookies are `HttpOnly`, use `SameSite=None; Secure` on public HTTPS Preview, and use separate plain-HTTP development handling locally.
- Every tRPC mutation must include a verifiable same-origin `Origin`; cross-origin and headerless mutations are rejected.
- Server-side ownership checks apply to chat history, symptom records and deletions. A user cannot read or delete another account’s records by changing an ID.
- The app collects only the account name/username and the health text a user chooses to submit. Saved chat and symptom content remains in the user’s own database records.
- Users can delete their saved conversations and symptom reports. Account deletion and password-reset/email workflows are not offered.
- E2E temporary rows are removed by the restart verification or cleanup command, but the shared-database warning still applies.
- Health answers, PCOS education, symptom summaries and urgent guidance are multilingual; some secondary navigation and explanatory interface labels remain in English.

## AI, safety and content sources

Live AI responses are generated through the built-in Manus service; conversations and symptom records are stored separately in the managed database. If the service fails or a response does not predominantly use the requested script, a curated response is returned and marked as fallback. The fallback is limited to reviewed general information; it does not pretend to provide live model reasoning.

Urgent-symptom detection runs on the server before an AI call. It provides an immediate translated instruction to seek local urgent medical care; it cannot assess emergencies. PCOS content is educational, non-diagnostic and source-linked. The research basis and citations are recorded in [`CONTENT-SOURCES.md`](CONTENT-SOURCES.md), including the WHO PCOS fact sheet and the 2023 international evidence-based guideline record.

## Main files

- `client/src/pages/` — account, dashboard, chat, symptoms, PCOS and settings pages.
- `client/src/contexts/AuthContext.tsx` — logged-in client state and route protection.
- `shared/health.ts` — languages, interface copy, education, safety messages, language detection and curated fallback content.
- `server/auth.ts`, `server/db.ts`, `server/routers.ts` — sessions, database access and authorization-aware API procedures.
- `server/health.ts` — live AI requests, structured symptom responses and language validation.
- `drizzle/schema.ts`, `drizzle/` — managed schema and migrations.
- `server/health.test.ts`, `scripts/e2e-smoke.mjs` — unit and end-to-end verification.
