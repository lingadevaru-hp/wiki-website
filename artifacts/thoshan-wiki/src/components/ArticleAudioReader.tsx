import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Mic,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Timer,
  Volume2,
  X,
} from 'lucide-react';

interface ArticleAudioReaderProps {
  title: string;
  text: string;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function splitIntoChunks(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export default function ArticleAudioReader({ title, text }: ArticleAudioReaderProps) {
  const chunks = useMemo(() => splitIntoChunks(text), [text]);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [sleepTimer, setSleepTimer] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);

  const estimatedDuration = useMemo(() => Math.max(30, Math.ceil(text.trim().split(/\s+/).length / 2.25)), [text]);
  const currentTime = estimatedDuration * progress;

  useEffect(() => {
    const storedRate = Number(localStorage.getItem('wiki-reader-rate') || 1);
    const storedVoice = localStorage.getItem('wiki-reader-voice') || '';
    if ([0.85, 1, 1.25, 1.5].includes(storedRate)) setRate(storedRate);
    setVoiceName(storedVoice);
    const updateVoices = () => setVoices(window.speechSynthesis?.getVoices() || []);
    updateVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', updateVoices);
  }, []);

  useEffect(() => {
    if (!sleepTimer || !playing) return;
    const timer = window.setTimeout(() => {
      window.speechSynthesis?.cancel();
      stopProgressTimer();
      setPlaying(false);
      setSleepTimer(0);
    }, sleepTimer * 1000);
    return () => window.clearTimeout(timer);
  }, [sleepTimer, playing]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const stopProgressTimer = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const speakChunk = (index: number) => {
    if (!('speechSynthesis' in window) || !chunks[index]) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.voice = voices.find((voice) => voice.name === voiceName) || null;
    utterance.onend = () => {
      if (index < chunks.length - 1) {
        setChunkIndex(index + 1);
        speakChunk(index + 1);
      } else {
        setPlaying(false);
        setProgress(1);
        stopProgressTimer();
      }
    };
    utterance.onerror = () => {
      setPlaying(false);
      stopProgressTimer();
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const play = () => {
    if (!('speechSynthesis' in window)) return;
    setOpen(true);
    setPlaying(true);
    speakChunk(chunkIndex);
    stopProgressTimer();
    intervalRef.current = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(1, value + 1 / estimatedDuration / 4);
        return next;
      });
    }, 250);
  };

  const pause = () => {
    window.speechSynthesis?.pause();
    setPlaying(false);
    stopProgressTimer();
  };

  const seek = (nextProgress: number) => {
    const clamped = Math.min(1, Math.max(0, nextProgress));
    const nextIndex = Math.min(chunks.length - 1, Math.floor(clamped * chunks.length));
    setProgress(clamped);
    setChunkIndex(nextIndex);
    if (playing) speakChunk(nextIndex);
  };

  const skip = (seconds: number) => seek(progress + seconds / estimatedDuration);

  const close = () => {
    window.speechSynthesis?.cancel();
    stopProgressTimer();
    setPlaying(false);
    setOpen(false);
  };

  const changeRate = () => {
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 0.85 : 1;
    setRate(next);
    localStorage.setItem('wiki-reader-rate', String(next));
    if (playing) speakChunk(chunkIndex);
  };

  const changeSleepTimer = () => {
    setSleepTimer((value) => value === 0 ? 300 : value === 300 ? 900 : 0);
  };

  const selectVoice = (nextVoice: string) => {
    setVoiceName(nextVoice);
    localStorage.setItem('wiki-reader-voice', nextVoice);
    if (playing) speakChunk(chunkIndex);
  };

  const togglePanel = () => {
    if (playing && !open) {
      setOpen(true);
    } else if (playing) {
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
        {playing ? <Pause size={16} fill="currentColor" /> : <Mic size={16} />}
        <span>{playing ? 'Pause' : 'Listen'}</span>
      </button>

      {open && (
        <div className="audio-reader" role="region" aria-label={`Audio reader for ${title}`}>
          <div className="audio-reader-inner">
            <div className="audio-reader-heading">
              <div className="audio-reader-icon"><Mic size={16} /><span className={`audio-equalizer ${playing ? 'is-active' : ''}`} aria-hidden="true"><i /><i /><i /></span></div>
              <div className="min-w-0">
                <p className="audio-reader-kicker">Article reader</p>
                <p className="audio-reader-title">{title}</p>
                <p className="audio-reader-now"><i /><span>{playing ? chunks[chunkIndex] : 'Ready to continue reading'}</span></p>
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
            <div className="audio-reader-options">
              <label><Volume2 size={13} /><span className="sr-only">Voice</span><select value={voiceName} onChange={(event) => selectVoice(event.target.value)} aria-label="Narration voice"><option value="">System voice</option>{voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}</select></label>
              <button type="button" className={sleepTimer ? 'audio-option-active' : ''} onClick={changeSleepTimer} aria-label="Set sleep timer"><Timer size={13} />{sleepTimer ? `${Math.round(sleepTimer / 60)} min` : 'Sleep'}</button>
            </div>
            <div className="audio-reader-controls">
              <button type="button" className="audio-skip" onClick={() => skip(-10)} aria-label="Skip back 10 seconds"><RotateCcw size={18} /><span>10</span></button>
              <button type="button" className="audio-play" onClick={playing ? pause : play} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button type="button" className="audio-skip" onClick={() => skip(10)} aria-label="Skip forward 10 seconds"><RotateCw size={18} /><span>10</span></button>
              <button type="button" className="audio-rate" onClick={changeRate} aria-label="Change playback speed">{rate}x</button>
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
