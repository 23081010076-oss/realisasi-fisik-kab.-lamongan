<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Opd;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private function makeUniqueCode($kode, $instansi, &$seen)
    {
        $words = array_filter(explode(' ', preg_replace('/[^a-zA-Z0-9 ]/', '', $instansi)));
        $words = array_slice($words, 0, 2);
        
        $suffix = '';
        foreach ($words as $w) {
            if (!empty($w)) {
                $suffix .= strtoupper($w[0]);
            }
        }
        
        $candidate = "{$kode}-{$suffix}";
        if (!in_array($candidate, $seen)) {
            return $candidate;
        }
        
        $i = 2;
        while (in_array("{$candidate}{$i}", $seen)) {
            $i++;
        }
        return "{$candidate}{$i}";
    }

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('Mulai Seed User Admin...');
        
        // Seed Admin User
        User::updateOrCreate(
            ['email' => 'admin@lamongan.go.id'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'is_active' => true,
            ]
        );
        $this->command->info('User admin dibuat: admin@lamongan.go.id / admin123');

        $this->command->info('Mulai Import Data OPD...');
        
        $skpdData = [
            ['id' => 1, 'instansi' => 'Dinas Pendidikan', 'kode' => '1.01.01'],
            ['id' => 2, 'instansi' => 'Dinas Kesehatan', 'kode' => '1.01.02'],
            ['id' => 3, 'instansi' => 'Rumah Sakit Umum Daerah Dr. Soegiri', 'kode' => '1.01.02'],
            ['id' => 4, 'instansi' => 'Badan Perencanaan Pembangunan Penelitian Dan Pengembangan Daerah', 'kode' => '3.01.02'],
            ['id' => 5, 'instansi' => 'Rumah Sakit Umum Daerah Ngimbang', 'kode' => '1.01.02'],
            ['id' => 6, 'instansi' => 'Dinas PU Bina Marga', 'kode' => '1.01.03'],
            ['id' => 7, 'instansi' => 'DINAS PU SUMBER DAYA AIR', 'kode' => '1.01.03'],
            ['id' => 8, 'instansi' => 'DINAS PERUMAHAN RAKYAT DAN KAWASAN PERMUKIMAN', 'kode' => '1.01.04'],
            ['id' => 10, 'instansi' => 'Dinas Perhubungan', 'kode' => '1.02.09'],
            ['id' => 11, 'instansi' => 'Dinas Lingkungan Hidup', 'kode' => '1.02.05'],
            ['id' => 12, 'instansi' => 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL', 'kode' => '1.02.06'],
            ['id' => 13, 'instansi' => 'Dinas Pemberdayaan Perempuan dan Perlindungan Anak', 'kode' => '1.02.02'],
            ['id' => 14, 'instansi' => 'Dinas Tenaga kerja', 'kode' => '1.02.01'],
            ['id' => 15, 'instansi' => 'DINAS SOSIAL', 'kode' => '1.01.06'],
            ['id' => 16, 'instansi' => 'DINAS KOPERASI DAN USAHA MIKRO', 'kode' => '1.02.11'],
            ['id' => 17, 'instansi' => 'Dinas Perindustrian dan Perdagangan', 'kode' => '2.01.07'],
            ['id' => 18, 'instansi' => 'DINAS PENANAMAN MODAL DAN PELAYANAN TERPADU SATU PINTU', 'kode' => '1.02.12'],
            ['id' => 19, 'instansi' => 'Dinas Pariwisata dan Kebudayaan', 'kode' => '1.02.16'],
            ['id' => 20, 'instansi' => 'Dinas Pemuda dan Olahraga', 'kode' => '1.02.13'],
            ['id' => 21, 'instansi' => 'Badan Kesatuan Bangsa dan Politik', 'kode' => '5.01.01'],
            ['id' => 22, 'instansi' => 'Satuan Polisi Pamong Praja', 'kode' => '1.01.05'],
            ['id' => 23, 'instansi' => 'Badan Penanggulangan Bencana Daerah', 'kode' => '1.01.05'],
            ['id' => 24, 'instansi' => 'Sekretariat Dewan Perwakilan Rakyat Daerah', 'kode' => '4.01.04'],
            ['id' => 25, 'instansi' => 'Kepala Daerah Dan Wakil Kepala Daerah', 'kode' => '1.20.02'],
            ['id' => 26, 'instansi' => 'Sekretariat Daerah', 'kode' => '4.01.03'],
            ['id' => 27, 'instansi' => 'Badan Pengelolaan Keuangan dan Aset Daerah', 'kode' => '3.01.03'],
            ['id' => 28, 'instansi' => 'Inspektorat', 'kode' => '3.01.01'],
            ['id' => 29, 'instansi' => 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia', 'kode' => '3.01.04'],
            ['id' => 30, 'instansi' => 'Kecamatan Babat', 'kode' => '6.01.01'],
            ['id' => 31, 'instansi' => 'Kecamatan Bluluk', 'kode' => '6.01.01'],
            ['id' => 32, 'instansi' => 'Kecamatan Brondong', 'kode' => '6.01.01'],
            ['id' => 33, 'instansi' => 'Kecamatan Deket', 'kode' => '6.01.01'],
            ['id' => 34, 'instansi' => 'Kecamatan Glagah', 'kode' => '6.01.01'],
            ['id' => 35, 'instansi' => 'Kecamatan Kalitengah', 'kode' => '6.01.01'],
            ['id' => 36, 'instansi' => 'Kecamatan Karangbinangun', 'kode' => '6.01.01'],
            ['id' => 37, 'instansi' => 'Kecamatan Karanggeneng', 'kode' => '6.01.01'],
            ['id' => 38, 'instansi' => 'Kecamatan Kedungpring', 'kode' => '6.01.01'],
            ['id' => 39, 'instansi' => 'Kecamatan Kembangbahu', 'kode' => '6.01.01'],
            ['id' => 40, 'instansi' => 'Kecamatan Lamongan', 'kode' => '6.01.01'],
            ['id' => 41, 'instansi' => 'Kecamatan Laren', 'kode' => '6.01.01'],
            ['id' => 42, 'instansi' => 'Kecamatan Maduran', 'kode' => '6.01.01'],
            ['id' => 43, 'instansi' => 'Kecamatan Mantup', 'kode' => '6.01.01'],
            ['id' => 44, 'instansi' => 'Kecamatan Modo', 'kode' => '6.01.01'],
            ['id' => 45, 'instansi' => 'Kecamatan Ngimbang', 'kode' => '6.01.01'],
            ['id' => 46, 'instansi' => 'Kecamatan Paciran', 'kode' => '6.01.01'],
            ['id' => 47, 'instansi' => 'Kecamatan Pucuk', 'kode' => '6.01.01'],
            ['id' => 48, 'instansi' => 'Kecamatan Sambeng', 'kode' => '6.01.01'],
            ['id' => 49, 'instansi' => 'Kecamatan Sarirejo', 'kode' => '6.01.01'],
            ['id' => 50, 'instansi' => 'Kecamatan Sekaran', 'kode' => '6.01.01'],
            ['id' => 51, 'instansi' => 'Kecamatan Solokuro', 'kode' => '6.01.01'],
            ['id' => 52, 'instansi' => 'Kecamatan Sugio', 'kode' => '6.01.01'],
            ['id' => 53, 'instansi' => 'Kecamatan Sukodadi', 'kode' => '6.01.01'],
            ['id' => 54, 'instansi' => 'Kecamatan Sukorame', 'kode' => '6.01.01'],
            ['id' => 55, 'instansi' => 'Kecamatan Tikung', 'kode' => '6.01.01'],
            ['id' => 56, 'instansi' => 'Kecamatan Turi', 'kode' => '6.01.01'],
            ['id' => 58, 'instansi' => 'DINAS PEMBERDAYAAN MASYARAKAT DAN DESA', 'kode' => '1.02.07'],
            ['id' => 60, 'instansi' => 'DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH', 'kode' => '1.02.18'],
            ['id' => 61, 'instansi' => 'Dinas Komunikasi dan Informatika', 'kode' => '1.02.10'],
            ['id' => 62, 'instansi' => 'DINAS KETAHANAN PANGAN DAN PERTANIAN', 'kode' => '2.01.03'],
            ['id' => 63, 'instansi' => 'Dinas Peternakan Dan Kesehatan Hewan', 'kode' => '2.01.03'],
            ['id' => 64, 'instansi' => 'Dinas Perikanan', 'kode' => '2.01.01'],
            ['id' => 65, 'instansi' => 'Badan Pendapatan Daerah', 'kode' => '3.01.03'],
            ['id' => 66, 'instansi' => 'DINAS PENGENDALIAN PENDUDUK DAN KELUARGA BERENCANA', 'kode' => '1.02.08'],
            ['id' => 67, 'instansi' => 'Dinas Perpustakaan dan Kerasipan daerah', 'kode' => '1.02.08'],
            ['id' => 83, 'instansi' => 'Rumah Sakit Umum Daerah Karangkembang', 'kode' => '1.01.02'],
        ];

        $seen = [];
        $inserted = 0;

        foreach ($skpdData as $row) {
            $code = $row['kode'];
            if (in_array($code, $seen)) {
                $code = $this->makeUniqueCode($row['kode'], $row['instansi'], $seen);
            }
            $seen[] = $code;

            Opd::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $row['instansi'],
                    'is_active' => true,
                ]
            );
            $inserted++;
        }

        $this->command->info("{$inserted} OPD berhasil diimport");
    }
}
