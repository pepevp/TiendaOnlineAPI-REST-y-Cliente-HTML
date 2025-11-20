const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

// Carpeta FRONT
const frontPath = path.join(__dirname, 'front');
app.use(express.static(frontPath));

// ROOT
app.get('/', (req, res) => {
    res.redirect('/paginas/login.html');
});

// ----------------------------------------------------------
// TOKEN FIJO
// ----------------------------------------------------------
const TOKEN = 'MiTokenSuperSecreto123';

function validarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, mensaje: 'No se proporcionó token' });

    if (authHeader !== `Bearer ${TOKEN}`) {
        return res.status(403).json({ success: false, mensaje: 'Token inválido' });
    }

    next();
}

// ----------------------------------------------------------
// LOGIN
// ----------------------------------------------------------
app.post('/auth/login', (req, res) => {
    const { usuario, password } = req.body;

    const usuariosPath = path.join(__dirname, 'back', 'data', 'usuarios.json');
    let usuarios = [];

    try {
        if (fs.existsSync(usuariosPath)) {
            usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8'));
        }
    } catch (e) {
        return res.status(500).json({ success: false, mensaje: "Error interno leyendo usuarios." });
    }

    const user = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (!user) {
        return res.json({ success: false, mensaje: "Usuario o contraseña incorrectos" });
    }

    // Leer tienda.json
    const tiendaPath = path.join(__dirname, 'back', 'data', 'tienda.json');
    let tiendaData = { productos: [], categorias: [] };

    try {
        if (fs.existsSync(tiendaPath)) {
            tiendaData = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
        }
    } catch (e) {
        console.log("Error leyendo tienda.json");
    }

    // Devolver token fijo + tienda
    res.json({
        success: true,
        token: TOKEN,
        productos: tiendaData.productos,
        categorias: tiendaData.categorias
    });
});

// ----------------------------------------------------------
// VALIDAR CARRITO
// ----------------------------------------------------------
app.post('/api/validar-carrito', validarToken, (req, res) => {
    const carritoCliente = req.body.carrito;
    if (!Array.isArray(carritoCliente)) {
        return res.status(400).json({ success: false, mensaje: "Carrito inválido" });
    }

    // Cargar productos del servidor
    const tiendaPath = path.join(__dirname, 'back', 'data', 'tienda.json');
    const tiendaData = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
    const productosServidor = tiendaData.productos;

    let productoManipulado = null;

    for (const item of carritoCliente) {
        const real = productosServidor.find(p => p.id === item.id);
        if (!real) {
            productoManipulado = `(ID inexistente ${item.id})`;
            break;
        }
        if (item.price !== real.precio) {
            productoManipulado = `${real.nombre}: cliente ${item.price} / servidor ${real.precio}`;
            break;
        }
    }

    if (productoManipulado) {
        return res.json({
            success: false,
            mensaje: `Precio manipulado detectado: ${productoManipulado}`
        });
    }

    res.json({ success: true, mensaje: 'Compra validada correctamente' });
});

// ----------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
