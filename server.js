const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Ruta de la carpeta front
const frontPath = path.join(__dirname, 'front');

// --- ROOT (CORRECCIÓN DE ORDEN) ---
// Esta ruta específica para '/' DEBE ir ANTES del app.use(express.static)
app.get('/', (req, res) => {
    res.redirect('/paginas/login.html');
});

// Servir toda la carpeta front como estática
app.use(express.static(frontPath));

// --- ENDPOINT LOGIN ---
app.post('/auth/login', (req, res) => {
    const { usuario, password } = req.body;

    const usuariosPath = path.join(__dirname, 'back', 'data', 'usuarios.json');
    let usuarios = [];
    
    try {
        if (fs.existsSync(usuariosPath)) {
            usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8'));
        }
    } catch (e) {
        console.error('Error al leer usuarios.json:', e);
        return res.status(500).json({ success: false, mensaje: 'Error interno del servidor al leer usuarios.' });
    }

    const user = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (user) {
        // --- LECTURA DE ARCHIVOS SEPARADOS (SINCRONIZADO CONTIGO) ---
        const productosPath = path.join(__dirname, 'back', 'data', 'productos.json');
        const categoriasPath = path.join(__dirname, 'back', 'data', 'categorias.json');

        let productos = [];
        let categorias = [];

        try {
            if (fs.existsSync(productosPath)) {
                // Leemos el JSON y accedemos a la clave "productos"
                const dataProductos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));
                productos = dataProductos.productos || [];
            }
            if (fs.existsSync(categoriasPath)) {
                // Leemos el JSON y accedemos a la clave "categorias"
                const dataCategorias = JSON.parse(fs.readFileSync(categoriasPath, 'utf-8'));
                categorias = dataCategorias.categorias || [];
            }
        } catch (e) {
            console.error('Advertencia: Error al leer productos.json o categorias.json.', e);
        }

        res.json({
            success: true, 
            token: 'MiTokenSuperSecreto123', 
            productos: productos, 
            categorias: categorias
        });
    } else {
        res.json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
});


// --- (NUEVO) ENDPOINT DE VALIDACIÓN DE CARRITO ---
app.post('/api/validar-carrito', (req, res) => {
    console.log("Recibida petición para validar carrito...");

    // 1. Validación de Token (Requisito de seguridad)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (token !== 'MiTokenSuperSecreto123') {
        return res.status(401).json({ success: false, mensaje: 'Error de autenticación: Token no válido.' });
    }

    // 2. Cargar precios reales del servidor
    const productosPath = path.join(__dirname, 'back', 'data', 'productos.json');
    let productosServidor = [];
    try {
        if (fs.existsSync(productosPath)) {
            const dataProductos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));
            productosServidor = dataProductos.productos || [];
        }
    } catch (e) {
        return res.status(500).json({ success: false, mensaje: 'Error interno al verificar productos.' });
    }

    // 3. Obtener carrito del cliente
    const carritoCliente = req.body.carrito;
    if (!Array.isArray(carritoCliente)) {
        return res.status(400).json({ success: false, mensaje: 'Formato de carrito incorrecto.' });
    }

    // 4. Lógica de Validación de Precios (Requisito clave)
    let precioManipulado = false;
    let productoManipulado = '';

    for (const itemCliente of carritoCliente) {
        const productoReal = productosServidor.find(p => p.id === itemCliente.id);

        if (!productoReal) {
            precioManipulado = true;
            productoManipulado = `(ID: ${itemCliente.id} no existe)`;
            break;
        }
        
        // ¡LA VALIDACIÓN! Comparamos el precio del cliente con el precio real
        if (itemCliente.price !== productoReal.precio) {
            precioManipulado = true;
            productoManipulado = `${productoReal.nombre} (Cliente: $${itemCliente.price} vs Servidor: $${productoReal.precio})`;
            break;
        }
    }

    // 5. Responder al cliente
    if (precioManipulado) {
        console.warn(`VALIDACIÓN FALLIDA: Precio manipulado detectado para ${productoManipulado}`);
        return res.json({ 
            success: false, 
            mensaje: `¡Alerta de seguridad! El precio de ${productoManipulado} no es correcto. Pedido cancelado.` 
        });
    } else {
        console.log("VALIDACIÓN EXITOSA: Todos los precios son correctos.");
        // Aquí iría la lógica para guardar el pedido en la base de datos, etc.
        return res.json({ 
            success: true, 
            mensaje: '¡Pedido validado! Compra realizada con éxito.' 
        });
    }
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});