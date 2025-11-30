import React, { useEffect, useState } from "react";
import ParticlesCanvas from "./ParticlesCanvas";
import BunnyLines from "./BunnyLines";
import "./bg.css";

export default function FireBunnyBackground({ parallaxFactor = 0.06 }: { parallaxFactor?: number }) {
  const [offset, setOffset] = useState(0);
  const [mx, setMx] = useState(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      setOffset(y * parallaxFactor);
    }
    function onMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      setMx(((e.clientX - cx) / cx) * 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, [parallaxFactor]);

  return (
    <div className="bg-root bg-dark" style={{ pointerEvents: "none" }}>
      <div className="bg-gradient" style={{ transform: `translate3d(${mx}px, ${offset}px, 0)` }} />
      <ParticlesCanvas color="rgba(255,150,40,0.85)" count={90} speed={1} blendMode="screen" />
      <BunnyLines stroke="#ff8a3d" stroke2="#ffd6af" scale={1} offset={offset * 0.2} />
      <div className="bg-bottom-glow" style={{ transform: `translateY(${offset * 0.18}px)` }} />
    </div>
  );
}
