// ============================================================
// DOCSAVER — dashboard logic
// Everyone in the family can browse everyone else's documents
// (fully-open visibility, as configured). The family strip lets
// you switch whose document set you're looking at.
// ============================================================

let currentProfile = null;
let allFamily = [];
let viewingUserId = null;

async function init() {
  currentProfile = await renderHeader("dashboard.html");
  if (!currentProfile) return;

  const { data: users, error } = await sb
    .from("users")
    .select("id, uid, name, role")
    .order("name");
  if (error) {
    console.error(error);
    return;
  }
  allFamily = users;

  const params = new URLSearchParams(window.location.search);
  viewingUserId = params.get("as") || currentProfile.id;

  renderFamilyStrip();
  await renderDocGrid();
}

function renderFamilyStrip() {
  const strip = document.getElementById("family-strip");
  strip.innerHTML = allFamily
    .map((u) => {
      const isMe = u.id === currentProfile.id;
      const active = u.id === viewingUserId;
      return `<button class="family-chip ${active ? "active" : ""}" data-id="${u.id}">
        ${u.name}${isMe ? " (you)" : ""}
      </button>`;
    })
    .join("");

  strip.querySelectorAll(".family-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewingUserId = btn.dataset.id;
      const url = new URL(window.location.href);
      url.searchParams.set("as", viewingUserId);
      window.history.replaceState({}, "", url);
      renderFamilyStrip();
      renderDocGrid();
    });
  });
}

async function renderDocGrid() {
  const viewingUser = allFamily.find((u) => u.id === viewingUserId);
  document.getElementById("viewing-heading").textContent =
    viewingUser.id === currentProfile.id ? "Your documents" : `${viewingUser.name}'s documents`;
  document.getElementById("viewing-subheading").textContent =
    "Tap a document type to view, add, or edit it.";

  const { data: docs, error } = await sb
    .from("documents")
    .select("id, doc_type")
    .eq("owner_id", viewingUserId);
  if (error) console.error(error);

  const present = new Set((docs || []).map((d) => d.doc_type));

  const grid = document.getElementById("doc-grid");
  grid.innerHTML = DOC_TYPE_ORDER.map((key) => {
    const type = DOC_TYPES[key];
    const has = present.has(key);
    return `
      <a class="doc-card" href="document.html?owner=${viewingUserId}&type=${key}">
        <span class="doc-icon">${type.icon}</span>
        <h3>${type.label}</h3>
        <span class="doc-status ${has ? "present" : "missing"}">
          ${has ? "On file" : "Not added yet"}
        </span>
      </a>`;
  }).join("");
}

init();
