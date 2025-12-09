import { useState } from "react";
import "../../../styles/cosmicui.css";

// ---- Data imports (you can place them next to this file) ----
import personas from "./personas.json";
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
          <div className="cosmicui-grid">
            {personas.map((p) => (
              <div key={p.id} className="cosmicui-card">
                <h3>{p.name}</h3>
                <p>{p.role}</p>
                <p className="desc">{p.description}</p>
              </div>
            ))}
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
    </div>
  );
};

export default CosmicUI;
