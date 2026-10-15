import serverless from "serverless-http";
import { createApp } from "../../server/_core/app.ts";

const app = createApp({ serveAssets: false });
export const handler = serverless(app);
export const config = { path: "/api/*" };
