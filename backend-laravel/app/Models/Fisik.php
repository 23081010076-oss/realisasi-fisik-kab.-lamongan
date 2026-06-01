<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fisik extends Model
{
    protected $table = 'fisik';

    public $timestamps = false;

    protected $fillable = [
        'jasa',
        'th_anggaran',
        'skpd',
        'kegiatan',
        'lokasi',
        'no_kontrak',
        'tgl_kontrak',
        'nilai_kontrak',
        'no_spnk',
        'tgl_spnk',
        'nilai_spnk',
        'pagu',
        'hps',
        'pelaksana',
        'rencana',
        'realisasi',
        'deviasi',
        'foto1',
        'foto2',
        'foto3',
        'foto4',
        'tgl_update',
        'prosentase',
    ];

    protected $casts = [
        'tgl_kontrak' => 'date',
        'tgl_spnk' => 'date',
        'nilai_spnk' => 'date',
        'tgl_update' => 'date',
    ];
}
