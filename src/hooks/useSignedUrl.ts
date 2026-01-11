import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Hook to get a signed URL for a storage file path
 * Returns a refreshable signed URL for private storage buckets
 */
export function useSignedUrl(storagePath: string | null | undefined, bucket: string = 'trade-screenshots') {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setSignedUrl(null);
      return;
    }

    // Extract file path from full URL if necessary
    let filePath = storagePath;
    const bucketMarker = `/${bucket}/`;
    if (storagePath.includes(bucketMarker)) {
      const parts = storagePath.split(bucketMarker);
      filePath = parts[parts.length - 1];
    }

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

        if (signError) throw signError;

        setSignedUrl(data.signedUrl);
      } catch (err: any) {
        console.error('Failed to get signed URL:', err);
        setError(err.message);
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();

    // Refresh signed URL before it expires (refresh at 50 minutes)
    const refreshInterval = setInterval(fetchSignedUrl, (SIGNED_URL_EXPIRY - 600) * 1000);

    return () => clearInterval(refreshInterval);
  }, [storagePath, bucket]);

  return { signedUrl, isLoading, error };
}

/**
 * Generate a signed URL immediately (for upload flow)
 */
export async function createSignedUrl(
  filePath: string, 
  bucket: string = 'trade-screenshots',
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
