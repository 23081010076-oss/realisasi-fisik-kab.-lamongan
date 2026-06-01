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
        Schema::create('paket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('kategori', ['KONSTRUKSI', 'KONSULTANSI', 'BARANG', 'JASA_LAINNYA']);
            $table->uuid('opd_id')->index();
            $table->string('kegiatan');
            $table->string('lokasi');
            $table->double('nilai');
            $table->double('pagu')->default(0);
            $table->double('nilai_realisasi')->default(0);
            $table->double('progres')->default(0);
            $table->integer('tahun')->index();
            $table->enum('status', ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'])->default('PENDING')->index();
            $table->dateTime('tanggal_mulai')->nullable();
            $table->dateTime('tanggal_selesai')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('nomor_kontrak')->nullable();
            $table->string('no_spmk')->nullable();
            $table->string('sumber_dana')->default('BLUD');
            $table->string('pelaksana')->nullable();
            $table->string('kode_rekening')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paket');
    }
};
