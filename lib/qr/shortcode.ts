import { customAlphabet } from "nanoid";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SHORT_CODE_LENGTH = 7;

/**
 * Generate a URL-safe, collision-resistant short code using only alphanumeric chars.
 * Special chars (-, _) are excluded to keep codes clean in URL paths.
 */
export const generateShortCode = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);