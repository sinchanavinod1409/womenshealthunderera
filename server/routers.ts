import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  LANGS,
  PCOS,
  URGENT,
  fallbackAnswer,
  resolveLanguage,
  summarizeSymptoms,
  urgentWarning,
  type Language,
} from "../shared/health";
import {
  hashPassword,
  issueSession,
  meetsPasswordPolicy,
  revokeSession,
  safeUser,
  verifyPassword,
} from "./auth";
import {
  addMessage,
  addSymptomReport,
  createUsernameUser,
  deleteOwnedConversation,
  deleteOwnedSymptomReport,
  getConversation,
  getConversationMessages,
  getUserByUsername,
  listConversations,
  listSymptomReports,
  makeConversation,
  updateLastSignedIn,
  updateUserLanguage,
} from "./db";
import { liveChatAnswer, liveSymptomSummary } from "./health";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

function cleanUsername(value: string) {
  return value.trim().toLowerCase();
}
function duplicateUsername(error: unknown) {
  let current = error;
  for (
    let depth = 0;
    depth < 5 && current && typeof current === "object";
    depth++
  ) {
    const record = current as Record<string, unknown>;
    if (
      String(record.code) === "ER_DUP_ENTRY" ||
      String(record.code) === "1062" ||
      String(record.errno) === "1062" ||
      String(record.code) === "SQLITE_CONSTRAINT_UNIQUE"
    )
      return true;
    current = record.cause;
  }
  return false;
}

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok" as const,
    ai: Boolean(process.env.MANUS_API_URL && process.env.MANUS_API_KEY)
      ? ("available" as const)
      : ("unavailable" as const),
  })),
  auth: router({
    me: publicProcedure.query(({ ctx }) =>
      ctx.user ? safeUser(ctx.user) : null
    ),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(120),
          username: z
            .string()
            .trim()
            .min(3)
            .max(32)
            .regex(
              /^[a-zA-Z0-9_.-]+$/,
              "Use letters, numbers, dots, underscores or hyphens."
            ),
          password: z.string().min(8).max(128),
          confirmPassword: z.string().max(128),
          preferredLanguage: z.enum(LANGS),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.password !== input.confirmPassword)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Passwords do not match.",
          });
        if (!meetsPasswordPolicy(input.password))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Use at least 8 characters with uppercase, lowercase, a number and a special character.",
          });
        const username = cleanUsername(input.username);
        try {
          const user = await createUsernameUser({
            username,
            name: input.name,
            passwordHash: await hashPassword(input.password),
            preferredLanguage: input.preferredLanguage,
          });
          await issueSession(user.id, ctx.res, ctx.req, true);
          return safeUser(user);
        } catch (error) {
          if (duplicateUsername(error))
            throw new TRPCError({
              code: "CONFLICT",
              message: "That username is already in use. Choose another.",
            });
          throw error;
        }
      }),
    login: publicProcedure
      .input(
        z.object({
          username: z.string().min(1).max(32),
          password: z.string().min(1).max(128),
          remember: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByUsername(cleanUsername(input.username));
        const valid = await verifyPassword(
          input.password,
          user?.passwordHash ?? null
        );
        if (!user || !valid)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Username or password is incorrect.",
          });
        await updateLastSignedIn(user.id);
        await issueSession(user.id, ctx.res, ctx.req, input.remember);
        return safeUser({ ...user, lastSignedIn: new Date() });
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await revokeSession(ctx.sessionTokenHash, ctx.res, ctx.req);
      return { success: true as const };
    }),
    setLanguage: protectedProcedure
      .input(z.object({ language: z.enum(LANGS) }))
      .mutation(async ({ input, ctx }) => {
        await updateUserLanguage(ctx.user.id, input.language);
        return { language: input.language };
      }),
  }),
  chat: router({
    list: protectedProcedure.query(({ ctx }) => listConversations(ctx.user.id)),
    messages: protectedProcedure
      .input(z.object({ conversationId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const conversation = await getConversation(
          ctx.user.id,
          input.conversationId
        );
        if (!conversation)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found.",
          });
        return getConversationMessages(ctx.user.id, input.conversationId);
      }),
    remove: protectedProcedure
      .input(z.object({ conversationId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        return {
          deleted: await deleteOwnedConversation(
            ctx.user.id,
            input.conversationId
          ),
        };
      }),
    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number().int().positive().optional(),
          text: z.string().trim().min(1).max(6000),
          preferredLanguage: z.enum(LANGS).optional(),
          languageOverride: z.enum(LANGS).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let conversation;
        if (input.conversationId) {
          conversation = await getConversation(
            ctx.user.id,
            input.conversationId
          );
          if (!conversation)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Conversation not found.",
            });
        } else {
          conversation = await makeConversation(
            ctx.user.id,
            input.text.slice(0, 130),
            input.preferredLanguage ?? ctx.user.preferredLanguage
          );
        }
        if (!conversation)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not open conversation.",
          });
        const language = resolveLanguage(
          input.text,
          (input.preferredLanguage ?? ctx.user.preferredLanguage) as Language,
          input.conversationId
            ? (conversation.language as Language)
            : undefined,
          input.languageOverride
        );
        await addMessage({
          conversationId: conversation.id,
          userId: ctx.user.id,
          role: "user",
          content: input.text,
          language,
          source: "live",
        });
        const prior = await getConversationMessages(
          ctx.user.id,
          conversation.id
        );
        const history = prior
          .slice(-11, -1)
          .map(m => ({ role: m.role, content: m.content })) as {
          role: "user" | "assistant";
          content: string;
        }[];
        let answer: string;
        let source: "live" | "fallback" | "safety";
        if (urgentWarning(input.text)) {
          answer = URGENT[language];
          source = "safety";
        } else {
          try {
            answer = await liveChatAnswer({
              text: input.text,
              language,
              history,
            });
            source = "live";
          } catch (error) {
            console.warn(
              "[Health AI] Live response unavailable; using labelled fallback:",
              error instanceof Error ? error.message : "unknown error"
            );
            answer = fallbackAnswer(input.text, language);
            source = "fallback";
          }
        }
        await addMessage({
          conversationId: conversation.id,
          userId: ctx.user.id,
          role: "assistant",
          content: answer,
          language,
          source,
        });
        return { conversationId: conversation.id, answer, language, source };
      }),
  }),
  symptoms: router({
    list: protectedProcedure.query(({ ctx }) =>
      listSymptomReports(ctx.user.id)
    ),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        return {
          deleted: await deleteOwnedSymptomReport(ctx.user.id, input.id),
        };
      }),
    analyze: protectedProcedure
      .input(
        z.object({
          description: z
            .string()
            .min(1)
            .max(6000)
            .refine(
              value => value.trim().length >= 3,
              "Please add a little more detail."
            ),
          preferredLanguage: z.enum(LANGS).optional(),
          languageOverride: z.enum(LANGS).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const language = resolveLanguage(
          input.description,
          (input.preferredLanguage ?? ctx.user.preferredLanguage) as Language,
          undefined,
          input.languageOverride
        );
        const urgent = urgentWarning(input.description);
        let summary: string;
        let nextSteps: string;
        let source: "live" | "fallback" | "safety";
        if (urgent) {
          summary = URGENT[language];
          nextSteps = URGENT[language];
          source = "safety";
        } else {
          try {
            const result = await liveSymptomSummary(
              input.description,
              language
            );
            const labels = {
              en: {
                symptoms: "Reported symptoms",
                duration: "Duration",
                frequency: "Frequency",
                severity: "Severity",
                context: "Relevant context",
                unknown: "Not stated",
                missed: "No symptom category could be reliably identified",
                follow: "If you wish, you can clarify",
              },
              kn: {
                symptoms: "ತಿಳಿಸಿದ ಲಕ್ಷಣಗಳು",
                duration: "ಅವಧಿ",
                frequency: "ಆವರ್ತನೆ",
                severity: "ತೀವ್ರತೆ",
                context: "ಸಂಬಂಧಿತ ಸಂದರ್ಭ",
                unknown: "ತಿಳಿಸಿಲ್ಲ",
                missed: "ಲಕ್ಷಣದ ವರ್ಗವನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ",
                follow: "ನೀವು ಬಯಸಿದರೆ ಇದನ್ನು ಸ್ಪಷ್ಟಪಡಿಸಬಹುದು",
              },
              hi: {
                symptoms: "बताए गए लक्षण",
                duration: "अवधि",
                frequency: "आवृत्ति",
                severity: "तीव्रता",
                context: "संबंधित संदर्भ",
                unknown: "नहीं बताया गया",
                missed: "लक्षण की श्रेणी भरोसेमंद ढंग से नहीं पहचानी जा सकी",
                follow: "यदि आप चाहें तो स्पष्ट कर सकती हैं",
              },
              ta: {
                symptoms: "தெரிவிக்கப்பட்ட அறிகுறிகள்",
                duration: "கால அளவு",
                frequency: "நிகழும் அடிக்கடி",
                severity: "தீவிரம்",
                context: "தொடர்புடைய சூழல்",
                unknown: "குறிப்பிடப்படவில்லை",
                missed: "அறிகுறி வகையை நம்பகமாக அடையாளம் காண முடியவில்லை",
                follow: "விரும்பினால் இதைத் தெளிவுபடுத்தலாம்",
              },
            }[language];
            const fields = [
              `${labels.symptoms}: ${result.reportedSymptoms.join(", ") || labels.missed}`,
              `${labels.duration}: ${result.duration ?? labels.unknown}`,
              `${labels.frequency}: ${result.frequency ?? labels.unknown}`,
              `${labels.severity}: ${result.severity ?? labels.unknown}`,
              `${labels.context}: ${result.context ?? labels.unknown}`,
            ];
            summary = `${fields.join("\n")}\n\n${result.summary}${result.unknowns.length ? `\n\n${result.unknowns.join(" · ")}` : ""}`;
            nextSteps = `${result.nextSteps}${result.questions.length ? `\n\n${labels.follow}:\n• ${result.questions.join("\n• ")}` : ""}`;
            source = "live";
          } catch (error) {
            console.warn(
              "[Health AI] Symptom summary fallback:",
              error instanceof Error ? error.message : "unknown error"
            );
            const result = summarizeSymptoms(input.description, language);
            summary = result.summary;
            nextSteps = result.nextSteps;
            source = "fallback";
          }
        }
        const report = await addSymptomReport({
          userId: ctx.user.id,
          originalDescription: input.description,
          language,
          structuredSummary: summary,
          nextSteps,
          source,
        });
        return {
          id: report,
          originalDescription: input.description,
          language,
          summary,
          nextSteps,
          source,
          urgent,
        };
      }),
  }),
  education: router({
    pcos: publicProcedure
      .input(z.object({ language: z.enum(LANGS).default("en") }))
      .query(({ input }) => PCOS[input.language]),
  }),
});
export type AppRouter = typeof appRouter;
