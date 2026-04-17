import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  validateFirstName,
  saveFirstName,
  FIRST_NAME_MAX,
} from '@/lib/firstName';

interface NameCaptureProps {
  onSubmit: (firstName: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  empty: 'Escribe tu nombre para continuar.',
  too_short: 'Necesita al menos 2 letras.',
  too_long: `Máximo ${FIRST_NAME_MAX} caracteres.`,
  invalid_chars: 'Solo letras, espacios, guiones o apóstrofes.',
};

/**
 * Pre-roll fase 1: Captura del nombre del usuario.
 * Valida, normaliza y persiste (localStorage + perfil si hay sesión).
 * NO modifica la intro principal. Es una capa previa.
 */
export const NameCapture = ({ onSubmit }: NameCaptureProps) => {
  const [name, setName] = useState('');
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(t);
  }, []);

  const validation = useMemo(() => validateFirstName(name), [name]);
  const isValid = validation.valid;
  const errorMsg =
    !isValid && showError
      ? ERROR_MESSAGES[(validation as { error: string }).error] ?? null
      : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (showError) setShowError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowError(true);
      return;
    }
    setSubmitting(true);
    const formatted = await saveFirstName(name);
    setSubmitting(false);
    if (!formatted) {
      setShowError(true);
      return;
    }
    onSubmit(formatted);
  };

  const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center px-7 overflow-hidden">
      {/* Halo ambiente sutil para integrar con el universo de la intro */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 45%, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative z-10 w-full max-w-[340px] flex flex-col items-center gap-7"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[10px] tracking-[0.28em] uppercase font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Antes de empezar
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease }}
          className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] text-center leading-[1.25]"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          ¿Cómo te llamas?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.85 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.85, duration: 0.6, ease }}
          className="w-full"
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleChange}
            placeholder="Tu nombre"
            autoComplete="given-name"
            maxLength={FIRST_NAME_MAX}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? 'name-error' : undefined}
            className="w-full bg-transparent border-0 border-b text-center text-[22px] font-medium py-3 outline-none transition-colors duration-300 placeholder:font-normal"
            style={{
              color: '#fff',
              borderColor: errorMsg
                ? 'rgba(248,113,113,0.55)'
                : 'rgba(255,255,255,0.18)',
              caretColor: '#fff',
            }}
            onFocus={(e) => {
              if (!errorMsg)
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)';
            }}
            onBlur={(e) => {
              if (!errorMsg)
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            }}
          />

          {/* Mensaje de error reservando altura para evitar saltos */}
          <div className="h-5 mt-2 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.p
                  id="name-error"
                  key={errorMsg}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="text-[11px] tracking-[0.04em]"
                  style={{ color: 'rgba(248,113,113,0.85)' }}
                >
                  {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.button
          type="submit"
          disabled={!isValid || submitting}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6, ease }}
          whileTap={{ scale: 0.97 }}
          className="mt-1 px-8 h-11 rounded-full text-[12px] tracking-[0.18em] uppercase font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: isValid ? '#fff' : 'rgba(255,255,255,0.08)',
            color: isValid ? '#000' : 'rgba(255,255,255,0.4)',
          }}
        >
          {submitting ? 'Guardando…' : 'Continuar'}
        </motion.button>
      </motion.form>
    </div>
  );
};
