const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const SECRET_KEY = "mi_clave_secreta_super_segura";

app.use(express.json());

// Carpeta FRONT
const frontPath = path.join(__dirname, 'front');

app.get('/', (req, res) => {
    res.redirect('/paginas/login.html');
});

app.use(express.static(frontPath));

/* ================================
   JWT Manual
================================ */

function base64UrlEncode(obj) {
    const str = typeof obj === "string" ? obj : JSON.stringify(obj);
    return Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4 !== 0) str += '=';
    return JSON.parse(Buffer.from(str, "base64").toString());
}

function generarJWT(payload) {
    const header = { alg: "HS256", typ: "JWT" };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const firma = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(encodedHeader + "." + encodedPayload)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${encodedHeader}.${encodedPayload}.${firma}`;
}

function verificarJWT(token) {
    if (!token) return { valid: false, error: "Token vacío" };

    const partes = token.split(".");

    if (partes.length !== 3) {
        return { valid: false, error: "Formato inválido" };
    }

    const [header, payload, firmaRecibida] = partes;

    const firmaEsperada = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(header + "." + payload)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    if (firmaRecibida !== firmaEsperada) {
        return { valid: false, error: "Firma inválida (Token manipulado)" };
    }

    try {
        const data = base64UrlDecode(payload);
        if (data.exp < Math.floor(Date.now() / 1000)) {
            return { valid: false, error: "Token expirado" };
        }
        return { valid: true, payload: data };
    } catch (e) {
        return { valid: false, error: "Error al decodificar payload" };
    }
}

/* ================================
   Middleware
================================ */

function validarToken(req, res, next) {
    const header = req.headers["authorization"];

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, mensaje: "Token no enviado" });
    }

    const token = header.split(" ")[1];
    const result = verificarJWT(token);

    if (!result.valid) {
        return res.status(403).json({ success: false, mensaje: result.error });
    }

    req.usuario = result.payload;
    next();
}

/* ================================
   Endpoints
================================ */

// LOGIN
app.post("/auth/login", (req, res) => {
    const { usuario, password } = req.body;

    const usuariosPath = path.join(__dirname, "back", "data", "usuarios.json");
    const tiendaPath = path.join(__dirname, "back", "data", "tienda.json");

    const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf8"));
    const tiendaData = JSON.parse(fs.readFileSync(tiendaPath, "utf8"));

    const user = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (!user) {
        return res.json({ success: false, mensaje: "Usuario o contraseña incorrectos" });
    }

    const payload = {
        sub: user.usuario,
        rol: "cliente",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
    };

    const token = generarJWT(payload);

    res.json({
        success: true,
        token,
        productos: tiendaData.productos,
        categorias: tiendaData.categorias
    });
});

// NUEVO ENDPOINT - productos desde servidor
app.get("/api/productos", (req, res) => {
    const tiendaPath = path.join(__dirname, "back", "data", "tienda.json");
    const tiendaData = JSON.parse(fs.readFileSync(tiendaPath, "utf8"));
    res.json(tiendaData.productos);
});

// VALIDAR CARRITO
// --- VALIDAR CARRITO (Protegido con JWT) ---
// VALIDAR CARRITO
app.post('/api/validar-carrito', validarToken, (req, res) => {
    const carritoCliente = req.body.carrito;
    if (!Array.isArray(carritoCliente)) {
        return res.status(400).json({ success: false, mensaje: "Carrito inválido" });
    }

    const tiendaPath = path.join(__dirname, 'back', 'data', 'tienda.json');
    let productosServidor = [];
    try {
        const tiendaData = JSON.parse(fs.readFileSync(tiendaPath, 'utf-8'));
        productosServidor = tiendaData.productos;
    } catch(e) {
        return res.status(500).json({ success: false, mensaje: "Error interno verificando precios" });
    }

    let productoManipulado = null;

    for (const item of carritoCliente) {
        const real = productosServidor.find(p => p.id === item.id);
        if (!real) {
            productoManipulado = `(ID inexistente ${item.id})`;
            break;
        }
        if (item.precio !== real.precio) {
            productoManipulado = `${real.nombre}: cliente ${item.precio} / servidor ${real.precio}`;
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


app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
