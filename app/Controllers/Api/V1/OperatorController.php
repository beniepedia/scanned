<?php

namespace App\Controllers\Api\V1;

use App\Services\OperatorService;
use CodeIgniter\HTTP\ResponseInterface;

class OperatorController extends BaseApiController
{
    private OperatorService $operators;

    public function __construct()
    {
        $this->operators = new OperatorService();
    }

    public function index(): ResponseInterface
    {
        return $this->ok($this->operators->all());
    }

    public function login(): ResponseInterface
    {
        $rules   = [
            'nomor'    => 'required|max_length[20]',
            'password' => 'required|max_length[72]',
        ];
        $payload = (array) ($this->request->getJSON(true) ?? []);

        if (! $this->validateData($payload, $rules)) {
            return $this->fail('Nomor operator dan password wajib diisi.', 422, $this->validator->getErrors());
        }
        $operator = $this->operators->authenticate((string) ($payload['nomor'] ?? ''), (string) ($payload['password'] ?? ''));

        if ($operator === null) {
            return $this->fail('Nomor operator atau password salah.', 401);
        }

        return $this->ok($operator);
    }
}
