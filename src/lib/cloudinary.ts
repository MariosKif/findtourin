import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

export function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: 'worldoftours/tours',
    transformation: 'c_limit,w_1600,h_1200,q_auto',
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    import.meta.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || ''
  );

  return {
    signature,
    timestamp,
    cloudName: import.meta.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: import.meta.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
    folder: params.folder,
  };
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
