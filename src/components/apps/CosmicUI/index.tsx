import { useState } from "react";
import "../../../styles/cosmicui.css";

// ---- Data imports (you can place them next to this file) ----
import personas from "./personas.json";
import personas from "./personas.json";
import { Modal, CButton, useToast } from "./ui-wrappers";
import wishlist from "./wishlist.json";
import stories from "./stories.json";

/*
  Tabs:
  1. Personas
  2. Stories
  3. Wishlist
*/

const tabs = [
  { id: "personas", label: "Personas" },
  { id: "stories", label: "Stories" },
  { id: "wishlist", label: "Wishlist" }
];

const CosmicUI = () => {
const [activeTab, setActiveTab] = useState("personas");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null as any);
  const { push, ToastContainer } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  return (
    <div className="cosmicui-container">
      {/* ---- Header ---- */}
      <div className="cosmicui-header">
        <h1>Cosmic UI</h1>
        <div className="cosmicui-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`cosmicui-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Content Panel ---- */}
      <div className="cosmicui-content">
           {activeTab === "personas" && (
                <div className="cosmicui-card" key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="role">{p.role}</p>
                  <p className="desc">{p.description}</p>
                  <div style={{ marginTop: 12 }}>
                    <CButton onClick={() => { setModalItem(p); setModalOpen(true); }}>More</CButton>
                    <CButton style={{ marginLeft: 8 }} onClick={() => { push(`Added ${p.name} to wishlist`); }}>⭐</CButton>
                  </div>
                </div>
            )}
          </div>
        )}

        {activeTab === "stories" && (
          <div className="cosmicui-list">
            {stories.map((s) => (
              <div key={s.id} className="cosmicui-story">
                <h3>{s.title}</h3>
                <p>{s.summary}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "wishlist" && (
          <ul className="cosmicui-wishlist">
            {wishlist.map((w) => (
              <li key={w.id}>
                <span>{w.text}</span>
                <span className="tag">{w.priority}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalItem?.name}>
        <div>
          <p><strong>Role:</strong> {modalItem?.role}</p>
          <p>{modalItem?.description}</p>
          <div style={{ marginTop: 12 }}>
            <CButton onClick={() => { /* action: open SOSX dataset, etc */ }}>Open in Viewer</CButton>
          </div>
       </div>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default CosmicUI;
