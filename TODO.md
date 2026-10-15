# WOMEN’S HEALTH AI — Outcome checklist

## Authentication and protected account access — verified

- Provide separate login and registration pages.
- Login: username, password, show/hide password button, login button, secure remember-me if supported, registration link, helpful incorrect-credential error, loading indicator during login, and redirect authenticated users to the dashboard.
- Registration: full name, unique username, password, confirmation, optional preferred language, validate all fields, prevent duplicate usernames, require at least 8 characters including uppercase, lowercase, number and special character, hash passwords securely, and store accounts in the database.
- Provide logout and protected dashboard pages. Unauthenticated users cannot access private dashboard data by entering a URL directly.
- Use secure server-side sessions or another appropriate authentication mechanism. Do not use a hardcoded universal username or password.
- If password reset is implemented, it must work without an external email service or clearly explain its local/demo limitations.

## Multilingual assistant, conversation history and fallback — verified

- Understand and answer in English, Kannada, Hindi and Tamil. Detect the language of every new user message, reply in that same language, preserve conversation language for follow-ups unless explicitly changed, support manual preferred language and mid-conversation switching, and never require English translation.
- The same language rule applies to follow-ups, symptom summaries, education and safety guidance. Keep medical explanations clear, natural, respectful and easy to understand; preserve medical meaning, warnings and important detail.
- Handle varied natural-language questions, not just hardcoded example responses. Support free-text questions, current conversation display, follow-ups, evidence-informed health education, saved history for logged-in users, deletion and explanations of uncertainty. Common questions include PCOS vs PCOD, irregular periods, symptoms and when to seek care.
- Use the built-in AI service when available. If it cannot be used, provide working language-specific templates, curated health information and supported translations; label fallback responses clearly. Never fake a live response, claim fallback has live reasoning ability, silently switch to English, or claim a provider is connected when it is not.

## Symptom understanding and care guidance — verified

- Accept symptoms in natural language including regional languages, informal expressions and spelling variations; support one or multiple symptoms, selected language and optional follow-up answers/corrections. Preserve the exact original user-entered symptom text for display and storage.
- Collect only relevant symptoms, duration, menstrual-cycle changes, pain/discomfort and other information the user voluntarily provides.
- Detect language where possible; preserve the original description; translate or interpret into a structured representation without losing details; extract only reported symptoms, duration, frequency, severity and relevant context; mark missing/unknown information as unknown; ask only respectful and relevant questions; summarize for user correction.
- Provide understandable educational information and suitable next steps. Do not invent symptoms or history, diagnose PCOS or any condition, claim certainty, prescribe medicine, or confuse general education with personalized medical advice.

## PCOS education — verified

- Provide a dedicated page in English, Kannada, Hindi and Tamil covering what PCOS is; common symptoms; possible contributing factors; how healthcare professionals evaluate PCOS; general lifestyle/self-care; questions to discuss with a healthcare professional; and myths/facts.
- Include irregular/infrequent periods, acne/oily skin, increased facial/body hair, thinning scalp hair, difficulty with ovulation/fertility, and relevant metabolic concerns.
- Explain that symptoms can have multiple causes; their presence does not confirm PCOS; some people with PCOS have different symptoms. Never imply that irregular periods or any single symptom automatically means PCOS.

## Urgent-symptom safety and health disclaimer — verified

- Apply urgent-symptom safety rules server-side before ordinary educational responses.
- Detect examples including severe abdominal/pelvic pain, fainting, very heavy bleeding, and severe pain or bleeding during a possible pregnancy.
- For urgent warning signs, immediately display clear guidance to seek appropriate urgent medical care in the user’s language; prioritize the warning and do not delay it with unnecessary questions.
- Clearly explain that the application provides education and care guidance, not a medical diagnosis or substitute for a qualified healthcare professional.

## Dashboard, language settings, privacy and deletion — verified

- After login, show personalized welcome, new AI conversation, symptom understanding, PCOS education, previous conversations, preferred language settings, account settings and logout.
- Keep each user’s private data separate. Enforce server-side authorization and prohibit cross-user access.
- Let users delete their own saved conversations and symptom reports.
- Collect only necessary personal information; do not request sensitive medical details unless needed for the feature.
- Show proper empty states when there are no conversations.

## Persistent database, migrations and setup — verified

- Use real persistent database storage, not browser-only temporary storage. Include tables/relationships for users, preferences/selected language, conversations, messages, symptom reports and configuration if needed.
- Enforce unique usernames; store secure password hashes; implement correct owner relationships; include database initialization/migrations and useful sample educational data where appropriate.
- Data must persist after app restarts. Add server-side authorization. Do not expose one user’s records to another.
- Deliver complete setup and launch instructions, backend API/business logic, frontend and automated tests; the application must not require manual external API/database/provider configuration.

## Accessible responsive application — verified

- Use calm accessible colors, responsive mobile/tablet/desktop layouts, easy navigation, clear typography, welcoming dashboard and professional chat.
- Provide accessible forms/buttons, visible language selector, loading indicators and helpful errors. Auth pages must be polished and consistent with the application.

## Verified automated and end-to-end requirements — verified

- Run and record actual results for registration, duplicate username rejection, valid login, invalid-credential rejection, secure stored hashes, protected pages, cross-user privacy, persistence after restart, and logout.
- Run actual English, Kannada, Hindi and Tamil question/response tests, follow-up language preservation, manual language switching and translated urgent-warning checks. Enforce a meaningful majority of the requested writing system in model responses, falling back rather than accepting materially mixed or wrong-language output.
- Check secure `HttpOnly; Secure; SameSite=None` cookies through the public HTTPS Preview, reject missing and forged mutation `Origin` headers, check responsive desktop and mobile behavior, and force the live-AI-unavailable fallback path to verify that it is honestly labelled.
- Build, launch and test end to end, fix errors, and report only verified outcomes. Do not mark untested requirements passed.
