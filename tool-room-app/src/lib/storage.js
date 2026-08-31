import { supabase } from './supabase';

export async function uploadFileToBucket(file, folder = 'drawings') {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('job-card-media')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('Upload Error:', error.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('job-card-media')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}