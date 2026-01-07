import React, { useRef, useState, useEffect } from "react";

interface PlayBunProps {
  src: string;
  title: string;
  poster?: string;
}

export function PlayBun({ src, title, poster }: PlayBunProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [autoPoster, setAutoPoster] = useState<string | undefined>(poster);

  useEffect(() => {
    if (poster || !src) return;

    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setAutoPoster(canvas.toDataURL("image/jpeg", 0.85));
    };
  }, [src, poster]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    playing ? videoRef.current.pause() : videoRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="cc-grid col-span-4 hstack space-x-3 p-2">
      <video
        ref={videoRef}
        src={src}
        poster={autoPoster}
        muted
        playsInline
        preload="metadata"
        className="w-20 h-12 rounded-lg object-cover"
        onEnded={() => setPlaying(false)}
      />

      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="cc-text">Video</div>
      </div>

      <span
        className={playing ? "i-bi:pause-fill text-2xl" : "i-bi:play-fill text-2xl"}
        onClick={togglePlay}
      />
    </div>
  );
}
