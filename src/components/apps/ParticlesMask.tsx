import { useEffect } from "react";
import { loadAll } from "@tsparticles/all";
import { tsParticles } from "@tsparticles/engine";
import { loadPolygonMaskPlugin } from "@tsparticles/plugin-polygon-mask";

import "../../styles/particlesmask.css";

const ParticlesMask = () => {
  useEffect(() => {
    const init = async () => {
      await loadAll(tsParticles); // replaces loadFull()
      await loadPolygonMaskPlugin(tsParticles); // v3 plugin

      const options = {
        fpsLimit: 50,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "bubble" }
          },
          modes: {
            bubble: {
              distance: 30,
              duration: 2,
              opacity: 0.69,
              size: 5,
              speed: 0.3
            }
          }
        },
        particles: {
          color: {
            value: "random",
            animation: { enable: true, speed: 2, sync: true }
          },
          links: {
            blink: false,
            color: "random",
            distance: 30,
            enable: true,
            opacity: 0.69,
            width: 0.5
          },
          move: {
            enable: true,
            outModes: "bounce",
            speed: { min: 0.33, max: 0.77 }
          },
          number: { value: 111 },
          opacity: {
            animation: { enable: true, speed: 2 },
            value: { min: 0.03, max: 0.7 }
          },
          shape: { type: "star" },
          size: { random: true, value: { min: 0.23, max: 0.92 } }
        },
        polygon: {
          draw: {
            enable: true,
            stroke: { color: "#FF4500", width: 2.3, opacity: 0.35 }
          },
          move: { radius: 4 },
          inline: { arrangement: "equidistant" },
          scale: 0.69,
          type: "inline",
          url: "https://particles.js.org/images/smalldeer.svg"
        }
      };

      await tsParticles.load({ id: "tsparticles", options });
    };

    init();
  }, []);

  return (
    <>
      <div id="tsparticles" className="tsparticles-container" />

      <div className="github bg-orange">
        <p className="color-white font-calibri size-s  text-center content-center flex items-center justify-center align-center relative">
          EL LA Stars
        </p>
      </div>
    </>
  );
};

export default ParticlesMask;
