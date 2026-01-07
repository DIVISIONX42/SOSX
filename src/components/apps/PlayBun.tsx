import React, { useRef, useState } from "react";

export function PlayBun({ src, title, poster }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const [playing, setPlaying] = useState(false);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const enterFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  const enterPiP = async () => {
    const v = videoRef.current;
    if (v && "requestPictureInPicture" in v) {
      await v.requestPictureInPicture();
    }
  };

  /* ===== TOUCH GESTURES ===== */

  const onTouchStart = (e) => {
    startPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const onTouchEnd = (e) => {
    if (!videoRef.current) return;

    const dx = e.changedTouches[0].clientX - startPos.current.x;
    const dy = e.changedTouches[0].clientY - startPos.current.y;

    // Horizontal swipe → SEEK
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      videoRef.current.currentTime += dx > 0 ? 5 : -5;
    }

    // Vertical swipe → VOLUME
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30) {
      let vol = videoRef.current.volume + (dy < 0 ? 0.1 : -0.1);
      videoRef.current.volume = Math.min(1, Math.max(0, vol));
    }
  };

  return (
    <div
      className="
        cc-grid col-span-4 flex items-center gap-3 p-2
        rounded-xl bg-white/10 backdrop-blur-xl
        border border-white/20
        shadow-[0_0_25px_rgba(140,100,255,0.35)]
      "
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onEnded={() => setPlaying(false)}
        className="
          w-20 h-12 rounded-lg object-cover bg-black
          ring-1 ring-purple-400/40
          shadow-[0_0_15px_rgba(120,80,255,0.6)]
        "
      />

      {/* TEXT */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{title}</div>
        <div className="text-xs opacity-70">Swipe: ↔ seek · ↕ volume</div>
      </div>

      {/* CONTROLS */}
      <span
        className={playing ? "i-bi:pause-fill text-2xl text-purple-300" : "i-bi:play-fill text-2xl text-purple-300"}
        onClick={togglePlay}
      />

      <span
        className="i-bi:picture-in-picture text-xl text-blue-300"
        onClick={enterPiP}
      />

      <span
        className="i-bi:fullscreen text-xl text-indigo-300"
        onClick={enterFullscreen}
      />

      <a
        href={src}
        download
        className="i-bi:download text-xl text-purple-200"
      />
    </div>
  );
}
