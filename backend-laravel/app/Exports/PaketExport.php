<?php

namespace App\Exports;

use App\Models\Paket;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaketExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    private $params;

    public function __construct(array $params = [])
    {
        $this->params = $params;
    }

    public function collection()
    {
        $query = Paket::with('opd');

        if (!empty($this->params['tahun'])) {
            $query->where('tahun', $this->params['tahun']);
        }
        if (!empty($this->params['opdId'])) {
            $query->where('opd_id', $this->params['opdId']);
        }
        if (!empty($this->params['kategori'])) {
            $query->where('kategori', $this->params['kategori']);
        }
        if (!empty($this->params['status'])) {
            $query->where('status', $this->params['status']);
        }

        return $query->orderBy('updated_at', 'desc')->get()->map(function ($p) {
            return [
                'kode'             => $p->code,
                'nama_paket'       => $p->name,
                'opd'              => $p->opd?->name ?? '',
                'kategori'         => $p->kategori,
                'kegiatan'         => $p->kegiatan,
                'lokasi'           => $p->lokasi,
                'pagu_anggaran'    => $p->pagu,
                'nilai_kontrak'    => $p->nilai,
                'realisasi_keuangan' => $p->nilai_realisasi,
                'realisasi_fisik'  => $p->progres,
                'tahun'            => $p->tahun,
                'sumber_dana'      => $p->sumber_dana,
                'status'           => $p->status,
                'nomor_kontrak'    => $p->nomor_kontrak,
                'no_spmk'          => $p->no_spmk,
                'pelaksana'        => $p->pelaksana,
                'tanggal_mulai'    => $p->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai'  => $p->tanggal_selesai?->format('Y-m-d'),
                'keterangan'       => $p->keterangan,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Kode/Code',
            'Nama Paket',
            'OPD/Instansi',
            'Kategori',
            'Kegiatan',
            'Lokasi',
            'Pagu Anggaran',
            'Nilai Kontrak',
            'Realisasi Keuangan',
            'Realisasi Fisik (%)',
            'Tahun',
            'Sumber Dana',
            'Status',
            'Nomor Kontrak',
            'No. SPMK',
            'Pelaksana',
            'Tanggal Mulai',
            'Tanggal Selesai',
            'Keterangan',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF2563EB']],
            ],
        ];
    }
}
