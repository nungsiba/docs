// ============================================================
// DOCSAVER — single document page logic
// ============================================================

let currentProfile = null;
let ownerProfile = null;
let docTypeKey = null;
let existingDoc = null;
let canEdit = false;

const params = new URLSearchParams(window.location.search);
const ownerId = params.get("owner");
docTypeKey = params.get("type");

function showMsg(text, kind = "error") {
  document.getElementById("msg-slot").innerHTML =
    `<div class="${kind === "error" ? "error-msg" : "success-msg"}">${text}</div>`;
}

async function init() {
  currentProfile = await renderHeader(null);
  if (!currentProfile) return;

  if (!DOC_TYPES[docTypeKey] || !ownerId) {
    document.getElementById("doc-heading").textContent = "Document not found";
    return;
  }

  const { data: owner, error: ownerErr } = await sb
    .from("users")
    .select("*")
    .eq("id", ownerId)
    .single();
  if (ownerErr || !owner) {
    document.getElementById("doc-heading").textContent = "Document not found";
    return;
  }
  ownerProfile = owner;
  canEdit = currentProfile.id === ownerProfile.id || currentProfile.role === "admin";

  const type = DOC_TYPES[docTypeKey];
  document.getElementById("doc-heading").textContent = type.label;
  document.getElementById("doc-subheading").textContent =
    ownerProfile.id === currentProfile.id
      ? "Your document"
      : `Belongs to ${ownerProfile.name}`;

  const { data: doc } = await sb
    .from("documents")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("doc_type", docTypeKey)
    .maybeSingle();
  existingDoc = doc || null;

  if (existingDoc) {
    await showViewMode();
  } else if (canEdit) {
    showEditMode();
  } else {
    document.getElementById("no-access").classList.remove("hidden");
  }
}

// ---------------- VIEW MODE ----------------

async function showViewMode() {
  document.getElementById("view-mode").classList.remove("hidden");

  const { data: signed, error } = await sb.storage
    .from("documents")
    .createSignedUrl(existingDoc.file_path, 3600);
  if (error) {
    showMsg("Could not load the file. It may have been removed.");
    return;
  }

  const frame = document.getElementById("preview-frame");
  frame.src = signed.signedUrl;

  const dl = document.getElementById("download-link");
  dl.href = signed.signedUrl;
  dl.setAttribute("download", `${docTypeKey}.pdf`);

  document.getElementById("print-btn").addEventListener("click", () => {
    const w = window.open(signed.signedUrl, "_blank");
    if (w) w.addEventListener("load", () => w.print());
  });

  const editBtn = document.getElementById("edit-btn");
  if (canEdit) {
    editBtn.addEventListener("click", () => {
      document.getElementById("view-mode").classList.add("hidden");
      showEditMode();
    });
  } else {
    editBtn.remove();
  }
}

// ---------------- EDIT MODE ----------------

function showEditMode() {
  document.getElementById("edit-mode").classList.remove("hidden");
  buildFieldsForm();
  wireTabs();
  wireUploadSave();
  wireTypeSave();
}

function wireTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-upload").classList.toggle("hidden", btn.dataset.tab !== "upload");
      document.getElementById("tab-type").classList.toggle("hidden", btn.dataset.tab !== "type");
    });
  });
}

function buildFieldsForm() {
  const type = DOC_TYPES[docTypeKey];
  const form = document.getElementById("fields-form");
  const existingFields = (existingDoc && existingDoc.fields) || {};

  form.innerHTML = type.fields
    .map((f) => {
      if (f.kind === "select") {
        return `<div class="field">
          <label for="f-${f.key}">${f.label}</label>
          <select id="f-${f.key}">
            <option value=""></option>
            ${f.options.map((o) => `<option ${existingFields[f.key] === o ? "selected" : ""}>${o}</option>`).join("")}
          </select>
        </div>`;
      }
      if (f.kind === "photo" || f.kind === "signature") {
        return `<div class="field">
          <label for="f-${f.key}">${f.label}</label>
          <input type="file" id="f-${f.key}" accept="image/*" />
        </div>`;
      }
      const inputType = f.kind === "date" ? "date" : "text";
      return `<div class="field">
        <label for="f-${f.key}">${f.label}</label>
        <input type="${inputType}" id="f-${f.key}" value="${existingFields[f.key] || ""}"
          ${f.maxLength ? `maxlength="${f.maxLength}"` : ""} />
        ${f.hint ? `<p class="field-hint">${f.hint}</p>` : ""}
      </div>`;
    })
    .join("");
}

async function saveDocument(blob, sourceType, fields) {
  const path = `${ownerId}/${docTypeKey}.pdf`;
  const { error: uploadErr } = await sb.storage
    .from("documents")
    .upload(path, blob, { upsert: true, contentType: "application/pdf" });
  if (uploadErr) {
    showMsg("Could not save the file: " + uploadErr.message);
    return false;
  }

  const row = {
    owner_id: ownerId,
    doc_type: docTypeKey,
    source_type: sourceType,
    file_path: path,
    fields: fields || {}
  };

  const { error: dbErr } = existingDoc
    ? await sb.from("documents").update(row).eq("id", existingDoc.id)
    : await sb.from("documents").insert(row);

  if (dbErr) {
    showMsg("Saved the file but could not update the record: " + dbErr.message);
    return false;
  }
  return true;
}

function wireUploadSave() {
  document.getElementById("upload-save-btn").addEventListener("click", async () => {
    const input = document.getElementById("file-input");
    if (!input.files.length) {
      showMsg("Please choose an image first.");
      return;
    }
    showMsg("Saving…", "success");
    const blob = await imageFileToPdfBlob(input.files[0]);
    const ok = await saveDocument(blob, "uploaded_file", {});
    if (ok) window.location.reload();
  });
}

function wireTypeSave() {
  document.getElementById("type-save-btn").addEventListener("click", async () => {
    const type = DOC_TYPES[docTypeKey];
    const values = { __images: {} };

    for (const f of type.fields) {
      const el = document.getElementById(`f-${f.key}`);
      if (f.kind === "photo" || f.kind === "signature") {
        if (el.files.length) {
          values.__images[f.key] = await fileToDataUrl(el.files[0]);
        }
      } else {
        values[f.key] = el.value;
      }
    }

    showMsg("Generating PDF…", "success");
    const blob = await fieldsToPdfBlob(docTypeKey, values);
    delete values.__images; // don't store raw image data in the DB row
    const ok = await saveDocument(blob, "generated_pdf", values);
    if (ok) window.location.reload();
  });
}

init();
