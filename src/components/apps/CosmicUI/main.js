/* ------------------------------
   JSON Loader
--------------------------------*/
const loadJSON = async (file) => (await fetch(file)).json();

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

  setupTabs();
  loadTab("dashboard");
};

/* ------------------------------
   Tabs
--------------------------------*/
function setupTabs() {
  const allButtons = [
    ...document.querySelectorAll(".tab-btn"),
    ...document.querySelectorAll("#mobile-nav button")
  ];

  allButtons.forEach((btn) => {
    btn.onclick = () => {
      document.querySelector(".tab-btn.active")?.classList.remove("active");

      const topMatch = document.querySelector(`#top-nav [data-tab="${btn.dataset.tab}"]`);
      if (topMatch) topMatch.classList.add("active");

      loadTab(btn.dataset.tab);
    };
  });
}

function loadTab(tab) {
  const c = document.querySelector("#content");
  c.innerHTML = "";

  if (tab === "dashboard") renderDashboard(c);
  if (tab === "favorites") renderWishlist(c);
  if (tab === "personas") renderPersonas(c);
  if (tab === "settings") renderSettings(c);
}

/* ------------------------------
   Dashboard
--------------------------------*/
function renderDashboard(c) {
  datasets.forEach((d) => {
    const card = document.createElement("div");
    card.className = "dataset-card cosmic-border";

    card.innerHTML = `
      <h3>${d.name}</h3>
      <p>${d.short}</p>
    `;

    card.append(
      createButton("More", () => openDatasetModal(d)),
      createButton(wishlist.has(d.id) ? "★" : "☆", () => toggleWishlist(d.id))
    );

    c.append(card);
  });
}

/* ------------------------------
   Wishlist
--------------------------------*/
function renderWishlist(c) {
  const items = datasets.filter((d) => wishlist.has(d.id));

  if (!items.length) {
    c.innerHTML = "<p>No favorites yet. Add some from the Dashboard!</p>";
    return;
  }

  items.forEach((d) => {
    const card = document.createElement("div");
    card.className = "dataset-card cosmic-border";

    card.innerHTML = `<h3>${d.name}</h3><p>${d.short}</p>`;

    card.append(createButton("Open", () => openDatasetModal(d)));
    c.append(card);
  });
}

/* ------------------------------
   Personas
--------------------------------*/
function renderPersonas(c) {
  personas.forEach((p) => {
    const card = document.createElement("div");
    card.className = "persona-card cosmic-border";

    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.story}</p>
    `;

    card.append(
      createButton(p.id === activePersona ? "Selected" : "Select", () =>
        selectPersona(p.id)
      )
    );

    c.append(card);
  });
}

function selectPersona(id) {
  activePersona = id;
  localStorage.setItem("persona", id);
  loadTab("personas");
}

/* ------------------------------
   Settings
--------------------------------*/
function renderSettings(c) {
  c.innerHTML = `
    <h2>Settings</h2>
    <p>Coming soon: themes, profile, sync.</p>
  `;
}

/* ------------------------------
   Wishlist Toggle
--------------------------------*/
function toggleWishlist(id) {
  wishlist.has(id) ? wishlist.delete(id) : wishlist.add(id);
  localStorage.setItem("wishlist", JSON.stringify([...wishlist]));
  loadTab("dashboard");
}

/* ------------------------------
   Modal
--------------------------------*/
function openDatasetModal(d) {
  const overlay = document.createElement("div");
  overlay.className = "cosmic-modal";
  overlay.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  `;

  const box = document.createElement("div");
  box.className = "cosmic-border";
  box.style = `
    background: #0e1a26;
    padding: 24px;
    width: 90%;
    max-width: 480px;
  `;

  box.innerHTML = `
    <h2>${d.name}</h2>
    <p>${d.description}</p>
    <p><b>Source:</b> ${d.source}</p>
    <br>
  `;

  const openBtn = createButton("Open in SOSX", () => {
    // 🔥 SOSX HOOK:
    // window.SOSX.openDataset(d.id);
    overlay.remove();
  });

  const closeBtn = createButton("Close", () => overlay.remove());

  box.append(openBtn, closeBtn);
  overlay.append(box);
  document.body.append(overlay);
}

/* ------------------------------
   Helper: Cosmic Button
--------------------------------*/
function createButton(text, action) {
  const b = document.createElement("button");
  b.className = "cosmic-button";
  b.textContent = text;
  b.onclick = action;
  return b;
}
