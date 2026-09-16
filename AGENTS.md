# AGENTS.md — SI GEPENG

Aturan permanen untuk agent yang bekerja di repo ini. Baca sebelum menyentuh UI.

## Proyek
- SI GEPENG (Sistem Informasi Cek Penerimaan) — Next.js 16 (App Router, Turbopack), React, Ant Design 6.1.4 (hanya dashboard), mssql.
- UI dan commit message: bahasa Indonesia.

## Hard rules (instruksi owner, jangan dilanggar)
1. **Jangan sentuh backend** — `src/app/api/**` dan logika bisnis di `src/lib/**` off-limits. Perubahan UI/UX saja.
2. **Login tidak boleh pakai AntD** — form native HTML murni React (`src/components/Login.tsx`).
3. **Dark mode hapus total** — jangan pernah reintroduksi `.theme-dark` atau token gelap.
4. **Icon: Material Design saja** via `react-icons/md`, selalu import dari mapping `src/components/md-icons.tsx` (alias sama dengan nama icon AntD lama). Jangan tambah `@ant-design/icons`.
5. **Logo login** = `public/logo-saweria.png` (landscape 600×357), ditampilkan tanpa border.

## Design system: NEOBRUTALISM (login + dashboard, satu sistem)
Token hidup di `:root` (globals.css) — selalu pakai `var(--*)`, jangan hex literal di rule CSS:
- Warna: paper `#f6f1e4`, ink `#141414`, surface `#ffffff`, accent kuning `#FFD23F`, danger `#D61F1F` (deep `#b81a1a`).
- Border: 2px ink (kartu login 3px). Hard offset shadow TANPA blur: kartu 6–8px, input 3px, modal 10px, tombol 3px (hover lebih dalam, active 0–1px).
- Radius: kartu 12px, kontrol 10px, chip 8px, modal 14px.
- Font: Space Grotesk (body), Archivo Black (display), Inter (fallback).
- TANPA gradient, TANPA blur, SATU aksen (kuning).

## Strategi CSS (AntD v6)
- CSS-in-JS AntD di-inject SETELAH globals.css → semua override AntD wajib `!important`.
- Urutan globals.css: `:root` tokens → blok login → override AntD → addendum → mobile (≤768/≤480px) → `prefers-reduced-motion`.
- Jaga specificity: rule khusus (mis. `.ant-btn-dangerous.ant-btn-primary`) harus menang atas rule generik yang lebih rendah di file — cek konflik sebelum menambah rule tombol/modal.

## Aksesibilitas (floor, jangan turun)
- Kontras teks ≥ 4.5:1 — hitung sebelum commit warna baru.
- Tap target ≥ 44px di mobile.
- Form: `label[htmlFor]`, error field wajib `aria-invalid` + `aria-describedby` + `role="alert"`, `aria-busy` saat loading, landmark `<main>`.
- Button icon-only wajib `aria-label` (+ `aria-pressed` jika toggle).
- Motion ≤ 100ms, selalu ada fallback `prefers-reduced-motion`.
- Tabel fixed-layout (semua kolom punya `width` + `scroll.x`): JANGAN `white-space: nowrap` di sel body (menyebabkan teks bertumpuk antar kolom) — pakai `overflow-wrap: anywhere`.

## Verifikasi (environment tanpa browser)
1. `npx tsc --noEmit` bersih + `npm run build` ✓ setelah setiap perubahan.
2. Prod server di :3000 (`npm run start`) — setelah rebuild, **restart server dulu** sebelum cek.
3. QA visual = inspect CSS yang di-serve (curl HTML → ambil URL `.css` → grep rule), bukan screenshot.
4. Simpan laporan audit/fix di `anti-slop/` (nama: `audit-NNN-tanggal.md`, `fix-NNN-tanggal.md`).

## Peta file
- `src/app/globals.css` — seluruh design system + override AntD + mobile.
- `src/components/md-icons.tsx` — mapping icon Material Design (alias lama AntD).
- `src/app/layout.tsx` — font, viewport (`viewportFit: cover`), preload logo.
- `.env` — kredensial DB, **gitignored, jangan pernah di-commit**.
- `anti-slop/` — riwayat audit & fix.
