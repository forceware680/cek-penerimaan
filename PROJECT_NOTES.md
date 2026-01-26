# PROJECT NOTES - SI GEPENG Cek Penerimaan

> **Catatan Perkembangan Proyek untuk AI Assistant**
> 
> File ini berisi konteks dan catatan penting tentang proyek ini agar memudahkan pemahaman di sesi mendatang.

---

## 📋 Ringkasan Proyek

**Nama**: SI GEPENG - Cek Penerimaan  
**Tanggal Pembuatan**: 6 Januari 2026  
**Framework**: Next.js 14+ (App Router)  
**Database**: SQL Server 2008  
**Platform Target**: Vercel (100% serverless compatible)

---

## 🎯 Tujuan Proyek

Proyek ini adalah **remake** dari aplikasi lama yang menggunakan:
- Backend: Flask (Python) 
- Frontend: React (terpisah di folder `web-project/`)
- Database connector: `pyodbc`

Dikonversi menjadi:
- Full Next.js 14+ App Router
- Database connector: `mssql` (pure JavaScript, serverless-compatible)
- Single project yang bisa langsung deploy ke Vercel

---

## ✅ Fitur yang Tersedia

### 1. Authentication
- Login dengan username/password
- JWT token disimpan di httpOnly cookie
- Mendukung role ADMIN dan USER biasa
- USER biasa memiliki filter prefix yang membatasi data yang bisa diakses

### 2. Cek Saldo Penerimaan (Menu Utama)
- Tabel data penerimaan dengan pagination, sorting, filtering
- **Tarik Jenis Data**:
  - Saldo Awal
  - Saldo Tahun Lalu
  - Saldo Lain-lain
  - Saldo Berjalan
  - Sisa Stock (Stock Opname Insert)
- **Export Excel** - Export data ke format .xlsx
- **Empty Table** - Hapus semua data dari tabel temporary
- **Rekap** - Modal yang menampilkan summary (total records, barang, saldo, dll)

### 3. UI/UX
- Dark/Light Mode toggle
- Responsive design (desktop & mobile)
- Sidebar navigasi dengan animasi typewriter
- User dropdown menu dengan logout

---

## ❌ Fitur yang Dihapus (Request User)

Fitur-fitur berikut ada di project lama tapi **tidak** dimasukkan:
- Cek Tabel Permintaan
- Cek Tabel Detail Permintaan
- Edit Data Detail Permintaan
- Stock Opname (Sebelum, Hasil, Setelah)
- Rollback (Permintaan, Permintaan Detail, Pengeluaran Detail)
- User Management
- **Clear All Tables** (dihapus karena Empty Table sudah cukup)

---

## 🗄️ Database

### Connection
```
Server: 103.86.139.92
Database: dbkop
User: simaset
Password: semlmgl
```

### Tabel Utama yang Digunakan
- `dbkop.dbo.login` - Data user login
- `dbkop.dbo.TempPersediaanStep1` - Tabel temporary untuk data penerimaan
- `AsetPersediaan90.dbo.*` - Berbagai tabel sumber data (PenerimaanDPA, PenerimaanDPANon, Gudang, dll)
- `AsetMaster90.dbo.ObjekPersediaanPLU` - Master data PLU

### Query Kompleks
Semua query tarik saldo menggunakan CTE (Common Table Expressions) yang cukup kompleks untuk:
- Menghitung NoKel (nomor kelompok) secara sekuensial
- Menghitung FIFO berdasarkan tanggal dan jam
- Join multiple tables dengan filter periode

---

## 📁 Struktur Folder

```
cek-penerimaan/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/               # Login, Logout, Me
│   │   │   ├── saldo-data/         # Summary data
│   │   │   ├── temp-persediaan-step1/  # CRUD data
│   │   │   ├── empty-step1/        # Hapus data
│   │   │   ├── tarik-saldo-*/      # 4 endpoint tarik saldo
│   │   │   └── stockopname-insert/ # Insert stock opname
│   │   ├── layout.tsx              # Root layout dengan AuthProvider
│   │   ├── page.tsx                # Main page (Login atau Dashboard)
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── Dashboard.tsx           # Layout utama dengan sidebar
│   │   ├── Login.tsx               # Halaman login
│   │   └── TempPersediaanStep1Table.tsx  # Komponen tabel utama
│   ├── context/
│   │   └── AuthContext.tsx         # React context untuk auth state
│   ├── lib/
│   │   ├── db.ts                   # Koneksi database mssql
│   │   ├── auth.ts                 # JWT utilities
│   │   └── utils.ts                # Helper functions
│   └── data/
│       └── PBSubk.json             # Data lookup untuk PBSubk
├── .env.local                      # Environment variables (tidak di-commit)
├── next.config.ts                  # Next.js config
├── package.json
├── README.md                       # Dokumentasi untuk user
└── PROJECT_NOTES.md                # File ini
```

---

## 🔐 Sistem Autentikasi

### Flow Login
1. User submit username + password
2. API `/api/auth/login` query ke `dbkop.dbo.login`
3. Jika valid, generate JWT token
4. Token disimpan di httpOnly cookie `access_token`
5. Frontend redirect ke Dashboard

### Role & Filter
- **ADMIN**: Bisa akses semua data, bisa pilih PBSubk mana saja
- **USER**: Data difilter berdasarkan `filter` column di tabel login
- Filter menggunakan pattern `NoKel LIKE {prefix} + '%'`

---

## ⚙️ Konfigurasi Penting

### next.config.ts
```typescript
serverExternalPackages: ['mssql'],  // Penting untuk Vercel
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

### Database Connection (lib/db.ts)
```typescript
options: {
  encrypt: false,           // SQL Server 2008 tidak support TLS modern
  trustServerCertificate: true,
}
```

---

## 🚀 Deployment

### Vercel
1. Push ke GitHub
2. Import di Vercel
3. Set Environment Variables:
   - `DB_SERVER`
   - `DB_DATABASE`
   - `DB_UID`
   - `DB_PWD`
   - `JWT_SECRET`

### Catatan Penting
- SQL Server harus bisa diakses dari internet (buka firewall)
- Vercel serverless functions memiliki timeout 10 detik (hobby) / 60 detik (pro)
- Query yang sangat kompleks mungkin perlu optimisasi

---

## 📝 Changelog

### 2026-01-26
- ✅ **Dynamic NoKel Year Suffix**: NoKel sekarang di-generate secara dinamis berdasarkan Tahun Anggaran yang dipilih saat login. Contoh: jika pilih Tahun 2026, NoKel akan menjadi `.26K0001` bukan `.25K0001` yang sebelumnya hardcoded. Perubahan di:
  - `TempPersediaanStep1Table.tsx`: Mengirim parameter `fiscal_year` ke API
  - 5 API routes: `tarik-saldo-awal`, `tarik-saldo-tahun-lalu`, `tarik-saldo-berjalan`, `tarik-saldo-lain-lain`, `stockopname-insert` - semua menggunakan `@NoKelPrefix` dinamis

- ✅ **Fix Date Comparison Bug**: Memperbaiki bug dimana data di luar range tanggal ikut tertarik (contoh: saldo awal 2026 ikut tertarik ketika pilih periode 2025). Penyebab: SQL Server tidak mengkonversi string ke datetime dengan benar saat menggunakan `BETWEEN`. Solusi: Menggunakan `CONVERT(DATETIME, @Periode*, 120)` untuk konversi eksplisit. Fix diterapkan di:
  - `tarik-saldo-tahun-lalu`: Query CTE `SO` pada kolom `Awal`
  - `tarik-saldo-berjalan`: Query CTE `FilteredData` pada kolom `TglBAST`
  - `tarik-saldo-lain-lain`: Query CTE `FilteredData` pada kolom `TglBast`
  - `tarik-saldo-awal`: Query CTE `FilteredData` pada kolom `TglBast`

### 2026-01-12
- ✅ **Fix Dark Mode Persistence**: Toggle dark/light mode sekarang tersimpan di `localStorage`, sehingga preferensi theme tetap terjaga setelah browser reload. Perubahan di `Dashboard.tsx`:
  - State `isDark` membaca dari `localStorage.getItem('theme')` saat mount
  - Setiap perubahan mode disimpan ke `localStorage.setItem('theme', 'dark'|'light')`

### 2026-01-06
- ✅ Initial project creation
- ✅ Migrasi dari Flask+React ke Next.js 14+
- ✅ Implementasi semua API routes
- ✅ Implementasi komponen Frontend
- ✅ Build successful
- ✅ Hapus fitur Clear All Tables (per request user)
- ✅ **Export Excel Enhancement**: Auto Filter dan baris Total dengan SUM formula

---

## 🤔 Catatan untuk AI Assistant

1. **Project Lama**: Masih ada di folder parent (`../web-project/` dan `../api/`), bisa dijadikan referensi jika ada query SQL yang perlu dicek

2. **PBSubk.json**: File ini berisi lookup data untuk autocomplete nama PBSubk, di-copy dari project lama

3. **Query SQL**: Semua query di API routes adalah port 1:1 dari Flask, jangan ubah logikanya kecuali diminta

4. **Fiscal Year**: User bisa pilih tahun anggaran saat login, disimpan di localStorage. NoKel di-generate menggunakan 2 digit terakhir tahun (2026 → `.26K`)

5. **Periode Default**: Semester 1 (Jan-Jun) atau Semester 2 (Jul-Dec) dengan preset di DatePicker

6. **Date Comparison**: Selalu gunakan `CONVERT(DATETIME, @param, 120)` untuk konversi string ke datetime di SQL queries agar tidak terjadi bug boundary comparison

---

*Last updated: 2026-01-26 14:44*
