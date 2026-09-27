import slugify from 'slugify';

/**
 * Generates a URL-safe slug. Callers append a short random suffix when
 * uniqueness against an existing slug is needed (see services that use this).
 */
export function toSlug(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

export function randomSuffix(length = 5) {
  return Math.random().toString(36).slice(2, 2 + length);
}
