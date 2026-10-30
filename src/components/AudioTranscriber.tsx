import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Copy,
  Check,
  FileText,
  ArrowRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';
import { transcribeAudio } from '../services/api';

interface AudioTranscriberProps {
  onSendToChat?: (text: string) => void;
  onSendToAssistant?: (text: string, lang: SupportedLanguage) => void;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  onSendToChat,
  onSendToAssistant
}) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.5-transcribe');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript('');
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const newUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newUrl);

        await handleTranscribe(audioBlob, mimeType);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage(err.message || 'Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleTranscribe = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        if (!base64Audio) throw new Error('Failed to encode audio file.');

        const res = await transcribeAudio(base64Audio, mimeType, language);
        setTranscript(res.transcript);
        setModelUsed(res.model || 'gemini-3.5-transcribe');
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || 'Audio transcription note.');
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 space-y-6 select-none text-[#F5EFE6]">
      
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-[#F5EFE6]/7">
        <div className="flex items-center gap-2 text-xs text-[#C87A4B] font-medium uppercase tracking-wider font-sans">
          <Sparkles className="w-4 h-4" />
          <span>Model: gemini-3.5-transcribe</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#FAF6F0] tracking-tight">
          Audio Transcription Studio
        </h1>
        <p className="text-xs sm:text-sm text-[#A89F91] font-light">
          Speak naturally in English, Hindi, or Telugu to produce accurate verbatim text notes for government applications.
        </p>
      </div>

      {/* Main Studio Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#141311] border border-[#F5EFE6]/7 shadow-2xl space-y-6">
        
        {/* Language selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F5EFE6]/7">
          <span className="text-xs font-semibold text-[#A89F91] uppercase tracking-wider">
            Spoken Language Script
          </span>
          <div className="flex items-center bg-[#0D0D0C] p-1 rounded-xl border border-[#F5EFE6]/6">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                disabled={isRecording}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-[#C87A4B] text-[#0D0D0C] font-semibold shadow-sm'
                    : 'text-[#A89F91] hover:text-[#FAF6F0]'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Recording Visualizer & Controls */}
        <div className="py-10 flex flex-col items-center justify-center space-y-5 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <div className="absolute w-28 h-28 rounded-full border border-[#C87A4B]/40 animate-ping pointer-events-none" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#C87A4B] cursor-pointer ${
                isRecording
                  ? 'bg-[#BA6C3D] text-[#FAF6F0] scale-105'
                  : 'bg-[#C87A4B] hover:bg-[#D48354] text-[#0D0D0C] hover:scale-105 shadow-lg shadow-[#C87A4B]/20'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="text-center space-y-1">
            {isRecording ? (
              <>
                <p className="text-lg font-bold text-[#E0A364] tabular-nums font-mono">
                  {formatTime(recordingSeconds)}
                </p>
                <p className="text-xs text-[#A89F91] font-light">
                  Recording audio... Click square to finish &amp; transcribe with gemini-3.5-transcribe.
                </p>
              </>
            ) : isTranscribing ? (
              <p className="text-xs text-[#C87A4B] animate-pulse">
                Transcribing audio using gemini-3.5-transcribe...
              </p>
            ) : (
              <p className="text-xs text-[#A89F91] font-light">
                Click the microphone to record your voice note or statement.
              </p>
            )}
          </div>

          {audioUrl && !isRecording && (
            <div className="flex items-center gap-3 pt-2">
              <audio src={audioUrl} controls className="h-8 max-w-xs rounded opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#1A1816] border border-[#C87A4B]/30 text-[#E0A364] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C87A4B]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C87A4B]" />
              <span className="text-sm font-semibold text-[#FAF6F0]">Transcribed Output</span>
            </div>
            {transcript && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[#E0A364] bg-[#0D0D0C] px-2 py-0.5 rounded border border-[#F5EFE6]/10 text-[10px]">
                  {modelUsed}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-[#A89F91] hover:text-[#FAF6F0] rounded bg-[#1A1816] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#E0A364]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#0D0D0C] border border-[#F5EFE6]/6 min-h-[110px] text-xs sm:text-sm text-[#FAF6F0] whitespace-pre-wrap leading-relaxed font-sans font-light">
            {isTranscribing ? (
              <span className="text-[#A89F91] italic">Transcribing in progress...</span>
            ) : transcript ? (
              transcript
            ) : (
              <span className="text-[#A89F91] italic">
                Transcribed output will appear here after recording.
              </span>
            )}
          </div>
        </div>

        {transcript && (
          <div className="pt-4 border-t border-[#F5EFE6]/7 flex flex-wrap items-center justify-end gap-3">
            {onSendToChat && (
              <button
                onClick={() => onSendToChat(transcript)}
                className="px-4 py-2 text-xs font-semibold text-[#FAF6F0] bg-[#1A1816] hover:bg-[#23201C] border border-[#F5EFE6]/8 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#C87A4B]" />
                <span>Send to Gemini Advisor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onSendToAssistant && (
              <button
                onClick={() => onSendToAssistant(transcript, language)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#0D0D0C] bg-[#C87A4B] hover:bg-[#D48354] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Ask Voice Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
