/* eslint-disable react/prop-types */
import React, { useRef, useState } from "react";

interface PlayBunProps {
  src: string;
  title: string;
  poster?: string;
}

export function PlayBun({ src, title, poster }: PlayBunProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = async () => {
    if (!videoRef.current) return;

    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setPlaying(true);
      } catch (e) {
        console.warn("Autoplay blocked", e);
      }
    }
  };

  const enterFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.requestFullscreen) v.requestFullscreen();
    // iOS fallback
    // @ts-ignore
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };

  const enterPiP = async () => {
    const v = videoRef.current as any;
    if (!v) return;

    try {
      if (document.pictureInPictureEnabled && !v.disablePictureInPicture) {
        await v.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP not supported", e);
    }
  };

  const [autoPoster, setAutoPoster] = useState<string | undefined>(poster);

const captureFirstFrame = () => {
  const video = videoRef.current;
  if (!video) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

  setAutoPoster(dataUrl);
};


  return (
    <div
      className="
        cc-grid col-span-4 hstack space-x-3 p-2
        rounded-xl
        bg-white/10 backdrop-blur-xl
        border border-white/20
        shadow-[0_0_20px_rgba(120,80,255,0.35)]
        hover:shadow-[0_0_28px_rgba(120,120,255,0.55)]
        transition-all
      "
    >

  <video
  ref={videoRef}
  src={src}
  poster={autoPoster}
  preload="metadata"
  muted
  playsInline
  className="w-20 h-12 rounded-lg object-cover"
  onLoadedData={() => {
    if (!poster) {
      videoRef.current!.currentTime = 0.1;
    }
  }}
  onSeeked={captureFirstFrame}
  onEnded={() => setPlaying(false)}
/>    <div className="flex-1 overflow-hidden">
        <div className="font-medium text-sm truncate">{title}</div>
        <div className="cc-text text-xs opacity-70">Video</div>
      </div>

      {/* Play / Pause */}
      <span
        className={
          playing
            ? "i-bi:pause-fill text-2xl cursor-pointer text-purple-300"
            : "i-bi:play-fill text-2xl cursor-pointer text-purple-300"
        }
        onClick={togglePlay}
      />

      {/* PiP */}
      <span
        className="i-bi:picture-in-picture text-xl cursor-pointer text-blue-300"
        onClick={enterPiP}
        title="Picture in Picture"
      />

      {/* Fullscreen */}
      <span
        className="i-bi:fullscreen text-xl cursor-pointer text-blue-300"
        onClick={enterFullscreen}
      />

      {/* Download */}
      <a
        href={src}
        download
        className="i-bi:download text-xl cursor-pointer text-purple-200"
      />
    </div>
  );
}
