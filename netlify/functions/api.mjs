import serverless from "serverless-http";
import { createApp } from "../../server/_core/app.ts";

process.env.NODE_ENV = "production";

const app = createApp({ serveAssets: false });
export const handler = serverless(app, {
	basePath: "/.netlify/functions/api",
});
