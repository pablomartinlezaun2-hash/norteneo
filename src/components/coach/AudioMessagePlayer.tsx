/**
 * AudioMessagePlayer — Mini reproductor premium para mensajes de voz del coach.
 *
 * - Carga la URL firmada bajo demanda al pulsar play (ahorro de ancho de banda).
 * - Indica duración y barra de progreso animada.
 * - Marca como escuchado al iniciar reproducción si es el atleta.
 * - Adopta el estilo del bubble (mine vs other) sin colores hardcoded.
 */

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  audioId: string;
  durationSeconds?: number | null;
  isMine: boolean;
  onMarkListened?: () => void;
  /** Etiqueta opcional encima del player (p. ej. tipo de evento). */
  eventLabel?: string | null;
}

function formatDuration(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export const AudioMessagePlayer = ({
  audioId,
  durationSeconds,
  isMine,
  onMarkListened,
  eventLabel,
}: Props) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState<number>(durationSeconds ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [markedListened, setMarkedListened] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const ensureUrl = async (): Promise<string | null> => {
    if (signedUrl) return signedUrl;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("coach-audio-url", {
        body: { audioId },
      });
      if (err) {
        setError(err.message || "No se pudo cargar el audio");
        return null;
      }
      const url = (data as any)?.signed_url as string | null;
      if (!url) {
        setError("No se pudo cargar el audio");
        return null;
      }
      setSignedUrl(url);
      return url;
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    setError(null);
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    const url = await ensureUrl();
    if (!url) return;

    if (!audioRef.current) {
      const a = new Audio(url);
      a.preload = "metadata";
      a.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
      });
      a.addEventListener("timeupdate", () => {
        if (a.duration > 0) setProgress(a.currentTime / a.duration);
      });
      a.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(1);
      });
      a.addEventListener("error", () => {
        setError("Error reproduciendo");
        setPlaying(false);
      });
      audioRef.current = a;
    }

    try {
      await audioRef.current.play();
      setPlaying(true);
      if (!isMine && !markedListened && onMarkListened) {
        onMarkListened();
        setMarkedListened(true);
      }
    } catch (e) {
      setError("No se pudo reproducir");
      setPlaying(false);
    }
  };

  const totalDuration = duration || durationSeconds || 0;
  const currentTime = totalDuration * progress;

  return (
    <div
      className={cn(
        "rounded-2xl px-3.5 py-3 border shadow-sm min-w-[220px] max-w-[280px]",
        isMine
          ? "bg-foreground text-background border-foreground/80"
          : "bg-card/60 text-foreground border-border/30 ring-1 ring-foreground/[0.03]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles className={cn("w-3 h-3", isMine ? "text-background/60" : "text-foreground/50")} />
        <span
          className={cn(
            "text-[9px] uppercase tracking-wider font-bold",
            isMine ? "text-background/60" : "text-muted-foreground/60",
          )}
        >
          Audio del coach
        </span>
        {eventLabel && (
          <span
            className={cn(
              "ml-auto px-1.5 py-px rounded text-[9px] font-semibold truncate max-w-[100px]",
              isMine
                ? "bg-background/15 text-background/70"
                : "bg-foreground/[0.06] text-muted-foreground/70",
            )}
          >
            {eventLabel}
          </span>
        )}
      </div>

      {/* Player row */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95",
            isMine
              ? "bg-background text-foreground"
              : "bg-foreground text-background",
            loading && "opacity-60",
          )}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : playing ? (
            <Pause className="w-3.5 h-3.5" fill="currentColor" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            className={cn(
              "h-1 rounded-full overflow-hidden",
              isMine ? "bg-background/20" : "bg-foreground/10",
            )}
          >
            <div
              className={cn(
                "h-full transition-[width] duration-150",
                isMine ? "bg-background" : "bg-foreground",
              )}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          {/* Times */}
          <div className="flex items-center justify-between mt-1">
            <span
              className={cn(
                "text-[9px] tabular-nums",
                isMine ? "text-background/50" : "text-muted-foreground/50",
              )}
            >
              {formatDuration(playing || progress > 0 ? currentTime : 0)}
            </span>
            <span
              className={cn(
                "text-[9px] tabular-nums",
                isMine ? "text-background/50" : "text-muted-foreground/50",
              )}
            >
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-red-400/80">
          <AlertCircle className="w-2.5 h-2.5" />
          {error}
        </div>
      )}
    </div>
  );
};
