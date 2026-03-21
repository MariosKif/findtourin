import { adminStorage } from './firebase';

const bucket = adminStorage.bucket();

export async function uploadImage(file: Buffer, fileName: string): Promise<{ url: string; storagePath: string }> {
  const storagePath = `tours/${Date.now()}-${fileName}`;
  const fileRef = bucket.file(storagePath);

  await fileRef.save(file, {
    metadata: {
      contentType: getContentType(fileName),
    },
  });

  await fileRef.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  return { url, storagePath };
}

export async function deleteImage(storagePath: string) {
  try {
    await bucket.file(storagePath).delete();
  } catch (error: any) {
    if (error.code !== 404) {
      throw new Error(`Delete failed: ${error.message}`);
    }
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
