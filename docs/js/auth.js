// ============================================================
// DOCSAVER — login page logic
// ============================================================

const msgSlot = document.getElementById("msg-slot");
const familyForm = document.getElementById("family-login-form");
const adminForm = document.getElementById("admin-login-form");
const toggleToAdmin = document.getElementById("toggle-to-admin");
const toggleToFamily = document.getElementById("toggle-to-family");
const toggleToFamilyWrap = document.getElementById("toggle-to-family-wrap");

function showError(text) {
  msgSlot.innerHTML = `<div class="error-msg">${text}</div>`;
}
function clearMsg() {
  msgSlot.innerHTML = "";
}

// If already signed in, skip straight to the dashboard.
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) window.location.href = "dashboard.html";
})();

toggleToAdmin.addEventListener("click", () => {
  familyForm.classList.add("hidden");
  adminForm.classList.remove("hidden");
  toggleToAdmin.classList.add("hidden");
  toggleToFamilyWrap.classList.remove("hidden");
  clearMsg();
});

toggleToFamily.addEventListener("click", () => {
  adminForm.classList.add("hidden");
  familyForm.classList.remove("hidden");
  toggleToAdmin.classList.remove("hidden");
  toggleToFamilyWrap.classList.add("hidden");
  clearMsg();
});

familyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();
  const uid = document.getElementById("uid").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await sb.auth.signInWithPassword({
    email: uidToEmail(uid),
    password
  });

  if (error) {
    showError("That User ID or password isn't right. Please try again.");
    return;
  }
  window.location.href = "dashboard.html";
});

adminForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg();
  const password = document.getElementById("admin-password").value;

  const { error } = await sb.auth.signInWithPassword({
    email: window.DOCSAVER_CONFIG.ADMIN_EMAIL,
    password
  });

  if (error) {
    showError("Incorrect admin password.");
    return;
  }
  window.location.href = "dashboard.html";
});
