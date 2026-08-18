import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Square,
  X,
} from 'lucide-react';

interface ArticleAudioReaderProps {
  title: string;
  text: string;
}

type ReaderMode = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

const MAX_SEGMENT_CHARS = 1900;

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function splitIntoSegments(text: string) {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const segments: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > MAX_SEGMENT_CHARS && current) {
      segments.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) segments.push(current);
  return segments.length ? segments : [text.trim()];
}

function browserSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickBrowserVoice() {
  if (!browserSpeechAvailable()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    if (lang.includes('en-in') || name.includes('india')) return 100;
    if (lang.includes('hi-in')) return 95;
    if (lang.includes('en-gb')) return 80;
    if (lang.startsWith('en') && (name.includes('male') || name.includes('man'))) return 70;
    if (lang.startsWith('en')) return 50;
    return 0;
  };

  return voices
    .slice()
    .sort((left, right) => score(right) - score(left))[0] ?? null;
}

export default function ArticleAudioReader({ title, text }: ArticleAudioReaderProps) {
  const segments = useMemo(() => splitIntoSegments(text), [text]);
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const estimatedDuration = useMemo(() => Math.max(30, Math.ceil(wordCount / 2.35)), [wordCount]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ReaderMode>('idle');
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [segmentDuration, setSegmentDuration] = useState(0);
  const [segmentTime, setSegmentTime] = useState(0);
  const [status, setStatus] = useState('Ready to render article voice');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackActiveRef = useRef(false);

  const playing = mode === 'playing' || mode === 'loading';
  const segmentShare = segments.length ? segmentIndex / segments.length : 0;
  const currentSegmentProgress = segmentDuration > 0 ? segmentTime / segmentDuration : 0;
  const progress = Math.min(1, Math.max(0, segmentShare + currentSegmentProgress / Math.max(1, segments.length)));
  const currentTime = estimatedDuration * progress;

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stopBrowserSpeech = () => {
    fallbackActiveRef.current = false;
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
  };

  const stopAudio = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    clearObjectUrl();
    stopBrowserSpeech();
  };

  useEffect(() => () => stopAudio(), []);

  const playWithBrowserVoice = (index: number) => {
    if (!browserSpeechAvailable() || !segments[index]) {
      setMode('error');
      setStatus('Voice reading is unavailable in this browser');
      return;
    }

    stopAudio();
    fallbackActiveRef.current = true;
    setOpen(true);
    setMode('playing');
    setSegmentIndex(index);
    setStatus('Cloudflare voice unavailable. Reading with browser voice.');

    const utterance = new SpeechSynthesisUtterance(segments[index]);
    utterance.rate = 0.96;
    utterance.pitch = 0.95;
    const browserVoice = pickBrowserVoice();
    if (browserVoice) utterance.voice = browserVoice;
    utterance.onend = () => {
      if (!fallbackActiveRef.current) return;
      if (index < segments.length - 1) {
        playWithBrowserVoice(index + 1);
      } else {
        fallbackActiveRef.current = false;
        setMode('idle');
        setSegmentTime(0);
        setStatus('Finished reading');
      }
    };
    utterance.onerror = () => {
      fallbackActiveRef.current = false;
      setMode('error');
      setStatus('Voice reading stopped. Try Listen again.');
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const loadAndPlaySegment = async (index: number, startAt = 0) => {
    const segment = segments[index];
    if (!segment) return;

    stopAudio();
    setOpen(true);
    setMode('loading');
    setSegmentIndex(index);
    setSegmentTime(0);
    setSegmentDuration(0);
    setStatus(index === 0 ? 'Sending article text to Cloudflare' : 'Sending next section to Cloudflare');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: segment }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);

      setStatus('Rendering voice audio with Workers AI');
      const blob = await response.blob();
      setStatus('Receiving MP3 audio from Cloudflare');
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.preload = 'auto';

      audio.onloadedmetadata = () => {
        setSegmentDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        if (startAt > 0 && Number.isFinite(audio.duration)) {
          audio.currentTime = Math.min(audio.duration - 0.25, startAt);
        }
      };
      audio.ontimeupdate = () => {
        setSegmentTime(audio.currentTime || 0);
        setSegmentDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      };
      audio.onplay = () => {
        setMode('playing');
        setStatus('Reading with Cloudflare voice');
      };
      audio.onpause = () => {
        if (audio.ended) return;
        setMode((current) => (current === 'playing' ? 'paused' : current));
      };
      audio.onended = () => {
        clearObjectUrl();
        if (index < segments.length - 1) {
          void loadAndPlaySegment(index + 1);
        } else {
          setMode('idle');
          setSegmentTime(0);
          setStatus('Finished reading');
        }
      };
      audio.onerror = () => {
        setMode('error');
        setStatus('Audio playback failed. Switching to browser voice.');
        playWithBrowserVoice(index);
      };

      await audio.play();
    } catch (error) {
      if (controller.signal.aborted) return;
      setMode('error');
      setStatus('Cloudflare voice unavailable. Switching to browser voice.');
      playWithBrowserVoice(index);
    }
  };

  const play = () => {
    if (audioRef.current && mode === 'paused') {
      void audioRef.current.play();
      return;
    }
    if (fallbackActiveRef.current && mode === 'paused') {
      window.speechSynthesis?.resume();
      setMode('playing');
      return;
    }
    void loadAndPlaySegment(segmentIndex);
  };

  const pause = () => {
    if (audioRef.current) audioRef.current.pause();
    if (fallbackActiveRef.current) window.speechSynthesis?.pause();
    setMode('paused');
    setStatus('Paused');
  };

  const stop = () => {
    stopAudio();
    setMode('idle');
    setSegmentIndex(0);
    setSegmentTime(0);
    setSegmentDuration(0);
    setStatus('Ready to render article voice');
  };

  const skip = (seconds: number) => {
    if (fallbackActiveRef.current) {
      const nextIndex = Math.min(segments.length - 1, Math.max(0, segmentIndex + (seconds > 0 ? 1 : -1)));
      playWithBrowserVoice(nextIndex);
      return;
    }

    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const nextTime = audio.currentTime + seconds;
    if (nextTime < 0 && segmentIndex > 0) {
      void loadAndPlaySegment(segmentIndex - 1);
    } else if (nextTime >= audio.duration && segmentIndex < segments.length - 1) {
      void loadAndPlaySegment(segmentIndex + 1);
    } else {
      audio.currentTime = Math.min(Math.max(0, nextTime), Math.max(0, audio.duration - 0.1));
    }
  };

  const seek = (nextProgress: number) => {
    const clamped = Math.min(1, Math.max(0, nextProgress));
    const targetIndex = Math.min(segments.length - 1, Math.floor(clamped * segments.length));
    if (targetIndex !== segmentIndex || !audioRef.current) {
      void loadAndPlaySegment(targetIndex);
      return;
    }
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      const segmentProgress = (clamped * segments.length) % 1;
      audioRef.current.currentTime = segmentProgress * audioRef.current.duration;
    }
  };

  const close = () => {
    stop();
    setOpen(false);
  };

  const togglePanel = () => {
    if (mode === 'playing' || mode === 'loading') {
      pause();
    } else {
      play();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`reader-trigger ${playing ? 'is-playing' : ''}`}
        onClick={togglePanel}
        aria-label={playing ? 'Pause article narration' : 'Listen to this article'}
        data-testid="button-listen-article"
      >
        {mode === 'loading' ? <Loader2 size={16} className="reader-spin" /> : playing ? <Pause size={16} fill="currentColor" /> : <Mic size={16} />}
        {playing && <span className="reader-trigger-signal" aria-hidden="true"><i /><i /><i /></span>}
        <span>{mode === 'loading' ? 'Loading' : playing ? 'Pause' : 'Listen'}</span>
      </button>

      {open && (
        <div className="audio-reader" role="region" aria-label={`Audio reader for ${title}`}>
          <div className="audio-reader-inner">
            <div className="audio-reader-heading">
              <div className="audio-reader-icon"><Mic size={16} /><span className={`audio-equalizer ${playing ? 'is-active' : ''}`} aria-hidden="true"><i /><i /><i /></span></div>
              <div className="min-w-0">
                <p className="audio-reader-kicker">Cloudflare TTS · MeloTTS</p>
                <p className="audio-reader-title">{title}</p>
                <p className="audio-reader-now"><i /><span>{status} · Section {segmentIndex + 1} of {segments.length}</span></p>
              </div>
              <button type="button" className="icon-button ml-auto" onClick={close} aria-label="Close audio reader">
                <X size={17} />
              </button>
            </div>
            <div className="audio-reader-seek">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(event) => seek(Number(event.target.value))}
                aria-label="Audio position"
                style={{ '--seek-progress': `${progress * 100}%` } as React.CSSProperties}
              />
              <div className="audio-reader-time"><span>{formatTime(currentTime)}</span><span>{formatTime(estimatedDuration)}</span></div>
            </div>
            <div className="audio-reader-controls">
              <button type="button" className="audio-skip" onClick={() => skip(-10)} aria-label="Skip back 10 seconds"><RotateCcw size={18} /><span>10</span></button>
              <button type="button" className="audio-play" onClick={mode === 'playing' || mode === 'loading' ? pause : play} aria-label={mode === 'playing' || mode === 'loading' ? 'Pause' : 'Play'}>
                {mode === 'loading' ? <Loader2 size={19} className="reader-spin" /> : mode === 'playing' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button type="button" className="audio-skip" onClick={() => skip(10)} aria-label="Skip forward 10 seconds"><RotateCw size={18} /><span>10</span></button>
              <button type="button" className="audio-stop" onClick={stop} aria-label="Stop reading"><Square size={15} fill="currentColor" /></button>
              <button type="button" className="audio-collapse" onClick={() => setOpen(false)} aria-label="Minimize audio reader"><ChevronDown size={18} /></button>
            </div>
          </div>
        </div>
      )}
      {!open && playing && (
        <button type="button" className="audio-reader-mini" onClick={() => setOpen(true)} aria-label="Open minimized article reader">
          <span className="audio-reader-mini-pulse" /><Mic size={15} /><span>Reading aloud</span><ChevronDown size={15} />
        </button>
      )}
    </>
  );
}
