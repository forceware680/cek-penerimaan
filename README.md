# SI GEPENG - Cek Penerimaan

Aplikasi Next.js 14+ untuk Cek Penerimaan yang 100% kompatibel dengan Vercel.

## Fitur

- **Cek Saldo Penerimaan** - View dan manage data penerimaan
- **Tarik Data** - Tarik saldo awal, saldo berjalan, saldo lain-lain, saldo tahun lalu, dan sisa stock
- **Export Excel** - Export data ke format Excel
- **Dark/Light Mode** - Toggle antara tema gelap dan terang
- **Responsive** - Mendukung desktop dan mobile

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: SQL Server 2008+ via `mssql` package
- **UI**: Ant Design 5.x
- **Authentication**: JWT dengan httpOnly cookies
- **Styling**: Tailwind CSS + Custom CSS

## Instalasi

### Prerequisites

- Node.js 18+
- NPM atau Yarn

### Setup Lokal

1. Clone repository dan masuk ke folder project:
   ```bash
   cd cek-penerimaan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Buat file `.env.local` dengan isi:
   ```
   DB_SERVER=your_server_ip
   DB_DATABASE=dbkop
   DB_UID=your_username
   DB_PWD=your_password
   JWT_SECRET=your-secure-secret-key
   ```

4. Jalankan development server:
   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000)

## Deploy ke Vercel

### Langkah-langkah:

1. Push project ke GitHub/GitLab/Bitbucket

2. Buat project baru di [Vercel](https://vercel.com)

3. Import repository

4. Tambahkan Environment Variables di Vercel Dashboard:
   - `DB_SERVER` - IP atau hostname SQL Server
   - `DB_DATABASE` - Nama database
   - `DB_UID` - Username database
   - `DB_PWD` - Password database
   - `JWT_SECRET` - Secret key untuk JWT

5. Deploy!

### Catatan Penting:

- SQL Server harus dapat diakses dari internet (Vercel serverless)
- Pastikan firewall mengizinkan koneksi dari Vercel IP ranges
- Untuk SQL Server 2008, koneksi menggunakan `encrypt: false`

## Struktur Folder

```
cek-penerimaan/
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # Login, Logout, Me
│   │   │   ├── saldo-data/
│   │   │   ├── temp-persediaan-step1/
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── TempPersediaanStep1Table.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── db.ts          # Database connection
│   │   ├── auth.ts        # JWT utilities
│   │   └── utils.ts       # Helper functions
│   └── data/
│       └── PBSubk.json    # Data PBSubk
├── .env.local             # Environment variables (not committed)
├── next.config.ts
├── package.json
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/me` | GET | Get current user |
| `/api/saldo-data` | GET | Get summary data |
| `/api/temp-persediaan-step1` | GET | Get all records |
| `/api/empty-step1` | POST | Clear table |
| `/api/tarik-saldo-awal` | GET | Pull saldo awal |
| `/api/tarik-saldo-berjalan` | GET | Pull saldo berjalan |
| `/api/tarik-saldo-lain-lain` | GET | Pull saldo lain-lain |
| `/api/tarik-saldo-tahun-lalu` | GET | Pull saldo tahun lalu |
| `/api/stockopname-insert` | GET | Insert stock opname |
| `/api/clearalltabletemp` | DELETE | Clear all temp tables |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Developed By

- **Herman Prasetyo** - Developer
- **SeML** - Database Design

---

© 2024 SI GEPENG WEB
