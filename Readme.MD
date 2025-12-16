
**AuctionAPP**

- **Deskripsi**: Proyek ini berisi implementasi otentikasi (access + refresh token, rotasi refresh token), RBAC dasar, dan contoh seed data untuk pengembangan.

**Struktur Proyek (ringkasan)**
- `be-auction/`: server back-end
	- `server.js`: entry point
	- `src/`: kode sumber backend (controllers, services, middlewares, utils)
	- `prisma/`: schema Prisma, migrations, seeder
	- `exp/`: eksperimen/skrip helper (mis. test rotation)
- `fe-auction/`: aplikasi front-end Next.js (React)
	- `app/`, `components/`, `lib/`, `hooks/` dll.

**Prasyarat**
- Node.js (disarankan LTS terbaru yang kompatibel dengan `next@16` dan dependensi backend). Pada Windows gunakan PowerShell.
- PostgreSQL (atau database lain yang didukung oleh `pg`), akses string disimpan di `.env` pada backend.

**Setup & Menjalankan (Backend)**
- 1) Masuk ke folder backend dan instal dependency:

	```powershell
	cd be-auction
	npm install
	```

- 2) Siapkan file environment `.env` di `be-auction/` (contoh variabel):

	```text
	DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
	JWT_SECRET="isi_rahasia_jwt"
	REFRESH_TOKEN_SECRET="isi_rahasia_refresh"
	PORT=3000
	# Opsi email (untuk nodemailer) bila diperlukan:
	SMTP_HOST=
	SMTP_PORT=
	SMTP_USER=
	SMTP_PASS=
	```

- 3) Generate Prisma client & migrasi (pengembangan):

	```powershell
	npx prisma generate
	npx prisma migrate dev
	# Untuk menjalankan seeder (proyek sudah punya seeder):
	npx prisma db seed
	# Alternatif manual jika diperlukan:
	node prisma/seeders/seed.js
	```

- 4) Menjalankan server selama pengembangan:

	```powershell
	npm run dev
	# (script backend: "dev": "nodemon server.js")
	```

- 5) Skrip tambahan yang berguna:

	- `npm run start` — jalankan `node server.js` (produksi)
	- `npm run cleanup:tokens` — bersihkan token yang sudah kedaluwarsa (`src/utils/cleanupTokens.js`)
	- `npm run test:rotation` — contoh skrip untuk menguji refresh token rotation (`exp/js_jsx/testRefreshRotation.js`)

**Setup & Menjalankan (Frontend)**
- 1) Masuk ke folder frontend dan instal dependency:

	```powershell
	cd fe-auction
	npm install
	```

- 2) Konfigurasi environment (jika perlu). Periksa `fe-auction/lib/config.js` atau file konfigurasi lain untuk variabel yang diperlukan seperti API base URL.

- 3) Menjalankan development server Next.js:

	```powershell
	npm run dev
	# (script frontend: "dev": "next dev")
	```

**Database & Prisma**
- Schema Prisma berada pada `be-auction/prisma/schema.prisma`.
- Migrations sudah ada di `be-auction/prisma/migrations/` — jika bekerja pada fitur baru, buat migration baru dengan `npx prisma migrate dev --name <deskripsi>`.
- Seeder ada di `be-auction/prisma/seeders/` dan dipanggil lewat konfigurasi `prisma.seed` di `package.json`.

**Fitur penting dan catatan arsitektur**
- Otentikasi: Implementasi access token + refresh token, termasuk rotasi refresh token. Periksa `src/services/authService.js`, `src/middlewares/authMiddleware.js`, dan util `src/utils/tokenHelper.js`.
- RBAC: middleware RBAC tersedia di `src/middlewares/rbacMiddleware.js` dan role seed di `prisma/seeders`.
- Token cleanup: `src/utils/cleanupTokens.js` menyediakan skrip untuk membersihkan token lama — jalankan berkala lewat cron atau scheduler.

**Pengujian & Skrip Eksperimen**
- Terdapat skrip eksperimen di `be-auction/exp/js_jsx/` seperti `testRefreshRotation.js` untuk memverifikasi logika rotasi refresh token.

**Tip Debugging lokal**
- Jika ada masalah migrasi, pastikan `DATABASE_URL` di `.env` benar dan jalankan `npx prisma migrate reset` (hati-hati: menghapus data). Untuk produksi gunakan `npx prisma migrate deploy`.

**Kontribusi**
- Untuk perubahan besar pada otentikasi, buka branch fitur baru dari `AUTH-Only(Dont_Change_This_File)` dan buat PR dengan deskripsi dan langkah reproduksi.

**Kontak / Referensi**
- Untuk penjelasan implementasi otentikasi dan refresh token rotation, lihat dokumentasi internal pada `be-auction/exp/MD/REFRESH_TOKEN_ROTATION_PLAN.md` dan `be-auction/exp/MD/COOKIE_AUTH.md`.

---
