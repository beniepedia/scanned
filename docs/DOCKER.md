# Menjalankan dengan Docker (tanpa PHP/CI4)

Tahap ini hanya menjalankan **frontend statis** + **backend AI**. Service PHP/CI4
ditambahkan nanti; saat itu frontend kembali dibangun dengan `base=/app/` dan
`index.html` digantikan shell CI4.

## Arsitektur

```
Browser (https://anpr.<domain>)
        │  Cloudflare (TLS, Access, WAF)
        ▼
cloudflared  ──tunnel──►  web (Caddy :80)
                             ├── /            → /srv (dist SPA, manifest, icons, sw.js)
                             └── /ai/*        → ai:8000 (prefix /ai dihapus)
                                                     └── Gemini API
```

Tidak ada port publik yang dibuka; hanya `cloudflared` yang melakukan outbound ke
Cloudflare. `8080:80` dipublikasikan pada service `web` untuk uji lokal
(hapus bila hanya lewat tunnel).

## Prasyarat

- Docker + Docker Compose (Docker Desktop/WSL2 di Windows).
- `backend-node/.env` berisi `GEMINI_API_KEY=...` (dipakai `env_file`).
- Token tunnel Cloudflare (`TUNNEL_TOKEN`), bisa diletakkan di `.env` root atau
  sebagai environment variable shell.

## Build & jalankan

```bash
# tanpa tunnel (uji lokal)
docker compose up -d --build web ai
curl http://localhost:8080/            # 200, title ANPR SPBU
curl http://localhost:8080/ai/health   # {"status":"ok",...}

# dengan tunnel bawaan compose (hanya bila belum ada tunnel sendiri)
docker compose --profile tunnel up -d --build
docker compose logs -f cloudflared     # tunggu "Registered tunnel connection"
```

Hentikan: `docker compose down` (tambahkan `-v` bila ingin membuang network).

## Kalau tunnel Cloudflare sudah ada di server

Service `cloudflared` di compose ini **tidak dijalankan** secara default
(`profiles: ["tunnel"]`). Gunakan tunnel yang sudah ada dengan salah satu cara:

### Opsi A (disarankan): container tunnel ikut network stack ini

Compose ini memakai network bernama tetap `anpr_spbu_internal`:

```bash
docker compose up -d --build web ai
docker network connect anpr_spbu_internal <nama-container-tunnel>
```

Lalu di dashboard Zero Trust, public hostname `anpr.<domain>` → service
`http://web:80` (tanpa path; `/ai` diproksi internal oleh Caddy).

Agar permanen (tetap tersambung setelah restart), tambahkan di compose milik tunnel:

```yaml
services:
  cloudflared:
    networks: [anpr_spbu_internal]

networks:
  anpr_spbu_internal:
    external: true
```

### Opsi B: lewat port host (tanpa menyentuh network)

`web` dipublikasikan ke `127.0.0.1:8080` di host. Arahkan ingress tunnel ke:

- Docker Desktop (Windows/macOS): `http://host.docker.internal:8080`
- Linux: `http://172.17.0.1:8080`, atau tambahkan
  `extra_hosts: ["host.docker.internal:host-gateway"]` pada service tunnel lalu
  pakai `http://host.docker.internal:8080`

Kelebihan: tidak perlu join network. Kekurangan: port host harus tetap hidup dan
trafik keluar-masuk host satu kali ekstra.

### Verifikasi

```bash
docker compose up -d --build web ai
curl http://127.0.0.1:8080/ai/health      # 200 {"status":"ok",...}
docker logs --tail 20 <nama-container-tunnel>   # cek tidak ada error ingress
curl -I https://anpr.<domain>/            # 200 via Cloudflare
curl    https://anpr.<domain>/ai/health   # 200 JSON
```

Jangan jalankan `docker compose --profile tunnel up` bila tunnel sendiri sudah
aktif (dua koneksi tunnel dengan kredensial sama tidak diperlukan).

## Konfigurasi Cloudflare (Zero Trust)

1. Zero Trust → Networks → Tunnels → **Create tunnel** → pilih Docker → salin token.
2. Isi `TUNNEL_TOKEN` di `.env`.
3. Public hostname: `anpr.<domain>` → service `http://web:80` (tanpa path khusus;
   `/ai` sudah diproksi internal oleh Caddy).
4. Disarankan:
   - **Access policy** (email OTP / Google) untuk seluruh hostname — login aplikasi
     masih dummy, jadi ini lapisan autentikasi nyata.
   - **WAF rate limit** untuk path `/ai/*` (mis. 30 request/menit/IP) agar kuota
     Gemini tidak tersedot.
5. TLS otomatis oleh Cloudflare; origin tetap HTTP sehingga tidak perlu sertifikat
   di server.

## Struktur file

| File | Isi |
| --- | --- |
| `docker-compose.yml` | service `web`, `ai`, `cloudflared`, network `internal` |
| `frontend/Dockerfile` | stage build Node 24 → `dist/`, stage runtime Caddy + aset PWA |
| `frontend/Caddyfile` | serve SPA + proxy `/ai/*` ke `ai:8000` |
| `backend-node/Dockerfile` | Node 24 slim, non-root, healthcheck `/health` |
| `.dockerignore` | mengecualikan `vendor/`, `node_modules/`, `public/app/`, `.env` |

## Variabel penting

| Variabel | Di mana | Arti |
| --- | --- | --- |
| `GEMINI_API_KEY` | `backend-node/.env` | kunci Gemini (jangan commit) |
| `TUNNEL_TOKEN` | `.env` root / shell | token tunnel Cloudflare |
| `HOST`, `PORT` | compose (`ai`) | `0.0.0.0:8000` di dalam network Docker |
| `VITE_BUILD_BASE`, `VITE_BUILD_HTML`, `VITE_BUILD_OUTDIR` | `frontend/Dockerfile` | build statis `base=/`, output `dist/` |
| `VITE_AI_URL` | `frontend/Dockerfile` | `/ai/analyze-vehicle` (same-origin lewat Caddy) |

## Troubleshooting

| Gejala | Penyebab / solusi |
| --- | --- |
| `cloudflared` restart terus | `TUNNEL_TOKEN` kosong/salah → cek `docker compose logs cloudflared` |
| 502 pada `/ai/*` | service `ai` belum sehat → `docker compose logs ai`, cek `GEMINI_API_KEY` |
| Halaman blank + 404 aset | base build salah; pastikan `VITE_BUILD_BASE=/` dan `VITE_BUILD_HTML=1` |
| Kamera/Auto Scan tidak jalan | akses harus `https://` lewat domain Cloudflare (bukan `http://IP:8080`) |
| Manifest/PWA tidak aktif | cek `https://<domain>/manifest.webmanifest` 200 dan `sw.js` terdaftar di DevTools → Application |
| Perubahan tidak muncul | cache service worker lama → DevTools → Application → Unregister + Clear storage, atau naikkan versi cache di `public/sw.js` |
| `sharp` gagal install | pastikan image `node:24-bookworm-slim` (glibc), bukan alpine/musl |

## Catatan

- Data transaksi tetap di `localStorage` perangkat (mode `local`). Container `web`
  stateless; tidak ada volume data.
- Service `ai` tidak menyimpan gambar.
- Saat CI4 ditambahkan: tambah service `php`, ubah build frontend ke `base=/app/`
  (tanpa `VITE_BUILD_HTML`), dan arahkan ingress tunnel ke service PHP.
