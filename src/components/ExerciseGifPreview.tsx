import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Pause } from 'lucide-react';

interface ExerciseGifPreviewProps {
  exerciseName: string;
  className?: string;
  compact?: boolean;
}

// In-memory cache to avoid re-fetching
const gifCache: Record<string, string | null> = {};

export const ExerciseGifPreview = ({ exerciseName, className = '', compact = false }: ExerciseGifPreviewProps) => {
  const [gifUrl, setGifUrl] = useState<string | null>(gifCache[exerciseName] || null);
  const [loading, setLoading] = useState(!gifCache[exerciseName]);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (gifCache[exerciseName] !== undefined) {
      setGifUrl(gifCache[exerciseName]);
      setLoading(false);
      return;
    }

    const fetchGif = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('exercise-gif', {
          body: { name: exerciseName },
        });

        if (fnError) throw fnError;

        const url = data?.gifUrl || null;
        gifCache[exerciseName] = url;
        setGifUrl(url);
      } catch (err) {
        console.error('Error fetching exercise GIF:', err);
        gifCache[exerciseName] = null;
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGif();
  }, [exerciseName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 rounded-lg ${compact ? 'w-16 h-16' : 'aspect-video'} ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!gifUrl || error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15 rounded-lg ${compact ? 'w-16 h-16' : 'aspect-video'} ${className}`}>
        <Play className="w-6 h-6 text-primary/30" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted/30 ${compact ? 'w-16 h-16' : 'aspect-video'} ${className}`}>
      <img
        src={gifUrl}
        alt={exerciseName}
        className={`w-full h-full object-cover ${paused ? 'opacity-50' : ''}`}
        loading="lazy"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          setPaused(!paused);
        }}
        className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        {paused ? (
          <Play className="w-3 h-3 fill-white" />
        ) : (
          <Pause className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};
