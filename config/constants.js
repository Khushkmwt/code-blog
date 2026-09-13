import { config } from "./index.js";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

export const MIN_PASSWORD_LENGTH = 6;

export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: config.isProduction,
});

export const COOKIE_OPTS = cookieOptions();