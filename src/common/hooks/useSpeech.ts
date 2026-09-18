import { useCallback, useEffect, useState } from 'react';

/* ============================================================
   useSpeech — spoken English without an audio catalogue.

   The browser's installed voice keeps every authored example
   speakable, including combinations made with the lesson knobs.
   Nothing is spoken automatically: sound that starts without a
   learner asking for it is especially disruptive on a phone.
   ============================================================ */

export type SpeechSpeed = 'normal' | 'slow';

export type Speech = {
  readonly supported: boolean;
  readonly speaking: boolean;
  readonly speak: (text: string, speed?: SpeechSpeed) => void;
  readonly stop: () => void;
};

export function useSpeech(): Speech {
  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback((): void => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, speed: SpeechSpeed = 'normal'): void => {
      if (!supported || text.trim().length === 0) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = speed === 'slow' ? 0.58 : 0.82;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      utterance.voice =
        voices.find((voice) => voice.lang.toLowerCase() === 'en-in') ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith('en-gb')) ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
        null;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { supported, speaking, speak, stop };
}
