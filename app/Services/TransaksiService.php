<?php

namespace App\Services;

use App\Libraries\Plate;

/**
 * @phpstan-type Transaksi array{id:int, plat:string, tanggal:string, waktu:string, bbm:string, liter:float}
 */
final class TransaksiService
{
    public const BBM_TYPES = ['Pertalite', 'Pertamax', 'Pertamax Turbo'];

    private JsonStore $store;

    public function __construct()
    {
        $this->store = new JsonStore('transaksi.json', self::seed());
    }

    /**
     * Newest first.
     *
     * @return list<Transaksi>
     */
    public function all(): array
    {
        $rows = $this->store->all();

        usort($rows, static fn (array $a, array $b): int => $b['id'] <=> $a['id']);

        return $rows;
    }

    /**
     * @return list<Transaksi>
     */
    public function today(): array
    {
        $today = date('Y-m-d');

        return array_values(array_filter($this->all(), static fn (array $t): bool => $t['tanggal'] === $today));
    }

    public function existsToday(string $plat): bool
    {
        $key = Plate::normalise($plat);

        foreach ($this->today() as $transaksi) {
            if ($transaksi['plat'] === $key) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return Transaksi
     */
    public function create(string $plat, string $bbm, float $liter): array
    {
        $key = Plate::normalise($plat);
        $row = [
            'id'      => 0,
            'plat'    => $key,
            'tanggal' => date('Y-m-d'),
            'waktu'   => date('H:i'),
            'bbm'     => $bbm,
            'liter'   => $liter,
        ];

        $this->store->mutate(static function (array $rows) use (&$row): array {
            $nextId = 1;

            foreach ($rows as $existing) {
                $nextId = max($nextId, (int) $existing['id'] + 1);
            }

            $row['id'] = $nextId;
            $rows[]    = $row;

            return $rows;
        });

        return $row;
    }

    /**
     * @return Transaksi|null
     */
    public function find(int $id): ?array
    {
        foreach ($this->all() as $transaksi) {
            if ($transaksi['id'] === $id) {
                return $transaksi;
            }
        }

        return null;
    }

    public function delete(int $id): bool
    {
        $deleted = false;

        $this->store->mutate(static function (array $rows) use ($id, &$deleted): array {
            $kept = [];

            foreach ($rows as $row) {
                if ($row['id'] === $id) {
                    $deleted = true;

                    continue;
                }

                $kept[] = $row;
            }

            return $kept;
        });

        return $deleted;
    }

    /**
     * @return list<Transaksi>
     */
    private static function seed(): array
    {
        $today = date('Y-m-d');

        return [
            ['id' => 1, 'plat' => 'B1234ABC', 'tanggal' => $today, 'waktu' => '07:15', 'bbm' => 'Pertalite', 'liter' => 3.5],
            ['id' => 2, 'plat' => 'B5678DEF', 'tanggal' => $today, 'waktu' => '07:42', 'bbm' => 'Pertamax', 'liter' => 4.0],
            ['id' => 3, 'plat' => 'D901GHI', 'tanggal' => $today, 'waktu' => '08:05', 'bbm' => 'Pertalite', 'liter' => 2.0],
        ];
    }
}
