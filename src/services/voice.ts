import { SupportedLanguage, SUPPORTED_LANGUAGES, VoiceStyle } from '../types';
import { generateServerTTS } from './api';

export interface VoicePreference {
  style: VoiceStyle;
  playbackSpeed: number;
}

/**
 * Normalizes text to sound natural, warm, and fluid when spoken by speech engines.
 * Strips robotic artifacts: markdown bullets, asterisks, URLs, abbreviations, and list numbers.
 */
export function cleanTextForSpeech(rawText: string, language: SupportedLanguage): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove markdown code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 2. Remove markdown headings (###, ##, #)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 3. Remove bold and italics formatting (**bold**, *italic*, _text_)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // 4. Remove bracketed references or citations like [1], [2], (Official)
  text = text.replace(/\[\d+\]/g, '');
  text = text.replace(/\(Official\)/gi, '');

  // 5. Replace common government and official URLs with spoken human phrasing
  text = text.replace(/https?:\/\/scholarships\.gov\.in[^\s]*/gi, 'the National Scholarship Portal');
  text = text.replace(/scholarships\.gov\.in/gi, 'the National Scholarship Portal');
  text = text.replace(/https?:\/\/pmjay\.gov\.in[^\s]*/gi, 'the Ayushman Bharat portal');
  text = text.replace(/pmjay\.gov\.in/gi, 'the Ayushman Bharat portal');
  text = text.replace(/https?:\/\/abha\.abdm\.gov\.in[^\s]*/gi, 'the ABHA health portal');
  text = text.replace(/abha\.abdm\.gov\.in/gi, 'the ABHA health portal');
  text = text.replace(/https?:\/\/vidyalakshmi\.co\.in[^\s]*/gi, 'the Vidya Lakshmi education loan portal');
  text = text.replace(/vidyalakshmi\.co\.in/gi, 'the Vidya Lakshmi portal');
  text = text.replace(/https?:\/\/daad\.(in|de)[^\s]*/gi, 'the DAAD study abroad portal');
  text = text.replace(/daad\.(in|de)/gi, 'the DAAD portal');
  text = text.replace(/https?:\/\/[^\s]+/gi, 'the official portal');

  // 6. Convert numbered lists into natural spoken transition phrases
  if (language === 'hi') {
    text = text.replace(/(?:^|\n)\s*1[\.\)]\s*/g, ' पहली बात यह है कि ');
    text = text.replace(/(?:^|\n)\s*2[\.\)]\s*/g, ' दूसरी बात, ');
    text = text.replace(/(?:^|\n)\s*3[\.\)]\s*/g, ' तीसरा बिंदु, ');
    text = text.replace(/(?:^|\n)\s*4[\.\)]\s*/g, ' इसके अलावा, ');
  } else if (language === 'te') {
    text = text.replace(/(?:^|\n)\s*1[\.\)]\s*/g, ' మొదటిగా, ');
    text = text.replace(/(?:^|\n)\s*2[\.\)]\s*/g, ' రెండవది, ');
    text = text.replace(/(?:^|\n)\s*3[\.\)]\s*/g, ' మూడవది, ');
    text = text.replace(/(?:^|\n)\s*4[\.\)]\s*/g, ' అలాగే, ');
  } else {
    text = text.replace(/(?:^|\n)\s*1[\.\)]\s*/g, ' First, ');
    text = text.replace(/(?:^|\n)\s*2[\.\)]\s*/g, ' Second, ');
    text = text.replace(/(?:^|\n)\s*3[\.\)]\s*/g, ' Third, ');
    text = text.replace(/(?:^|\n)\s*4[\.\)]\s*/g, ' Next, ');
  }

  // 7. Strip bullet points and list dashes
  text = text.replace(/^[•\-\*]\s+/gm, ' ');
  text = text.replace(/\s+[•\-\*]\s+/g, ', ');

  // 8. Expand abbreviations for smooth Indian English delivery
  if (language === 'en') {
    text = text.replace(/\bNSP\b/g, 'National Scholarship Portal');
    text = text.replace(/\bPM-JAY\b/gi, 'P M Jay');
    text = text.replace(/\bPMJAY\b/gi, 'P M Jay');
    text = text.replace(/\bABHA\b/g, 'Abha');
    text = text.replace(/\bKYC\b/gi, 'K Y C');
    text = text.replace(/\be-KYC\b/gi, 'electronic K Y C');
    text = text.replace(/\bDBT\b/g, 'Direct Benefit Transfer');
    text = text.replace(/\bPFMS\b/g, 'Public Financial Management System');
    text = text.replace(/\bAPS\b/g, 'A P S certificate');
    text = text.replace(/\bGovt\b\.?/gi, 'Government');
    text = text.replace(/\b₹\s*(\d+)/g, '$1 rupees');
    text = text.replace(/\bRs\.?\s*(\d+)/gi, '$1 rupees');
  }

  // 9. Clean excessive punctuation and extra spaces
  text = text.replace(/[:;]/g, ',');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Gemini-Powered Voice Engine
 * All audio interactions run strictly on Google Gemini (Gemini 3.8 Live API & Gemini 3.8 Flash Lite TTS).
 * Browser-based SpeechRecognition, Web Speech API, and window.speechSynthesis have been completely eliminated.
 */
export class VoiceEngine {
  private audioContext: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isSpeakingActive = false;
  private isSpeechPaused = false;
  private audioLevelCallback: ((level: number) => void) | null = null;
  private speechSimulationInterval: any = null;

  // Voice settings & Audio controls
  private voiceStyle: VoiceStyle = 'natural';
  private playbackSpeed = 1.0;

  constructor() {
    // Native browser speech synthesis and recognition are completely removed.
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }

  public isPaused(): boolean {
    return this.isSpeechPaused;
  }

  public setAudioLevelCallback(cb: ((level: number) => void) | null) {
    this.audioLevelCallback = cb;
  }

  public setVoiceStyle(style: VoiceStyle) {
    this.voiceStyle = style;
  }

  public getVoiceStyle(): VoiceStyle {
    return this.voiceStyle;
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = Math.max(0.7, Math.min(1.5, speed));
    if (this.currentAudioElement) {
      this.currentAudioElement.playbackRate = this.playbackSpeed;
    }
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  public getSettings(): { style: VoiceStyle; speed: number; rate: number; pitch: number } {
    return {
      style: this.voiceStyle,
      speed: this.playbackSpeed,
      rate: 1.0,
      pitch: 1.0
    };
  }

  public pauseSpeech() {
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause();
      this.isSpeechPaused = true;
      this.stopSpeechSimulation();
    }
  }

  public resumeSpeech() {
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play().catch(() => {});
      this.isSpeechPaused = false;
      this.startSpeechSimulation();
    }
  }

  private startSpeechSimulation() {
    this.stopSpeechSimulation();
    let step = 0;

    this.speechSimulationInterval = setInterval(() => {
      if (!this.isSpeakingActive) {
        this.stopSpeechSimulation();
        return;
      }
      step += 0.25;
      const wave =
        Math.sin(step) * 0.25 +
        Math.sin(step * 2.3) * 0.2 +
        Math.cos(step * 0.7) * 0.15 +
        0.35;
      const normalized = Math.min(0.85, Math.max(0.12, wave));
      if (this.audioLevelCallback) {
        this.audioLevelCallback(normalized);
      }
    }, 70);
  }

  private stopSpeechSimulation() {
    if (this.speechSimulationInterval) {
      clearInterval(this.speechSimulationInterval);
      this.speechSimulationInterval = null;
    }
    if (this.audioLevelCallback) {
      this.audioLevelCallback(0);
    }
  }

  /**
   * Speaks text using Gemini high-fidelity server TTS (gemini-3.8-flash-lite-tts).
   * Generates authentic WAV audio and plays back via WebAudio / HTMLAudio.
   */
  public async speak(
    rawText: string,
    language: SupportedLanguage,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    this.cancelSpeech();

    const cleaned = cleanTextForSpeech(rawText, language);
    if (!cleaned) {
      if (onEnd) onEnd();
      return;
    }

    this.isSpeakingActive = true;
    this.isSpeechPaused = false;

    try {
      const result = await generateServerTTS(cleaned, language, this.voiceStyle);

      if (!this.isSpeakingActive) return;

      if (!result.success || !result.audioBase64) {
        throw new Error('Gemini TTS generation did not return audio data.');
      }

      const mimeType = result.mimeType || 'audio/wav';
      const audioUrl = `data:${mimeType};base64,${result.audioBase64}`;
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;
      audio.playbackRate = this.playbackSpeed;

      audio.onplay = () => {
        this.startSpeechSimulation();
        if (onStart) onStart();
      };

      audio.onended = () => {
        this.isSpeakingActive = false;
        this.stopSpeechSimulation();
        this.currentAudioElement = null;
        if (onEnd) onEnd();
      };

      audio.onerror = (e) => {
        console.warn('Gemini audio playback error:', e);
        this.isSpeakingActive = false;
        this.stopSpeechSimulation();
        this.currentAudioElement = null;
        if (onError) onError(e);
        if (onEnd) onEnd();
      };

      await audio.play();
    } catch (err: any) {
      console.warn('Gemini voice generation notice:', err?.message || err);
      this.isSpeakingActive = false;
      this.stopSpeechSimulation();
      this.currentAudioElement = null;
      if (onError) onError(err);
      if (onEnd) onEnd();
    }
  }

  /**
   * Instantly stops all Gemini spoken audio playback and halts visualizer wave.
   */
  public cancelSpeech() {
    this.isSpeakingActive = false;
    this.isSpeechPaused = false;
    this.stopSpeechSimulation();

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch (e) {
        // ignore
      }
      this.currentAudioElement = null;
    }
  }

  /**
   * Preview persona delivery via Gemini server-side speech.
   */
  public previewVoice(
    style: VoiceStyle,
    speedOrLang: number | SupportedLanguage = 1.0,
    langOrOnStart: SupportedLanguage | (() => void) = 'en',
    onStartOrEnd?: () => void,
    onEndCb?: () => void,
    onErrorCb?: () => void
  ) {
    this.setVoiceStyle(style);
    let speed = 1.0;
    let language: SupportedLanguage = 'en';
    let onStart: (() => void) | undefined;
    let onEnd: (() => void) | undefined;
    let onError: (() => void) | undefined;

    if (typeof speedOrLang === 'number') {
      speed = speedOrLang;
      this.setPlaybackSpeed(speed);
      if (typeof langOrOnStart === 'string') {
        language = langOrOnStart as SupportedLanguage;
      }
      onStart = onStartOrEnd;
      onEnd = onEndCb;
      onError = onErrorCb;
    } else {
      language = speedOrLang as SupportedLanguage;
      if (typeof langOrOnStart === 'function') {
        onEnd = langOrOnStart;
      }
    }

    let sample = '';
    if (language === 'hi') {
      sample = 'नमस्ते! मैं वॉयसब्रिज एआई हूँ। मैं जेमिनी 3.8 लाइव एपीआई के माध्यम से आपकी सहायता करने के लिए तैयार हूँ।';
    } else if (language === 'te') {
      sample = 'నమస్కారం! నేను వాయిస్‌బ్రిడ్జ్ ఏఐ. జెమిని 3.8 లైవ్ ఏపీఐ ద్వారా మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను.';
    } else {
      sample = 'Hello, I am VoiceBridge AI. Operating exclusively on Gemini 3.8 Live API for real-time conversational assistance.';
    }
    this.speak(sample, language, onStart, onEnd, onError);
  }
}

export const voiceEngine = new VoiceEngine();
