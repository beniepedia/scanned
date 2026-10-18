<?php

namespace App\Services;

use App\Libraries\Plate;

/**
 * @phpstan-type Motor array{plat:string, nama:string, jenis:string}
 */
final class MotorService
{
    private JsonStore $store;

    public function __construct()
    {
        $this->store = new JsonStore('motors.json', self::seed());
    }

    /**
     * @return list<Motor>
     */
    public function all(?string $search = null): array
    {
        $rows = $this->store->all();

        if ($search !== null && trim($search) !== '') {
            $needle = strtoupper(trim($search));
            $rows   = array_values(array_filter(
                $rows,
                static fn (array $m): bool => str_contains(strtoupper($m['plat']), $needle)
                    || str_contains(strtoupper($m['nama']), $needle)
                    || str_contains(strtoupper($m['jenis']), $needle)
            ));
        }

        return $rows;
    }

    /**
     * @return Motor|null
     */
    public function find(string $plat): ?array
    {
        $key = Plate::normalise($plat);

        foreach ($this->store->all() as $motor) {
            if ($motor['plat'] === $key) {
                return $motor;
            }
        }

        return null;
    }

    /**
     * @return Motor
     */
    public function create(
        string $nama,
        string $jenis,
        string $plat,
        ?string $warna = null,
        ?int $berlakuTahun = null,
        ?string $berlakuBulan = null
    ): array {
        $key   = Plate::normalise($plat);
        $motor = ['plat' => $key, 'nama' => trim($nama), 'jenis' => trim($jenis)];

        if ($warna !== null && trim($warna) !== '') {
            $motor['warna'] = strtolower(trim($warna));
        }

        if ($berlakuTahun !== null) {
            $motor['berlakuTahun'] = $berlakuTahun;
        }

        if ($berlakuBulan !== null && trim($berlakuBulan) !== '') {
            $motor['berlakuBulan'] = trim($berlakuBulan);
        }

        $this->store->mutate(static function (array $rows) use ($motor): array {
            foreach ($rows as $row) {
                if ($row['plat'] === $motor['plat']) {
                    return $rows;
                }
            }

            $rows[] = $motor;

            return $rows;
        });

        return $motor;
    }

    public function count(): int
    {
        return count($this->store->all());
    }

    /**
     * @return list<Motor>
     */
    private static function seed(): array
    {
        $seed = [
            ['plat' => 'B1234ABC', 'nama' => 'Andi', 'jenis' => 'Honda Vario 125'],
            ['plat' => 'B5678DEF', 'nama' => 'Budi', 'jenis' => 'Yamaha NMAX'],
            ['plat' => 'D901GHI', 'nama' => 'Citra', 'jenis' => 'Honda Beat'],
            ['plat' => 'B2345JKL', 'nama' => 'Dedi', 'jenis' => 'Suzuki Satria F150'],
            ['plat' => 'F6789MNO', 'nama' => 'Eka', 'jenis' => 'Yamaha Mio M3'],
            ['plat' => 'B3456PQR', 'nama' => 'Fajar', 'jenis' => 'Honda PCX 160'],
            ['plat' => 'AB890STU', 'nama' => 'Gita', 'jenis' => 'Honda Scoopy'],
            ['plat' => 'B4567VWX', 'nama' => 'Hendra', 'jenis' => 'Yamaha Aerox 155'],
            ['plat' => 'N123YZ', 'nama' => 'Intan', 'jenis' => 'Honda Genio'],
            ['plat' => 'B7890QRS', 'nama' => 'Joko', 'jenis' => 'Yamaha Lexi 125'],
        ];

        return $seed;
    }
}
