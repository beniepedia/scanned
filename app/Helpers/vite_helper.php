<?php

use CodeIgniter\Config\Services;

/**
 * Emits the tags for the Svelte entry point.
 *
 * Production: reads public/app/.vite/manifest.json (written by `npm run build`).
 * Development: set VITE_DEV=1 in .env and run `npm run dev` in frontend/.
 */
if (! function_exists('vite_asset')) {
    function vite_asset(string $entry = 'src/main.ts'): string
    {
        if ((string) env('VITE_DEV', '0') === '1') {
            // Harus sama dengan `base` di frontend/vite.config.ts.
            $base   = 'http://localhost:5173/app/';
            $client = $base . '@vite/client';
            $main   = $base . ltrim($entry, '/');

            return '<script type="module" src="' . $client . '"></script>'
                . '<script type="module" src="' . $main . '"></script>';
        }

        $manifestPath = FCPATH . 'app/.vite/manifest.json';

        if (! is_file($manifestPath)) {
            return '<style>body{font-family:system-ui;padding:24px;color:#1A1D21}</style>'
                . '<p>Build frontend belum ada. Jalankan:</p>'
                . '<pre>cd frontend
npm install
npm run build</pre>';
        }

        $manifest = json_decode((string) file_get_contents($manifestPath), true) ?: [];
        $chunk    = $manifest[$entry] ?? null;

        if ($chunk === null) {
            log_message('error', 'Vite entry "{entry}" tidak ada di manifest.', ['entry' => $entry]);

            return '';
        }

        $base = base_url('app/');
        $tags = '';

        foreach ($chunk['css'] ?? [] as $css) {
            $tags .= '<link rel="stylesheet" href="' . $base . $css . '">';
        }

        return $tags . '<script type="module" src="' . $base . $chunk['file'] . '"></script>';
    }
}

if (! function_exists('vite_hmr_running')) {
    /**
     * Best-effort check so the shell can warn when VITE_DEV=1 but the dev server is down.
     */
    function vite_hmr_running(): bool
    {
        if ((string) env('VITE_DEV', '0') !== '1') {
            return false;
        }

        $socket = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.2);
        if (is_resource($socket)) {
            fclose($socket);

            return true;
        }

        Services::logger()->warning('VITE_DEV=1 tapi Vite dev server tidak berjalan di :5173');

        return false;
    }
}
