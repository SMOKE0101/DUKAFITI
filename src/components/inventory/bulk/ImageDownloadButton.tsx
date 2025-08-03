import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageDownloadButtonProps {
  onComplete?: () => void;
}

const ImageDownloadButton: React.FC<ImageDownloadButtonProps> = ({ onComplete }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      toast.info('Starting image download process...');

      const { data, error } = await supabase.functions.invoke('download-template-images');

      if (error) {
        console.error('Error downloading images:', error);
        toast.error('Failed to download images');
        return;
      }

      if (data?.success) {
        toast.success(`Successfully downloaded ${data.successCount} images!`);
        setIsComplete(true);
        onComplete?.();
        
        // Reset complete state after 3 seconds
        setTimeout(() => setIsComplete(false), 3000);
      } else {
        toast.error(data?.error || 'Failed to download images');
      }

    } catch (error) {
      console.error('Error calling download function:', error);
      toast.error('Failed to start download process');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isComplete ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isDownloading ? 'Downloading...' : isComplete ? 'Complete!' : 'Download Images'}
    </Button>
  );
};

export default ImageDownloadButton;