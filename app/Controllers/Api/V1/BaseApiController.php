<?php

namespace App\Controllers\Api\V1;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Shared JSON envelope: {success, data, meta} or {success, message, errors}.
 */
abstract class BaseApiController extends BaseController
{
    protected function ok(mixed $data, array $meta = []): ResponseInterface
    {
        return $this->respondWith(200, [
            'success' => true,
            'data'    => $data,
            'meta'    => $meta === [] ? (object) [] : $meta,
        ]);
    }

    protected function created(mixed $data): ResponseInterface
    {
        return $this->respondWith(201, [
            'success' => true,
            'data'    => $data,
            'meta'    => (object) [],
        ]);
    }

    protected function fail(string $message, int $status = 422, array $errors = []): ResponseInterface
    {
        return $this->respondWith($status, [
            'success' => false,
            'message' => $message,
            'errors'  => $errors === [] ? (object) [] : $errors,
        ]);
    }

    private function respondWith(int $status, array $payload): ResponseInterface
    {
        return $this->response
            ->setStatusCode($status)
            ->setHeader('Cache-Control', 'no-store')
            ->setJSON($payload);
    }
}
