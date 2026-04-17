import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPersonalizedGreeting } from '@/lib/personalizedGreeting';

interface PersonalGreetingProps {
  firstName: string;
  onComplete: () => void;
}

/**
 * Pre-roll fase 2: microescena premium personalizada.
 * Reproduce el saludo de voz generado por ElevenLabs (cacheado en backend)
 * y, al terminar, cede paso a la intro principal SIN modificarla.
 *
 * Fallback robusto:
 *  - Si la API tarda > LOADING_THRESHOLD_MS, se muestra microespera elegante.
 *  - Si la API falla o el audio no puede reproducirse, se muestra el saludo
 *    visual durante VISUAL_FALLBACK_MS y se continúa hacia la intro.
 *  - Watchdog global MAX_TOTAL_MS: nunca se queda bloqueado.
 */

const LOADING_THRESHOLD_MS = 600;     // Tiempo antes de mostrar la microespera
const PREP_MAX_MS = 4500;             // Máx tiempo en estado "preparing"
const VISUAL_FALLBACK_MS = 2400;      // Duración del saludo cuando no hay audio
const POST_AUDIO_TAIL_MS = 600;       // Cola visual tras terminar el audio
const MAX_TOTAL_MS = 8000;            // Watchdog global

type Phase = 'preparing' | 'greeting' | 'fading';

const PREP_MESSAGES = [
  'Preparando tu acceso',
  'Sincronizando perfil',
  'Inicializando experiencia',
];

export const PersonalGreeting = ({ firstName, onComplete }: PersonalGreetingProps) => {
  const [phase, setPhase] = useState<Phase>('preparing');
  const [showPrepCopy, setShowPrepCopy] = useState(false);
  const [prepIndex, setPrepIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completedRef = useRef(false);

  const safeComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  // Watchdog global — nunca quedarnos bloqueados
  useEffect(() => {
    const watchdog = setTimeout(safeComplete, MAX_TOTAL_MS);
    return () => clearTimeout(watchdog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Microespera elegante (aparece solo si tarda)
  useEffect(() => {
    if (phase !== 'preparing') return;
    const t = setTimeout(() => setShowPrepCopy(true), LOADING_THRESHOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Rotación sutil del microcopy de espera
  useEffect(() => {
    if (!showPrepCopy) return;
    const interval = setInterval(
      () => setPrepIndex((i) => (i + 1) % PREP_MESSAGES.length),
      1400,
    );
    return () => clearInterval(interval);
  }, [showPrepCopy]);

  // Carga + reproducción del saludo
  useEffect(() => {
    let cancelled = false;
    let prepTimeoutId: number | undefined;

    const startVisualFallback = () => {
      if (cancelled) return;
      setPhase('greeting');
      window.setTimeout(() => {
        if (!cancelled) {
          setPhase('fading');
          window.setTimeout(safeComplete, 400);
        }
      }, VISUAL_FALLBACK_MS);
    };

    const startWithAudio = (url: string) => {
      if (cancelled) return;
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.95;
      audio.muted = false;
      // @ts-expect-error - playsInline existe en HTMLMediaElement (iOS Safari)
      audio.playsInline = true;
      audioRef.current = audio;

      const onEnded = () => {
        if (cancelled) return;
        window.setTimeout(() => {
          if (!cancelled) {
            setPhase('fading');
            window.setTimeout(safeComplete, 400);
          }
        }, POST_AUDIO_TAIL_MS);
      };
      const onError = () => {
        console.warn('[greeting] audio playback failed → visual fallback');
        startVisualFallback();
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      // CRÍTICO: llamar play() ANTES del setState para preservar la cadena
      // de activación de usuario (evita NotAllowedError en Safari/iOS).
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            if (!cancelled) setPhase('greeting');
          })
          .catch((e) => {
            console.warn('[greeting] play() rejected', e);
            // Intento de recuperación: reproducir muteado y desmutear
            audio.muted = true;
            audio
              .play()
              .then(() => {
                audio.muted = false;
                if (!cancelled) setPhase('greeting');
              })
              .catch((e2) => {
                console.warn('[greeting] muted retry failed', e2);
                startVisualFallback();
              });
          });
      } else {
        setPhase('greeting');
      }
    };

    // Cap de espera para la API: si tarda más de PREP_MAX_MS → fallback
    prepTimeoutId = window.setTimeout(() => {
      if (!cancelled && phase === 'preparing') {
        console.warn('[greeting] API timeout → visual fallback');
        startVisualFallback();
      }
    }, PREP_MAX_MS);

    fetchPersonalizedGreeting(firstName)
      .then((res) => {
        if (cancelled) return;
        if (prepTimeoutId) window.clearTimeout(prepTimeoutId);
        if (res?.audioUrl) {
          startWithAudio(res.audioUrl);
        } else {
          startVisualFallback();
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (prepTimeoutId) window.clearTimeout(prepTimeoutId);
        startVisualFallback();
      });

    return () => {
      cancelled = true;
      if (prepTimeoutId) window.clearTimeout(prepTimeoutId);
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
          a.src = '';
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName]);

  const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center px-7 overflow-hidden">
      {/* Halo ambiente — coherente con el universo de la intro */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        style={{
          background:
            'radial-gradient(ellipse 55% 40% at 50% 48%, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 'preparing' && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease } }}
            transition={{ duration: 0.5, ease }}
            className="relative z-10 flex flex-col items-center gap-5"
          >
            {/* Pulso premium en lugar de spinner */}
            <motion.div
              className="relative w-2 h-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.85)' }}
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.85, 0.35, 0.85],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <AnimatePresence mode="wait">
              {showPrepCopy && (
                <motion.p
                  key={prepIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.5, ease }}
                  className="text-[11px] tracking-[0.32em] uppercase font-medium"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {PREP_MESSAGES[prepIndex]}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {(phase === 'greeting' || phase === 'fading') && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease }}
            className="relative z-10 flex flex-col items-center gap-3 text-center"
          >
            <motion.span
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease }}
              className="text-[11px] tracking-[0.32em] uppercase font-medium"
              style={{ color: 'rgba(255,255,255,0.42)' }}
            >
              {welcomeWord(firstName)}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.0, delay: 0.2, ease }}
              className="text-[36px] md:text-[44px] font-semibold tracking-[-0.03em] leading-[1.1]"
              style={{ color: '#fff' }}
            >
              {firstName}
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7, ease }}
              className="mt-3 h-px w-16 origin-center"
              style={{ background: 'rgba(255,255,255,0.4)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade-out final para empalmar suavemente con el SplashScreen */}
      <AnimatePresence>
        {phase === 'fading' && (
          <motion.div
            className="absolute inset-0 bg-black pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeIn' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
