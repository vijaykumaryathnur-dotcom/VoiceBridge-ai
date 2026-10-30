import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

// Web Speech API interfaces
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface VoicePreference {
  rate: number;
  pitch: number;
  selectedVoiceURI?: string;
}

/**
 * Normalizes text to sound natural, warm, and fluid when spoken by speech synthesizers.
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

  // 6. Convert numbered lists (both multiline and inline) into natural spoken transition phrases
  if (language === 'hi') {
    text = text.replace(/(?:^|[\s,;:])1[\.\)]\s+/gm, ' पहला, ');
    text = text.replace(/(?:^|[\s,;:])2[\.\)]\s+/gm, ' दूसरा, ');
    text = text.replace(/(?:^|[\s,;:])3[\.\)]\s+/gm, ' तीसरा, ');
    text = text.replace(/(?:^|[\s,;:])4[\.\)]\s+/gm, ' चौथा, ');
    text = text.replace(/(?:^|[\s,;:])5[\.\)]\s+/gm, ' पांचवां, ');
  } else if (language === 'te') {
    text = text.replace(/(?:^|[\s,;:])1[\.\)]\s+/gm, ' మొదటగా, ');
    text = text.replace(/(?:^|[\s,;:])2[\.\)]\s+/gm, ' రెండవది, ');
    text = text.replace(/(?:^|[\s,;:])3[\.\)]\s+/gm, ' మూడవది, ');
    text = text.replace(/(?:^|[\s,;:])4[\.\)]\s+/gm, ' నాల్గవది, ');
    text = text.replace(/(?:^|[\s,;:])5[\.\)]\s+/gm, ' ఐదవది, ');
  } else {
    text = text.replace(/(?:^|[\s,;:])1[\.\)]\s+/gm, ' First, ');
    text = text.replace(/(?:^|[\s,;:])2[\.\)]\s+/gm, ' Second, ');
    text = text.replace(/(?:^|[\s,;:])3[\.\)]\s+/gm, ' Third, ');
    text = text.replace(/(?:^|[\s,;:])4[\.\)]\s+/gm, ' Next, ');
    text = text.replace(/(?:^|[\s,;:])5[\.\)]\s+/gm, ' Finally, ');
  }

  // 7. Remove bullet points and dashes
  text = text.replace(/^\s*[\*\-•–]\s+/gm, 'Also, ');

  // 8. Convert currency symbols and key abbreviations to natural pronunciation
  text = text.replace(/₹\s*([0-9]+(?:\.[0-9]+)?)\s*(lakhs?|lacs?|cr|crores?|लाख|లక్షలు|లక్షల|లక్ష)?/gi, (_match, num, unit) => {
    if (unit) {
      if (language === 'hi' && unit.includes('लाख')) return `${num} लाख रुपये`;
      if (language === 'te' && unit.includes('లక్ష')) return `${num} లక్షల రూపాయలు`;
      return `${num} ${unit} rupees`;
    }
    if (language === 'hi') return `${num} रुपये`;
    if (language === 'te') return `${num} రూపాయలు`;
    return `${num} rupees`;
  });
  text = text.replace(/€\s*([0-9,]+)/g, '$1 euros');
  text = text.replace(/\$/g, 'dollars ');
  text = text.replace(/%/g, ' percent');

  // Phonetic expansions for acronyms so they are not slurred together
  text = text.replace(/\bAPS\b/g, 'A P S');
  text = text.replace(/\bIELTS\b/g, 'Eye-elts');
  text = text.replace(/\bPM-JAY\b/g, 'P M Jay');
  text = text.replace(/\bABHA\b/g, 'Abha');
  text = text.replace(/\bCSC\b/g, 'C S C');
  text = text.replace(/\bOTP\b/g, 'O T P');
  text = text.replace(/\bATS\b/g, 'A T S');
  text = text.replace(/\bCV\b/g, 'C V');
  text = text.replace(/\bNSP\b/g, 'National Scholarship Portal');

  // 9. Clean excessive spaces, hyphens, and normalize punctuation
  text = text.replace(/[\r\n]+/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/\s+([,\.\?!])/g, '$1');

  return text.trim();
}

/**
 * Splits text into conversational thought units for natural pacing with breathing micro-pauses.
 * Leverages Intl.Segmenter to respect multilingual sentences, hindi dandas, and preserve decimal numbers.
 */
export function splitIntoConversationalChunks(text: string, language: SupportedLanguage = 'en'): string[] {
  if (!text) return [];

  // Use Intl.Segmenter for linguistic sentence boundary detection
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const locale = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
      const segmenter = new (Intl as any).Segmenter(locale, { granularity: 'sentence' });
      const segments: string[] = Array.from(segmenter.segment(text))
        .map((s: any) => s.segment.trim())
        .filter(Boolean);

      if (segments.length > 0) {
        return segments;
      }
    } catch (e) {
      // fallback to regex below
    }
  }

  // Fallback regex: matches sentences ending with .?!। while preserving decimals (\d+\.\d+)
  const rawSentences = text.match(/(?:[^\.!\?।]+|\d+\.\d+)+[\.!\?।]+|.+$/g) || [text];

  const cleanChunks: string[] = [];
  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    // If a sentence is unusually long (> 160 chars), gently split on semicolons
    if (trimmed.length > 160 && trimmed.includes(';')) {
      const parts = trimmed.split(';');
      for (const p of parts) {
        if (p.trim()) cleanChunks.push(p.trim());
      }
    } else {
      cleanChunks.push(trimmed);
    }
  }

  return cleanChunks.length > 0 ? cleanChunks : [text];
}

export class VoiceEngine {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private isListening = false;
  private isSpeakingActive = false;
  private audioLevelCallback: ((level: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private speechSimulationInterval: any = null;
  private currentUtteranceIndex = 0;
  private utteranceChunks: string[] = [];
  private activeLanguage: SupportedLanguage = 'en';
  private pauseTimer: any = null;

  // Voice settings
  private speechRate = 0.96; // Warm, natural cadence
  private speechPitch = 1.0;
  private selectedVoiceURI: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      }
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        // Pre-warm voices
        this.synthesis.getVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
          this.synthesis.onvoiceschanged = () => {
            this.synthesis?.getVoices();
          };
        }
      }
    }
  }

  public isSpeechSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isSynthesisSupported(): boolean {
    return Boolean(this.synthesis);
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }

  public setAudioLevelCallback(cb: ((level: number) => void) | null) {
    this.audioLevelCallback = cb;
  }

  public setSpeechSettings(rate: number = 0.96, pitch: number = 1.0, voiceURI?: string) {
    this.speechRate = Math.max(0.75, Math.min(1.25, rate));
    this.speechPitch = Math.max(0.85, Math.min(1.2, pitch));
    if (voiceURI) this.selectedVoiceURI = voiceURI;
  }

  /**
   * Discovers and ranks voices for the target language, preferring Neural, Natural, and Google voices.
   */
  public getVoicesForLanguage(language: SupportedLanguage): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    const allVoices = this.synthesis.getVoices();

    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === language);
    const targetLocale = langConfig ? langConfig.speechLocale.toLowerCase() : 'en-in';

    // Filter matching voices
    const matching = allVoices.filter(v => {
      const vLang = v.lang.toLowerCase();
      const vName = v.name.toLowerCase();

      if (language === 'hi') {
        return vLang.startsWith('hi') || vName.includes('hindi') || vName.includes('हिन्दी');
      } else if (language === 'te') {
        return vLang.startsWith('te') || vName.includes('telugu') || vName.includes('తెలుగు');
      } else {
        return vLang.startsWith('en');
      }
    });

    // Score voice naturalness (prefer high-clarity neural/natural voices)
    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      if (name.includes('natural')) score += 50;
      if (name.includes('neural')) score += 45;
      if (name.includes('online')) score += 40;
      if (name.includes('google')) score += 35;
      if (name.includes('premium') || name.includes('enhanced')) score += 30;

      // Indian accent preference for English in VoiceBridge context
      if (language === 'en') {
        if (lang === 'en-in') score += 25;
        if (name.includes('india') || name.includes('neerja') || name.includes('prabhat')) score += 20;
        if (lang === 'en-us' || lang === 'en-gb') score += 10;
      }

      // Avoid known robotic legacy voices if newer ones exist
      if (name.includes('desktop') || name.includes('espeak')) score -= 20;

      return score;
    };

    return matching.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  }

  public getBestVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null;
    const voices = this.getVoicesForLanguage(language);

    if (this.selectedVoiceURI) {
      const explicit = voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (explicit) return explicit;
    }

    if (voices.length > 0) return voices[0];

    // Fallback: any voice on system
    const all = this.synthesis.getVoices();
    return all.find(v => v.lang.startsWith(language)) || all[0] || null;
  }

  public async startListening(
    language: SupportedLanguage,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onStart?: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // If currently speaking, immediately interrupt
    if (this.isSpeakingActive) {
      this.cancelSpeech();
    }

    if (this.isListening) {
      this.stopListening();
    }

    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === language);
    this.recognition.lang = langConfig ? langConfig.speechLocale : 'en-IN';

    // Start AudioContext for microphone level visualization
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        source.connect(this.analyser);
        this.startLevelLoop();
      }
    } catch (micErr) {
      console.warn('Microphone audio context visualization access limited:', micErr);
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        // Quiet silence timeout, natural in conversational pauses
        return;
      }
      console.warn('Speech recognition notice:', event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.stopLevelLoop();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('Recognition start caught error:', err);
      this.isListening = false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore already stopped
      }
    }
    this.isListening = false;
    this.stopLevelLoop();
  }

  private startLevelLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!this.analyser || !this.isListening) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(1, Math.max(0, average / 128));
      if (this.audioLevelCallback) {
        this.audioLevelCallback(normalized);
      }
      this.animationFrameId = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  private stopLevelLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }
    if (!this.isSpeakingActive && this.audioLevelCallback) {
      this.audioLevelCallback(0);
    }
  }

  /**
   * Simulates organic voice wave level during assistant speech so the VoiceOrb ripples
   * warmly in sync with spoken syllables.
   */
  private startSpeechSimulation() {
    this.stopSpeechSimulation();
    let step = 0;

    this.speechSimulationInterval = setInterval(() => {
      if (!this.isSpeakingActive) {
        this.stopSpeechSimulation();
        return;
      }
      step += 0.25;
      // Organic speech wave combining multiple frequencies
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
    if (!this.isListening && this.audioLevelCallback) {
      this.audioLevelCallback(0);
    }
  }

  /**
   * High-quality, natural conversational speech playback.
   * Pre-processes text into clean conversational speech, chunks sentences, and introduces
   * human-like breathing micro-pauses with varied intonation.
   */
  public speak(
    rawText: string,
    language: SupportedLanguage,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synthesis) {
      if (onError) onError('Speech synthesis not supported');
      return;
    }

    // Cancel ongoing speech or scheduled timers
    this.cancelSpeech();

    // Clean and split text into natural conversational chunks
    const cleaned = cleanTextForSpeech(rawText, language);
    if (!cleaned) {
      if (onEnd) onEnd();
      return;
    }

    this.utteranceChunks = splitIntoConversationalChunks(cleaned);
    this.currentUtteranceIndex = 0;
    this.activeLanguage = language;
    this.isSpeakingActive = true;

    const bestVoice = this.getBestVoice(language);
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === language);
    const targetLocale = langConfig ? langConfig.speechLocale : 'en-IN';

    let started = false;

    const playNextChunk = () => {
      if (!this.isSpeakingActive) return;

      if (this.currentUtteranceIndex >= this.utteranceChunks.length) {
        this.isSpeakingActive = false;
        this.stopSpeechSimulation();
        if (onEnd) onEnd();
        return;
      }

      const chunkText = this.utteranceChunks[this.currentUtteranceIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);

      utterance.lang = targetLocale;
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // Warm conversational pacing
      utterance.rate = this.speechRate;

      // Slight natural intonation: lift pitch on questions, warm steady pitch on statements
      const isQuestion = chunkText.trim().endsWith('?');
      utterance.pitch = isQuestion ? this.speechPitch + 0.04 : this.speechPitch;

      utterance.onstart = () => {
        if (!started) {
          started = true;
          this.startSpeechSimulation();
          if (onStart) onStart();
        }
      };

      utterance.onend = () => {
        this.currentUtteranceIndex++;
        if (!this.isSpeakingActive) return;

        // Introduce a subtle human breathing pause between sentences
        // Longer pause (180ms) after a question to let the user absorb the thought
        const microPauseMs = isQuestion ? 190 : 120;

        // Temporarily lower visualizer wave to reflect breath pause
        if (this.audioLevelCallback) {
          this.audioLevelCallback(0.08);
        }

        this.pauseTimer = setTimeout(() => {
          playNextChunk();
        }, microPauseMs);
      };

      utterance.onerror = (e) => {
        // Interrupted is normal when user cancels or speaks
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech chunk error:', e.error);
        }
        this.currentUtteranceIndex++;
        if (this.currentUtteranceIndex < this.utteranceChunks.length && this.isSpeakingActive) {
          playNextChunk();
        } else {
          this.isSpeakingActive = false;
          this.stopSpeechSimulation();
          if (onError && e.error !== 'interrupted') onError(e);
          if (onEnd) onEnd();
        }
      };

      try {
        this.synthesis!.speak(utterance);
      } catch (err) {
        console.warn('Synthesis speak caught error:', err);
        this.isSpeakingActive = false;
        this.stopSpeechSimulation();
        if (onError) onError(err);
        if (onEnd) onEnd();
      }
    };

    playNextChunk();
  }

  /**
   * Instantly stops speech synthesis, clears chunk queue, and halts audio simulation.
   */
  public cancelSpeech() {
    this.isSpeakingActive = false;
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    this.stopSpeechSimulation();
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }
}

export const voiceEngine = new VoiceEngine();
