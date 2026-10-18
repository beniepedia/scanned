# Konfigurasi vhost (Laragon / Apache)

Target URL: `http://spbu-svelte.test` dan `https://spbu-svelte.test`.

## Document root

Apache **harus** diarahkan ke folder `public/`, bukan root project:

```
D:\WEB APP\www\spbu-svelte\public
```

## File yang dibuat

1. `C:\laragon\etc\apache2\sites-enabled\auto.spbu-svelte.test.conf`

```apache
define ROOT "D:/WEB APP/www/spbu-svelte/public"
define SITE "spbu-svelte.test"

<VirtualHost *:80>
    DocumentRoot "${ROOT}"
    ServerName ${SITE}
    ServerAlias *.${SITE} spbu-svelte.localhost localhost.spbu-svelte.test
    <Directory "${ROOT}">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>

<VirtualHost *:443>
    DocumentRoot "${ROOT}"
    ServerName ${SITE}
    ServerAlias *.${SITE} spbu-svelte.localhost
    <Directory "${ROOT}">
        AllowOverride All
        Require all granted
    </Directory>

    SSLEngine on
    SSLCertificateFile      C:/laragon/etc/ssl/laragon.crt
    SSLCertificateKeyFile   C:/laragon/etc/ssl/laragon.key
</VirtualHost>
```

Tambahkan juga reverse proxy ke backend AI di kedua blok (`*:80` dan `*:443`):

```apache
ProxyPreserveHost On
ProxyPass /ai/ http://127.0.0.1:8000/
ProxyPassReverse /ai/ http://127.0.0.1:8000/
```

Syarat: `mod_proxy` dan `mod_proxy_http` aktif di `httpd.conf`
(`LoadModule proxy_module modules/mod_proxy.so`, `LoadModule proxy_http_module
modules/mod_proxy_http.so`). Backend-node harus berjalan (`cd backend-node && npm start`)
dan hanya mendengarkan `127.0.0.1:8000`.

2. `C:\Windows\System32\drivers\etc\hosts`

```
127.0.0.1      spbu-svelte.test    #laragon magic!
```

`spbu-svelte.localhost` tidak perlu entri hosts — browser memperlakukannya sebagai
secure context (dipakai untuk menguji kamera tanpa sertifikat).

## Aktifkan

Laragon **tidak** memuat vhost baru tanpa restart Apache:

1. Buka aplikasi Laragon.
2. **Stop All**, lalu **Start All** (atau menu Apache → Restart).
3. Cek: `curl -I http://spbu-svelte.test/` → `HTTP/1.1 200 OK`.

Verifikasi konfigurasi tanpa restart:

```bash
"C:\laragon\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe" -t
"C:\laragon\bin\apache\httpd-2.4.54-win64-VS16\bin\httpd.exe" -t -D DUMP_VHOSTS
```

## Kamera & HTTPS

`navigator.mediaDevices.getUserMedia` hanya aktif pada:

- `https://spbu-svelte.test` (sertifikat Laragon, terima peringatan sekali), atau
- `http://spbu-svelte.localhost` / `http://localhost` (secure context), atau
- origin apa pun yang didaftarkan di
  `chrome://flags/#unsafely-treat-insecure-origin-as-secure` (khusus pengujian).

Pada tablet yang mengakses lewat IP LAN (`http://192.168.x.x`), kamera akan
diblokir browser — gunakan HTTPS.

## Tanpa Apache

Untuk pengujian cepat tanpa vhost:

```bash
cd "D:\WEB APP\www\spbu-svelte"
# set sementara di .env:  app.baseURL = 'http://localhost:8080/'
php spark serve --port 8080
```

Kembalikan `app.baseURL` ke `http://spbu-svelte.test/` setelah selesai.
