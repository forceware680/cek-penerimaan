# Rencana Pengembangan Fitur: Request Kode Barang (PLU/NON) & Riwayat

## 1. Konteks Tech Stack & Arsitektur
- **Framework**: Next.js 15+ (App Router).
- **Language**: TypeScript (`.ts`, `.tsx`).
- **Database**: SQL Server 2008 R2 (MSSQL) menggunakan database `DBKOP` (Staging) dan `AsetMaster90` (Utama).
- **Authentication**: JWT (JSON Web Token) - terhubung dengan `JWT_SECRET` di `.env.local`.
- **Deployment**: Vercel.
- **Struktur Folder Sasaran**: 
  - Backend (API): `src/app/api/request-barang/...`
  - Frontend (UI): `src/components/...` atau `src/app/(routes)/...`

## 2. Deskripsi Fitur
Fitur ini memungkinkan Pengurus Barang (User/OPD) untuk mengajukan pembuatan Kode Barang baru. Admin (Aset) memiliki wewenang untuk Menyetujui (Approve) atau Menolak (Reject) pengajuan tersebut. Fitur ini menggunakan tabel *staging* di `DBKOP` agar tidak langsung mengganggu `AsetMaster90` sebelum ada validasi.

## 3. Role, Auth & Payload JWT
- Payload JWT harus memuat informasi `username`, `role` (Admin/User), dan `opd_name` (jika User).
- **Role User (Pengurus Barang)**: Hanya bisa input request dan melihat riwayat miliknya sendiri.
- **Role Admin**: Bisa melihat semua request, mengeksekusi Approve/Reject.

## 4. Alur Sistem & Endpoints (Rencana API)

### A. Sisi User (OPD)
1. **GET `/api/master/objek-rssub`**: Fetch dropdown Akun Persediaan dari `AsetMaster90.dbo.ObjekRSSub` (`WHERE ObjekRSSub LIKE '1.1.7%'`).
2. **GET `/api/master/satuan`**: Fetch dropdown Satuan dari `AsetMaster90.dbo.Satuan`.
3. **POST `/api/request-barang/create`**: 
   - Payload: `ObjekRSSub`, `StaID` ('PLU'/'NON'), `IDPLU_Req` (opsional), `Keterangan`, `Satuan`.
   - Logic: Insert ke `DBKOP.dbo.Req_KodeBarang`. Otomatis create notifikasi untuk Admin di `DBKOP.dbo.Sys_Notification`.
4. **GET `/api/request-barang/history`**: Fetch riwayat request milik user yang sedang login (baca via token JWT).

### B. Sisi Admin
1. **GET `/api/request-barang/all`**: Fetch semua request dengan status PENDING.
2. **POST `/api/request-barang/approve`**:
   - Payload: `RequestID`.
   - Logic: 
     - Validasi `IDPLU` unik ke `AsetMaster90.dbo.ObjekPersediaanPLU`.
     - Jika `StaID` = 'NON', generate IDPLU baru.
     - Insert ke `AsetMaster90.dbo.ObjekPersediaanPLU`.
     - Update status di `DBKOP.dbo.Req_KodeBarang` menjadi APPROVED.
     - Kirim notifikasi ke User.
3. **POST `/api/request-barang/reject`**:
   - Payload: `RequestID`, `CatatanAdmin`.
   - Logic: Update status menjadi REJECTED, kirim notifikasi ke User.

## 5. Sistem Notifikasi (Lonceng)
- **GET `/api/notifications/unread`**: Endpoint polling/fetching untuk mengambil jumlah notif belum terbaca berdasarkan `Username` di JWT.
- **POST `/api/notifications/mark-read`**: Mengubah status `IsRead = 1` saat notifikasi diklik.

## 6. Kebutuhan Database (Dieksekusi di DBKOP)
Terdapat dua tabel utama yang ditambahkan pada database `DBKOP`:
1. `[dbo].[Req_KodeBarang]`: Tabel staging & riwayat pengajuan.
2. `[dbo].[Sys_Notification]`: Tabel antrean pesan notifikasi/lonceng.
*(Script SQL sudah disiapkan terpisah)*