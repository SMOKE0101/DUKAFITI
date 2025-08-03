import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export const useImageUpload = () => {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadImage = async (file: File, productId?: string): Promise<string | null> => {
    try {
      setState({ isUploading: true, progress: 0, error: null });

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId || Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      setState(prev => ({ ...prev, progress: 50 }));

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setState(prev => ({ ...prev, progress: 100 }));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      setState({ isUploading: false, progress: 0, error: null });
      toast.success('Image uploaded successfully!');
      
      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setState({ isUploading: false, progress: 0, error: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // products/filename.ext

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) throw error;

      toast.success('Image deleted successfully!');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    ...state,
    uploadImage,
    deleteImage,
  };
};