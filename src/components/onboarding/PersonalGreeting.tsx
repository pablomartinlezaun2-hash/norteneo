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
 *  - Watchdog global MAX_TOTAL_MS: nunca se queda bloqueado, pero se
 *    extiende automáticamente si el audio empieza a sonar.
 */

const LOADING_THRESHOLD_MS = 600;     // Tiempo antes de mostrar la microespera
const PREP_MAX_MS = 5000;             // Máx tiempo en estado "preparing"
const VISUAL_FALLBACK_MS = 2400;      // Duración del saludo cuando no hay audio
const POST_AUDIO_TAIL_MS = 600;       // Cola visual tras terminar el audio
const PREPARE_WATCHDOG_MS = 9000;     // Watchdog mientras esperamos audio
const PLAYING_WATCHDOG_MS = 12000;    // Watchdog absoluto durante reproducción

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
  const phaseRef = useRef<Phase>('preparing');
  const watchdogRef = useRef<number | undefined>(undefined);

  phaseRef.current = phase;

  const safeComplete = (reason: string) => {
    if (completedRef.current) return;
    completedRef.current = true;
    console.info(`[greeting] complete → main intro starts (reason=${reason})`);
    onComplete();
  };

  const armWatchdog = (ms: number, reason: string) => {
    if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
    watchdogRef.current = window.setTimeout(() => {
      console.warn(`[greeting] watchdog fired (${reason}) after ${ms}ms`);
      safeComplete(`watchdog:${reason}`);
    }, ms);
  };

  // Watchdog inicial — nunca quedarnos bloqueados durante "preparing"
  useEffect(() => {
    armWatchdog(PREPARE_WATCHDOG_MS, 'preparing');
    return () => {
      if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
    };
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

    console.info(`[greeting] mount with firstName="${firstName}"`);

    const startVisualFallback = (reason: string) => {
      if (cancelled) return;
      console.info(`[greeting] visual fallback (${reason}) duration=${VISUAL_FALLBACK_MS}ms`);
      setPhase('greeting');
      window.setTimeout(() => {
        if (!cancelled) {
          setPhase('fading');
          window.setTimeout(() => safeComplete('fallback-end'), 400);
        }
      }, VISUAL_FALLBACK_MS);
    };

    const startWithAudio = (url: string) => {
      if (cancelled) return;
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.95;
      audioRef.current = audio;

      const onEnded = () => {
        if (cancelled) return;
        console.info('[greeting] audio ended → tail then fade');
        window.setTimeout(() => {
          if (!cancelled) {
            setPhase('fading');
            window.setTimeout(() => safeComplete('audio-end'), 400);
          }
        }, POST_AUDIO_TAIL_MS);
      };
      const onError = (e: Event) => {
        console.warn('[greeting] audio playback failed → visual fallback', e);
        startVisualFallback('audio-error');
      };
      const onPlaying = () => {
        // El audio sonó: extendemos el watchdog para no cortarlo a mitad
        armWatchdog(PLAYING_WATCHDOG_MS, 'playing');
        console.info('[greeting] audio playing');
      };

      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('playing', onPlaying, { once: true });

      // Mostramos el texto justo antes de iniciar la reproducción
      setPhase('greeting');

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch((e) => {
          console.warn('[greeting] play() rejected', e);
          startVisualFallback('play-rejected');
        });
      }
    };

    // Cap de espera para la API: si tarda más de PREP_MAX_MS → fallback
    prepTimeoutId = window.setTimeout(() => {
      if (!cancelled && phaseRef.current === 'preparing') {
        startVisualFallback('api-timeout');
      }
    }, PREP_MAX_MS);

    fetchPersonalizedGreeting(firstName)
      .then((res) => {
        if (cancelled) return;
        if (prepTimeoutId) window.clearTimeout(prepTimeoutId);
        if (res?.audioUrl) {
          startWithAudio(res.audioUrl);
        } else {
          startVisualFallback('no-audio-url');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (prepTimeoutId) window.clearTimeout(prepTimeoutId);
        console.warn('[greeting] fetch threw', e);
        startVisualFallback('fetch-throw');
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
              Bienvenido
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
