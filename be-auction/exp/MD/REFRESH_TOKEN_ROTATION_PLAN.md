# Rencana Implementasi: Hashed Refresh Tokens + Rotation

**Tujuan:**
- Meningkatkan keamanan refresh token dengan menyimpan hanya hash di database, menerapkan rotation pada saat refresh, serta mendeteksi dan merespons token reuse.

**Ringkasan Singkat:**
- Generate refresh token random (plain) dikirim ke client sebagai cookie `HttpOnly`.
- Server menyimpan HMAC/SHA256 hash dari token (bukan token plain) beserta metadata session.
- Pada permintaan refresh: hash(token) dicari di DB; jika valid → buat refresh token baru (rotate) dan tandai token lama sebagai revoked dalam satu transaksi.
- Jika token tidak ditemukan tapi ada indikasi reuse, revoke semua sesi user dan laporkan kejadian.

**Manfaat:**
- Mencegah penggunaan token dari kebocoran DB (karena hanya hash disimpan).
- Rotation mengurangi window serangan dan memungkinkan deteksi replay/reuse.

**Persyaratan Lingkungan / Config (.env)**
- Tambahkan environment variable berikut:
  - `REFRESH_TOKEN_HASH_SECRET` — secret untuk HMAC (jangan commit ke repo)
  - `REFRESH_TOKEN_BYTES=64` (opsional) — entropy token size
  - `REFRESH_TOKEN_EXPIRES_IN=7d` (sudah ada; pastikan sinkron)

**Perubahan Database (Prisma)**
- Tambah kolom non-destruktif pada tabel `RefreshToken` (atau tabel yang ada):
  - `tokenHash String` (unique)
  - `createdAt DateTime @default(now())`
  - `lastUsedAt DateTime?`
  - `expiresAt DateTime`
  - `revoked Boolean @default(false)`
  - `deviceInfo String?` (opsional)
  - `ip String?` (opsional)

Contoh snippet Prisma model (modifikasi non-destruktif):

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String?  // Jika ada legacy; akan dideprecate
  tokenHash String?  @unique
  createdAt DateTime @default(now())
  lastUsedAt DateTime?
  expiresAt DateTime
  revoked   Boolean  @default(false)
  deviceInfo String?
  ip        String?

  user User @relation(fields: [userId], references: [id])
}
```

Catatan: jangan hapus kolom legacy `token` langsung; lakukan deprecate secara bertahap.

**Fungsi Hashing (Recommended)**
- Gunakan HMAC-SHA256 dengan secret dari env.

Contoh Node.js:

```js
import crypto from 'crypto'

function hashRefreshToken(token) {
  return crypto
    .createHmac('sha256', process.env.REFRESH_TOKEN_HASH_SECRET)
    .update(token)
    .digest('hex')
}
```

Alasan: HMAC menambah secret sehingga hash lebih sulit untuk preimage attacks.

**Alur Login (Create Refresh Token)**
- Server membuat `plainToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex')`.
- `tokenHash = hashRefreshToken(plainToken)`.
- Simpan record refresh token di DB: `{ userId, tokenHash, createdAt, expiresAt, deviceInfo, ip }`.
- Set cookie `refresh_token=plainToken` dengan opsi: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<expiry seconds>`.
- (Opsional) Untuk kompatibilitas sementara, Anda dapat juga menyimpan kolom `token` lama, lalu migrasi perlahan.

**Alur Refresh (Rotation) — Atomic**
1. Client mengirim request `POST /auth/refresh` (cookie `refresh_token` otomatis dikirim karena HttpOnly cookie).
2. Server membaca `plainToken` dari cookie.
3. Hit `tokenHash = hashRefreshToken(plainToken)`.
4. Dalam satu DB transaction:
   - Cari row WHERE `tokenHash` = tokenHash AND `revoked=false` AND `expiresAt > now()`.
   - Jika tidak ditemukan:
     - Cek apakah ada row revoked yang matching (indikasikan reuse). Jika reuse terdeteksi, revoke semua sessions untuk user dan kirim 401.
     - Jika tidak ada → 401 unauthorized.
   - Jika ditemukan valid row:
     - Buat `newPlain = randomBytes(...)` dan `newHash = hashRefreshToken(newPlain)`.
     - Insert new row `{userId, tokenHash: newHash, createdAt: now, expiresAt: now + refreshExpiry, deviceInfo, ip}`.
     - Set old row `revoked = true; lastUsedAt = now` atau hapus old row.
   - Commit transaction.
5. Server set cookie refresh_token = newPlain (HttpOnly) dan return access token baru.

Catatan teknis: pastikan operasi insert old->revoke->insert baru dilakukan atomically untuk menghindari race conditions (gunakan transaction).

**Deteksi Reuse & Respons**
- If token not found but there exists a revoked row with same tokenHash/user recently revoked -> treat as reuse.
- Response policy on reuse detection:
  - Revoke all user sessions (set revoked=true for all refresh tokens for that user).
  - Log event with high severity and userId/ip/ua.
  - Force user re-login (401 + message).

**Perubahan Kode (files & fungsi utama)**
- `src/utils/tokenHelper.js`:
  - Tambah `hashRefreshToken()` dan export.
  - `generateRefreshToken()` tetap menghasilkan plain token.
  - Tambah `REFRESH_TOKEN_BYTES` config.
- `src/services/authService.js`:
  - Saat login: generate plain token, hash, simpan hash di DB (prisma.refreshToken.create).
  - Saat refresh: gunakan transaction untuk mencari tokenHash, rotate (insert new + revoke old), dan kembalikan access token + set new cookie.
  - logout / logoutAll: revoke rows by user.
- `src/controllers/authController.js`:
  - Pastikan setCookie untuk refresh token tetap bekerja (HttpOnly).
  - Tidak perlu perubahan di client jika cookie name sama.
- Middleware & Utilities:
  - Tambah helper untuk recording `deviceInfo` (user-agent) dan IP.

**Migration Strategy (Safe Rollout)**
1. Tambah kolom baru (`tokenHash`, `revoked`, `lastUsedAt`, `deviceInfo`) melalui migration non-destruktif.
2. Deploy code yang menulis ke `tokenHash` pada new logins/refreshes, namun masih membaca legacy `token` (jika ada) untuk backward compatibility.
3. Monitor for some days; wait until majority of tokens are migrated (users re-login or refresh flows happened).
4. Setelah window, switch code to stop accepting legacy `token` (reject legacy token flows).
5. Remove legacy `token` column in a later migration.

**DB Migration Commands (example)**

```powershell
# generate migration
npx prisma migrate dev --name add_refresh_token_hash
# or for production
npx prisma migrate deploy
```

**Testing (Unit & Integration)**
- Unit tests:
  - Hashing function correctness (HMAC produces hex length expected).
  - Rotation logic handles concurrency (mock transaction scenarios).
- Integration tests:
  - End-to-end login -> refresh -> access token lifecycle.
  - Reuse detection: simulate replay of old refresh token and assert revoke-all.
  - Cookie options validation (HttpOnly, Secure in prod).

**Monitoring & Logging**
- Log events:
  - `REFRESH_TOKEN_ROTATED` (userId, sessionId/device, ip, ua)
  - `REFRESH_TOKEN_REUSE_DETECTED` (userId, tokenHash truncated, ip, ua)
  - `REFRESH_TOKEN_REFRESH_FAILED` (reasons)
- Create alerts for spikes in `REFRESH_TOKEN_REUSE_DETECTED`.

**Rollback Plan**
- If migration causes issues:
  - Rollback code to previous version that still reads legacy `token` column.
  - Revert migration only if necessary (may require DB restore). Prefer code rollback + mitigation.

**Performance & Cost**
- Writes increase on refresh (insert + update). Use proper DB indices and consider TTL cleanup jobs for expired tokens.
- Use Redis if extremely high volume for refresh tokens, but DB is fine for moderate loads.

**Estimate Effort**
- Dev + Tests + Migration: ~1-3 days (small team) for POC + tests.
- Full rollout + monitoring + polishing: ~3-5 days.

**Checklist Sebelum Deploy**
- [ ] Add `REFRESH_TOKEN_HASH_SECRET` to production env vault
- [ ] Create migration and review schema changes
- [ ] Implement hashing & rotation logic in `authService` with transactions
- [ ] Add logging for rotation & reuse detection
- [ ] Add integration tests for refresh & reuse
- [ ] Stage deploy to staging environment; run smoke tests
- [ ] Monitor `refresh` endpoints for errors after deploy
 - [ ] Add hash key versioning and migration plan (support previous keys for verification)
 - [ ] Add periodic cleanup/TTL job for expired and revoked tokens
 - [ ] Add per-user rate limiting for `POST /auth/refresh`

**Contoh Pseudocode (authService.refreshAccessToken)**

```js
// Pseudocode
async function refreshAccessToken(plainToken, reqMeta) {
  const tokenHash = hashRefreshToken(plainToken)

  return await prisma.$transaction(async (tx) => {
    const row = await tx.refreshToken.findFirst({ where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } } })

    if (!row) {
      // check reuse: any recently revoked token with same hash?
      const revoked = await tx.refreshToken.findFirst({ where: { tokenHash, revoked: true, /* recent window */ } })
      if (revoked) {
        // reuse detected: revoke all
        await tx.refreshToken.updateMany({ where: { userId: revoked.userId }, data: { revoked: true } })
        throw new Error('Refresh token reuse detected')
      }
      throw new Error('Invalid refresh token')
    }

    // rotate
    const newPlain = generateRefreshToken()
    const newHash = hashRefreshToken(newPlain)
    await tx.refreshToken.create({ data: { userId: row.userId, tokenHash: newHash, expiresAt: computeExpiry(), deviceInfo: reqMeta.device, ip: reqMeta.ip } })
    await tx.refreshToken.update({ where: { id: row.id }, data: { revoked: true, lastUsedAt: new Date() } })

    // generate new access token and return newPlain to be set as cookie
    const accessToken = generateAccessToken({ userId: row.userId, ... })
    return { accessToken, refreshToken: newPlain }
  })
}
```

**Catatan Operasional & Keamanan Lainnya**
- Pastikan server waktu sinkron (NTP) untuk expiry checks.
- Batasi `refresh` endpoint rate (per-user rate limiting).
- Jangan log plain tokens; jika perlu, truncate when logging.
- Pastikan secret `REFRESH_TOKEN_HASH_SECRET` disimpan aman (vault/secret manager).

- **Concurrency / Race Conditions:** meskipun transaksi membantu, gunakan pola conditional update dan cek jumlah baris yang terpengaruh:
  - Dalam transaksi, setelah menemukan row valid, lakukan `update` pada row lama dengan kondisi `WHERE id = oldId AND revoked = false` dan periksa `affectedRows`/`count`. Jika `0`, artikan token telah diproses/dirusak oleh request lain — batalkan atau tangani secara idempotent.
  - Di Postgres gunakan `SELECT ... FOR UPDATE` saat mencari row untuk mengunci record sebelum modifikasi.

- **Unique collision handling:** pastikan `tokenHash` memiliki constraint `@unique`. Tangani `unique_violation` saat membuat token baru dengan retry (generate new plain token + new hash) karena kemungkinan teoretis collision/duplicate insert saat paralel.

- **Key rotation / versioning:** jika Anda perlu mengganti `REFRESH_TOKEN_HASH_SECRET`, hash lama akan invalid. Implementasikan `hashVersion Int` pada model `RefreshToken` dan simpan version saat membuat token. Saat verifikasi, coba verifikasi dengan current key, jika gagal coba previous key(s) berdasarkan versioning policy.

- **Session / device binding:** simpan `sessionId` (UUID) atau `deviceInfo` agar revoke-per-session mudah. Jangan hanya mengandalkan tokenHash untuk identitas sesi jika Anda ingin granular revoke.

- **Logging sensitivitas:** jangan menyimpan token plain di log. Log hanya: `userId`, `sessionId` (atau truncated tokenHash, e.g., first 8 chars), `ip`, `ua`, dan event type. Truncate hashes if logged.

- **Cookie `SameSite` decision:** `Lax` cocok untuk many flows; gunakan `Strict` hanya jika tidak memerlukan cross-site navigations (SSO). Pastikan dokumentasi untuk dev/staging agar cookie `Secure` digunakan di prod.

- **IP / UA heuristics:** jangan gunakan IP sebagai satu-satunya faktor validasi. Gunakan combo `deviceInfo` (UA) + optional IP-change heuristics (notify user or challenge) karena mobile/NAT IP berubah-ubah.

- **DB housekeeping & retention:** buat job periodik (cron) untuk menghapus/archieve expired + revoked tokens tertua untuk mencegah pertumbuhan tabel tak terkontrol. Alternatif: gunakan soft-delete + TTL index jika DB mendukung.

- **Rate limiting & abuse mitigation:** `POST /auth/refresh` harus memiliki per-user rate limit dan global throttling. Ini membantu mencegah brute force terhadap cookie/token.

- **Prisma schema notes:** selain `tokenHash @unique`, tambahkan indeks untuk query performa, contoh: `@@index([userId, revoked, expiresAt])`. Untuk key-versioning tambahkan `hashVersion Int @default(1)`.

- **Testing & Concurrency tests:** tambahkan test yang mensimulasikan parallel refresh menggunakan same refresh token (mis. 10 concurrent requests) dan assert hanya satu request yang berhasil merotasi token; sisanya harus gagal dengan 401 atau reuse-detected handling.

- **Pseudocode (rotation) — rincian conditional update:**

```js
// Dalam prisma.$transaction
const row = await tx.refreshToken.findFirst({ where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } } })
if (!row) {
  const revoked = await tx.refreshToken.findFirst({ where: { tokenHash, revoked: true } })
  if (revoked) {
    await tx.refreshToken.updateMany({ where: { userId: revoked.userId }, data: { revoked: true } })
    throw new Error('Refresh token reuse detected')
  }
  throw new Error('Invalid refresh token')
}

// Prepare new token
const newPlain = generateRefreshToken()
const newHash = hashRefreshToken(newPlain)

// Create new row (handle unique-violation by retry)
await tx.refreshToken.create({ data: { userId: row.userId, tokenHash: newHash, expiresAt: computeExpiry(), deviceInfo: reqMeta.device, ip: reqMeta.ip } })

// Conditional revoke of old row
const updated = await tx.refreshToken.updateMany({ where: { id: row.id, revoked: false }, data: { revoked: true, lastUsedAt: new Date() } })
if (updated.count === 0) {
  // another parallel flow already processed it — treat as reuse/race and handle accordingly
  throw new Error('Concurrent token rotation detected')
}

const accessToken = generateAccessToken({ userId: row.userId })
return { accessToken, refreshToken: newPlain }
```

**Catatan:** sesuaikan pesan error dan response untuk UX (mis. 401 dan instruksi re-login). Log event reuse dengan severity tinggi.
