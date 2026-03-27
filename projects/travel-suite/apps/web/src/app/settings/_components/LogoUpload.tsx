'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LogoUploadProps {
  currentUrl: string | null;
  organizationId: string;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

const MAX_SIZE_MB = 2;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

export function LogoUpload({ currentUrl, organizationId, onUploaded, onRemoved }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'brand';

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, JPG, SVG, or WebP image.');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const fileName = `${organizationId}/logos/logo-${Date.now()}.${ext}`;

      let publicUrl: string | null = null;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        const { error: fallbackError } = await supabase.storage
          .from('social-media')
          .upload(fileName, file, { upsert: true });

        if (fallbackError) {
          setError('Upload failed. Please try again.');
          return;
        }

        const { data: fallbackData } = supabase.storage
          .from('social-media')
          .getPublicUrl(fileName);
        publicUrl = fallbackData.publicUrl;
      } else {
        const { data } = supabase.storage
          .from('organization-assets')
          .getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      if (!publicUrl) {
        setError('Upload failed. Please try again.');
        return;
      }

      // Save logo_url via server-side API (bypasses RLS)
      const saveRes = await fetch('/api/admin/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: publicUrl }),
      });

      if (!saveRes.ok) {
        setError('Logo uploaded but failed to save. Please try again.');
        onUploaded(publicUrl);
        return;
      }

      onUploaded(publicUrl);
      setSaved(true);

      // If arriving from setup checklist and no guided tour is active, redirect to dashboard
      if (isSetupMode && !document.querySelector('.driver-active-element')) {
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-secondary dark:text-white">Company Logo</label>
      <div
        data-tour="logo-upload"
        className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors cursor-pointer ${
          saved
            ? 'border-[#00d084] bg-[#00d084]/5'
            : dragOver
            ? 'border-[#00d084] bg-[#00d084]/5'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !saved && inputRef.current?.click()}
      >
        {currentUrl ? (
          <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Company logo"
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {saved ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00d084] animate-bounce" />
              <p className="text-sm font-medium text-[#00d084]">Logo saved!</p>
              {isSetupMode && (
                <p className="text-xs text-gray-500">Returning to dashboard...</p>
              )}
            </div>
          ) : uploading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00d084]/30 border-t-[#00d084]" />
              <p className="text-sm text-gray-600">Uploading & saving...</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {currentUrl ? 'Change logo' : 'Upload your logo'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, SVG or WebP. Max {MAX_SIZE_MB}MB.
              </p>
            </>
          )}
        </div>
        {!saved && <Upload className="h-5 w-5 text-gray-400 shrink-0" />}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleChange}
          disabled={uploading || saved}
        />
      </div>
      {currentUrl && !saved && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoved();
          }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="h-3 w-3" />
          Remove logo
        </button>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
