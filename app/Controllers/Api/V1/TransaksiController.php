<?php

namespace App\Controllers\Api\V1;

use App\Libraries\Plate;
use App\Services\TransaksiService;
use CodeIgniter\HTTP\ResponseInterface;

class TransaksiController extends BaseApiController
{
    private TransaksiService $transaksi;

    public function __construct()
    {
        $this->transaksi = new TransaksiService();
    }

    public function index(): ResponseInterface
    {
        $tanggal = $this->request->getGet('tanggal');
        $plat    = $this->request->getGet('plat');

        $rows = is_string($tanggal) && $tanggal === date('Y-m-d')
            ? $this->transaksi->today()
            : $this->transaksi->all();

        if (is_string($plat) && trim($plat) !== '') {
            $key  = Plate::normalise($plat);
            $rows = array_values(array_filter($rows, static fn (array $t): bool => str_contains($t['plat'], $key)));
        }

        $totalLiter = array_sum(array_map(static fn (array $t): float => (float) $t['liter'], $rows));

        return $this->ok($rows, [
            'total'   => count($rows),
            'liter'   => round($totalLiter, 2),
            'tanggal' => date('Y-m-d'),
        ]);
    }

    public function create(): ResponseInterface
    {
        $rules   = [
            'plat'  => 'required|max_length[12]',
            'bbm'   => 'required|in_list[' . implode(',', TransaksiService::BBM_TYPES) . ']',
            'liter' => 'required|decimal|greater_than[0]|less_than_equal_to[100]',
        ];
        $payload = (array) ($this->request->getJSON(true) ?? []);

        if (! $this->validateData($payload, $rules)) {
            return $this->fail('Data transaksi tidak valid.', 422, $this->validator->getErrors());
        }

        $plat = (string) ($payload['plat'] ?? '');

        if (! Plate::isValid($plat)) {
            return $this->fail('Nomor plat tidak valid.', 422, ['plat' => 'Nomor plat tidak valid.']);
        }

        $row = $this->transaksi->create($plat, (string) $payload['bbm'], (float) $payload['liter']);

        return $this->created($row);
    }

    public function delete(int $id): ResponseInterface
    {
        if (! $this->transaksi->delete($id)) {
            return $this->fail('Transaksi tidak ditemukan.', 404);
        }

        return $this->ok(['id' => $id, 'deleted' => true]);
    }
}
