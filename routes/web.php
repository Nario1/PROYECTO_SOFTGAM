<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DocenteController;
use App\Http\Controllers\API\EstudianteController;
use App\Http\Controllers\API\JuegoController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\ContenidoController;
use App\Http\Controllers\API\SoporteController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Aquí registramos las rutas para la aplicación.
|
*/


// ============================================
// RUTA CATCH-ALL PARA LA SINGLE PAGE APPLICATION (SPA)
// Esta debe ser la última ruta del archivo.
// ============================================
Route::get('/{any}', function () {
    return view('welcome'); // Sirve la vista principal que carga tu app de React
})->where('any', '^(?!api).*$');

