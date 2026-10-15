import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authenticateRequest } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  sessionTokenHash?: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  try {
    const session = await authenticateRequest(opts.req);
    return {
      req: opts.req,
      res: opts.res,
      user: session.user,
      sessionTokenHash: session.tokenHash,
    };
  } catch (error) {
    console.error(
      "[Auth] Session verification failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return { req: opts.req, res: opts.res, user: null };
  }
}
