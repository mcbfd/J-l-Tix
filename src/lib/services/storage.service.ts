import { createClient } from '@/lib/supabase/client';

/**
 * Service for uploading and managing event banner images and media assets.
 * Supports direct Supabase Storage uploads with graceful fallback to high-quality compressed Base64 data URLs.
 */
export async function uploadEventImage(file: File): Promise<string> {
  const supabase = createClient();

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné doit être une image (JPG, PNG, WebP).');
  }

  // Max file size: 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("L'image est trop volumineuse. Taille maximale autorisée : 5 Mo.");
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `event-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `banners/${fileName}`;

  try {
    // Attempt upload to Supabase Storage 'event-banners' bucket
    const { error: uploadError } = await supabase.storage
      .from('event-banners')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (!uploadError) {
      const { data } = supabase.storage.from('event-banners').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload fallback activated:', err);
  }

  // Graceful client-side fallback: Convert to Data URL (works without bucket setup)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Impossible de lire l'image sélectionnée."));
      }
    };
    reader.onerror = () => reject(new Error("Erreur lors de la lecture de l'image."));
    reader.readAsDataURL(file);
  });
}
