# Orbitask — Tata Surya Tugas

Orbitask mengubah fokus harian menjadi tata surya yang hidup: **matahari** adalah
tujuan utama, **planet** adalah tugas, dan **bulan** adalah subtask. Semua
antarmuka berbahasa Indonesia dan berjalan sepenuhnya di perangkat pengguna
(localStorage) tanpa akun atau server tambahan.

## Menjalankan

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Untuk produksi:

```bash
npm run build
npm start
```

## Deploy

### Vercel (direkomendasikan)

Aplikasi ini sudah live di **https://orbitask-dun.vercel.app**
(repo `Moonv3/orbitask`, project Vercel `Moonv/orbitask`, production branch `main`).

Untuk deploy ulang atau fork ke akun sendiri:

1. Push repository ke GitHub (branch `main` atau `master`).
2. Di Vercel, pilih **Add New → Project** lalu import repository tersebut.
3. Biarkan deteksi otomatis Next.js; build command `npm run build` sudah ditetapkan
   di `vercel.json`. Tidak ada environment variable yang dibutuhkan.
4. Hubungkan repo GitHub ke project agar setiap push/PR otomatis dibuatkan
   deployment (preview untuk PR, produksi untuk `main`).
5. GitHub Actions (`.github/workflows/ci.yml`) juga menjalankan `typecheck`,
   `lint`, dan `build` pada setiap push/PR ke `main`/`master`.

Deploy manual dari CLI (butuh `vercel login`):

```bash
vercel --prod
```

Data pengguna tetap berada di browser masing-masing (localStorage), jadi
tidak perlu database atau variabel rahasia.

### Host statis lain

Aplikasi ini bisa diekspor sebagai situs statis, tetapi `next.config.ts`
sedang memakai `cacheComponents` dan `partialPrefetching`. Untuk
`output: "export"`, kedua opsi itu perlu dinonaktifkan dan build diuji ulang.

## Peta milestone

| Milestone | Isi |
| --- | --- |
| M0 | Skema data v2/v3, migrasi lossless, pengaturan, backup JSON, selector energi/urgensi/streak |
| M1 | Bulan (subtask), gravitasi tenggat & komet, preset energi, orbit trail, shader planet, kualitas high/light, chime suara |
| M1.5 | Multipel tata surya, switcher, arsip/pulihkan, aksen per sistem, backup v3 |
| M2 | Nebula & Milky Way, cincin planet, prominensi matahari, GodRays, lens flare, depth of field, chromatic aberration, grain, intro sinematik |
| M3 | Timer fokus + HUD, palet perintah (`Ctrl/⌘+K`), tag konstelasi + filter, drag re-orbit, batas 5 bulan baru |
| M4 | Skip link, responsivitas, reduced motion, profiling browser, dokumentasi ini |

Peta galaksi (mode `galaxy`) adalah tambahan di luar daftar milestone di atas.

## Interaksi penting

- **Klik planet** untuk membuka detail: prioritas, tenggat, energi, bulan,
  lintasan, dan sesi fokus.
- **Tenggat lewat** membuat planet menjadi komet. Komet tidak pernah dihapus —
  tersedia pintasan penjadwalan ulang (besok / +3 hari / minggu depan).
- **Anggaran energi harian** hanya saran. Melebihi anggaran tidak memblokir
  pembuatan tugas; matahari hanya meredup sebagai pengingat lembut.
- **Menyelesaikan planet** dengan bulan yang belum selesai diperbolehkan, dengan
  catatan halus di panel detail.
- **Bulan baru dibatasi 5**. Data lama dengan hingga 12 bulan tetap dipertahankan
  utuh oleh normalisasi (`MAX_SUBTASKS_LEGACY`).
- **Tag** membentuk konstelasi: pakai tag yang sama pada beberapa tugas, lalu
  saring dari daftar tugas.
- **Drag tugas** di daftar tugas ke lane Sekarang / Hari ini / Nanti untuk
  mengubah lintasannya.
- **Fokus**: pilih 15/25/50 menit dari panel tugas atau palet perintah. HUD
  menampilkan hitung mundur; jeda, lanjut, dan henti mencatat durasi ke sesi
  tugas (termasuk jika sistem aktif berganti).
- **Palet perintah**: `Ctrl+K` / `⌘K` untuk mencari perintah dan tugas, `↑`/`↓`
  memilih, `Enter` menjalankan, `Esc` menutup.
- **Suara** default mati dan hanya aktif jika di-unmute di Pengaturan.

## Data & migrasi

Data disimpan di tiga key localStorage yang saling melengkapi:

- `orbitask-v1` — data tugas generasi pertama.
- `orbitask-v2` — data dengan lane, energi, tag, dan subtask.
- `orbitask-v3` — data multi-sistem (sistem aktif, arsip, pengaturan).

Migrasi bersifat **lossless**: key lama tidak dihapus, sistem lama menjadi tata
surya pertama, dan data baru dinormalisasi tanpa memangkas subtask lama. Backup
JSON dari Pengaturan dapat dipulihkan kapan saja (arsip bukan hapus).

## Arsitektur singkat

```
app/                    App Router, layout, globals.css
components/
  OrbitaskApp.tsx       orkestrasi state UI, shortcut, skip link, tick fokus
  solar-system/         Scene R3F, Sun, Planet, atmosfer, kamera
  galaxy/               scene peta galaksi
  ui/                   dialog, panel, HUD, palet perintah, TopBar
lib/                    tipe, migrasi, selector, format, palette, orbit
store/useTaskStore.ts   Zustand + persist, aksi tugas/sistem/fokus/command
```

Efek postprocessing hanya aktif pada kualitas **High**. Pada kualitas **Light**,
scene memakai bintang dan partikel lebih sedikit serta tanpa composer agar tetap
ringan di perangkat lemah. Seluruh animasi menghormati
`prefers-reduced-motion`.

## Aksesibilitas

- Skip link di awal halaman menuju `#main-content`.
- Dialog memakai `role="dialog"`, `aria-modal`, dan label yang jelas.
- Status fokus dan progres memakai `aria-live` / `role="progressbar"`.
- Navigasi keyboard tersedia untuk palet perintah dan penutupan panel dengan `Esc`.
- Fokus tampilan mengikuti `:focus-visible`.

## Skrip

```bash
npm run typecheck   # type check
npm run lint       # ESLint
npm run build      # produksi
```
