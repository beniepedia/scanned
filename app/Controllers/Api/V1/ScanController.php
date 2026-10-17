<?php

namespace App\Controllers\Api\V1;

use App\Libraries\Plate;
use App\Services\MotorService;
use App\Services\TransaksiService;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Turns OCR/free text into a normalised plate, then reports what the operator
 * should see next (unknown vehicle / already refuelled today / clear to fill).
 *
 * The OCR itself runs in the browser (tesseract.js); this endpoint is the
 * server-side fallback and the place a server OCR would plug in later.
 */
class ScanController extends BaseApiController
{
    public function store(): ResponseInterface
    {
        $payload = (array) ($this->request->getJSON(true) ?? []);

        if (! $this->validateData($payload, ['text' => 'required|max_length[500]'])) {
            return $this->fail('Teks hasil scan kosong.', 422, $this->validator->getErrors());
        }

        $plat = Plate::extract((string) $payload['text']);

        if ($plat === null) {
            return $this->fail('Nomor plat tidak terbaca. Coba foto ulang atau input manual.', 422);
        }

        $motor = (new MotorService())->find($plat);

        return $this->ok([
            'plat'            => $plat,
            'plat_formatted'  => Plate::format($plat),
            'motor'           => $motor,
            'sudah_isi_hari_ini' => (new TransaksiService())->existsToday($plat),
        ]);
    }
}
