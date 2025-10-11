<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pruebas_diagnosticas', function (Blueprint $table) {
            $table->id();
            
            // Relación con el estudiante
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Relación con la prueba
            $table->unsignedBigInteger('prueba_id');
            $table->foreign('prueba_id')->references('id')->on('pruebas')->onDelete('cascade');

            $table->string('categoria', 50);
            $table->integer('puntaje');
            $table->timestamp('fecha')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pruebas_diagnosticas');
    }
};
