import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { SESSION_COOKIE } from "./auth";
import { getUserByUsername } from "./db";
import { closeLocalDatabase } from "./localSqlite";
import type { TrpcContext } from "./_core/context";

type IssuedCookie = { name: string; value: string };
const databaseDirectory = mkdtempSync(join(tmpdir(), "womens-health-test-"));
const cookies: IssuedCookie[] = [];
const ctx: TrpcContext = {
  user: null,
  req: {
    protocol: "http",
    headers: { host: "localhost", origin: "http://localhost" },
  } as TrpcContext["req"],
  res: {
    cookie: (name: string, value: string) => cookies.push({ name, value }),
  } as TrpcContext["res"],
};

beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv(
    "WOMENS_HEALTH_SQLITE_PATH",
    join(databaseDirectory, "health.sqlite")
  );
});

afterAll(() => {
  closeLocalDatabase();
  rmSync(databaseDirectory, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("local SQLite account storage", () => {
  it("registers, persists the account and session, and logs in after reopening", async () => {
    const caller = appRouter.createCaller(ctx);
    const password = "Private@123";
    const account = await caller.auth.register({
      name: "Akhila",
      username: "akhila",
      password,
      confirmPassword: password,
      preferredLanguage: "en",
    });

    expect(account).toMatchObject({ name: "Akhila", username: "akhila" });
    expect(cookies.at(-1)?.name).toBe(SESSION_COOKIE);

    await expect(
      caller.auth.register({
        name: "Another Akhila",
        username: "AKHILA",
        password,
        confirmPassword: password,
        preferredLanguage: "en",
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "That username is already in use. Choose another.",
    });

    closeLocalDatabase();
    const loggedIn = await caller.auth.login({
      username: "AKHILA",
      password,
      remember: false,
    });
    expect(loggedIn).toMatchObject({
      id: account.id,
      name: "Akhila",
      username: "akhila",
    });
  });

  it("does not use the local fallback in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(getUserByUsername("akhila")).rejects.toThrow(
      "Database is not available"
    );
    vi.stubEnv("NODE_ENV", "test");
  });
});
