<?php

namespace App\Libraries;

/**
 * Single source of truth for Indonesian plate handling on the backend.
 * Mirror of frontend/src/lib/utils/plate.ts - keep both in sync.
 */
final class Plate
{
    /** Normalised form: 1-2 letters, 1-4 digits, 1-3 letters, no separator. */
    public const PATTERN = '/^([A-Z]{1,2})([0-9]{1,4})([A-Z]{1,3})$/';

    public static function normalise(?string $raw): string
    {
        return strtoupper((string) preg_replace('/[\s\-]/', '', (string) $raw));
    }

    public static function isValid(?string $raw): bool
    {
        return preg_match(self::PATTERN, self::normalise($raw)) === 1;
    }

    /**
     * "B1234ABC" -> "B 1234 ABC". Returns the input untouched when it is not a valid plate.
     */
    public static function format(?string $raw): string
    {
        $normalised = self::normalise($raw);

        if (preg_match(self::PATTERN, $normalised, $m) !== 1) {
            return $normalised;
        }

        return $m[1] . ' ' . $m[2] . ' ' . $m[3];
    }

    /**
     * Pulls a plate out of free text (AI output, operator notes).
     */
    public static function extract(?string $text): ?string
    {
        $upper = strtoupper((string) $text);

        if (preg_match('/[A-Z]{1,2}\s?[0-9]{1,4}\s?[A-Z]{1,3}/', $upper, $m) === 1) {
            $candidate = preg_replace('/\s/', '', $m[0]);

            if (self::isValid($candidate)) {
                return $candidate;
            }
        }

        $glued = preg_replace('/[^A-Z0-9]/', '', $upper);

        if (preg_match('/[A-Z]{1,2}[0-9]{1,4}[A-Z]{1,3}/', $glued, $m) === 1 && self::isValid($m[0])) {
            return $m[0];
        }

        return null;
    }
}
