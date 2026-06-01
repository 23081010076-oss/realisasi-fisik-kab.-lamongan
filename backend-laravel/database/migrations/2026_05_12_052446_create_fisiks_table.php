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
        Schema::create('fisik', function (Blueprint $table) {
            $table->id();
            $table->string('jasa', 15)->index();
            $table->string('th_anggaran', 4)->index();
            $table->string('skpd', 125)->index();
            $table->string('kegiatan', 255);
            $table->string('lokasi', 125);
            $table->string('no_kontrak', 40);
            $table->date('tgl_kontrak');
            $table->string('nilai_kontrak', 20);
            $table->string('no_spnk', 35);
            $table->date('tgl_spnk');
            $table->date('nilai_spnk');
            $table->string('pagu', 20);
            $table->string('hps', 20);
            $table->string('pelaksana', 125);
            $table->string('rencana', 10);
            $table->string('realisasi', 50);
            $table->string('deviasi', 10);
            $table->string('foto1', 70)->default('');
            $table->string('foto2', 70)->default('');
            $table->string('foto3', 70)->default('');
            $table->string('foto4', 70)->default('');
            $table->date('tgl_update');
            $table->string('prosentase', 3);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fisik');
    }
};
