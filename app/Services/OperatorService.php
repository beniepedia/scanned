<?php

namespace App\Services;

/**
 * Dummy operator directory. Replace with DatabaseOperatorRepository in phase 2.
 *
 * @phpstan-type OperatorRow array{nomor:string, nama:string, password:string}
 */
final class OperatorService
{
    /** @var list<OperatorRow> */
    private const OPERATORS = [
        ['nomor' => '21045', 'nama' => 'Andi', 'password' => '1234'],
        ['nomor' => '21046', 'nama' => 'Budi', 'password' => '1234'],
        ['nomor' => '21047', 'nama' => 'Citra', 'password' => '1234'],
    ];

    /**
     * @return array{nomor:string, nama:string}|null
     */
    public function authenticate(string $nomor, string $password): ?array
    {
        foreach (self::OPERATORS as $operator) {
            if ($operator['nomor'] === trim($nomor) && $operator['password'] === trim($password)) {
                return ['nomor' => $operator['nomor'], 'nama' => $operator['nama']];
            }
        }

        return null;
    }

    /**
     * @return list<array{nomor:string, nama:string}>
     */
    public function all(): array
    {
        return array_map(
            static fn (array $o): array => ['nomor' => $o['nomor'], 'nama' => $o['nama']],
            self::OPERATORS
        );
    }
}
