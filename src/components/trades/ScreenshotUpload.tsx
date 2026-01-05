import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ScreenshotUploadProps {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ScreenshotUpload({ label, value, onChange }: ScreenshotUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
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
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(data.path);

      setPreview(urlData.publicUrl);
      onChange(urlData.publicUrl);

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
  };

  const handleRemove = async () => {
    if (preview && user) {
      // Extract file path from URL
      const urlParts = preview.split('/trade-screenshots/');
      if (urlParts[1]) {
        await supabase.storage
          .from('trade-screenshots')
          .remove([urlParts[1]]);
      }
    }
    setPreview(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
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
            'flex flex-col items-center justify-center gap-2 text-muted-foreground',
            'hover:border-primary/50 hover:text-primary transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
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
              <span className="text-sm">Click to upload</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
