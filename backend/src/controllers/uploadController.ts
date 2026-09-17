import { Response, NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import { AppError } from "../middleware/errorHandler";

const ALLOWED_EXT = [".webp", ".jpg", ".jpeg", ".png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const REVIEW_ALLOWED_EXT = [".webp", ".jpg", ".png"];
const REVIEW_MAX_SIZE = 3 * 1024 * 1024; // 3MB

function uploadDir(): string {
  // In Docker deployments UPLOADS_PATH points at a shared named volume that the
  // frontend nginx container also mounts. Locally (dev/build) keep writing into
  // the frontend public folder so vite/nginx serve uploads without extra config.
  if (process.env.UPLOADS_PATH) return process.env.UPLOADS_PATH;
  // backend/src/controllers (dev) or backend/dist/controllers (build) -> project root/frontend/public/uploads/hotels
  return path.resolve(__dirname, "../../../frontend/public/uploads/hotels");
}

function reviewUploadDir(): string {
  // Reviews use a distinct folder so admin/hotel assets and public review
  // photos stay separate.
  if (process.env.UPLOADS_PATH) return path.join(process.env.UPLOADS_PATH, "reviews");
  return path.resolve(__dirname, "../../../frontend/public/uploads/reviews");
}

async function writeImage(folder: string, fileUrlPrefix: string, allowedExt: string[], maxSize: number, name: any, data: any, fallbackBase: string) {
  if (!name || typeof name !== "string" || !data || typeof data !== "string") {
    throw new AppError("File name and base64 data are required", 400);
  }

  const extName = path.extname(name);
  const ext = extName.toLowerCase();
  if (!allowedExt.includes(ext)) {
    throw new AppError(`Only ${allowedExt.map((e) => e.slice(1)).join(", ")} images are allowed`, 400);
  }

  let base64 = data;
  const comma = data.indexOf(",");
  if (comma !== -1 && data.slice(0, comma).includes(";base64")) {
    base64 = data.slice(comma + 1);
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new AppError("The selected file is empty", 400);
  }
  if (buffer.length > maxSize) {
    throw new AppError(`Image must be ${maxSize / (1024 * 1024)}MB or smaller`, 400);
  }

  const base = path.basename(name, extName).replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 60) || fallbackBase;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}${ext}`;

  const dir = folder;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  return { url: `${fileUrlPrefix}/${filename}` };
}

export async function saveReviewImage(name: string, data: string): Promise<string> {
  const { url } = await writeImage(reviewUploadDir(), "/uploads/reviews", REVIEW_ALLOWED_EXT, REVIEW_MAX_SIZE, name, data, "review");
  return url;
}

export const uploadController = {
  async hotelImage(req: any, res: Response, next: NextFunction) {
    try {
      const dir = uploadDir();
      const { url } = await writeImage(dir, "/uploads/hotels", ALLOWED_EXT, MAX_SIZE, req.body?.name, req.body?.data, "hotel");
      res.status(201).json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  },

  async reviewImage(req: any, res: Response, next: NextFunction) {
    try {
      const url = await saveReviewImage(req.body?.name, req.body?.data);
      res.status(201).json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  },
};