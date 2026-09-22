// ============================================================
// DOCSAVER — admin-actions Edge Function
//
// Why this exists: creating a login for a new family member, or
// resetting someone's password, needs Supabase's service_role
// key. That key must NEVER be shipped in the frontend JS (it
// would let anyone in the world take over the whole database).
// This function holds that key server-side, and only acts after
// checking the caller is signed in AND has role = 'admin'.
//
// Deploy with the Supabase CLI:
//   supabase functions deploy admin-actions
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically to edge functions by Supabase — no need to set
// them yourself.)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_EMAIL_DOMAIN = "docsaver.local";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const callerToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client scoped to the caller's own token, just to verify who they are.
    const callerClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } }
    });
    const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerUser) {
      return json({ error: "Not signed in." }, 401);
    }

    // Admin client with full privileges, used only after the admin check below.
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerProfile } = await admin
      .from("users")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return json({ error: "Only an admin can do this." }, 403);
    }

    const body = await req.json();

    if (body.action === "create_user") {
      const { name, phone_number, dob, address } = body;
      if (!name) return json({ error: "Name is required." }, 400);

      const uid = await makeUniqueUid(admin, name);
      const email = `${uid}@${AUTH_EMAIL_DOMAIN}`;
      const password = `${uid}@123`;

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if (createErr) return json({ error: createErr.message }, 400);

      const { error: profileErr } = await admin.from("users").insert({
        id: created.user.id,
        uid,
        name,
        phone_number: phone_number || null,
        dob: dob || null,
        address: address || null,
        role: "user",
        created_by: callerUser.id
      });
      if (profileErr) return json({ error: profileErr.message }, 400);

      return json({ uid, password });
    }

    if (body.action === "reset_password") {
      const { user_id } = body;
      const { data: targetProfile } = await admin
        .from("users")
        .select("uid")
        .eq("id", user_id)
        .single();
      if (!targetProfile) return json({ error: "User not found." }, 404);

      const newPassword = `${targetProfile.uid}@123`;
      const { error: resetErr } = await admin.auth.admin.updateUserById(user_id, {
        password: newPassword
      });
      if (resetErr) return json({ error: resetErr.message }, 400);

      return json({ password: newPassword });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function makeUniqueUid(admin, name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "member";
  let candidate = base;
  let n = 1;
  while (true) {
    const { data } = await admin.from("users").select("id").eq("uid", candidate).maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}${n}`;
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
