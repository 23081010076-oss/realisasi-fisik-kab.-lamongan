<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Opd extends Model
{
    use HasUuids;

    protected $table = 'opd';

    protected $fillable = [
        'code',
        'name',
        'kepala',
        'contact',
        'address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function pakets()
    {
        return $this->hasMany(Paket::class);
    }
}
