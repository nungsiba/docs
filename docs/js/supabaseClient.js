// ============================================================
// DOCSAVER — Supabase client + shared session/auth helpers
// ============================================================

const { createClient } = supabase;
const sb = createClient(
  window.DOCSAVER_CONFIG.SUPABASE_URL,
  window.DOCSAVER_CONFIG.SUPABASE_ANON_KEY
);

// UID -> synthetic auth email (family members log in with a
// plain UID; Supabase Auth needs an email under the hood).
function uidToEmail(uid) {
  return `${uid.trim().toLowerCase()}@${window.DOCSAVER_CONFIG.AUTH_EMAIL_DOMAIN}`;
}

// Redirect helper: send a signed-out visitor back to login.
async function requireSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

// Fetch the current user's row from public.users (profile info + role).
async function getCurrentProfile() {
  const session = await requireSession();
  if (!session) return null;
  const { data, error } = await sb
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) {
    console.error("Could not load profile:", error);
    return null;
  }
  return data;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = "index.html";
}

// Renders the shared header (brand, nav, who-am-i, sign out)
// into any element with id="app-header".
async function renderHeader(activePage) {
  const el = document.getElementById("app-header");
  if (!el) return;
  const profile = await getCurrentProfile();
  if (!profile) return;

  const navLinks = [
    { href: "dashboard.html", label: "Documents" },
    { href: "profile.html", label: "Profile" }
  ];
  if (profile.role === "admin") {
    navLinks.push({ href: "admin.html", label: "Admin" });
  }

  el.innerHTML = `
    <a class="brand" href="dashboard.html">
      <span class="mark">D</span> DOCSAVER
    </a>
    <div class="header-nav">
      ${navLinks
        .map(
          (l) =>
            `<a href="${l.href}" class="${activePage === l.href ? "active" : ""}">${l.label}</a>`
        )
        .join("")}
      <span class="who-am-i">${profile.name} (${profile.uid})</span>
      <button class="btn btn-outline btn-sm" id="sign-out-btn">Sign out</button>
    </div>
  `;
  document.getElementById("sign-out-btn").addEventListener("click", signOut);
  return profile;
}
