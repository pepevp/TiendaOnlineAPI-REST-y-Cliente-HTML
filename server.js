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
        // --- CAMBIO: LEER UN SOLO ARCHIVO 'tienda.json' ---
        const tiendaPath = path.join(__dirname, 'back', 'data', 'tienda.json');
        let tiendaData = { productos: [], categorias: [] };

        try {
            if (fs.existsSync(tiendaPath)) {
                tiendaData = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
            }
        } catch (e) {
            console.error('Advertencia: Error al leer tienda.json.', e);
        }

        res.json({
            success: true, 
            token: 'MiTokenSuperSecreto123', 
            productos: tiendaData.productos || [], // Devolvemos la clave 'productos'
            categorias: tiendaData.categorias || [] // Devolvemos la clave 'categorias'
        });
    } else {
        res.json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
});


// --- ENDPOINT DE VALIDACIÓN DE CARRITO ---
app.post('/api/validar-carrito', (req, res) => {
    console.log("Recibida petición para validar carrito...");

    // 1. Validación de Token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token !== 'MiTokenSuperSecreto123') {
        return res.status(401).json({ success: false, mensaje: 'Error de autenticación: Token no válido.' });
    }

    // 2. Cargar precios reales del servidor (LEYENDO DE TIENDA.JSON)
    const tiendaPath = path.join(__dirname, 'back', 'data', 'tienda.json');
    let productosServidor = [];
    try {
        if (fs.existsSync(tiendaPath)) {
            const tiendaData = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
            productosServidor = tiendaData.productos || [];
        }
    } catch (e) {
        return res.status(500).json({ success: false, mensaje: 'Error interno al verificar productos.' });
    }

    // 3. Obtener carrito del cliente
    const carritoCliente = req.body.carrito;
    if (!Array.isArray(carritoCliente)) {
        return res.status(400).json({ success: false, mensaje: 'Formato de carrito incorrecto.' });
    }

    // 4. Lógica de Validación de Precios
    let precioManipulado = false;
    let productoManipulado = '';

    for (const itemCliente of carritoCliente) {
        const productoReal = productosServidor.find(p => p.id === itemCliente.id);

        if (!productoReal) {
            precioManipulado = true;
            productoManipulado = `(ID: ${itemCliente.id} no existe)`;
            break;
        }
        
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