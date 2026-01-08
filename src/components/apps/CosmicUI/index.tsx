import { useState, useRef, useEffect } from "react";

import "../../../styles/cosmicui-layout.css";
import "../../../styles/cosmicui.css";

/* Import cosmic-ui-lite core styles */
import "../../../styles/cosmic-ui-lite/src/styles/cosmic-ui.css";
import "../../../styles/cosmic-ui-lite/src/styles/base/_variables.css";
import "../../../styles/cosmic-ui-lite/src/styles/base/_shared.css";
import "../../../styles/cosmic-ui-lite/src/styles/base/_responsive.css";

/* Components */
import "../../../styles/cosmic-ui-lite/src/styles/components/_card.css";
import "../../../styles/cosmic-ui-lite/src/styles/components/_modal.css";
import "../../../styles/cosmic-ui-lite/src/styles/components/_info.css";
import "../../../styles/cosmic-ui-lite/src/styles/components/_tag.css";
//import "../../../styles/cosmic-ui-lite/src/styles/components/_sidebar.css";
//import "../../../styles/cosmic-ui-lite/src/styles/components/_toolbar.css";

/* Animations */
import "../../../styles/cosmic-ui-lite/src/styles/animations/_keyframes.css";
import "../../../styles/cosmic-ui-lite/src/styles/animations/_hover-effects.css";

import personas from "./personas.json";
import wishlist from "./wishlist.json";
import stories from "./stories.json";

import { Modal, CButton, useToast } from "./ui-wrappers";

import CharacterViewer from '../../canvas/CharacterViewer';


/* TABS */
const tabs = [
  { id: "personas", label: "Personas", icon: "👤" },
  { id: "stories", label: "Stories", icon: "📘" },
  { id: "wishlist", label: "Wishlist", icon: "⭐" }
];

const CosmicUI = () => {
  const [activeTab, setActiveTab] = useState("personas");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<any>(null);
  const { push, ToastContainer } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ----------------------------------------------------------
  // ⭐ 3D BACKGROUND PARTICLES FIXED (behind UI)
  // ----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    let particles: any[] = [];
    const count = 120;

    class Particle {
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;

      constructor() {
        this.size = Math.random() * 2 + 1;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.dx = (Math.random() - 0.5) * 1;
        this.dy = (Math.random() - 0.5) * 1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,255,255,0.8)";
        ctx.fill();
      }

      update() {
        if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.dy *= -1;

        this.x += this.dx;
        this.y += this.dy;
        this.draw();
      }
    }

    const init = () => {
      particles = Array.from({ length: count }, () => new Particle());
    };

    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((pA, i) => {
        pA.update();

        for (let j = i; j < particles.length; j++) {
          const pB = particles[j];
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,255,255,0.1)";
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        }
      });
    };

    init();
    animate();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ----------------------------------------------------------
  // RENDER UI
  // ----------------------------------------------------------
  return (
    <div className="cosmic-ui-layout">
      {/* BACKGROUND CANVAS */}
      <canvas
        ref={canvasRef}
        className="cosmic-ui-bg-layer"
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* ---- Header ---- */}

      {/* SIDEBAR */}
      <aside className="cosmic-sidebar">
        <h1 className="glitch" data-text="Cosmic UI">
          Cosmic UI{" "}
        </h1>

        <div className="sidebar-items">
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`sidebar-item ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="icon">{t.icon}</span>
              {t.label}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="cosmic-main">
        {/* Toolbar */}
        <div className="cosmic-toolbar">
          <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
        </div>

        {/* REAL CONTENT */}
        <div className="cosmic-content-panel">
          {/* Personas */}
          {activeTab === "personas" && (
            <div className="cosmicui-grid">
              {personas.map((p) => (
                <div className="cosmicui-card" key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="role">{p.role}</p>
                  <p className="desc">{p.description}</p>

                  <div style={{ marginTop: 12 }}>
                    <CButton
                      onClick={() => {
                        setModalItem(p);
                        setModalOpen(true);
                      }}
                    >
                      More
                    </CButton>
                    <CButton
                      style={{ marginLeft: 8 }}
                      onClick={() => push(`Added ${p.name} to wishlist`)}
                    >
                      ⭐
                    </CButton>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stories */}
          {activeTab === "stories" && (
            <div className="cosmicui-list">
              {stories.map((s) => (
                <div className="cosmicui-story" key={s.id}>
                  <h3>{s.title}</h3>
                  <p>{s.summary}</p>
                </div>
              ))}
            </div>
          )}

          {/* Wishlist */}
          {activeTab === "wishlist" && (
            <ul className="cosmicui-wishlist">
              {wishlist.map((w) => (
                <li key={w.id}>
                  <span>{w.text}</span>
                  <span className="tag">{w.priority.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalItem?.name}>
        <p>
          <strong>Role:</strong> {modalItem?.role}
        </p>
        <p>{modalItem?.description}</p>
        <CButton style={{ marginTop: 12 }}>Open in Viewer</CButton>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default CosmicUI;
