<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('juegos', function (Blueprint $table) {
            $table->id(); // Esto es unsignedBigInteger por defecto
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->string('imagen', 150)->nullable();
            $table->foreignId('tematica_id')->constrained('tematicas')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('juegos');
    }
};
