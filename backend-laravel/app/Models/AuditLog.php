<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AuditLog extends Model
{
    use HasUuids;

    protected $table = 'audit_logs';

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'entity',
        'entity_id',
        'details',
        'ip_address',
    ];

    protected $casts = [
        'details' => 'array',
    ];
}
