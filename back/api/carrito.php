<?php
header('Content-Type: application/json');

// Configuración: token fijo
require_once(__DIR__ . '/../config/token.php'); // define('TOKEN', 'MiTokenSuperSecreto123');

// Leer token de autorización
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    echo json_encode(['success' => false, 'mensaje' => 'No se proporcionó token']);
    exit;
}

$authHeader = $headers['Authorization'];
if ($authHeader !== 'Bearer ' . TOKEN) {
    echo json_encode(['success' => false, 'mensaje' => 'Token inválido']);
    exit;
}

// Leer POST JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['carrito'])) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos']);
    exit;
}

$carritoCliente = $input['carrito'];

// Cargar tienda
$tienda = json_decode(file_get_contents(__DIR__ . '/../data/tienda.json'), true);
if (!$tienda || !isset($tienda['productos'])) {
    echo json_encode(['success' => false, 'mensaje' => 'No se pudo cargar la tienda']);
    exit;
}

// Validar precios
foreach ($carritoCliente as $item) {
    $producto = array_filter($tienda['productos'], fn($p) => $p['id'] == $item['id']);
    if (!$producto) {
        echo json_encode(['success' => false, 'mensaje' => 'Producto no encontrado: ' . $item['id']]);
        exit;
    }
    $producto = array_values($producto)[0];
    if ($producto['precio'] != $item['precio']) {
        echo json_encode(['success' => false, 'mensaje' => 'Precio manipulado para el producto: ' . $producto['nombre']]);
        exit;
    }
}

// Si todo es correcto
echo json_encode(['success' => true, 'mensaje' => 'Compra validada correctamente']);
