import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AudioBriefingPlayerProps {
  microcycleId: string;
  adherence: number;
  trainingAcc?: number;
  performance?: number;
  fatigue?: number;
  nutrition?: number;
  hasNutrition?: boolean;
  hasFatigue?: boolean;
}

type Status = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const AudioBriefingPlayer = ({
  microcycleId,
  adherence,
  trainingAcc,
  performance,
  fatigue,
  nutrition,
  hasNutrition,
  hasFatigue,
}: AudioBriefingPlayerProps) => {
  const [status, setStatus] = useState<Status>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Reset when microcycle changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setStatus('idle');
    setAudioUrl(null);
    setDuration(0);
    setProgress(0);
    setErrorMsg(null);
  }, [microcycleId]);

  const ensureAudio = async (): Promise<HTMLAudioElement | null> => {
    if (audioRef.current && audioUrl) return audioRef.current;

    setStatus('loading');
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        'microcycle-audio-briefing',
        {
          body: {
            microcycleId,
            adherence,
            trainingAcc,
            performance,
            fatigue,
            nutrition,
            hasNutrition,
            hasFatigue,
          },
        }
      );

      if (error) throw error;
      if (data?.fallback || !data?.audioUrl) {
        throw new Error('Audio no disponible');
      }

      const url = data.audioUrl as string;
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration || 0);
      });
      audio.addEventListener('timeupdate', () => {
        setProgress(audio.currentTime || 0);
      });
      audio.addEventListener('ended', () => {
        setStatus('ready');
        setProgress(0);
      });
      audio.addEventListener('error', () => {
        setStatus('error');
        setErrorMsg('Error al cargar el audio');
      });

      audioRef.current = audio;
      setStatus('ready');
      return audio;
    } catch (e: any) {
      console.error('[briefing] generate error', e);
      setStatus('error');
      setErrorMsg('No se pudo generar el briefing');
      return null;
    }
  };

  const handleToggle = async () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = await ensureAudio();
      if (!audio) return;
    }

    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
    } else {
      try {
        await audio.play();
        setStatus('playing');
      } catch (err) {
        console.error('[briefing] play blocked', err);
        setStatus('error');
        setErrorMsg('Toca de nuevo para reproducir');
      }
    }
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';
  const isError = status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-3.5 space-y-3"
    >
      <div className="flex items-center gap-3">
        {/* Play button */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pausar briefing' : 'Reproducir briefing'}
          className={cn(
            'relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all',
            'bg-foreground text-background hover:scale-105 active:scale-95',
            isLoading && 'opacity-70 cursor-wait',
            isError && 'bg-destructive text-destructive-foreground'
          )}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle className="w-4 h-4" />
              </motion.div>
            ) : isPlaying ? (
              <motion.div
                key="pause"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Pause className="w-4 h-4 fill-current" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Title + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground truncate">
              Briefing semanal
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {isLoading
              ? 'Generando briefing…'
              : isError
              ? errorMsg || 'Error'
              : status === 'idle'
              ? 'Toca para escuchar'
              : `${formatTime(progress)} / ${formatTime(duration)}`}
          </p>
        </div>
      </div>

      {/* Progress bar — only when audio is available */}
      {audioUrl && !isError && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            style={{ width: `${pct}%` }}
            transition={{ ease: 'linear', duration: 0.1 }}
          />
        </div>
      )}
    </motion.div>
  );
};
