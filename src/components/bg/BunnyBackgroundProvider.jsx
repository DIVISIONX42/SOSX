// src/components/bg/BunnyBackgroundProvider.jsx
import React, { useEffect, useState } from "react";
import FireBunnyBackground from "./FireBunnyBackground";
import IceBunnyBackground from "./IceBunnyBackground";
import BunnyPortal from "./BunnyPortal";

/**
 * Use this component at top-level (App) so the background sits behind app UI.
 * It respects the user's system theme but allows manual override via `theme` prop.
 *
 * Props:
 *  - theme: "dark" | "light" | undefined  (undefined = follow system)
 */
export default function BunnyBackgroundProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BunnyPortal>
        <div className="bunny-bg-container">
          {/* your canvases, particles, etc */}
        </div>
      </BunnyPortal>

      {children}
    </>
  );
}


