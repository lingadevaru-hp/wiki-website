import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
} from "lucide-react";

interface ArticleAudioReaderProps {
  title: string;
  text: string;
}

type ReaderMode = "idle" | "loading" | "playing" | "paused" | "error";

const MAX_SEGMENT_CHARS = 1900;

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function splitIntoSegments(text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const segments: string[] = [];
  let current = "";

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

export default function ArticleAudioReader({
  title,
  text,
}: ArticleAudioReaderProps) {
  const segments = useMemo(() => splitIntoSegments(text), [text]);
  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );
  const estimatedDuration = useMemo(
    () => Math.max(30, Math.ceil(wordCount / 2.35)),
    [wordCount],
  );
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ReaderMode>("idle");
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [segmentDuration, setSegmentDuration] = useState(0);
  const [segmentTime, setSegmentTime] = useState(0);
  const [status, setStatus] = useState("Ready to render article voice");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const segmentOffsetRef = useRef(0);
  const activeSegmentRef = useRef(0);
  const playTokenRef = useRef(0);

  const playing = mode === "playing" || mode === "loading";
  const segmentShare = segments.length ? segmentIndex / segments.length : 0;
  const currentSegmentProgress =
    segmentDuration > 0 ? segmentTime / segmentDuration : 0;
  const progress = Math.min(
    1,
    Math.max(
      0,
      segmentShare + currentSegmentProgress / Math.max(1, segments.length),
    ),
  );
  const currentTime = estimatedDuration * progress;

  const revokeAudioUrl = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onloadedmetadata = null;
      audio.ontimeupdate = null;
      audio.onerror = null;
      audio.onpause = null;
      audio.onplaying = null;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    }
    revokeAudioUrl();
  };

  const resetPlayback = () => {
    playTokenRef.current += 1;
    stopAudio();
  };

  const clearReader = () => {
    resetPlayback();
    segmentOffsetRef.current = 0;
    setMode("idle");
    setSegmentIndex(0);
    setSegmentTime(0);
    setSegmentDuration(0);
    setStatus("Ready to render article voice");
  };

  useEffect(
    () => () => {
      resetPlayback();
    },
    [],
  );

  const finishCloudflarePlayback = (token: number) => {
    if (token !== playTokenRef.current) return;
    stopAudio();
    setMode("idle");
    setSegmentTime(0);
    setSegmentDuration(0);
    setStatus("Finished reading");
  };

  const playCloudflareVoice = async (
    index: number,
    token = playTokenRef.current,
    startAt = 0,
  ) => {
    const segment = segments[index];
    if (!segment) return;

    if (token !== playTokenRef.current) return;
    setOpen(true);
    setMode("loading");
    setSegmentIndex(index);
    setSegmentTime(0);
    setSegmentDuration(0);
    setStatus(
      index === 0
        ? "Sending article text to Cloudflare"
        : "Sending next section to Cloudflare",
    );

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: segment }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      setStatus("Rendering voice audio with Workers AI");
      const blob = await response.blob();
      setStatus("Receiving MP3 audio from Cloudflare");

      if (token !== playTokenRef.current) return;
      stopAudio();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audio.preload = "auto";
      audioRef.current = audio;
      activeSegmentRef.current = index;
      segmentOffsetRef.current = Math.max(0, startAt);
      const applyProgress = () => {
        if (token !== playTokenRef.current) return;
        setSegmentTime(
          Math.min(
            audio.currentTime,
            Number.isFinite(audio.duration)
              ? audio.duration
              : audio.currentTime,
          ),
        );
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setSegmentDuration(audio.duration);
        }
      };

      audio.onloadedmetadata = () => {
        if (token !== playTokenRef.current) return;
        setSegmentDuration(
          Number.isFinite(audio.duration) ? audio.duration : 0,
        );
        if (startAt > 0 && Number.isFinite(audio.duration)) {
          audio.currentTime = Math.min(
            startAt,
            Math.max(0, audio.duration - 0.05),
          );
        }
      };
      audio.ontimeupdate = applyProgress;
      audio.onplaying = () => {
        if (token !== playTokenRef.current) return;
        setMode("playing");
        setStatus("Reading with Cloudflare voice");
      };
      audio.onpause = () => {
        if (token !== playTokenRef.current) return;
        setSegmentTime(audio.currentTime);
      };
      audio.onerror = () => {
        if (token !== playTokenRef.current) return;
        stopAudio();
        setMode("error");
        setStatus("Cloudflare voice could not be played. Try Listen again.");
      };
      audio.onended = () => {
        if (token !== playTokenRef.current) return;
        stopAudio();
        setSegmentTime(Number.isFinite(audio.duration) ? audio.duration : 0);
        if (index < segments.length - 1) {
          void playCloudflareVoice(index + 1, token, 0);
        } else {
          finishCloudflarePlayback(token);
        }
      };

      await audio.play();
      if (token !== playTokenRef.current) return;
      setMode("playing");
      setStatus("Reading with Cloudflare voice");
    } catch (error) {
      if (token !== playTokenRef.current) return;
      stopAudio();
      setMode("error");
      setStatus("Cloudflare voice could not be rendered. Try Listen again.");
    }
  };

  const play = () => {
    if (mode === "paused" && audioRef.current) {
      const token = playTokenRef.current;
      void audioRef.current
        .play()
        .then(() => {
          if (token === playTokenRef.current) {
            setMode("playing");
            setStatus("Reading with Cloudflare voice");
          }
        })
        .catch(() => {
          setMode("error");
          setStatus("Cloudflare voice could not be played. Try Listen again.");
        });
      return;
    }
    const token = ++playTokenRef.current;
    stopAudio();
    setOpen(true);
    void playCloudflareVoice(segmentIndex, token, 0);
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    segmentOffsetRef.current = Math.max(0, audio.currentTime);
    audio.pause();
    setMode("paused");
    setStatus("Paused");
  };

  const stop = () => {
    clearReader();
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const nextOffset = Math.max(
      0,
      Math.min(
        duration || Number.MAX_SAFE_INTEGER,
        audio.currentTime + seconds,
      ),
    );
    if (duration && nextOffset >= duration - 0.05) {
      if (activeSegmentRef.current < segments.length - 1) {
        const token = playTokenRef.current;
        void playCloudflareVoice(activeSegmentRef.current + 1, token, 0);
      }
      return;
    }
    audio.currentTime = nextOffset;
    segmentOffsetRef.current = nextOffset;
    setSegmentTime(nextOffset);
  };

  const seek = (nextProgress: number) => {
    const clamped = Math.min(1, Math.max(0, nextProgress));
    const targetIndex = Math.min(
      segments.length - 1,
      Math.floor(clamped * segments.length),
    );
    if (targetIndex !== activeSegmentRef.current) {
      const token = ++playTokenRef.current;
      stopAudio();
      void playCloudflareVoice(targetIndex, token, 0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    const segmentProgress = (clamped * segments.length) % 1;
    const nextOffset = Number.isFinite(audio.duration)
      ? segmentProgress * audio.duration
      : segmentProgress * segmentTime;
    audio.currentTime = nextOffset;
    segmentOffsetRef.current = nextOffset;
    setSegmentTime(nextOffset);
  };

  const close = () => {
    stop();
    setOpen(false);
  };

  const togglePanel = () => {
    if (mode === "playing" || mode === "loading") {
      pause();
    } else {
      play();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`reader-trigger ${playing ? "is-playing" : ""}`}
        onClick={togglePanel}
        aria-label={
          playing ? "Pause article narration" : "Listen to this article"
        }
        data-testid="button-listen-article"
      >
        {mode === "loading" ? (
          <Loader2 size={16} className="reader-spin" />
        ) : playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Mic size={16} />
        )}
        {playing && (
          <span className="reader-trigger-signal" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        <span className="reader-label hidden min-[420px]:inline">
          {mode === "loading" ? "Loading" : playing ? "Pause" : "Listen"}
        </span>
      </button>

      {open && (
        <div
          className="audio-reader"
          role="region"
          aria-label={`Audio reader for ${title}`}
        >
          <div className="audio-reader-inner">
            <div className="audio-reader-heading">
              <div className="audio-reader-icon">
                <Mic size={16} />
                <span
                  className={`audio-equalizer ${playing ? "is-active" : ""}`}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="min-w-0">
                <p className="audio-reader-kicker">Cloudflare TTS · MeloTTS</p>
                <p className="audio-reader-title">{title}</p>
                <p className="audio-reader-now">
                  <i />
                  <span>
                    {status} · Section {segmentIndex + 1} of {segments.length}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="icon-button ml-auto"
                onClick={close}
                aria-label="Close audio reader"
              >
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
                style={
                  {
                    "--seek-progress": `${progress * 100}%`,
                  } as React.CSSProperties
                }
              />
              <div className="audio-reader-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(estimatedDuration)}</span>
              </div>
            </div>
            <div className="audio-reader-controls">
              <button
                type="button"
                className="audio-skip"
                onClick={() => skip(-10)}
                aria-label="Skip back 10 seconds"
              >
                <RotateCcw size={18} />
                <span>10</span>
              </button>
              <button
                type="button"
                className="audio-play"
                onClick={
                  mode === "playing" || mode === "loading" ? pause : play
                }
                aria-label={
                  mode === "playing" || mode === "loading" ? "Pause" : "Play"
                }
              >
                {mode === "loading" ? (
                  <Loader2 size={19} className="reader-spin" />
                ) : mode === "playing" ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                className="audio-skip"
                onClick={() => skip(10)}
                aria-label="Skip forward 10 seconds"
              >
                <RotateCw size={18} />
                <span>10</span>
              </button>
              <button
                type="button"
                className="audio-stop"
                onClick={stop}
                aria-label="Stop reading"
              >
                <Square size={15} fill="currentColor" />
              </button>
              <button
                type="button"
                className="audio-collapse"
                onClick={() => setOpen(false)}
                aria-label="Minimize audio reader"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
      {!open && playing && (
        <button
          type="button"
          className="audio-reader-mini"
          onClick={() => setOpen(true)}
          aria-label="Open minimized article reader"
        >
          <span className="audio-reader-mini-pulse" />
          <Mic size={15} />
          <span>Reading aloud</span>
          <ChevronDown size={15} />
        </button>
      )}
    </>
  );
}
