<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Registro de nuevo usuario
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dni' => 'required|string|max:20|unique:users',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'password' => 'required|string|min:6|confirmed',
            'rol' => 'required|in:estudiante,docente,admin'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'dni' => $request->dni,
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'password' => Hash::make($request->password),
                'rol' => $request->rol
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'dni' => $user->dni,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'rol' => $user->rol
                    ],
                    'token' => $token
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login de usuario
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dni' => 'required|string',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::where('dni', $request->dni)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales incorrectas'
                ], 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login exitoso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'dni' => $user->dni,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'rol' => $user->rol
                    ],
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en el login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información del usuario autenticado con perfil completo
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();

            // Datos básicos del usuario
            $userData = [
                'id' => $user->id,
                'dni' => $user->dni,
                'nombre' => $user->nombre,
                'apellido' => $user->apellido,
                'rol' => $user->rol
            ];

            // Si es estudiante, agregar información de gamificación
            if ($user->rol === 'estudiante') {
                // Puntos totales
                $puntosTotal = \DB::table('puntos')
                    ->where('user_id', $user->id)
                    ->sum('cantidad');

                // Nivel actual
                $nivelActual = \DB::table('estudiante_niveles')
                    ->join('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
                    ->where('estudiante_niveles.user_id', $user->id)
                    ->orderBy('niveles.requisito_puntos', 'desc')
                    ->select('niveles.*', 'estudiante_niveles.fecha_asignacion')
                    ->first();

                // Insignias obtenidas
                $insignias = \DB::table('estudiante_insignias')
                    ->join('insignias', 'estudiante_insignias.insignia_id', '=', 'insignias.id')
                    ->where('estudiante_insignias.user_id', $user->id)
                    ->select('insignias.*', 'estudiante_insignias.fecha')
                    ->get();

                // Posición en ranking
                $posicionRanking = \DB::table('ranking')
                    ->where('user_id', $user->id)
                    ->orderBy('fecha', 'desc')
                    ->value('posicion');

                $userData['perfil_estudiante'] = [
                    'puntos_total' => $puntosTotal ?? 0,
                    'nivel_actual' => $nivelActual ? [
                        'id' => $nivelActual->id,
                        'nombre' => $nivelActual->nombre,
                        'descripcion' => $nivelActual->descripcion,
                        'requisito_puntos' => $nivelActual->requisito_puntos,
                        'dificultad' => $nivelActual->dificultad,
                        'fecha_asignacion' => $nivelActual->fecha_asignacion
                    ] : null,
                    'insignias' => $insignias->map(function($insignia) {
                        return [
                            'id' => $insignia->id,
                            'nombre' => $insignia->nombre,
                            'descripcion' => $insignia->descripcion,
                            'fecha_obtencion' => $insignia->fecha
                        ];
                    }),
                    'posicion_ranking' => $posicionRanking ?? null,
                    'total_insignias' => $insignias->count()
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información del usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout del usuario
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout exitoso'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en el logout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar contraseña
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta'
                ], 400);
            }

            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar la contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'dni' => 'sometimes|required|string|max:20|unique:users,dni,' . $request->user()->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            $user->update($request->only(['nombre', 'apellido', 'dni']));

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'dni' => $user->dni,
                        'nombre' => $user->nombre,
                        'apellido' => $user->apellido,
                        'rol' => $user->rol
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}