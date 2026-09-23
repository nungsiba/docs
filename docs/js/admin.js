// ============================================================
// DOCSAVER — admin panel logic
//
// Note on passwords: every family login follows the fixed
// formula [UID]@123, so the admin (and the table below) can
// always compute what it is without DOCSAVER having to store
// a readable copy of anyone's actual password. Account creation
// and password resets run through the "admin-actions" Supabase
// Edge Function, which is the only part of the system trusted
// with elevated (service role) access.
// ============================================================

let currentProfile = null;

function showMsg(text, kind = "error") {
  document.getElementById("msg-slot").innerHTML =
    `<div class="${kind === "error" ? "error-msg" : "success-msg"}">${text}</div>`;
}

function computedPassword(uid) {
  return `${uid}@123`;
}

async function init() {
  currentProfile = await renderHeader("admin.html");
  if (!currentProfile) return;

  if (currentProfile.role !== "admin") {
    document.querySelector(".main").innerHTML =
      `<div class="empty-state"><p>This page is for the family admin only.</p></div>`;
    return;
  }

  await loadUsers();
  document.getElementById("create-form").addEventListener("submit", onCreate);
}

async function callAdminAction(payload) {
  const { data: { session } } = await sb.auth.getSession();
  const { data, error } = await sb.functions.invoke("admin-actions", {
    body: payload,
    headers: { Authorization: `Bearer ${session.access_token}` }
  });
  if (error) throw new Error(error.message || "Request failed.");
  if (data && data.error) throw new Error(data.error);
  return data;
}

async function onCreate(e) {
  e.preventDefault();
  const name = document.getElementById("c-name").value.trim();
  const phone_number = document.getElementById("c-phone").value.trim();
  const dob = document.getElementById("c-dob").value;
  const address = document.getElementById("c-address").value.trim();

  try {
    const result = await callAdminAction({ action: "create_user", name, phone_number, dob, address });
    showMsg(
      `Created login for ${name} — User ID: ${result.uid}, Password: ${result.password}`,
      "success"
    );
    document.getElementById("create-form").reset();
    await loadUsers();
  } catch (err) {
    showMsg("Could not create the login: " + err.message +
      " (Have you deployed the admin-actions Edge Function? See README.)");
  }
}

async function loadUsers() {
  const { data: users, error } = await sb.from("users").select("*").order("created_at");
  if (error) {
    showMsg("Could not load family members: " + error.message);
    return;
  }

  const tbody = document.getElementById("users-table-body");
  tbody.innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u.name}</td>
      <td>${u.uid}</td>
      <td>${computedPassword(u.uid)}</td>
      <td>${u.role}</td>
      <td class="table-actions">
        <a class="btn btn-outline btn-sm" href="profile.html?id=${u.id}">Edit</a>
        <a class="btn btn-outline btn-sm" href="dashboard.html?as=${u.id}">Documents</a>
        ${u.role !== "admin" ? `<button class="btn btn-outline btn-sm" data-reset="${u.id}">Reset password</button>` : ""}
        ${u.role !== "admin" ? `<button class="btn btn-danger btn-sm" data-delete="${u.id}" data-name="${u.name}">Delete</button>` : ""}
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-reset]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const result = await callAdminAction({ action: "reset_password", user_id: btn.dataset.reset });
        showMsg(`Password reset to: ${result.password}`, "success");
      } catch (err) {
        showMsg("Could not reset password: " + err.message);
      }
    });
  });

  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.dataset.name;
      const sure = confirm(
        `Delete ${name}'s login and ALL of their documents? This can't be undone.`
      );
      if (!sure) return;
      try {
        await callAdminAction({ action: "delete_user", user_id: btn.dataset.delete });
        showMsg(`${name}'s login and documents were deleted.`, "success");
        await loadUsers();
      } catch (err) {
        showMsg("Could not delete: " + err.message);
      }
    });
  });
}

init();
