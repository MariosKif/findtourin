import { supabaseAdmin } from './supabase';

const BUCKET = 'tour-images';

export async function uploadImage(file: Buffer, fileName: string): Promise<{ url: string; publicId: string }> {
  const path = `tours/${Date.now()}-${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { url: publicUrl, publicId: path };
}

export async function deleteImage(publicId: string) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([publicId]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}
