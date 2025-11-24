<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->string('archivo_public_id')->nullable()->after('archivo_path');
        });
    }

    public function down()
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->dropColumn('archivo_public_id');
        });
    }
};
