//to what corrects ur auto? ine does to 👯‍♀️Playboy👯

import React, { useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
}

export function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const enterFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="cc-grid col-span-4 hstack space-x-3 p-2">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-20 h-12 rounded-lg object-cover"
        onEnded={() => setPlaying(false)}
      />

      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="cc-text">Video</div>
      </div>

      {/* Play / Pause */}
      <span
        className={playing ? "i-bi:pause-fill text-2xl" : "i-bi:play-fill text-2xl"}
        onClick={togglePlay}
      />

      {/* Fullscreen */}
      <span
        className="i-bi:fullscreen text-xl cursor-pointer"
        onClick={enterFullscreen}
      />

      {/* Download */}
      <a
        href={src}
        download
        className="i-bi:download text-xl cursor-pointer"
      />
    </div>
  );
}
