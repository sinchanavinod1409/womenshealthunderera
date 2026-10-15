# WOMEN’S HEALTH AI — Implementation Plan

## Product and architecture

Build the approved product in the initialized React 19, Express, tRPC and Drizzle application. Use the already provisioned managed MySQL database for durable user-owned data; all SQL changes are managed with committed additive Drizzle migrations. The server listens on the project’s configured port and serves the Vite client in development and the built client in production.

Implement the explicitly requested username-and-password authentication (not Manus OAuth). Store password hashes created with Node.js `crypto.scrypt`; normalize and uniquely index usernames. Create random, revocable server-side sessions whose token digests are stored in MySQL and sent only in an HttpOnly cookie with `SameSite=None; Secure` for public HTTPS Preview. Enforce authentication and ownership at tRPC procedures, not only in client routes. Keep the existing starter authentication data compatible where feasible; do not weaken or create a universal/demo credential.

Use Drizzle tables for accounts/preferences, sessions, conversations, messages and symptom reports. Every private query and mutation is scoped to the authenticated user. Preserve the supplied symptom description alongside any structured summary. Support user-owned deletion. Use schema migrations for persistence across restarts.

For each new message, detect supported writing systems and use the requested/manual language as context where detection is ambiguous. Call the project-provided Manus LLM service from the server for natural-language answers and structured, non-diagnostic symptom summaries. Instructions require the same-language response, explicit unknowns, uncertainty, and no invented history or treatment. Run urgent-symptom rules on the server before a model call; return immediate, translated guidance when triggered. If the live model is unavailable or returns unusable content, use curated language-specific fallback material and state clearly that the answer is from fallback mode. A fallback is not represented as live AI.

The frontend will expose public login and registration screens and protected dashboard, chat/history, symptom understanding, PCOS learning, and settings routes. A shared language catalog supplies English, Kannada, Hindi and Tamil for core controls, PCOS education, fallback content, symptom summaries and safety messages. Chat language can change mid-conversation. Some secondary navigation and explanatory labels remain English. Add a route manifest for all page routes before starting the dev server.

## Project structure

- `client/src/App.tsx`: route tree and auth guard.
- `client/src/pages/`: login, registration, dashboard, chat, symptom summary, PCOS education and account/preferences pages.
- `client/src/components/`: shared navigation, language selector, message composer, safety callout, form controls and responsive layouts.
- `client/src/lib/`: typed tRPC client and language/formatting helpers.
- `shared/`: common types, language catalog, curated PCOS text, urgent guidance and fallback health education.
- `server/_core/`: Express startup, request context and authentication/session helpers.
- `server/routers.ts`, `server/health.ts` and `server/auth.ts`: authenticated account, conversation, symptom and AI workflows, with ownership checks and secure browser-write origin checks in `server/_core/trpc.ts`.
- `server/db.ts`, `drizzle/schema.ts`, `drizzle/`: database queries, tables and checked-in migrations.
- `server/*.test.ts`: automated tests of validation, language detection, urgency rules, fallback behavior and authenticated ownership.
- `README.md`: environment requirements, migrations, development commands, security/AI behavior and honest limitations.
- `client/public/manus-routes.json`: page route manifest.

## Design direction

Three tail-sampled alternatives considered: warm editorial botanical healthcare (0.07); crisp Scandinavian clinic minimalism (0.05); contemporary South Asian health-journal editorial (0.08). Selected: **warm editorial botanical healthcare**.

- **Design movement:** Contemporary editorial wellness publishing with restrained botanical references; avoid clinical dashboard clichés.
- **Core principles:** Reassuring without being saccharine; legible in all four scripts; privacy-forward; calm but decisive when safety guidance is needed.
- **Color philosophy:** Warm ivory reduces glare; deep plum signals grounded care; eucalyptus and clay accents add humanity without weakening alert contrast. Urgent notices use a clear high-contrast warning treatment distinct from the normal palette.
- **Layout paradigm:** A generous, left-aligned editorial canvas with a persistent compact navigation rail on wide screens and a low-friction bottom/compact navigation on phones. Use a narrow reading measure for education and a conversation-first wide pane for chat rather than a generic centered card grid.
- **Signature elements:** A small four-petal health mark; a quiet progress/step motif for symptom understanding; softly ruled conversation and education panels.
- **Interaction philosophy:** Patient and explicit. Language preference is visible. Forms explain validation near the field. Loading, empty, error and urgent states are distinct. No deceptive typing or AI theatrics.
- **Animation:** Subtle 120–180 ms state transitions and reduced-motion support. No looping motion, bouncing medical symbols or animation that delays safety messages.
- **Typography system:** A readable editorial serif for English headlines paired with an accessible humanist sans for body/UI; provide robust Noto Sans fallbacks for Kannada, Hindi and Tamil. Use sufficient line height and avoid tiny labels.
- **Brand essence:** A private, multilingual companion for clearer women’s health conversations; thoughtful, respectful, practical.
- **Brand voice:** Warm, direct and non-judgmental. Example: “Your description stays yours. We’ll help organize it.” “If symptoms feel severe, seek urgent medical care now.”
- **Wordmark & logo:** WOMEN’S HEALTH wordmark with a four-petal mark made of open, interlocking strokes.
- **Signature brand color:** Deep plum, `#623D59`.

## Content and sources

PCOS copy will explain that symptoms vary and have multiple possible causes, and that symptoms alone cannot confirm PCOS. It will distinguish general education from clinical assessment and explain that a healthcare professional considers a combination of findings and excludes other causes. Lifestyle information will avoid one-size-fits-all or weight-shaming claims. Include source links to the [World Health Organization PCOS fact sheet](https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome) and [2023 international evidence-based guideline recommendations (PubMed)](https://pubmed.ncbi.nlm.nih.gov/37580314/).

## Dependencies and workflow

Use installed dependencies and Node’s built-in cryptography; do not add an external model account, database provider or email service. The project environment already supplies the managed database connection and Manus AI credentials. Before implementation, TypeScript diagnostics were confirmed registered by the host. Before starting the service, create and later verify `GET /manus-routes.json`. Use the configured project port. Add/commit migration and setup docs with the application code; avoid destructive DDL or deleting any data other than temporary records created by the task’s own tests.
