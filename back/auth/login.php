<?php
header('Content-Type: application/json');

// Cargar token
require_once('../config/token.php');

// Leer credenciales del POST
$input = json_decode(file_get_contents('php://input'), true);

$usuario = $input['usuario'] ?? '';
$password = $input['password'] ?? '';

// Leer usuarios desde JSON
$usuarios = json_decode(file_get_contents(__DIR__ . '/../data/usuarios.json'), true);

// Buscar usuario válido
$usuarioValido = null;
foreach ($usuarios as $u) {
    if ($u['usuario'] === $usuario && $u['password'] === $password) {
        $usuarioValido = $u;
        break;
    }
}

if ($usuarioValido) {
    // Leer información de la tienda
    $tienda = json_decode(file_get_contents(__DIR__ . '/../data/tienda.json'), true);

    // Responder con token y datos de la tienda
    echo json_encode([
        'success' => true,
        'token' => TOKEN,
        'tienda' => $tienda
    ]);
} else {
    // Usuario o contraseña incorrectos
    echo json_encode([
        'success' => false,
        'mensaje' => 'Usuario o contraseña incorrectos'
    ]);
}
?>
