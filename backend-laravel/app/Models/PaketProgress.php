<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaketProgress extends Model
{
    use HasUuids;

    protected $table = 'paket_progress';

    const UPDATED_AT = null;

    protected $fillable = [
        'paket_id',
        'progres',
        'nilai_realisasi',
        'keterangan',
        'tanggal',
    ];

    protected $casts = [
        'progres' => 'double',
        'nilai_realisasi' => 'double',
        'tanggal' => 'datetime',
    ];

    public function toArray()
    {
        $array = parent::toArray();

        $array['paketId'] = $this->paket_id;
        $array['nilaiRealisasi'] = $this->nilai_realisasi;
        $array['createdAt'] = $this->created_at?->toJSON();

        return $array;
    }
}
