import { and, desc, eq, gt, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  conversations,
  messages,
  sessions,
  symptomReports,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import * as localSqlite from "./localSqlite";

let _db: ReturnType<typeof drizzle> | null = null;

function usesLocalSqlite() {
  return !ENV.databaseUrl && !ENV.isProduction;
}

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb() {
  return getDb().then(db => {
    if (!db) throw new Error("Database is not available");
    return db;
  });
}

// Retained for compatibility with platform identity callbacks. The public app uses its own requested username/password flow.
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  if (usesLocalSqlite()) return localSqlite.upsertUser(user);
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByUsername(username: string) {
  if (usesLocalSqlite()) return localSqlite.getUserByUsername(username);
  const db = await requireDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return rows[0];
}

export async function getUserByOpenId(openId: string) {
  if (usesLocalSqlite()) return localSqlite.getUserByOpenId(openId);
  const db = await requireDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return rows[0];
}

export async function getUserById(id: number) {
  if (usesLocalSqlite()) return localSqlite.getUserById(id);
  const db = await requireDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function createUsernameUser(input: {
  username: string;
  name: string;
  passwordHash: string;
  preferredLanguage: string;
}) {
  if (usesLocalSqlite()) return localSqlite.createUsernameUser(input);
  const db = await requireDb();
  const result = await db.insert(users).values({
    username: input.username,
    name: input.name,
    passwordHash: input.passwordHash,
    preferredLanguage: input.preferredLanguage,
    role: "user",
    loginMethod: "password",
    openId: null,
  });
  const id = Number(result[0].insertId);
  const user = await getUserById(id);
  if (!user) throw new Error("Account could not be loaded after registration");
  return user;
}

export async function updateLastSignedIn(id: number) {
  if (usesLocalSqlite()) return localSqlite.updateLastSignedIn(id);
  const db = await requireDb();
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, id));
}

export async function updateUserLanguage(id: number, language: string) {
  if (usesLocalSqlite())
    return localSqlite.updateUserLanguage(id, language);
  const db = await requireDb();
  await db
    .update(users)
    .set({ preferredLanguage: language })
    .where(eq(users.id, id));
}

export async function createSessionRecord(
  tokenHash: string,
  userId: number,
  expiresAt: Date
) {
  if (usesLocalSqlite())
    return localSqlite.createSessionRecord(tokenHash, userId, expiresAt);
  const db = await requireDb();
  await db
    .delete(sessions)
    .where(
      and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date()))
    );
  await db.insert(sessions).values({ tokenHash, userId, expiresAt });
}

export async function getUserBySessionHash(tokenHash: string) {
  if (usesLocalSqlite())
    return localSqlite.getUserBySessionHash(tokenHash);
  const db = await requireDb();
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()))
    )
    .limit(1);
  return rows[0]?.user;
}

export async function removeSession(tokenHash: string) {
  if (usesLocalSqlite()) return localSqlite.removeSession(tokenHash);
  const db = await requireDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function makeConversation(
  userId: number,
  title: string,
  language: string
) {
  if (usesLocalSqlite())
    return localSqlite.makeConversation(userId, title, language);
  const db = await requireDb();
  const result = await db
    .insert(conversations)
    .values({ userId, title: title.slice(0, 156), language });
  const rows = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, Number(result[0].insertId)),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);
  return rows[0]!;
}

export async function addMessage(input: {
  conversationId: number;
  userId: number;
  role: "user" | "assistant";
  content: string;
  language: string;
  source?: "live" | "fallback" | "safety";
}) {
  if (usesLocalSqlite()) return localSqlite.addMessage(input);
  const db = await requireDb();
  const result = await db.insert(messages).values(input);
  await db
    .update(conversations)
    .set({ updatedAt: new Date(), language: input.language })
    .where(
      and(
        eq(conversations.id, input.conversationId),
        eq(conversations.userId, input.userId)
      )
    );
  return Number(result[0].insertId);
}

export async function getConversation(userId: number, id: number) {
  if (usesLocalSqlite()) return localSqlite.getConversation(userId, id);
  const db = await requireDb();
  const rows = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function listConversations(userId: number) {
  if (usesLocalSqlite()) return localSqlite.listConversations(userId);
  const db = await requireDb();
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
}

export async function getConversationMessages(
  userId: number,
  conversationId: number
) {
  if (usesLocalSqlite())
    return localSqlite.getConversationMessages(userId, conversationId);
  const db = await requireDb();
  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.conversationId, conversationId)
      )
    )
    .orderBy(messages.id)
    .limit(100);
}

export async function listSymptomReports(userId: number) {
  if (usesLocalSqlite()) return localSqlite.listSymptomReports(userId);
  const db = await requireDb();
  return db
    .select()
    .from(symptomReports)
    .where(eq(symptomReports.userId, userId))
    .orderBy(desc(symptomReports.createdAt))
    .limit(30);
}

export async function addSymptomReport(input: {
  userId: number;
  originalDescription: string;
  language: string;
  structuredSummary: string;
  nextSteps: string;
  source: "live" | "fallback" | "safety";
}) {
  if (usesLocalSqlite()) return localSqlite.addSymptomReport(input);
  const db = await requireDb();
  const result = await db.insert(symptomReports).values(input);
  return Number(result[0].insertId);
}

export async function deleteOwnedConversation(userId: number, id: number) {
  if (usesLocalSqlite())
    return localSqlite.deleteOwnedConversation(userId, id);
  const db = await requireDb();
  const result = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  return result[0].affectedRows > 0;
}

export async function deleteOwnedSymptomReport(userId: number, id: number) {
  if (usesLocalSqlite())
    return localSqlite.deleteOwnedSymptomReport(userId, id);
  const db = await requireDb();
  const result = await db
    .delete(symptomReports)
    .where(and(eq(symptomReports.id, id), eq(symptomReports.userId, userId)));
  return result[0].affectedRows > 0;
}