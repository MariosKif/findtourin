import { supabase } from './supabase';

const BUCKET = 'tour-images';

export async function uploadImage(file: Buffer, fileName: string): Promise<{ url: string; storagePath: string }> {
  const storagePath = `tours/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: getContentType(fileName),
      upsert: false,
      // 1-year immutable cache. Filenames are content-addressed (timestamp +
      // original name); when a tour replaces an image the storage_path
      // changes, so we never need to invalidate. Default Supabase behaviour
      // is no-cache, which makes browsers revalidate every image on every
      // navigation — disastrous on a 39-tour listing page.
      cacheControl: '31536000',
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return { url: publicUrl, storagePath };
}

export async function deleteImage(storagePath: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error && !error.message.includes('Not found')) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const types: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return types[ext || ''] || 'application/octet-stream';
}
