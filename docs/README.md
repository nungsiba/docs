# DOCSAVER

A private document vault for your family — Aadhaar, PAN, driving licence, ATM/debit card, bank passbook, birth certificate, and passport — stored as PDFs, viewable, downloadable, and printable from any phone or computer.

## What this is built on

- **Frontend:** plain HTML/CSS/JS (no build step, no framework)
- **Backend:** Supabase (Postgres database, Auth, Storage, one Edge Function)
- **Hosting:** GitHub Pages

## Decisions made for your family (recap)

- Any signed-in family member can view any other member's profile and documents (fully open, as you chose).
- ATM/debit cards store only the **last 4 digits** as text; the full number only appears in the uploaded photo.
- Family passwords are permanent and follow the fixed pattern `[UID]@123`. The admin panel computes and displays this for every user rather than storing a separate readable copy of anyone's password — the *result* is the same (admin can always state anyone's password), but there's no extra plaintext password sitting in the database to leak.
- The admin's login uses a fixed password (`7628@123`) entered on a separate "Admin login" tab, not a UID.

## Supabase setup — already done for you

A dedicated Supabase project called **DOCSAVER** (region: ap-south-1, Mumbai) has been created on your account and fully configured:

- ✅ Database schema applied (`users`, `documents` tables + Row Level Security policies)
- ✅ Private `documents` storage bucket created
- ✅ Admin login created — sign in with the "Admin login" tab using password `7628@123`
- ✅ `admin-actions` Edge Function deployed (lets the admin create family logins and reset passwords securely)
- ✅ `js/config.js` in this folder already has the real project URL and key filled in
- ✅ Ran a security check (Supabase's advisor tool) and hardened the two functions it flagged

**One manual toggle left, since it isn't available through automation:** in the Supabase Dashboard → Authentication → Policies/Settings → Password, turn on **"Leaked password protection"**. It checks new passwords against known breached-password lists — a good extra layer, though with your fixed `uid@123` password scheme its main value is for the admin account itself.

If you ever need the project again: it's called **DOCSAVER** in your Supabase organization, project ref `qnasurbqetrmzrahsiub`.

### Put it on GitHub Pages
1. Create a new GitHub repo and push this whole folder to it.
2. Repo → Settings → Pages → Source: deploy from the `main` branch, root folder.
3. Your family site will be live at `https://your-username.github.io/your-repo-name/`.

## Day-to-day use

- **Admin** signs in via the "Admin login" tab with `7628@123`, then uses the Admin page to add each family member (name, phone, DOB, address). DOCSAVER generates their User ID and password automatically (`uid` / `uid@123`) and shows it once — write it down for them.
- **Family members** sign in with their User ID and password, then from Documents pick a person (the family strip at the top) and a document type, and either upload a photo of the document or type in its details to generate a clean PDF.
- Every document can be downloaded or printed straight from its page.

## If something needs fixing later

- **Add a new document type:** edit the `DOC_TYPES` object in `js/docTypes.js` and the `check` constraint on `doc_type` in `schema.sql`.
- **Change who can see what:** the visibility rule lives in the Row Level Security policies in `schema.sql` (`documents_select_all` / `users_select_all`) — tightening it later (e.g. to admin-only, or opt-in sharing) is a policy change, not a rebuild.
- **Rotate the admin password:** change it directly in Supabase Dashboard → Authentication → Users → admin → Reset password.
