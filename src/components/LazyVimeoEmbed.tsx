import { useEffect, useId, useMemo, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VimeoThumbnailProps {
  videoUrl: string;
  className?: string;
  alt?: string;
  eager?: boolean;
  showPlayIcon?: boolean;
}

interface LazyVimeoEmbedProps {
  videoUrl: string;
  className?: string;
  title?: string;
  active?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const preconnectedOrigins = new Set<string>();
const activePlayerListeners = new Set<(playerId: string | null) => void>();
let activePlayerId: string | null = null;

const notifyActivePlayerChange = (playerId: string | null) => {
  activePlayerId = playerId;
  activePlayerListeners.forEach((listener) => listener(playerId));
};

const subscribeToActivePlayer = (listener: (playerId: string | null) => void) => {
  activePlayerListeners.add(listener);
  return () => {
    activePlayerListeners.delete(listener);
  };
};

const ensurePreconnect = (origin: string) => {
  if (typeof document === 'undefined' || preconnectedOrigins.has(origin)) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  preconnectedOrigins.add(origin);
};

export const extractVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const getThumbnailUrl = (videoUrl: string) => {
  const videoId = extractVimeoId(videoUrl);
  return videoId ? `https://vumbnail.com/${videoId}.jpg` : null;
};

const buildEmbedUrl = ({
  videoId,
  autoplay,
  muted,
  loop,
}: {
  videoId: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
}) => {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    muted: muted ? '1' : '0',
    loop: loop ? '1' : '0',
    background: autoplay && muted && loop ? '1' : '0',
    autoplay_pause: '0',
    autopause: '0',
    controls: '0',
    title: '0',
    byline: '0',
    portrait: '0',
    pip: '0',
    dnt: '1',
    transparent: '0',
    quality: '360p',
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
};

export const VimeoThumbnail = ({
  videoUrl,
  className,
  alt = 'Vista previa del ejercicio',
  eager = false,
  showPlayIcon = true,
}: VimeoThumbnailProps) => {
  const thumbnailUrl = getThumbnailUrl(videoUrl);

  return (
    <div className={cn('relative aspect-video overflow-hidden rounded-xl bg-muted', className)}>
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="h-full w-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'low'}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
          <Play className="h-10 w-10" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-transparent" />

      {showPlayIcon && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-sm">
            <Play className="h-5 w-5 translate-x-[1px] text-foreground" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};

export const LazyVimeoEmbed = ({
  videoUrl,
  className,
  title = 'Exercise video',
  active = true,
  autoplay = true,
  muted = true,
  loop = true,
}: LazyVimeoEmbedProps) => {
  const instanceId = useId();
  const [currentActivePlayerId, setCurrentActivePlayerId] = useState<string | null>(activePlayerId);
  const [shouldMountIframe, setShouldMountIframe] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  const videoId = useMemo(() => extractVimeoId(videoUrl), [videoUrl]);
  const embedUrl = useMemo(
    () =>
      videoId
        ? buildEmbedUrl({
            videoId,
            autoplay,
            muted,
            loop,
          })
        : null,
    [autoplay, loop, muted, videoId]
  );

  useEffect(() => subscribeToActivePlayer(setCurrentActivePlayerId), []);

  useEffect(() => {
    if (!active || !embedUrl) {
      if (activePlayerId === instanceId) {
        notifyActivePlayerChange(null);
      }
      setShouldMountIframe(false);
      setIframeReady(false);
      return;
    }

    notifyActivePlayerChange(instanceId);

    const frame = window.requestAnimationFrame(() => {
      ensurePreconnect('https://player.vimeo.com');
      ensurePreconnect('https://i.vimeocdn.com');
      ensurePreconnect('https://f.vimeocdn.com');
      setShouldMountIframe(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (activePlayerId === instanceId) {
        notifyActivePlayerChange(null);
      }
    };
  }, [active, embedUrl, instanceId]);

  const isActivePlayer = active && currentActivePlayerId === instanceId;

  useEffect(() => {
    if (!isActivePlayer) {
      setShouldMountIframe(false);
      setIframeReady(false);
    }
  }, [isActivePlayer]);

  if (!videoId || !embedUrl) {
    return <VimeoThumbnail videoUrl={videoUrl} className={className} alt={title} showPlayIcon={false} />;
  }

  return (
    <div className={cn('relative aspect-video overflow-hidden rounded-xl bg-muted', className)}>
      <VimeoThumbnail videoUrl={videoUrl} alt={title} eager showPlayIcon={!iframeReady} className="h-full w-full" />

      {isActivePlayer && shouldMountIframe && (
        <iframe
          key={instanceId}
          src={embedUrl}
          title={title}
          width="100%"
          height="100%"
          frameBorder="0"
          loading="eager"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={cn(
            'absolute inset-0 h-full w-full transition-opacity duration-300',
            iframeReady ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIframeReady(true)}
        />
      )}

      {isActivePlayer && shouldMountIframe && !iframeReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/18 backdrop-blur-[1px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/72">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </div>
      )}
    </div>
  );
};
