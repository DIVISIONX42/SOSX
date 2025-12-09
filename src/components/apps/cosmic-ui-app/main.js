/* ------------------------------
   Load JSON helper
--------------------------------*/
async function loadJSON(file) {
  const res = await fetch(file);
  return await res.json();
}

/* ------------------------------
   App State
--------------------------------*/
let datasets = [];
let personas = [];
let wishlist = new Set(JSON.parse(localStorage.getItem("wishlist") || "[]"));
let activePersona = localStorage.getItem("persona") || null;

/* ------------------------------
   Init
--------------------------------*/
window.onload = async () => {
  datasets = await loadJSON("./datasets.json");
  personas = await loadJSON("./personas.json");

  initTabs();
  loadTab("dashboard");
};

/* ------------------------------
   TABS
--------------------------------*/
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelector(".tab-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      loadTab(btn.dataset.tab);
    };
  });
}

function loadTab(tab) {
  const c = document.getElementById("content");
  c.innerHTML = "";

  if (tab === "dashboard") renderDashboard(c);
  if (tab === "favorites") renderWishlist(c);
  if (tab === "personas") renderPersonas(c);
  if (tab === "settings") renderSettings(c);
}

/* ------------------------------
   DASHBOARD
--------------------------------*/
function renderDashboard(c) {
  datasets.forEach((d) => {
    const card = document.createElement("div");
    card.className = "dataset-card cosmic-border";

    card.innerHTML = `
      <h3>${d.name}</h3>
      <p>${d.short}</p>
    `;

    const btnMore = createButton("More", () => openDatasetModal(d));
    const btnWish = createButton(wishlist.has(d.id) ? "★" : "☆", () =>
      toggleWishlist(d.id)
    );

    card.append(btnMore, btnWish);
    c.appendChild(card);
  });
}

/* ------------------------------
   WISHLIST
--------------------------------*/
function renderWishlist(c) {
  const items = datasets.filter((d) => wishlist.has(d.id));

  if (items.length === 0) {
    c.innerHTML = "<p>No favorites yet. Add some from the Dashboard!</p>";
    return;
  }

  items.forEach((d) => {
    const card = document.createElement("div");
    card.className = "dataset-card cosmic-border";
    card.innerHTML = `<h3>${d.name}</h3><p>${d.short}</p>`;
    card.append(createButton("Open", () => openDatasetModal(d)));
    c.appendChild(card);
  });
}

/* ------------------------------
   PERSONAS
--------------------------------*/
function renderPersonas(c) {
  personas.forEach((p) => {
    const card = document.createElement("div");
    card.className = "persona-card cosmic-border";

    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.story}</p>
    `;

    const btn = createButton(p.id === activePersona ? "Selected" : "Select", () =>
      selectPersona(p.id)
    );

    card.append(btn);
    c.appendChild(card);
  });
}

function selectPersona(id) {
  activePersona = id;
  localStorage.setItem("persona", id);
  loadTab("personas");
}

/* ------------------------------
   SETTINGS
--------------------------------*/
function renderSettings(c) {
  c.innerHTML = `
    <h2>Settings</h2>
    <p>Additional UI settings, theme toggles, future features…</p>
  `;
}

/* ------------------------------
   Wishlist Toggle
--------------------------------*/
function toggleWishlist(id) {
  if (wishlist.has(id)) wishlist.delete(id);
  else wishlist.add(id);

  localStorage.setItem("wishlist", JSON.stringify(Array.from(wishlist)));
  loadTab("dashboard");
}

/* ------------------------------
   MODAL
--------------------------------*/
function openDatasetModal(d) {
  const modal = document.createElement("div");
  modal.className = "modal cosmic-border";
  modal.style.padding = "20px";
  modal.style.background = "rgba(22, 32, 45, 0.9)";

  modal.innerHTML = `
    <h2>${d.name}</h2>
    <p>${d.description}</p>
    <p><b>Source:</b> ${d.source}</p>
    <br><button id="btn-open-sosx">Open in SOSX</button>
    <br><br>
    <button id="close-modal">Close</button>
  `;

  document.body.append(modal);

  document.getElementById("close-modal").onclick = () => modal.remove();

  document.getElementById("btn-open-sosx").onclick = () => {
    // 🔧 SOSX integration hook:
    // window.SOSX.openDataset(d.id)
    modal.remove();
  };
}

/* ------------------------------
   Helper: Cosmic buttons
--------------------------------*/
function createButton(text, fn) {
  const b = document.createElement("button");
  b.className = "cosmic-button";
  b.innerText = text;
  b.onclick = fn;
  return b;
}
