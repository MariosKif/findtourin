/**
 * Image URL helpers for Supabase Storage transformations.
 *
 * Public storage URLs are served at full upload resolution and (for older
 * uploads) with cache-control: no-cache. The render/image endpoint serves
 * them with a 1-year immutable cache, on-the-fly resize, and optional
 * format conversion. Non-Supabase URLs (Unsplash, local /images/* paths)
 * are returned unchanged — they're already optimized at the source.
 */

const STORAGE_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

function isSupabaseStorage(src: string): boolean {
  return src.includes(STORAGE_PATH);
}

export function imgUrl(
  src: string | null | undefined,
  width: number,
  quality = 75,
): string {
  if (!src) return '';
  if (!isSupabaseStorage(src)) return src;
  const transformed = src.replace(STORAGE_PATH, RENDER_PATH);
  const sep = transformed.includes('?') ? '&' : '?';
  return `${transformed}${sep}width=${width}&quality=${quality}`;
}

export function imgSrcset(
  src: string | null | undefined,
  widths: number[],
  quality = 75,
): string {
  if (!src || !isSupabaseStorage(src)) return '';
  return widths.map((w) => `${imgUrl(src, w, quality)} ${w}w`).join(', ');
}
