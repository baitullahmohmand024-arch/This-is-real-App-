import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  isSender?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, duration: initialDuration, isSender = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="audio-player-container"
      className={`flex items-center gap-3 py-2 px-3 rounded-2xl w-64 max-w-full ${
        isSender
          ? 'bg-amber-900/30 text-amber-100 border border-amber-500/20'
          : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/40'
      }`}
    >
      <button
        id="audio-play-toggle-btn"
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-95 ${
          isSender
            ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
            : 'bg-zinc-100 text-zinc-900 hover:bg-white dark:bg-zinc-200 dark:text-zinc-900'
        }`}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        {/* Waveform Bars Simulation with seek */}
        <div className="relative flex items-center gap-0.5 h-6 cursor-pointer">
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Seek audio position"
          />
          {/* Simulated waveform bars */}
          {[12, 20, 16, 24, 14, 22, 18, 26, 12, 18, 24, 16, 22, 14, 18, 26, 15, 20, 12, 18].map((h, i) => {
            const barProgress = (i / 20) * 100;
            const isPlayed = barProgress <= progress;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  isPlayed
                    ? isSender
                      ? 'bg-amber-400'
                      : 'bg-zinc-100'
                    : isSender
                    ? 'bg-amber-500/30'
                    : 'bg-zinc-600/50'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] opacity-75 font-mono mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
