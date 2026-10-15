import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Existing platform identity rows are retained; application username accounts are stored here too. */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).unique(),
    username: varchar("username", { length: 32 }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    preferredLanguage: varchar("preferredLanguage", { length: 8 })
      .default("en")
      .notNull(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => ({
    usernameUnique: uniqueIndex("users_username_unique").on(table.username),
  })
);

export const sessions = mysqlTable(
  "health_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ ownerIndex: index("health_sessions_user_idx").on(table.userId) })
);

export const conversations = mysqlTable(
  "health_conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    language: varchar("language", { length: 8 }).default("en").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerIndex: index("health_conversations_user_idx").on(table.userId),
  })
);

export const messages = mysqlTable(
  "health_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    language: varchar("language", { length: 8 }).notNull(),
    source: mysqlEnum("source", ["live", "fallback", "safety"])
      .default("live")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    convoIndex: index("health_messages_conversation_idx").on(
      table.conversationId,
      table.id
    ),
    ownerIndex: index("health_messages_user_idx").on(table.userId),
  })
);

export const symptomReports = mysqlTable(
  "symptom_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    originalDescription: text("originalDescription").notNull(),
    language: varchar("language", { length: 8 }).notNull(),
    structuredSummary: text("structuredSummary").notNull(),
    nextSteps: text("nextSteps").notNull(),
    source: mysqlEnum("source", ["live", "fallback", "safety"])
      .default("live")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ ownerIndex: index("symptom_reports_user_idx").on(table.userId) })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SymptomReport = typeof symptomReports.$inferSelect;
