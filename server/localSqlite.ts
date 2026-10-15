import { chmodSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import type {
  Conversation,
  InsertUser,
  Message,
  SymptomReport,
  User,
} from "../drizzle/schema";

type Row = Record<string, unknown>;

let connection: Database.Database | null = null;

function database() {
  if (connection) return connection;

  const customFilename = process.env.WOMENS_HEALTH_SQLITE_PATH;
  const filename =
    customFilename ||
    join(homedir(), ".local", "share", "womenshealth", "health.sqlite");
  const directory = dirname(filename);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (!customFilename) chmodSync(directory, 0o700);

  connection = new Database(filename);
  connection.pragma("foreign_keys = ON");
  connection.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT UNIQUE,
      username TEXT UNIQUE,
      passwordHash TEXT,
      preferredLanguage TEXT NOT NULL DEFAULT 'en',
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastSignedIn TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS health_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenHash TEXT NOT NULL UNIQUE,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expiresAt INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS health_sessions_user_idx ON health_sessions(userId);
    CREATE TABLE IF NOT EXISTS health_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS health_conversations_user_idx ON health_conversations(userId);
    CREATE TABLE IF NOT EXISTS health_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId INTEGER NOT NULL REFERENCES health_conversations(id) ON DELETE CASCADE,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      language TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'live' CHECK(source IN ('live', 'fallback', 'safety')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS health_messages_conversation_idx ON health_messages(conversationId, id);
    CREATE INDEX IF NOT EXISTS health_messages_user_idx ON health_messages(userId);
    CREATE TABLE IF NOT EXISTS symptom_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      originalDescription TEXT NOT NULL,
      language TEXT NOT NULL,
      structuredSummary TEXT NOT NULL,
      nextSteps TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'live' CHECK(source IN ('live', 'fallback', 'safety')),
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS symptom_reports_user_idx ON symptom_reports(userId);
  `);
  chmodSync(filename, 0o600);
  console.info("[Database] Using local SQLite storage for development.");
  return connection;
}

export function closeLocalDatabase() {
  connection?.close();
  connection = null;
}

function toDate(value: unknown) {
  return value instanceof Date ? value : new Date(String(value));
}

function mapUser(row: Row | undefined): User | undefined {
  if (!row) return undefined;
  return {
    ...row,
    id: Number(row.id),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    lastSignedIn: toDate(row.lastSignedIn),
  } as unknown as User;
}

function mapConversation(row: Row | undefined): Conversation | undefined {
  if (!row) return undefined;
  return {
    ...row,
    id: Number(row.id),
    userId: Number(row.userId),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  } as unknown as Conversation;
}

function mapMessage(row: Row): Message {
  return {
    ...row,
    id: Number(row.id),
    conversationId: Number(row.conversationId),
    userId: Number(row.userId),
    createdAt: toDate(row.createdAt),
  } as unknown as Message;
}

function mapSymptomReport(row: Row): SymptomReport {
  return {
    ...row,
    id: Number(row.id),
    userId: Number(row.userId),
    createdAt: toDate(row.createdAt),
  } as unknown as SymptomReport;
}

function now() {
  return new Date().toISOString();
}

export function upsertUser(user: InsertUser) {
  const db = database();
  const current = db
    .prepare("SELECT id FROM users WHERE openId = ?")
    .get(user.openId) as Row | undefined;
  const fields = ["name", "email", "loginMethod", "lastSignedIn", "role"] as const;
  const updates = fields.filter(field => user[field] !== undefined);

  if (current) {
    if (!updates.includes("lastSignedIn")) updates.push("lastSignedIn");
    const values = updates.map(field =>
      field === "lastSignedIn"
        ? (user.lastSignedIn ?? new Date()).toISOString()
        : user[field] ?? null
    );
    const assignments = updates.map(field => `${field} = ?`).join(", ");
    db.prepare(`UPDATE users SET ${assignments}, updatedAt = ? WHERE id = ?`).run(
      ...values,
      now(),
      current.id
    );
    return;
  }

  db.prepare(
    `INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    user.openId,
    user.name ?? null,
    user.email ?? null,
    user.loginMethod ?? null,
    user.role ?? "user",
    (user.lastSignedIn ?? new Date()).toISOString()
  );
}

export function getUserByUsername(username: string) {
  const row = database()
    .prepare("SELECT * FROM users WHERE username = ? LIMIT 1")
    .get(username) as Row | undefined;
  return mapUser(row);
}

export function getUserByOpenId(openId: string) {
  const row = database()
    .prepare("SELECT * FROM users WHERE openId = ? LIMIT 1")
    .get(openId) as Row | undefined;
  return mapUser(row);
}

export function getUserById(id: number) {
  const row = database()
    .prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
    .get(id) as Row | undefined;
  return mapUser(row);
}

export function createUsernameUser(input: {
  username: string;
  name: string;
  passwordHash: string;
  preferredLanguage: string;
}) {
  const result = database()
    .prepare(
      `INSERT INTO users (username, name, passwordHash, preferredLanguage, role, loginMethod)
       VALUES (?, ?, ?, ?, 'user', 'password')`
    )
    .run(input.username, input.name, input.passwordHash, input.preferredLanguage);
  const user = getUserById(Number(result.lastInsertRowid));
  if (!user) throw new Error("Account could not be loaded after registration");
  return user;
}

export function updateLastSignedIn(id: number) {
  database()
    .prepare("UPDATE users SET lastSignedIn = ?, updatedAt = ? WHERE id = ?")
    .run(now(), now(), id);
}

export function updateUserLanguage(id: number, language: string) {
  database()
    .prepare("UPDATE users SET preferredLanguage = ?, updatedAt = ? WHERE id = ?")
    .run(language, now(), id);
}

export function createSessionRecord(
  tokenHash: string,
  userId: number,
  expiresAt: Date
) {
  const db = database();
  const save = db.transaction(() => {
    db.prepare("DELETE FROM health_sessions WHERE userId = ? AND expiresAt < ?").run(
      userId,
      Date.now()
    );
    db.prepare(
      "INSERT INTO health_sessions (tokenHash, userId, expiresAt) VALUES (?, ?, ?)"
    ).run(tokenHash, userId, expiresAt.getTime());
  });
  save();
}

export function getUserBySessionHash(tokenHash: string) {
  const row = database()
    .prepare(
      `SELECT users.* FROM health_sessions
       INNER JOIN users ON health_sessions.userId = users.id
       WHERE health_sessions.tokenHash = ? AND health_sessions.expiresAt > ? LIMIT 1`
    )
    .get(tokenHash, Date.now()) as Row | undefined;
  return mapUser(row);
}

export function removeSession(tokenHash: string) {
  database()
    .prepare("DELETE FROM health_sessions WHERE tokenHash = ?")
    .run(tokenHash);
}

export function makeConversation(userId: number, title: string, language: string) {
  const result = database()
    .prepare(
      "INSERT INTO health_conversations (userId, title, language) VALUES (?, ?, ?)"
    )
    .run(userId, title.slice(0, 156), language);
  const row = database()
    .prepare("SELECT * FROM health_conversations WHERE id = ? AND userId = ? LIMIT 1")
    .get(Number(result.lastInsertRowid), userId) as Row | undefined;
  const conversation = mapConversation(row);
  if (!conversation) throw new Error("Could not open conversation.");
  return conversation;
}

export function addMessage(input: {
  conversationId: number;
  userId: number;
  role: "user" | "assistant";
  content: string;
  language: string;
  source?: "live" | "fallback" | "safety";
}) {
  const db = database();
  const result = db
    .prepare(
      `INSERT INTO health_messages (conversationId, userId, role, content, language, source)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.conversationId,
      input.userId,
      input.role,
      input.content,
      input.language,
      input.source ?? "live"
    );
  db.prepare(
    "UPDATE health_conversations SET updatedAt = ?, language = ? WHERE id = ? AND userId = ?"
  ).run(now(), input.language, input.conversationId, input.userId);
  return Number(result.lastInsertRowid);
}

export function getConversation(userId: number, id: number) {
  const row = database()
    .prepare("SELECT * FROM health_conversations WHERE id = ? AND userId = ? LIMIT 1")
    .get(id, userId) as Row | undefined;
  return mapConversation(row);
}

export function listConversations(userId: number) {
  return (
    database()
      .prepare(
        "SELECT * FROM health_conversations WHERE userId = ? ORDER BY updatedAt DESC LIMIT 50"
      )
      .all(userId) as Row[]
  ).map(row => mapConversation(row)!);
}

export function getConversationMessages(userId: number, conversationId: number) {
  return (
    database()
      .prepare(
        `SELECT * FROM health_messages WHERE userId = ? AND conversationId = ?
         ORDER BY id LIMIT 100`
      )
      .all(userId, conversationId) as Row[]
  ).map(mapMessage);
}

export function listSymptomReports(userId: number) {
  return (
    database()
      .prepare(
        "SELECT * FROM symptom_reports WHERE userId = ? ORDER BY createdAt DESC LIMIT 30"
      )
      .all(userId) as Row[]
  ).map(mapSymptomReport);
}

export function addSymptomReport(input: {
  userId: number;
  originalDescription: string;
  language: string;
  structuredSummary: string;
  nextSteps: string;
  source: "live" | "fallback" | "safety";
}) {
  const result = database()
    .prepare(
      `INSERT INTO symptom_reports
       (userId, originalDescription, language, structuredSummary, nextSteps, source)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.userId,
      input.originalDescription,
      input.language,
      input.structuredSummary,
      input.nextSteps,
      input.source
    );
  return Number(result.lastInsertRowid);
}

export function deleteOwnedConversation(userId: number, id: number) {
  return (
    database()
      .prepare("DELETE FROM health_conversations WHERE id = ? AND userId = ?")
      .run(id, userId).changes > 0
  );
}

export function deleteOwnedSymptomReport(userId: number, id: number) {
  return (
    database()
      .prepare("DELETE FROM symptom_reports WHERE id = ? AND userId = ?")
      .run(id, userId).changes > 0
  );
}
