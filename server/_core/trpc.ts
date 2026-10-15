import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
const sameOriginWrites = t.middleware(async opts => {
  if (opts.type === "mutation") {
    const origin = opts.ctx.req.headers.origin;
    if (!origin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Mutation requests require a verifiable same-origin header.",
      });
    }
    try {
      const parsedOrigin = new URL(origin);
      const forwardedHost = opts.ctx.req.headers["x-forwarded-host"];
      const expectedHost =
        (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)
          ?.split(",")[0]
          .trim()
          .toLowerCase() || opts.ctx.req.headers.host?.toLowerCase();
      const forwardedProto = opts.ctx.req.headers["x-forwarded-proto"];
      const expectedProtocol =
        (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)
          ?.split(",")[0]
          .trim()
          .toLowerCase() || parsedOrigin.protocol.replace(":", "");
      if (
        !expectedHost ||
        parsedOrigin.host.toLowerCase() !== expectedHost ||
        parsedOrigin.protocol !== `${expectedProtocol}:`
      ) {
        throw new Error("Origin mismatch");
      }
    } catch {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Request origin could not be verified.",
      });
    }
  }
  return opts.next();
});
export const publicProcedure = t.procedure.use(sameOriginWrites);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure
  .use(sameOriginWrites)
  .use(requireUser);

export const adminProcedure = t.procedure.use(sameOriginWrites).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
