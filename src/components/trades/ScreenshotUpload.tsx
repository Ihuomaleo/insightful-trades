import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { createSignedUrl } from '@/hooks/useSignedUrl';

interface ScreenshotUploadProps {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ScreenshotUpload({ label, value, onChange }: ScreenshotUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false); // Track focus to prevent double-pasting
  const inputRef = useRef<HTMLInputElement>(null);

  // Load signed URL for existing value (stored path)
  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    const loadSignedUrl = async () => {
      try {
        let filePath = value;
        const bucketMarker = '/trade-screenshots/';
        if (value.includes(bucketMarker)) {
          const parts = value.split(bucketMarker);
          filePath = parts[parts.length - 1];
        }
        
        const signedUrl = await createSignedUrl(filePath);
        setPreview(signedUrl);
      } catch (err) {
        console.error('Failed to load screenshot preview:', err);
        setPreview(null);
      }
    };

    loadSignedUrl();
  }, [value]);

  const processFile = useCallback(async (file: File) => {
    if (!user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload or paste an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, file);

      if (error) throw error;

      const signedUrl = await createSignedUrl(data.path);
      
      setPreview(signedUrl);
      onChange(data.path);

      toast({
        title: 'Screenshot uploaded',
        description: 'Your screenshot has been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, onChange]);

  // Handle Clipboard Paste with focus check
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Only proceed if mouse is hovering over THIS instance and no preview exists
      if (!isHovered || preview || isUploading) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [preview, isUploading, processFile, isHovered]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = async () => {
    if (value && user) {
      let filePath = value;
      const bucketMarker = '/trade-screenshots/';
      if (value.includes(bucketMarker)) {
        const parts = value.split(bucketMarker);
        filePath = parts[parts.length - 1];
      }
      
      await supabase.storage
        .from('trade-screenshots')
        .remove([filePath]);
    }
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div 
      className="space-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <label className="text-sm font-medium leading-none">{label}</label>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt={label}
            className="w-full h-32 object-cover rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg',
            'flex flex-col items-center justify-center gap-2 text-muted-foreground text-center px-4',
            'hover:border-primary/50 hover:text-primary transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isHovered && !isUploading && 'border-primary/50 bg-primary/5'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-6 w-6" />
                <Upload className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">or hover & paste (Ctrl+V)</p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}