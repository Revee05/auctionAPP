# Ringkasan Perintah Prisma (Cheat Sheet)

File ini berisi ringkasan perintah Prisma CLI yang sering dipakai, contoh penggunaan, dan flag berguna. Jalankan perintah dari root proyek (tempat `prisma/schema.prisma` berada).

Catatan singkat:
- Gunakan `--schema` jika kamu memakai file schema Prisma di lokasi non-standar.
- Di Windows PowerShell perintah sama seperti contoh di bawah.

---

## Pengembangan Lokal

- Menghasilkan Prisma Client (jalankan setelah mengubah schema)

```bash
npx prisma generate
# atau lewat npm script
npm run prisma:generate
```

- Membuat dan menerapkan migration (development)

```bash
npx prisma migrate dev --name <deskripsi_perubahan>
# Contoh: npx prisma migrate dev --name add_refresh_token_hash_rotation
```

- Menerapkan migration di produksi (tanpa prompt)

```bash
npx prisma migrate deploy
```

- Reset database development lokal (menghapus DB, menerapkan migration, menjalankan seed)

```bash
npx prisma migrate reset
# Atau pakai flag --force untuk melewati konfirmasi
npx prisma migrate reset --force
```

- Menampilkan status migration

```bash
npx prisma migrate status
```


## Operasi Database

- Meng-push perubahan schema ke database tanpa membuat migration (bagus untuk prototipe)

```bash
npx prisma db push
```

- Menarik (pull) schema dari database ke `schema.prisma` (introspeksi)

```bash
npx prisma db pull
```

- Introspeksi remote database dan tulis ke `schema.prisma`

```bash
npx prisma db pull --schema=./prisma/schema.prisma
```

- Menjalankan seed script yang dikonfigurasi di `package.json` / `prisma.seed`

```bash
npx prisma db seed
# atau via npm script jika tersedia
npm run prisma:seed
```


## Studio & Formatting

- Buka Prisma Studio (GUI untuk melihat / mengedit data)

```bash
npx prisma studio
# Jika Studio tidak terbuka di port default, CLI akan menampilkan URL yang bisa dibuka di browser
```

- Memformat file Prisma schema

```bash
npx prisma format
```


## Lanjutan / Diff / Introspeksi

- Membuat diff SQL antara dua schema

```bash
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-database 'postgresql://user:pw@host:5432/db' --script > migration.sql
```

- Introspeksi database dan cetak schema

```bash
npx prisma db pull --print --schema=./prisma/schema.prisma
```


## Menggunakan file schema tertentu

```bash
npx prisma migrate dev --schema=./prisma/schema.prisma --name my_change
npx prisma generate --schema=./prisma/schema.prisma
npx prisma studio --schema=./prisma/schema.prisma
```


## Rekomendasi CI / Produksi

- Di pipeline CI atau produksi gunakan `migrate deploy` bukannya `migrate dev`.
- Pastikan `DATABASE_URL` sudah diatur di environment (secrets/ vault pada CI).
- Jalankan `npx prisma generate` setelah migration jika build membutuhkan Prisma Client.

Contoh langkah pipeline (Linux / generic):

```bash
# 1. Install dependencies
npm ci
# 2. Terapkan migrations
npx prisma migrate deploy
# 3. Generate client
npx prisma generate
# 4. Start aplikasi
node server.js
```


## Troubleshooting & Tips

- Error "Unique constraint" atau migration gagal: tinjau SQL di `prisma/migrations/<timestamp>/*` dan periksa data yang mungkin duplikat.
- Jika mengubah enum atau mengganti nama field, buat migration dengan hati-hati dan uji di staging.
- Gunakan `prisma studio` untuk memeriksa data setelah migration.
- Regenerate Prisma Client setiap kali schema berubah: `npx prisma generate`.
- Gunakan flag `--schema` jika bekerja dengan beberapa file schema.

---

Jika mau, saya bisa menambahkan skrip npm di `package.json` untuk perintah Prisma yang sering dipakai (mis. `prisma:generate`, `prisma:migrate`, `prisma:studio`).
