<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('paket_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('paket_id')->index();
            $table->double('progres');
            $table->double('nilai_realisasi');
            $table->text('keterangan')->nullable();
            $table->dateTime('tanggal')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paket_progress');
    }
};
