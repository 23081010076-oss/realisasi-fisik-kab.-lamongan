<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Document extends Model
{
    use HasUuids;

    protected $table = 'documents';

    const UPDATED_AT = null;

    protected $fillable = [
        'paket_id',
        'name',
        'filename',
        'filepath',
        'filesize',
        'mimetype',
        'category',
        'progress_percentage',
    ];

    protected $casts = [
        'filesize' => 'integer',
        'progress_percentage' => 'integer',
    ];

    public function toArray()
    {
        $array = parent::toArray();

        $array['paketId'] = $this->paket_id;
        $array['progressPercentage'] = $this->progress_percentage;
        $array['createdAt'] = $this->created_at?->toJSON();

        return $array;
    }

    public function paket()
    {
        return $this->belongsTo(Paket::class);
    }
}
