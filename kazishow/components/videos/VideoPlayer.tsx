"use client";
import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  thumbnail?: string | null;
  className?: string;
  audioUrl?: string | null;
}

export default function VideoPlayer({ src, thumbnail, className = "", audioUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Auto-pause when scrolled out of view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !video.paused) {
          video.pause();
          audioRef.current?.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Sync audio mute with video mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  function togglePlay() {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      if (audio && audioUrl) audio.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      audio?.pause();
      setPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = pct * video.duration;
    }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className={`relative bg-black overflow-hidden group ${className}`}>
      {/* Poster before load */}
      {thumbnail && !loaded && (
        <img src={thumbnail} alt="thumbnail" className="absolute inset-0 w-full h-full object-cover" />
      )}

      <video
        ref={videoRef}
        src={src}
        muted={audioUrl ? true : muted}
        loop
        playsInline
        preload="metadata"
        poster={thumbnail || undefined}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => { setDuration((e.target as HTMLVideoElement).duration); setLoaded(true); }}
        onEnded={() => { setPlaying(false); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />

      {/* Background audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          loop
          muted={muted}
          preload="none"
        />
      )}

      {/* Play / Pause overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!playing && (
          <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        )}
      </div>

      {/* Mute / unmute button */}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
        className="absolute bottom-28 left-4 z-20 flex items-center gap-1.5 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 active:scale-95 transition-all"
      >
        {muted
          ? <VolumeX className="w-4 h-4 text-white" />
          : <Volume2 className="w-4 h-4 text-white" />
        }
        <span className="text-white text-xs font-bold">{muted ? "Unmute" : "Mute"}</span>
      </button>

      {/* Controls bar — hover/tap */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-kazi-orange rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <button onClick={togglePlay} className="text-white p-1">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="white" />}
          </button>
          <span className="text-white/70 text-xs">
            {fmt((progress / 100) * duration)} / {fmt(duration)}
          </span>
          <button onClick={() => setMuted(!muted)} className="text-white p-1">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
