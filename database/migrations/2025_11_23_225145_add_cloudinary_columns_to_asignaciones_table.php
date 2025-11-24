<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('asignaciones', function (Blueprint $table) {
            $table->string('archivo_entrega_public_id')->nullable()->after('archivo_entrega');
            $table->string('nombre_archivo_original_entrega')->nullable()->after('archivo_entrega_public_id');
            $table->string('extension_original_entrega', 50)->nullable()->after('nombre_archivo_original_entrega');
        });
    }

    public function down()
    {
        Schema::table('asignaciones', function (Blueprint $table) {
            $table->dropColumn([
                'archivo_entrega_public_id', 
                'nombre_archivo_original_entrega', 
                'extension_original_entrega'
            ]);
        });
    }
};