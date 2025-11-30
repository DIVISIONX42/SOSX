import { createPortal } from "react-dom";

export default function BunnyPortal({ children }: { children: React.ReactNode }) {
  const root = document.getElementById("bunny-bg-root");
  if (!root) return null;

  return createPortal(children, root);
}
