// ============================================================
// DOCSAVER — profile page logic
// Anyone can view any profile (open visibility). Only the
// profile's owner or an admin can save changes to it.
// ============================================================

let currentProfile = null;
let viewingId = null;
let allFamily = [];

async function init() {
  currentProfile = await renderHeader("profile.html");
  if (!currentProfile) return;

  const { data: users } = await sb.from("users").select("id, uid, name, role").order("name");
  allFamily = users || [];

  const params = new URLSearchParams(window.location.search);
  viewingId = params.get("id") || currentProfile.id;

  renderFamilyStrip();
  await loadProfile();

  document.getElementById("profile-form").addEventListener("submit", onSave);
}

function renderFamilyStrip() {
  const strip = document.getElementById("family-strip");
  strip.innerHTML = allFamily
    .map((u) => `<button class="family-chip ${u.id === viewingId ? "active" : ""}" data-id="${u.id}">
      ${u.name}${u.id === currentProfile.id ? " (you)" : ""}
    </button>`)
    .join("");
  strip.querySelectorAll(".family-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewingId = btn.dataset.id;
      const url = new URL(window.location.href);
      url.searchParams.set("id", viewingId);
      window.history.replaceState({}, "", url);
      renderFamilyStrip();
      loadProfile();
    });
  });
}

async function loadProfile() {
  const { data, error } = await sb.from("users").select("*").eq("id", viewingId).single();
  if (error || !data) return;

  document.getElementById("p-uid").value = data.uid;
  document.getElementById("p-name").value = data.name || "";
  document.getElementById("p-phone").value = data.phone_number || "";
  document.getElementById("p-dob").value = data.dob || "";
  document.getElementById("p-address").value = data.address || "";

  const canEdit = currentProfile.id === viewingId || currentProfile.role === "admin";
  ["p-name", "p-phone", "p-dob", "p-address"].forEach((id) => {
    document.getElementById(id).disabled = !canEdit;
  });
  document.getElementById("save-btn").classList.toggle("hidden", !canEdit);
  document.getElementById("readonly-note").textContent = canEdit
    ? ""
    : "Only this person or an admin can edit this profile.";
}

async function onSave(e) {
  e.preventDefault();
  const { error } = await sb
    .from("users")
    .update({
      name: document.getElementById("p-name").value,
      phone_number: document.getElementById("p-phone").value,
      dob: document.getElementById("p-dob").value || null,
      address: document.getElementById("p-address").value
    })
    .eq("id", viewingId);

  const slot = document.getElementById("msg-slot");
  slot.innerHTML = error
    ? `<div class="error-msg">Could not save: ${error.message}</div>`
    : `<div class="success-msg">Profile updated.</div>`;
}

init();
