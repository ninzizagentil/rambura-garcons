import { v2 as cloudinary } from 'cloudinary';

const configured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (configured) cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

export function isCloudinaryConfigured() { return configured; }
export function uploadBuffer(buffer, folder = 'rambura-garcons') {
  if (!configured) throw Object.assign(new Error('Image storage is not configured'), { statusCode: 503 });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => error ? reject(error) : resolve({ imageUrl: result.secure_url, publicId: result.public_id }));
    stream.end(buffer);
  });
}
export async function deleteImage(publicId) { if (configured && publicId) return cloudinary.uploader.destroy(publicId); return null; }
