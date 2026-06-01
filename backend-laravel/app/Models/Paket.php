<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Paket extends Model
{
    use HasUuids;

    protected $table = 'paket';

    protected $fillable = [
        'code',
        'name',
        'kategori',
        'opd_id',
        'kegiatan',
        'lokasi',
        'nilai',
        'pagu',
        'nilai_realisasi',
        'progres',
        'tahun',
        'status',
        'tanggal_mulai',
        'tanggal_selesai',
        'keterangan',
        'nomor_kontrak',
        'no_spmk',
        'sumber_dana',
        'pelaksana',
        'kode_rekening',
    ];

    protected $casts = [
        'nilai' => 'double',
        'pagu' => 'double',
        'nilai_realisasi' => 'double',
        'progres' => 'double',
        'tahun' => 'integer',
        'tanggal_mulai' => 'datetime',
        'tanggal_selesai' => 'datetime',
    ];

    public function toArray()
    {
        $array = parent::toArray();

        $array['opdId'] = $this->opd_id;
        $array['nilaiRealisasi'] = $this->nilai_realisasi;
        $array['tanggalMulai'] = $this->tanggal_mulai?->toJSON();
        $array['tanggalSelesai'] = $this->tanggal_selesai?->toJSON();
        $array['nomorKontrak'] = $this->nomor_kontrak;
        $array['noSPMK'] = $this->no_spmk;
        $array['sumberDana'] = $this->sumber_dana;
        $array['kodeRekening'] = $this->kode_rekening;
        $array['createdAt'] = $this->created_at?->toJSON();
        $array['updatedAt'] = $this->updated_at?->toJSON();
        $array['sisaAnggaran'] = ($this->pagu ?? 0) - ($this->nilai ?? 0);
        $array['sisaRealisasi'] = ($this->nilai ?? 0) - ($this->nilai_realisasi ?? 0);
        $array['progresKeuangan'] = ($this->nilai ?? 0) > 0
            ? round((($this->nilai_realisasi ?? 0) / $this->nilai) * 100, 1)
            : 0;

        return $array;
    }

    public function opd()
    {
        return $this->belongsTo(Opd::class);
    }

    public function progress()
    {
        return $this->hasMany(PaketProgress::class, 'paket_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'paket_id');
    }
}
