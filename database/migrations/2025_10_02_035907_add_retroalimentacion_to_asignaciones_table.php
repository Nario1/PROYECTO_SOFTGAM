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
        Schema::table('asignaciones', function (Blueprint $table) {
            $table->text('retroalimentacion')->nullable()->after('archivo_entrega');
            $table->decimal('calificacion', 5, 2)->nullable()->after('retroalimentacion');
            $table->timestamp('retroalimentado_at')->nullable()->after('calificacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asignaciones', function (Blueprint $table) {
            $table->dropColumn(['retroalimentacion', 'calificacion', 'retroalimentado_at']);
        });
    }
};
