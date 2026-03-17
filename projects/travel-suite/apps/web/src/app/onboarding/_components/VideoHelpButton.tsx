'use client';

import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VideoHelpButtonProps {
  videoUrl: string;
  title?: string;
  description?: string;
  buttonText?: string;
}

/**
 * VideoHelpButton component displays a button that opens a modal with an embedded video tutorial.
 * Supports YouTube, Vimeo, and direct video URLs.
 *
 * @param videoUrl - The URL of the video to embed (YouTube, Vimeo, or direct video URL)
 * @param title - Optional title for the video modal (default: "Video Tutorial")
 * @param description - Optional description for the video modal
 * @param buttonText - Optional custom button text (default: "Watch 30s video")
 */
export function VideoHelpButton({
  videoUrl,
  title = 'Video Tutorial',
  description,
  buttonText = 'Watch 30s video',
}: VideoHelpButtonProps) {
  const [open, setOpen] = useState(false);

  // Convert YouTube and Vimeo URLs to embeddable format
  const getEmbedUrl = (url: string): string => {
    // YouTube URL patterns
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo URL patterns
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // Return original URL if it's already an embed URL or direct video URL
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] bg-white px-3 py-2 text-sm text-[#9c7c46] transition-colors hover:bg-[#f8f1e6] hover:text-[#7c6032] focus:outline-none focus:ring-2 focus:ring-[#9c7c46] focus:ring-offset-2"
          aria-label={title}
        >
          <PlayCircle className="h-4 w-4" />
          {buttonText}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#1b140a]">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-[#6f5b3e]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#eadfcd] bg-[#f8f1e6]">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
