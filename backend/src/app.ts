import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config";
import { apiRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { getSitemapXml } from "./services/sitemapService";

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const xml = await getSitemapXml();
    res.type("application/xml").send(xml);
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "MS Sons Tours API is running", timestamp: new Date().toISOString() });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };