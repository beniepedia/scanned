<?php

namespace App\Controllers\Api\V1;

use App\Libraries\Plate;
use App\Services\MotorService;
use CodeIgniter\HTTP\ResponseInterface;

class MotorController extends BaseApiController
{
    private MotorService $motors;

    public function __construct()
    {
        $this->motors = new MotorService();
    }

    public function index(): ResponseInterface
    {
        $search = $this->request->getGet('q');
        $rows   = $this->motors->all(is_string($search) ? $search : null);

        return $this->ok($rows, ['total' => count($rows)]);
    }

    public function show(string $plat): ResponseInterface
    {
        $motor = $this->motors->find($plat);

        if ($motor === null) {
            return $this->fail('Motor dengan plat ' . Plate::format($plat) . ' belum terdaftar.', 404);
        }

        return $this->ok($motor);
    }

    public function create(): ResponseInterface
    {
        $rules   = [
            'nama'  => 'required|max_length[80]',
            'jenis' => 'required|max_length[80]',
            'plat'  => 'required|max_length[12]',
        ];
        $payload = (array) ($this->request->getJSON(true) ?? []);

        if (! $this->validateData($payload, $rules)) {
            return $this->fail('Data kendaraan belum lengkap.', 422, $this->validator->getErrors());
        }

        if (! Plate::isValid((string) ($payload['plat'] ?? ''))) {
            return $this->fail('Nomor plat tidak valid. Contoh: B 1234 ABC.', 422, [
                'plat' => 'Nomor plat tidak valid.',
            ]);
        }

        $warna = isset($payload['warna']) ? (string) $payload['warna'] : null;

        $tahun = isset($payload['berlakuTahun']) && is_numeric($payload['berlakuTahun'])
            ? (int) $payload['berlakuTahun']
            : null;

        $bulan = isset($payload['berlakuBulan']) && preg_match('/^(0[1-9]|1[0-2])$/', (string) $payload['berlakuBulan']) === 1
            ? (string) $payload['berlakuBulan']
            : null;

        $motor = $this->motors->create(
            (string) $payload['nama'],
            (string) $payload['jenis'],
            (string) $payload['plat'],
            $warna,
            $tahun,
            $bulan
        );

        return $this->created($motor);
    }
}
