<?php

namespace Tests\Unit;

use App\Libraries\Plate;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class PlateTest extends CIUnitTestCase
{
    public function testNormaliseRemovesSeparatorsAndLowercase(): void
    {
        $this->assertSame('B1234ABC', Plate::normalise('b 1234 abc'));
        $this->assertSame('D12AB', Plate::normalise('D-12 AB'));
    }

    public function testIsValidAcceptsIndonesianPlates(): void
    {
        $this->assertTrue(Plate::isValid('B 1234 ABC'));
        $this->assertTrue(Plate::isValid('N 9876 YZ'));
        $this->assertTrue(Plate::isValid('AB 890 STU'));
    }

    public function testIsValidRejectsGarbage(): void
    {
        $this->assertFalse(Plate::isValid('1234'));
        $this->assertFalse(Plate::isValid('B ABC DEF'));
        $this->assertFalse(Plate::isValid(''));
        $this->assertFalse(Plate::isValid(null));
    }

    public function testFormatAddsSpaces(): void
    {
        $this->assertSame('B 1234 ABC', Plate::format('b1234abc'));
        $this->assertSame('AB 890 STU', Plate::format('AB890STU'));
    }

    public function testExtractFindsPlateInNoisyOcrText(): void
    {
        $this->assertSame('B1234ABC', Plate::extract('BOGOR VIHARA B 1234 ABC TERIMA KASIH'));
        $this->assertSame('B1234ABC', Plate::extract('BOGOR VIHARA B1234ABC TERIMA KASIH'));
        $this->assertNull(Plate::extract('no plate found here 112233'));
    }
}
