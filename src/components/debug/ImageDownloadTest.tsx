import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const ImageDownloadTest = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  const startImageDownload = async () => {
    setIsDownloading(true);
    try {
      console.log('Starting image download process...');
      
      const { data, error } = await supabase.functions.invoke('download-template-images', {
        body: {}
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error(`Download failed: ${error.message}`);
        return;
      }

      console.log('Download batch completed:', data);
      setProgress(data);
      
      if (data.successCount > 0) {
        toast.success(`Downloaded ${data.successCount} images successfully!`);
      }
      
      if (data.errorCount > 0) {
        toast.error(`${data.errorCount} images failed to download`);
      }

    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to start download process');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAllImages = async () => {
    setIsDownloading(true);
    let totalSuccess = 0;
    let totalErrors = 0;
    let batchCount = 0;

    try {
      // Keep calling until no more images to download
      while (true) {
        batchCount++;
        console.log(`Starting batch ${batchCount}...`);
        
        const { data, error } = await supabase.functions.invoke('download-template-images', {
          body: {}
        });

        if (error) {
          console.error('Edge function error:', error);
          toast.error(`Batch ${batchCount} failed: ${error.message}`);
          break;
        }

        console.log(`Batch ${batchCount} completed:`, data);
        totalSuccess += data.successCount;
        totalErrors += data.errorCount;

        // If no images were processed, we're done
        if (data.successCount === 0 && data.errorCount === 0) {
          console.log('No more images to download');
          break;
        }

        // Update progress
        setProgress({
          ...data,
          batchCount,
          totalSuccess,
          totalErrors
        });

        toast.success(`Batch ${batchCount}: ${data.successCount} images downloaded`);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success(`All done! Total: ${totalSuccess} success, ${totalErrors} errors across ${batchCount} batches`);

    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed during download process');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Template Image Download Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={startImageDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download Single Batch (200 images)'}
          </Button>
          
          <Button 
            onClick={downloadAllImages}
            disabled={isDownloading}
            variant="default"
          >
            {isDownloading ? 'Downloading All...' : 'Download All Remaining Images'}
          </Button>
        </div>

        {progress && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Last Result:</h3>
            <div className="space-y-1 text-sm">
              <p>✅ Success: {progress.successCount}</p>
              <p>❌ Errors: {progress.errorCount}</p>
              {progress.batchCount && (
                <>
                  <p>📦 Batch: {progress.batchCount}</p>
                  <p>🎯 Total Success: {progress.totalSuccess}</p>
                  <p>⚠️ Total Errors: {progress.totalErrors}</p>
                </>
              )}
              <p>💬 Message: {progress.message}</p>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>This will download external template images and upload them to Supabase storage.</p>
          <p>Each batch processes up to 200 templates with external image URLs.</p>
        </div>
      </CardContent>
    </Card>
  );
};
