import { supabase } from './supabase';

const BUCKET_NAME = 'job-card-media';

// Browser-level Canvas Compression (< 150 KB)
async function compressImage(file) {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1200;
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob], 
                file.name.replace(/\.[^/.]+$/, "") + ".webp", 
                { type: 'image/webp' }
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          0.75
        );
      };
    };
  });
}

// Upload file to bucket folder
export async function uploadFileToBucket(file, folderName = 'photos') {
  try {
    const fileToUpload = await compressImage(file);
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${folderName}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Storage upload error:', err.message);
    return null;
  }
}

// Physically delete file from Supabase Bucket
export async function deleteFileFromBucket(publicUrl) {
  if (!publicUrl) return;
  try {
    // Extract path after 'job-card-media/'
    // Example URL: .../storage/v1/object/public/job-card-media/photos/123_abc.webp -> "photos/123_abc.webp"
    const urlParts = publicUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;

    const relativePath = decodeURIComponent(urlParts[1].split('?')[0]);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([relativePath]);

    if (error) throw error;
  } catch (err) {
    console.error('Failed to delete file from storage bucket:', err.message);
  }
}