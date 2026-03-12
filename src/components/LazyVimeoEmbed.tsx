import { useState, useEffect, useRef } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyVimeoEmbedProps {
  videoUrl: string;
  className?: string;
}

const extractVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

export const LazyVimeoEmbed = ({ videoUrl, className }: LazyVimeoEmbedProps) => {
  const [loaded, setLoaded] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const videoId = extractVimeoId(videoUrl);
  const thumbnailUrl = videoId
    ? `https://vumbnail.com/${videoId}.jpg`
    : null;

  // Load iframe when component mounts (i.e. exercise view opens)
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const embedUrl = videoUrl.includes('player.vimeo.com')
    ? videoUrl
    : `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1`;

  return (
    <div
      ref={containerRef}
      className={cn('relative aspect-video rounded-xl overflow-hidden bg-muted', className)}
    >
      {/* Thumbnail placeholder */}
      {thumbnailUrl && !iframeReady && (
        <div className="absolute inset-0 z-10">
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
      )}

      {/* Fallback if no thumbnail */}
      {!thumbnailUrl && !iframeReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <Play className="w-10 h-10 text-muted-foreground" />
        </div>
      )}

      {/* Lazy iframe */}
      {loaded && (
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-500',
            iframeReady ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIframeReady(true)}
        />
      )}
    </div>
  );
};
