export const prepareGestureAudioElement = (
  existing?: HTMLAudioElement | null
): HTMLAudioElement => {
  const audio = existing ?? new Audio();
  audio.preload = 'auto';
  const media = audio as HTMLAudioElement & { playsInline?: boolean };
  media.playsInline = true;
  return audio;
};

let reservedGreetingAudio: HTMLAudioElement | null = null;

export const reserveGreetingAudio = (): HTMLAudioElement | null => {
  try {
    reservedGreetingAudio = prepareGestureAudioElement();
    reservedGreetingAudio.muted = true;
    return reservedGreetingAudio;
  } catch {
    reservedGreetingAudio = null;
    return null;
  }
};

export const consumeReservedGreetingAudio = (): HTMLAudioElement | null => {
  const audio = reservedGreetingAudio;
  reservedGreetingAudio = null;
  return audio;
};
