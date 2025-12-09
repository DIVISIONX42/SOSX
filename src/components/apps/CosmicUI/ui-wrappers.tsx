// src/components/apps/CosmicUI/ui-wrappers.tsx
import React, { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";

/* Simple Button that uses cosmic-ui-lite classes */
export function CButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const cls = ["cosmic-btn"]; // fallback: if cosmic-ui-lite uses different class, adjust
  if (props.variant) cls.push(`cosmic-btn-${props.variant}`);
  return <button {...props} className={[...(props.className ? [props.className] : []), ...cls].join(" ")} />;
}

/* Modal component using portal */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="cosmic-modal-overlay" style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)"
    }}>
      <div className="cosmic-modal cosmic-border" style={{
        width: "min(900px, 92%)",
        maxHeight: "86vh",
        overflowY: "auto",
        background: "rgba(6,10,16,0.9)",
        padding: 20,
        borderRadius: 12
      }}>
        {title && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "white", fontSize: 18 }}>✕</button>
        </div>}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* Tiny Toast manager (simple) */
let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = useState<{ id:number; text:string }[]>([]);
  function push(text: string, timeout = 3000) {
    const id = ++toastId;
    setToasts(s => [...s, { id, text }]);
    setTimeout(() => setToasts(s => s.filter(t => t.id !== id)), timeout);
  }
  const ToastContainer = () => (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 12000 }}>
      {toasts.map(t => (
        <div key={t.id} className="cosmic-toast cosmic-border" style={{
          background: "rgba(10,18,26,0.95)", color: "#fff", padding: "8px 12px", marginTop: 8, borderRadius: 8, border: "1px solid rgba(0,255,255,0.12)"
        }}>{t.text}</div>
      ))}
    </div>
  );
  return { push, ToastContainer };
}
