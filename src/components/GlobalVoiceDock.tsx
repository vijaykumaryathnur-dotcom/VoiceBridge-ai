import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  Send,
  SlidersHorizontal
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, VoiceStyle, PageContextInfo } from '../types';
import { voiceEngine } from '../services/voice';
import { sendVoiceMessage, GeminiLiveSession } from '../services/api';

interface GlobalVoiceDockProps {
  currentPage: string;
  pageTitle: string;
  pageDataSummary?: Record<string, any> | string;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onNavigateToAssistant?: () => void;
  onNavigate?: (view: string) => void;
  externalNarrationText?: string | null;
  onClearNarration?: () => void;
}

export const GlobalVoiceDock: React.FC<GlobalVoiceDockProps> = ({
  currentPage,
  pageTitle,
  pageDataSummary = {},
  currentLanguage,
  onLanguageChange,
  onNavigateToAssistant,
  externalNarrationText,
  onClearNarration
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('natural');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [textInput, setTextInput] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const liveSessionRef = useRef<GeminiLiveSession | null>(null);

  const getPersonaVoice = (style: VoiceStyle): string => {
    switch (style) {
      case 'professional': return 'Charon';
      case 'friendly': return 'Kore';
      case 'explainer': return 'Zephyr';
      case 'natural':
      default:
        return 'Aoede';
    }
  };

  // Audio level callback from VoiceEngine (for external narration playback)
  useEffect(() => {
    voiceEngine.setAudioLevelCallback((level) => {
      setAudioLevel(level);
    });
    return () => {
      voiceEngine.setAudioLevelCallback(null);
      liveSessionRef.current?.stop();
    };
  }, []);

  // When external narration is triggered from "Listen and Explain"
  useEffect(() => {
    if (externalNarrationText) {
      // If live session was active, stop it cleanly
      if (liveSessionRef.current?.isLiveConnected()) {
        liveSessionRef.current.stop();
      }

      setAssistantReply(externalNarrationText);
      setIsExpanded(true);
      setVoiceState('speaking');
      setIsPaused(false);

      voiceEngine.speak(
        externalNarrationText,
        currentLanguage,
        () => {
          setVoiceState('speaking');
          setIsPaused(false);
        },
        () => {
          setVoiceState('idle');
          if (onClearNarration) onClearNarration();
        },
        () => {
          setVoiceState('idle');
          if (onClearNarration) onClearNarration();
        }
      );
    }
  }, [externalNarrationText, currentLanguage]);

  // Cleanup on unmount or language change
  useEffect(() => {
    if (liveSessionRef.current?.isLiveConnected()) {
      liveSessionRef.current.stop();
      setVoiceState('idle');
    }
  }, [currentLanguage]);

  const handleToggleMic = async () => {
    // If currently connected via Gemini Live API
    if (liveSessionRef.current?.isLiveConnected()) {
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'speaking') {
      handleInterrupt();
      return;
    }

    voiceEngine.cancelSpeech();
    setLiveTranscript('');
    setAssistantReply('');
    setIsExpanded(true);
    setVoiceState('thinking');

    try {
      const personaVoice = getPersonaVoice(voiceStyle);
      const session = new GeminiLiveSession(currentLanguage, personaVoice, currentPage, pageTitle);
      liveSessionRef.current = session;

      session.onStatusChange = (status, err) => {
        if (status === 'connected') {
          setVoiceState('listening');
        } else if (status === 'disconnected' || status === 'error') {
          setVoiceState('idle');
          if (err) {
            console.warn('Live API dock status error:', err);
            setAssistantReply(err);
          }
        }
      };

      session.onAudioActivity = (level, source) => {
        setAudioLevel(level);
        if (source === 'model') {
          setVoiceState('speaking');
        } else if (source === 'mic' && level > 0.1) {
          setVoiceState('listening');
        }
      };

      session.onInputTranscript = (text) => {
        setLiveTranscript((prev) => (prev ? `${prev} ${text}` : text));
      };

      session.onOutputTranscript = (text) => {
        setAssistantReply((prev) => (prev ? `${prev} ${text}` : text));
        setVoiceState('speaking');
      };

      session.onInterrupted = () => {
        setVoiceState('listening');
      };

      session.onTurnComplete = () => {
        setVoiceState('listening');
      };

      await session.start(currentLanguage, personaVoice, currentPage, pageTitle);
    } catch (err) {
      console.error('Failed to start Gemini Live API in dock:', err);
      setVoiceState('idle');
    }
  };

  const handleProcessQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    if (liveSessionRef.current?.isLiveConnected()) {
      liveSessionRef.current.sendText(questionText);
      setLiveTranscript(questionText);
      return;
    }

    setVoiceState('thinking');

    const pageContext: PageContextInfo = {
      page: currentPage,
      title: pageTitle,
      dataSummary: pageDataSummary
    };

    try {
      const res = await sendVoiceMessage(
        questionText,
        currentLanguage,
        undefined,
        assistantReply
          ? [
              { sender: 'user', text: liveTranscript || questionText },
              { sender: 'assistant', text: assistantReply }
            ]
          : [],
        pageContext
      );

      const reply = res.reply;
      setAssistantReply(reply);
      setVoiceState('speaking');
      setIsPaused(false);

      voiceEngine.speak(
        reply,
        currentLanguage,
        () => {
          setVoiceState('speaking');
          setIsPaused(false);
        },
        () => setVoiceState('idle'),
        () => setVoiceState('idle')
      );
    } catch (err) {
      console.error('Dock message processing error:', err);
      const fallbackMsg =
        currentLanguage === 'hi'
          ? 'माफ़ कीजियेगा, कृपया अपना प्रश्न दोबारा कहें।'
          : currentLanguage === 'te'
          ? 'దయచేసి మీ ప్రశ్నను మరొకసారి అడగండి.'
          : 'Could you please repeat your question?';
      setAssistantReply(fallbackMsg);
      setVoiceState('idle');
    }
  };

  const handleInterrupt = () => {
    if (liveSessionRef.current?.isLiveConnected()) {
      liveSessionRef.current.interrupt();
    }
    voiceEngine.cancelSpeech();
    setVoiceState(liveSessionRef.current?.isLiveConnected() ? 'listening' : 'idle');
    setIsPaused(false);
  };

  const handleReplay = () => {
    if (!assistantReply) return;
    if (liveSessionRef.current?.isLiveConnected()) {
      liveSessionRef.current.interrupt();
    }
    voiceEngine.cancelSpeech();
    setVoiceState('speaking');
    setIsPaused(false);
    voiceEngine.speak(
      assistantReply,
      currentLanguage,
      () => {
        setVoiceState('speaking');
        setIsPaused(false);
      },
      () => setVoiceState('idle'),
      () => setVoiceState('idle')
    );
  };

  const handleTogglePause = () => {
    if (isPaused) {
      voiceEngine.resumeSpeech();
      setIsPaused(false);
      setVoiceState('speaking');
    } else {
      voiceEngine.pauseSpeech();
      setIsPaused(true);
      setVoiceState('idle');
    }
  };

  const handleApplyVoiceStyle = (style: VoiceStyle) => {
    setVoiceStyle(style);
    voiceEngine.setVoiceStyle(style);
    if (liveSessionRef.current?.isLiveConnected()) {
      // Re-init live session with new persona voice
      handleToggleMic().then(() => handleToggleMic());
    }
  };

  const handleApplySpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    voiceEngine.setPlaybackSpeed(speed);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || voiceState === 'thinking') return;
    const text = textInput.trim();
    setTextInput('');
    setLiveTranscript(text);
    handleProcessQuestion(text);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end select-none font-sans">
      
      {/* Expanded Floating Voice Panel */}
      {isExpanded && (
        <div className="mb-3 w-[92vw] sm:w-[410px] bg-[#141311] border border-[#F5EFE6]/10 rounded-2xl shadow-2xl p-4 text-[#F5EFE6] animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-xl relative overflow-hidden">
          
          {/* Ambient copper glow background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(ellipse_at_top_right,rgba(200,122,75,0.1),transparent_70%)] pointer-events-none" />

          {/* Top Bar: Context Badge & Actions */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE6]/7 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C87A4B] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#C87A4B]">
                  Gemini 3.8 Live API · {pageTitle}
                </span>
                <span className="text-xs font-semibold text-[#FAF6F0]">
                  {voiceState === 'listening'
                    ? 'Live Mic Streaming (16kHz PCM)...'
                    : voiceState === 'thinking'
                    ? 'Establishing Live Session...'
                    : voiceState === 'speaking'
                    ? isPaused ? 'Live Audio Paused' : 'Gemini Speaking (24kHz PCM)...'
                    : 'Gemini Live Session Ready'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showSettings
                    ? 'bg-[#1A1816] border-[#C87A4B]/40 text-[#E0A364]'
                    : 'bg-[#0D0D0C] border-[#F5EFE6]/8 text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
                title="Voice settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-lg bg-[#0D0D0C] border border-[#F5EFE6]/8 cursor-pointer"
                title="Minimize voice dock"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Voice Settings Sub-drawer */}
          {showSettings && (
            <div className="my-2.5 p-3 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/7 space-y-2 text-xs relative z-10 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] text-[#A89F91]">
                <span>Voice Persona Style:</span>
                <span className="capitalize font-mono text-[#E0A364]">{voiceStyle}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['natural', 'professional', 'friendly', 'explainer'] as VoiceStyle[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleApplyVoiceStyle(st)}
                    className={`px-2 py-1.5 rounded-lg text-xs capitalize transition-all cursor-pointer ${
                      voiceStyle === st
                        ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                        : 'bg-[#141311] border border-[#F5EFE6]/6 text-[#A89F91] hover:text-[#FAF6F0]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#A89F91] pt-1">
                <span>Speed:</span>
                <div className="flex items-center gap-1">
                  {[0.8, 1.0, 1.2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleApplySpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-[#E0A364] text-[#0D0D0C] font-semibold'
                          : 'bg-[#141311] text-[#A89F91]'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Bubble / Output Card */}
          <div className="my-3 space-y-2 max-h-44 overflow-y-auto pr-1 relative z-10">
            {liveTranscript && (
              <div className="p-2.5 rounded-xl bg-[#1A1816] border border-[#C87A4B]/30 text-xs">
                <span className="text-[10px] font-semibold uppercase text-[#C87A4B] block mb-0.5 font-mono">
                  You Asked:
                </span>
                <p className="text-[#FAF6F0] italic font-light">{liveTranscript}</p>
              </div>
            )}

            {assistantReply ? (
              <div className="p-3 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/8 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-[#A89F91]">
                  <span className="font-semibold uppercase text-[#E0A364] font-mono">VoiceBridge AI</span>
                  <span className="font-mono text-[#A89F91]/70">Context Aware</span>
                </div>
                <p className="text-[#FAF6F0] leading-relaxed font-light">{assistantReply}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#0D0D0C]/60 border border-[#F5EFE6]/5 text-center text-xs text-[#A89F91]">
                <p className="font-light">
                  Ask anything about the <span className="text-[#E0A364] font-medium">{pageTitle}</span> screen,
                  missing requirements, or next steps.
                </p>
              </div>
            )}
          </div>

          {/* Playback Controls & Audio Bar */}
          {assistantReply && (
            <div className="flex items-center justify-between pt-2 border-t border-[#F5EFE6]/7 relative z-10 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleReplay}
                  className="px-2.5 py-1 rounded-lg bg-[#1A1816] hover:bg-[#23201C] text-[#FAF6F0] border border-[#F5EFE6]/8 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Replay spoken audio"
                >
                  <RotateCcw className="w-3 h-3 text-[#C87A4B]" />
                  <span>Replay</span>
                </button>

                {voiceState === 'speaking' && (
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="px-2.5 py-1 rounded-lg bg-[#1A1816] hover:bg-[#23201C] text-[#FAF6F0] border border-[#F5EFE6]/8 transition-colors flex items-center gap-1 cursor-pointer"
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? <Play className="w-3 h-3 text-[#E0A364]" /> : <Pause className="w-3 h-3 text-[#E0A364]" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                )}

                {voiceState === 'speaking' && (
                  <button
                    type="button"
                    onClick={handleInterrupt}
                    className="px-2.5 py-1 rounded-lg bg-[#1A1816] hover:bg-[#BA6C3D] text-[#FAF6F0] border border-[#F5EFE6]/8 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Stop audio speech"
                  >
                    <VolumeX className="w-3 h-3 text-[#C87A4B]" />
                    <span>Stop</span>
                  </button>
                )}
              </div>

              {onNavigateToAssistant && (
                <button
                  type="button"
                  onClick={onNavigateToAssistant}
                  className="text-[11px] text-[#A89F91] hover:text-[#FAF6F0] flex items-center gap-1 cursor-pointer"
                >
                  <span>Full View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Quick Text Question Composer */}
          <form onSubmit={handleTextSubmit} className="mt-3 flex items-center gap-1.5 relative z-10">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Ask about ${pageTitle}...`}
              className="flex-1 px-3 py-1.5 bg-[#0D0D0C] border border-[#F5EFE6]/10 rounded-xl text-xs text-[#FAF6F0] placeholder-[#A89F91]/60 focus:outline-none focus:border-[#C87A4B]"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || voiceState === 'thinking'}
              className="p-1.5 bg-[#C87A4B] hover:bg-[#D48354] disabled:opacity-30 text-[#0D0D0C] rounded-xl transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Persistent Compact Voice Dock Pill */}
      <div className="flex items-center gap-2 p-1.5 bg-[#141311] border border-[#F5EFE6]/10 rounded-full shadow-2xl backdrop-blur-xl">
        
        {/* Language Quick Switcher */}
        <div className="flex items-center bg-[#0D0D0C] rounded-full p-0.5 border border-[#F5EFE6]/6">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer ${
                currentLanguage === lang.code
                  ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold'
                  : 'text-[#A89F91] hover:text-[#FAF6F0]'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>

        {/* Dynamic Waveform Rings + Microphone Button */}
        <div className="relative flex items-center justify-center">
          {voiceState === 'listening' && (
            <div
              className="absolute rounded-full border border-[#C87A4B]/60 animate-ping pointer-events-none"
              style={{
                width: `${44 + audioLevel * 28}px`,
                height: `${44 + audioLevel * 28}px`
              }}
            />
          )}

          {voiceState === 'speaking' && !isPaused && (
            <div className="absolute w-12 h-12 rounded-full border border-[#E0A364]/40 animate-pulse pointer-events-none" />
          )}

          <button
            type="button"
            onClick={handleToggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-[#BA6C3D] text-[#FAF6F0] shadow-[#BA6C3D]/30'
                : voiceState === 'speaking'
                ? 'bg-[#E0A364] text-[#0D0D0C] shadow-[#E0A364]/20'
                : voiceState === 'thinking'
                ? 'bg-[#1A1816] text-[#E0A364] border border-[#C87A4B]/40 animate-pulse'
                : 'bg-[#C87A4B] hover:bg-[#D48354] text-[#0D0D0C] shadow-[#C87A4B]/20'
            }`}
            aria-label={
              voiceState === 'listening'
                ? 'Stop listening'
                : voiceState === 'speaking'
                ? 'Interrupt speech'
                : 'Start speaking'
            }
            title={
              voiceState === 'listening'
                ? 'Listening... Click to finish'
                : voiceState === 'speaking'
                ? 'Speaking... Click to interrupt'
                : 'Speak to VoiceBridge'
            }
          >
            {voiceState === 'speaking' ? (
              <Volume2 className="w-5 h-5 animate-bounce" />
            ) : voiceState === 'listening' ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Expand / Minimize Toggle Arrow */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-[#A89F91] hover:text-[#FAF6F0] rounded-full transition-colors cursor-pointer mr-1"
          title={isExpanded ? 'Collapse voice dock' : 'Expand voice transcript'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

      </div>

    </div>
  );
};
