<?php

namespace App\Imports;

use App\Models\Opd;
use App\Models\Paket;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;

class PaketImport implements ToCollection, WithCalculatedFormulas
{
    private int    $tahun;
    private ?string $defaultOpdId;
    private string $sumberDana;

    private array $errors       = [];
    private int   $inserted     = 0;
    private array $processedCodes = [];

    // ---------------------------------------------------------------------------
    // Column alias map  –  canonical key → accepted header strings (UPPERCASE)
    // ---------------------------------------------------------------------------
    private const COL = [
        'name'           => ['PAKET PEKERJAAN', 'NAMA PEKERJAAN', 'NAMA PAKET', 'PEKERJAAN', 'PAKET', 'NAMA KEGIATAN', 'KEGIATAN PEKERJAAN'],
        'pagu'           => ['PAGU ANGGARAN', 'PAGU', 'ANGGARAN', 'NILAI PAGU', 'DIPA'],
        'nilai'          => ['NILAI KONTRAK', 'KONTRAK', 'NILAI', 'HARGA KONTRAK', 'HPS'],
        'nilaiRealisasi' => ['NILAI REALISASI', 'REALISASI KEUANGAN', 'KEUANGAN', 'REALISASI'],
        'pelaksana'      => ['PELAKSANA', 'KONTRAKTOR', 'REKANAN', 'PENYEDIA', 'NAMA PELAKSANA'],
        'sumberDana'     => ['SUMBER DANA', 'DANA', 'SUMBER'],
        'lokasi'         => ['LOKASI', 'TEMPAT', 'WILAYAH', 'KECAMATAN', 'ALAMAT'],
        'keterangan'     => ['KET', 'KETERANGAN', 'CATATAN', 'INFO'],
        'tahun'          => ['TAHUN', 'TAHUN ANGGARAN', 'TA'],
        'progresFisik'   => ['PROGRES FISIK', 'FISIK', 'FISIK(%)', 'PROGRES', 'REALISASI FISIK'],
        'progresKeuangan'=> ['KEUANGAN (%)', 'PROGRES KEUANGAN', 'REALISASI KEUANGAN (%)'],
        'nomorKontrak'   => ['NOMOR KONTRAK', 'NO KONTRAK', 'KODE KONTRAK'],
        'noSPMK'         => ['NO SPMK', 'SPMK', 'NOMOR SPMK'],
        'tanggalMulai'   => ['SPMK MULAI', 'MULAI', 'TGL MULAI', 'TANGGAL MULAI', 'KONTRAK MULAI'],
        'tanggalSelesai' => ['SPMK SELESAI', 'SELESAI', 'TGL SELESAI', 'TANGGAL SELESAI', 'KONTRAK SELESAI'],
        'kegiatan'       => ['KEGIATAN', 'PROGRAM', 'SUB KEGIATAN'],
        'kodeRekening'   => ['KODE REKENING', 'KODE', 'REKENING'],
        'opdCode'        => ['OPD', 'OPD CODE', 'KODE OPD', 'INSTANSI'],
        'kategori'       => ['KATEGORI', 'JENIS', 'JENIS PEKERJAAN', 'JENIS PENGADAAN'],
    ];

    private const VALID_KATEGORI = [
        'KONSTRUKSI'  => 'KONSTRUKSI',
        'KONSTRUSI'   => 'KONSTRUKSI',   // typo tolerance
        'KONSULTANSI' => 'KONSULTANSI',
        'KONSULTAN'   => 'KONSULTANSI',
        'BARANG'      => 'BARANG',
        'JASA_LAINNYA'=> 'JASA_LAINNYA',
        'JASA LAINNYA'=> 'JASA_LAINNYA',
        'JASA'        => 'JASA_LAINNYA',
    ];

    // Keywords used to auto-detect the header row
    private const KEYWORDS = [
        'PAKET PEKERJAAN', 'NAMA PEKERJAAN', 'PEKERJAAN',
        'NILAI KONTRAK', 'PAGU ANGGARAN', 'PELAKSANA', 'PAKET',
    ];

    // ---------------------------------------------------------------------------

    public function __construct(int $tahun, ?string $defaultOpdId = null, string $sumberDana = 'APBD')
    {
        $this->tahun        = $tahun;
        $this->defaultOpdId = $defaultOpdId;
        $this->sumberDana   = $sumberDana ?: 'APBD';
    }

    // ---------------------------------------------------------------------------
    // Main entry point
    // ---------------------------------------------------------------------------

    public function collection(Collection $rows): void
    {
        $rowsArray = $rows->toArray();

        $headerRowIdx  = $this->detectHeaderRow($rowsArray);
        $bannerOpdName = $this->scanBannerOpd($rowsArray, $headerRowIdx);
        $opds          = Opd::select('id', 'code', 'name')->get()->toArray();
        $sheetOpdId    = $bannerOpdName ? $this->resolveOpd($bannerOpdName, $opds) : null;
        $sheetOpdId  ??= $this->defaultOpdId;

        // Merge the two-row header: row N has main labels, row N+1 has sub-labels
        // (SPMK→MULAI/SELESAI, PROGRES→FISIK%/KEUANGAN%, SUMBER→DANA).
        // For each index, keep sub-row value when the main row cell is empty.
        $headerRow    = $rowsArray[$headerRowIdx]     ?? [];
        $subHeaderRow = $rowsArray[$headerRowIdx + 1] ?? [];
        $mergedHeader = $this->mergeHeaderRows($headerRow, $subHeaderRow);
        $colMap = $this->buildHeaderMap($mergedHeader);
        $colMap = $this->applyLayoutFallbacks($colMap);

        DB::transaction(function () use ($rowsArray, $headerRowIdx, $mergedHeader, $colMap, $opds, $sheetOpdId, $bannerOpdName): void {
            $autoCodeNum    = $this->nextAutoCodeNum($this->tahun, $sheetOpdId);
            $currentSection = ['kodeRekening' => null, 'kegiatan' => null];

            for ($i = $headerRowIdx + 1; $i < count($rowsArray); $i++) {
                $row    = $rowsArray[$i];
                $rowNum = $i + 1;

                if ($this->isHeaderLikeRow($row, $colMap)) {
                    continue;
                }

                $rawName = $this->resolveName($row, $colMap, $mergedHeader);
                $pagu    = $this->parseNum($this->getCell($row, $colMap, 'pagu'));
                $nilai   = $this->parseNum($this->getCell($row, $colMap, 'nilai'));

                // Section-header rows (lines starting with ':' or bare account codes)
                $section        = $this->parseSectionHeader($rawName);
                $hasPackageValue = $pagu > 0 || $nilai > 0
                    || $this->parseNum($this->getCell($row, $colMap, 'nilaiRealisasi')) > 0;

                if ($section !== false && ! $hasPackageValue) {
                    $currentSection = $section;
                    continue;
                }

                if ($this->isTotalRow($rawName) || $rawName === '') {
                    continue;
                }

                // --- Resolve OPD ---
                $rawOpdCode  = trim((string) ($this->getCell($row, $colMap, 'opdCode') ?? ''));
                $resolvedOpdId = ($rawOpdCode ? $this->resolveOpd($rawOpdCode, $opds) : null) ?? $sheetOpdId;

                if (! $resolvedOpdId) {
                    $hint = (! isset($colMap['opdCode']) && ! $bannerOpdName)
                        ? 'pilih OPD/Instansi di form import'
                        : "OPD '{$rawOpdCode}' tidak ditemukan di database";
                    $this->errors[] = "Baris {$rowNum}: {$hint} — dimasukkan ke OPD UNKNOWN";
                    $resolvedOpdId  = $this->fallbackOpdId();
                }

                // --- Scalar fields ---
                $nilaiRealisasi  = $this->parseNum($this->getCell($row, $colMap, 'nilaiRealisasi'));
                $progresFisik    = $this->parsePct($this->getCell($row, $colMap, 'progresFisik'));
                $progresKeuangan = $this->parsePct($this->getCell($row, $colMap, 'progresKeuangan'));
                $pelaksana       = $this->str($this->getCell($row, $colMap, 'pelaksana')) ?: null;
                $lokasi          = $this->str($this->getCell($row, $colMap, 'lokasi'))    ?: '-';
                $keterangan      = $this->str($this->getCell($row, $colMap, 'keterangan')) ?: null;
                $sumberDana      = $this->str($this->getCell($row, $colMap, 'sumberDana')) ?: $this->sumberDana;
                $tahunRow        = (int) ($this->getCell($row, $colMap, 'tahun') ?? 0) ?: $this->tahun;
                $nomorKontrak    = $this->str($this->getCell($row, $colMap, 'nomorKontrak')) ?: null;
                $noSPMK          = $this->str($this->getCell($row, $colMap, 'noSPMK'))       ?: null;
                $kegiatan        = $this->str($this->getCell($row, $colMap, 'kegiatan'))
                                    ?: ($currentSection['kegiatan'] ?? $rawName);
                $kodeRekening    = $this->str($this->getCell($row, $colMap, 'kodeRekening'))
                                    ?: ($currentSection['kodeRekening'] ?? null);
                $tanggalMulai    = $this->parseDate($this->getCell($row, $colMap, 'tanggalMulai'));
                $tanggalSelesai  = $this->parseDate($this->getCell($row, $colMap, 'tanggalSelesai'));

                // --- Kategori ---
                $rawKategori = $this->norm((string) ($this->getCell($row, $colMap, 'kategori') ?? ''));
                $kategori    = self::VALID_KATEGORI[$rawKategori]
                            ?? $this->inferKategori($rawName . ' ' . $kegiatan);

                // --- Auto-code (deterministic per import run) ---
                $code = sprintf('PK-%d-%04d', $tahunRow, $autoCodeNum++);
                $this->processedCodes[] = $code;

                try {
                    Paket::updateOrCreate(
                        ['code' => $code],
                        [
                            'name'             => $rawName,
                            'opd_id'           => $resolvedOpdId,
                            'kegiatan'         => $kegiatan,
                            'kode_rekening'    => $kodeRekening,
                            'kategori'         => $kategori,
                            'pagu'             => $pagu,
                            'nilai'            => $nilai,
                            'nilai_realisasi'  => $nilaiRealisasi,
                            'pelaksana'        => $pelaksana,
                            'sumber_dana'      => $sumberDana,
                            'lokasi'           => $lokasi,
                            'keterangan'       => $keterangan,
                            'progres'          => $progresFisik,
                            'nomor_kontrak'    => $nomorKontrak,
                            'no_spmk'          => $noSPMK,
                            'tanggal_mulai'    => $tanggalMulai,
                            'tanggal_selesai'  => $tanggalSelesai,
                            'tahun'            => $tahunRow,
                            'status'           => 'ACTIVE',
                        ]
                    );
                    $this->inserted++;
                } catch (\Throwable $e) {
                    $this->errors[] = "Baris {$rowNum}: " . $e->getMessage();
                }
            }
        });
    }

    // ---------------------------------------------------------------------------
    // Header detection
    // ---------------------------------------------------------------------------

    private function detectHeaderRow(array $rows): int
    {
        foreach (array_slice($rows, 0, 20, true) as $idx => $row) {
            $hits = 0;
            foreach ($row as $cell) {
                $n = $this->norm((string) $cell);
                foreach (self::KEYWORDS as $kw) {
                    if ($n === $kw || str_contains($n, $kw)) {
                        $hits++;
                        break;
                    }
                }
            }
            if ($hits >= 2) {
                return $idx;
            }
        }
        return 0;
    }

    private function scanBannerOpd(array $rows, int $headerIdx): ?string
    {
        for ($r = 0; $r < min($headerIdx, count($rows)); $r++) {
            $row = array_values($rows[$r]);
            foreach ($row as $idx => $cell) {
                $text = trim((string) $cell);
                if (preg_match('/^(?:OPD|PD|INSTANSI)\s*[:\-–]?$/i', $text)) {
                    for ($next = $idx + 1; $next < count($row); $next++) {
                        $value = trim((string) ($row[$next] ?? ''));
                        if ($value !== '') {
                            return $value;
                        }
                    }
                }
            }
            foreach ($rows[$r] as $cell) {
                if (preg_match('/^(?:OPD|PD|INSTANSI)\s*[:\-–]\s*(.+)/i', trim((string) $cell), $m)) {
                    return trim($m[1]);
                }
            }
        }
        return null;
    }

    // ---------------------------------------------------------------------------
    // Column map
    // ---------------------------------------------------------------------------

    private function mergeHeaderRows(array $headerRow, array $subHeaderRow): array
    {
        $merged = $headerRow;
        $lastMain = '';

        $max = max(count($headerRow), count($subHeaderRow));
        for ($idx = 0; $idx < $max; $idx++) {
            $main = $this->str($headerRow[$idx] ?? '');
            $sub  = $this->str($subHeaderRow[$idx] ?? '');

            if ($main !== '') {
                $lastMain = $main;
            }

            if ($main === '' && $sub !== '') {
                $merged[$idx] = trim($lastMain . ' ' . $sub);
                continue;
            }

            if ($main !== '' && $sub !== '') {
                $merged[$idx] = trim($main . ' ' . $sub);
            }
        }

        return $merged;
    }

    private function applyLayoutFallbacks(array $map): array
    {
        if (! isset($map['name'])) {
            return $map;
        }

        $nameIdx = $map['name'];
        $fallbacks = [
            'pagu'            => $nameIdx + 1,
            'nilai'           => $nameIdx + 2,
            'pelaksana'       => $nameIdx + 4,
            'tanggalMulai'    => $nameIdx + 5,
            'tanggalSelesai'  => $nameIdx + 6,
            'progresFisik'    => $nameIdx + 7,
            'progresKeuangan' => $nameIdx + 8,
            'sumberDana'      => $nameIdx + 9,
            'lokasi'          => $nameIdx + 10,
            'keterangan'      => $nameIdx + 11,
        ];

        foreach ($fallbacks as $key => $idx) {
            $map[$key] ??= $idx;
        }

        return $map;
    }

    /**
     * Build a map of  canonical key → column index.
     *
     * Matching priority (longest alias first within each key) prevents a short
     * alias like 'NILAI' from stealing a column that a longer alias 'NILAI REALISASI'
     * should own.  Each column index is assigned to the FIRST key whose alias
     * matches; subsequent keys cannot steal it.
     */
    private function buildHeaderMap(array $headerRow): array
    {
        $map        = [];   // canonical key  → col index
        $claimedIdx = [];   // col index       → canonical key (to prevent stealing)

        // Sort aliases longest-first so more-specific matches win
        $sortedCOL = self::COL;
        foreach ($sortedCOL as $key => &$aliases) {
            usort($aliases, fn($a, $b) => strlen($b) - strlen($a));
        }
        unset($aliases);

        foreach ($sortedCOL as $key => $aliases) {
            foreach ($headerRow as $colIdx => $rawHeader) {
                if (isset($claimedIdx[$colIdx])) {
                    continue;  // already owned by a more specific key
                }
                $n = $this->norm((string) $rawHeader);
                foreach ($aliases as $alias) {
                    if ($this->headerMatches($n, $alias)) {
                        $map[$key]           = $colIdx;
                        $claimedIdx[$colIdx] = $key;
                        break 2;
                    }
                }
            }
        }

        return $map;
    }

    private function headerMatches(string $normalizedHeader, string $alias): bool
    {
        $normalizedAlias = $this->norm($alias);

        if ($normalizedHeader === $normalizedAlias || str_starts_with($normalizedHeader, $normalizedAlias)) {
            return true;
        }

        $compactHeader = str_replace(' ', '', $normalizedHeader);
        $compactAlias  = str_replace(' ', '', $normalizedAlias);

        return $compactHeader === $compactAlias || str_starts_with($compactHeader, $compactAlias);
    }

    // ---------------------------------------------------------------------------
    // Cell helpers
    // ---------------------------------------------------------------------------

    private function getCell(array $row, array $colMap, string $key): mixed
    {
        $idx = $colMap[$key] ?? null;
        return ($idx !== null && array_key_exists($idx, $row)) ? $row[$idx] : null;
    }

    private function isHeaderLikeRow(array $row, array $colMap): bool
    {
        $name = $this->norm((string) ($this->getCell($row, $colMap, 'name') ?? ''));
        if ($name === '') {
            return false;
        }

        return in_array($name, ['PAKET PEKERJAAN', 'NAMA PEKERJAAN', 'PEKERJAAN'], true);
    }

    /** Trim to string, return '' when empty. */
    private function str(mixed $val): string
    {
        return trim((string) ($val ?? ''));
    }

    private function resolveName(array $row, array $colMap, array $headerRow): string
    {
        $name = $this->str($this->getCell($row, $colMap, 'name'));
        if ($name !== '') {
            return $name;
        }
        // Fallback: first cell whose header contains PAKET / PEKERJAAN / NAMA
        foreach ($headerRow as $colIdx => $header) {
            $n = $this->norm((string) $header);
            if (str_contains($n, 'PAKET') || str_contains($n, 'PEKERJAAN') || str_contains($n, 'NAMA')) {
                $v = $this->str($row[$colIdx] ?? '');
                if ($v !== '') {
                    return $v;
                }
            }
        }
        return '';
    }

    // ---------------------------------------------------------------------------
    // OPD resolution
    // ---------------------------------------------------------------------------

    private function resolveOpd(string $rawName, array $opds): ?string
    {
        $n = $this->norm($rawName);
        if ($n === '') {
            return null;
        }

        // 1. Exact code match
        foreach ($opds as $o) {
            if ($this->norm((string) $o['code']) === $n) {
                return (string) $o['id'];
            }
        }

        // 2. Exact name match
        foreach ($opds as $o) {
            if ($this->norm((string) $o['name']) === $n) {
                return (string) $o['id'];
            }
        }

        // 3. Word-score match (meaningful words only, length > 3)
        $searchWords = array_filter(explode(' ', $n), fn($w) => strlen($w) > 3);
        if ($searchWords) {
            $bestId    = null;
            $bestScore = 0;
            foreach ($opds as $o) {
                $nameWords = array_filter(explode(' ', $this->norm((string) $o['name'])), fn($w) => strlen($w) > 3);
                $score     = count(array_intersect($searchWords, $nameWords));
                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestId    = (string) $o['id'];
                }
            }
            if ($bestScore >= 1) {
                return $bestId;
            }
        }

        // 4. DB LIKE fallback
        return Opd::where('name', 'like', '%' . $rawName . '%')
            ->orWhere('code', 'like', '%' . $rawName . '%')
            ->value('id');
    }

    private function fallbackOpdId(): string
    {
        return (string) Opd::firstOrCreate(
            ['code' => 'UNKNOWN'],
            [
                'name'      => 'OPD Belum Teridentifikasi',
                'kepala'    => null,
                'contact'   => null,
                'address'   => null,
                'is_active' => true,
            ]
        )->id;
    }

    private function nextAutoCodeNum(int $year, ?string $opdId): int
    {
        if ($opdId) {
            $firstExistingForOpd = Paket::where('tahun', $year)
                ->where('opd_id', $opdId)
                ->where('code', 'like', "PK-{$year}-%")
                ->orderByRaw('CAST(SUBSTRING_INDEX(code, "-", -1) AS UNSIGNED) ASC')
                ->value('code');

            if ($firstExistingForOpd && preg_match('/(\d+)$/', $firstExistingForOpd, $m)) {
                return (int) $m[1];
            }
        }

        $latestCode = Paket::where('code', 'like', "PK-{$year}-%")
            ->orderByRaw('CAST(SUBSTRING_INDEX(code, "-", -1) AS UNSIGNED) DESC')
            ->value('code');

        if ($latestCode && preg_match('/(\d+)$/', $latestCode, $m)) {
            return ((int) $m[1]) + 1;
        }

        return Paket::where('tahun', $year)->count() + 1;
    }

    // ---------------------------------------------------------------------------
    // Stale-row cleanup
    // ---------------------------------------------------------------------------

    /**
     * Delete rows from previous imports for the same year(s) that were NOT
     * present in this import run.
     */
    private function deleteStaleRows(): void
    {
        if (empty($this->processedCodes)) {
            return;
        }

        $years = collect($this->processedCodes)
            ->map(fn($code) => (int) (explode('-', $code)[1] ?? 0))
            ->filter()
            ->unique()
            ->values();

        foreach ($years as $year) {
            Paket::where('tahun', $year)
                ->where('code', 'like', "PK-{$year}-%")
                ->whereNotIn('code', $this->processedCodes)
                ->delete();
        }
    }

    // ---------------------------------------------------------------------------
    // Row classifiers
    // ---------------------------------------------------------------------------

    /**
     * Returns section data array when the row is a section header, false otherwise.
     *
     * Rules:
     *   • A line starting with ':' is always a section header.
     *   • A bare account code (e.g. "1.03.10.2.01.0028") with NO additional
     *     meaningful text after it is a section header.
     *   • A line that starts with digits+dots but has substantial text after it
     *     is treated as a package name, NOT a section header.
     *
     * @return array{kodeRekening:string|null,kegiatan:string|null}|false
     */
    private function parseSectionHeader(string $name): array|false
    {
        $n = trim($name);
        if ($n === '') {
            return false;
        }

        // Explicit ':' prefix – always a section header
        if (str_starts_with($n, ':')) {
            $stripped = ltrim(substr($n, 1), ' ');
            if (preg_match('/^([\d.]+)\s*(.*)/', $stripped, $m)) {
                return ['kodeRekening' => trim($m[1]), 'kegiatan' => trim($m[2]) ?: $stripped];
            }
            return ['kodeRekening' => null, 'kegiatan' => $stripped];
        }

        // Bare account code pattern:  digits.digits.digits[...] with NOTHING after,
        // or at most a very short suffix (≤ 4 words).  Longer text = package name.
        if (preg_match('/^(\d+\.\d+\.\d+[\d.]*)\s+(.*)/', $n, $m)) {
            $suffix     = trim($m[2]);
            $wordCount  = count(array_filter(explode(' ', $suffix)));
            if ($wordCount <= 4) {
                // Treat as section header (e.g. "1.03.10.2.01.0028 Pengelolaan Leger Jalan")
                return ['kodeRekening' => trim($m[1]), 'kegiatan' => $suffix ?: null];
            }
            // More than 4 words → likely a package name that starts with a code
            return false;
        }

        return false;
    }

    private function isTotalRow(string $name): bool
    {
        $n = $this->norm($name);
        return (bool) preg_match(
            '/^(JUMLAH|TOTAL|SUB TOTAL|SUBTOTAL|GRAND TOTAL|JUMLAH TOTAL|REKAPITULASI|REKAP)(\s|$)/',
            $n
        );
    }

    // ---------------------------------------------------------------------------
    // Type parsers
    // ---------------------------------------------------------------------------

    private function norm(string $s): string
    {
        return trim(preg_replace('/\s+/', ' ', preg_replace('/[^A-Z0-9 ]/', ' ', strtoupper($s))));
    }

    private function parseNum(mixed $raw): float
    {
        if ($raw === null || $raw === '') {
            return 0.0;
        }
        if (is_numeric($raw)) {
            return (float) $raw;
        }
        $s         = trim((string) $raw);
        $lastDot   = strrpos($s, '.');
        $lastComma = strrpos($s, ',');

        if ($lastComma !== false && ($lastDot === false || $lastComma > $lastDot)) {
            // Indonesian format: 1.234.567,89
            $s = str_replace(['.', ','], ['', '.'], $s);
        } else {
            // US format: 1,234,567.89
            $s = str_replace(',', '', $s);
        }
        return (float) preg_replace('/[^0-9.]/', '', $s);
    }

    /**
     * Parse a percentage value that is stored as a plain number in the sheet
     * (e.g. "75" means 75 %, stored as 75.00 in the database).
     *
     * If the value looks like a decimal fraction ≤ 1 (e.g. 0.75) we multiply
     * by 100 as a safety net for edge-case cells.
     */
    private function parsePct(mixed $raw): float
    {
        $v = $this->parseNum($raw);
        if ($v > 0 && $v <= 1) {
            $v *= 100;   // 0.75 → 75
        }
        return $v;
    }

    private function parseDate(mixed $raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        // WithCalculatedFormulas already resolves date cells to DateTime objects
        if ($raw instanceof \DateTimeInterface) {
            return $raw->format('Y-m-d');
        }
        if (is_numeric($raw)) {
            try {
                $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float) $raw);
                return $date->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }
        $s = trim((string) $raw);
        foreach (['d/m/Y', 'd-m-Y', 'd.m.Y', 'Y-m-d'] as $format) {
            $date = \DateTimeImmutable::createFromFormat('!' . $format, $s);
            if ($date instanceof \DateTimeImmutable) {
                return $date->format('Y-m-d');
            }
        }

        $ts = strtotime($s);
        return $ts ? date('Y-m-d', $ts) : null;
    }

    private function inferKategori(string $text): string
    {
        $t = $this->norm($text);
        if (preg_match('/KONSULTAN|PERENCANAAN|PENGAWASAN|SUPERVISI|STUDI|KAJIAN|DED|AUDIT|SURVEY/', $t)) {
            return 'KONSULTANSI';
        }
        if (preg_match('/BARANG|ALAT|KENDARAAN|KOMPUTER|MEBEL|FURNITURE|SERAGAM/', $t)) {
            return 'BARANG';
        }
        if (preg_match('/PEMELIHARAAN|CLEANING|JASA LAIN|OPERASIONAL|LAUNDRY|KEBERSIHAN|KEAMANAN|SECURITY/', $t)) {
            return 'JASA_LAINNYA';
        }
        return 'KONSTRUKSI';
    }

    // ---------------------------------------------------------------------------
    // Public accessors
    // ---------------------------------------------------------------------------

    public function getErrors(): array { return $this->errors; }
    public function getInserted(): int  { return $this->inserted; }
}
