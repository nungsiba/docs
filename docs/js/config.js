// ============================================================
// DOCSAVER — Supabase project configuration
// Fill these in with YOUR project's values:
// Supabase Dashboard → Project Settings → API
// ============================================================
window.DOCSAVER_CONFIG = {
  SUPABASE_URL: "https://qnasurbqetrmzrahsiub.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYXN1cmJxZXRybXpyYWhzaXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDY0OTksImV4cCI6MjEwNTEyMjQ5OX0.CscHlMwKkPOubcoNIeAXVGoS3CSuJUIDzjO0rAxZG7g",

  // The fixed domain used to turn a family UID into a real
  // Supabase Auth email under the hood (family members never
  // see or type this — they only use their UID).
  AUTH_EMAIL_DOMAIN: "docsaver.local",

  // Admin's special login (used only on the login screen's
  // "Admin login" tab — not a UID).
  ADMIN_EMAIL: "admin@docsaver.local"
};
