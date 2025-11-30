// src/components/bg/BunnyBackgroundProvider.jsx
import React, { useEffect, useState } from "react";
import FireBunnyBackground from "./FireBunnyBackground";
import IceBunnyBackground from "./IceBunnyBackground";

/**
 * Use this component at top-level (App) so the background sits behind app UI.
 * It respects the user's system theme but allows manual override via `theme` prop.
 *
 * Props:
 *  - theme: "dark" | "light" | undefined  (undefined = follow system)
 */
export default function BunnyBackgroundProvider({ theme, children }) {
  const [prefersDark, setPrefersDark] = useState(false);
  const [override, setOverride] = useState(theme);

  useEffect(() => {
    if (theme) setOverride(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const cb = () => setPrefersDark(mq.matches);
    cb();
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  const isDark = override ? override === "dark" : prefersDark;

  return (
    <>
      {isDark ? <FireBunnyBackground /> : <IceBunnyBackground />}
      {/* children will render on top */}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </>
  );
}
