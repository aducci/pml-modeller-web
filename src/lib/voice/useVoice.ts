'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal shape of the Web Speech API's SpeechRecognition — not in lib.dom.d.ts.
interface SpeechRecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onspeechend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => SpeechRecognitionLike) | null;
}

/**
 * Chained STT/TTS voice adapter (Option 1 of the voice architecture — see
 * conversation with user 2026-07-24). Deliberately isolated behind this one
 * hook: swapping to a realtime speech-to-speech provider later (Option 2)
 * means replacing this file's internals with a WebSocket connection, not
 * touching ChatPanel or ConversationContext, which only ever see plain text.
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);

  const sttSupported = getSpeechRecognitionCtor() !== null;
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  /**
   * onFinalResult fires once per utterance, on speech-end auto-detect or
   * manual stop() — never on interim partials, so callers can safely treat
   * it as "the user is done talking, send this."
   */
  const start = useCallback((onFinalResult: (text: string) => void) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    onResultRef.current = onFinalResult;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalText = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript((finalText + interim).trim());
    };

    // Auto-submit on detected pause — the recommended UX for a conversational
    // interview flow, per user preference over requiring a manual stop tap.
    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = finalText.trim();
      setTranscript('');
      if (text) onResultRef.current?.(text);
    };

    recognitionRef.current = recognition;
    setTranscript('');
    setIsListening(true);
    recognition.start();
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsSupported || !text.trim()) return;
    window.speechSynthesis.cancel(); // never overlap utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsSupported]);

  const cancelSpeech = useCallback(() => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [ttsSupported]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (ttsSupported) window.speechSynthesis.cancel();
  }, [ttsSupported]);

  return {
    sttSupported,
    ttsSupported,
    isListening,
    isSpeaking,
    transcript,
    start,
    stop,
    speak,
    cancelSpeech,
  };
}
