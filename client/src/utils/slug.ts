/**
 * Converts a string into an SEO-friendly URL slug.
 * E.g., "¡Diseño Rápido y Legal!" -> "diseno-rapido-y-legal"
 */
export const sanitizeSlug = (title: string): string => {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD') // Split accented characters into base + accent
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric except spaces/hyphens
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
};
