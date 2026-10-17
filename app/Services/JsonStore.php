<?php

namespace App\Services;

use RuntimeException;

/**
 * Tiny JSON document store under writable/app/.
 *
 * Phase 1 stand-in for the database: gives the API real read/write behaviour
 * without a schema. Swapping in models + migrations only touches the services.
 */
final class JsonStore
{
    /**
     * @param list<array<string, mixed>> $seed
     */
    public function __construct(
        private readonly string $file,
        private readonly array $seed = []
    ) {
    }

    private function path(): string
    {
        return WRITEPATH . 'app' . DIRECTORY_SEPARATOR . $this->file;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function all(): array
    {
        $path = $this->path();

        if (! is_file($path)) {
            return $this->seed;
        }

        $rows = json_decode((string) file_get_contents($path), true);

        return is_array($rows) ? array_values($rows) : $this->seed;
    }

    /**
     * Locks the file, hands the rows to $mutator and persists whatever comes back.
     *
     * @param  callable(list<array<string, mixed>>):list<array<string, mixed>> $mutator
     * @return list<array<string, mixed>>
     */
    public function mutate(callable $mutator): array
    {
        $path = $this->path();
        $dir  = dirname($path);

        if (! is_dir($dir) && ! mkdir($dir, 0o775, true) && ! is_dir($dir)) {
            throw new RuntimeException('Tidak bisa membuat direktori data: ' . $dir);
        }

        $handle = fopen($path, 'c+');

        if ($handle === false) {
            throw new RuntimeException('Tidak bisa membuka file data: ' . $path);
        }

        try {
            flock($handle, LOCK_EX);
            $raw  = stream_get_contents($handle);
            $rows = $raw === false || $raw === '' ? $this->seed : (json_decode($raw, true) ?: $this->seed);
            $rows = $mutator($rows);

            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, (string) json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            fflush($handle);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }

        return $rows;
    }
}
