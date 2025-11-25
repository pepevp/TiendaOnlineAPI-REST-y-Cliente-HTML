const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // Necesario para firmar el token manualmente

const app = express();
const PORT = 3000;
const SECRET_KEY = "mi_clave_secreta_super_segura"; // Cambia esto en producción

app.use(express.json());

// Carpeta FRONT
const frontPath = path.join(__dirname, 'front');

// ROOT - Definir esto ANTES de los archivos estáticos para asegurar la prioridad
app.get('/', (req, res) => {
    res.redirect('/paginas/login.html');
});

app.use(express.static(frontPath));

/* ==========================================================
   1. FUNCIONES JWT MANUALES (Sin librerías externas)
   ========================================================== */

// Codificar a Base64URL (Reemplaza +, /, = para que sea seguro en URL)
function base64UrlEncode(obj) {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

// Decodificar desde Base64URL
function base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    // Rellenar con '=' si es necesario para base64 estándar
    while (str.length % 4) {
        str += '=';
    }
    return JSON.parse(Buffer.from(str, "base64").toString());
}

// Generar firma y Token completo
function generarJWT(payload) {
    const header = { alg: "HS256", typ: "JWT" };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    // Crear la firma usando HMAC SHA256
    const firma = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(encodedHeader + "." + encodedPayload)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${encodedHeader}.${encodedPayload}.${firma}`;
}

// Verificar Token
function verificarJWT(token) {
    if (!token) return { valid: false, error: "Token vacío" };

    const partes = token.split(".");
    if (partes.length !== 3) return { valid: false, error: "Formato inválido" };

    const [header, payload, firmaRecibida] = partes;

    // Recrear la firma con nuestra clave secreta
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

    // Verificar expiración
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

/* ==========================================================
   2. MIDDLEWARE DE SEGURIDAD
   ========================================================== */

function validarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, mensaje: 'No se proporcionó token o formato incorrecto' });
    }

    const token = authHeader.split(" ")[1];
    const resultado = verificarJWT(token);

    if (!resultado.valid) {
        return res.status(403).json({ success: false, mensaje: resultado.error });
    }

    // Guardamos los datos del usuario en la request por si se necesitan luego
    req.usuario = resultado.payload;
    next();
}

/* ==========================================================
   3. ENDPOINTS
   ========================================================== */

// --- LOGIN ---
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

    // --- GENERAR EL JWT MANUALMENTE ---
    const payload = {
        sub: user.usuario,      // Subject (usuario)
        rol: "cliente",         // Rol (ejemplo)
        iat: Math.floor(Date.now() / 1000), // Issued At
        exp: Math.floor(Date.now() / 1000) + 3600 // Expira en 1 hora
    };

    const tokenJWT = generarJWT(payload);

    // Devolver token JWT generado + datos de la tienda
    res.json({
        success: true,
        token: tokenJWT,
        productos: tiendaData.productos,
        categorias: tiendaData.categorias
    });
});

// --- VALIDAR CARRITO (Protegido con JWT) ---
app.post('/api/validar-carrito', validarToken, (req, res) => {
    const carritoCliente = req.body.carrito;
    if (!Array.isArray(carritoCliente)) {
        return res.status(400).json({ success: false, mensaje: "Carrito inválido" });
    }

    // Cargar productos reales del servidor
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
        // Comparación estricta de precios
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

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});