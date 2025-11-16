// hola
// front/js/utils.js

// --- CONSTANTES COMPARTIDAS ---
export const TIENDA_KEY = 'tienda_data_json';
export const CARRITO_KEY = 'carrito';
export const VISTOS_KEY = 'productos_vistos';

// --- HELPERS DE LOCALSTORAGE ---
export function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error al leer de LocalStorage (${key}):`, e);
        return null;
    }
}

export function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error al guardar en LocalStorage (${key}):`, e);
    }
}

// --- CARGA DE DATOS ---
/**
 * Carga todos los datos de la tienda desde LocalStorage.
 * @returns {{productos: Array, categorias: Array}}
 */
export function loadStoreData() {
    const tiendaData = getLocalStorage(TIENDA_KEY) || {};
    const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
    const categorias = Array.isArray(tiendaData.categorias) ? tiendaData.categorias : [];
    return { productos, categorias };
}

// --- SEGURIDAD Y AUTENTICACIÓN ---
/**
 * Verifica si el usuario está autenticado. Si no, lo redirige al login.
 */
export function checkAuth() {
    const token = getLocalStorage('token');
    if (!token) {
        console.warn('Acceso denegado. Redirigiendo a login.');
        window.location.href = '/paginas/login.html';
        return false;
    }
    return true;
}

/**
 * Cierra la sesión del usuario y limpia LocalStorage.
 */
export function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem(TIENDA_KEY);
    localStorage.removeItem(CARRITO_KEY);
    localStorage.removeItem(VISTOS_KEY);
    window.location.href = '/paginas/login.html'; // Redirección absoluta
}

// --- LÓGICA DE CARRITO (GLOBAL) ---

/**
 * Actualiza el contador (badge) del carrito en la barra de navegación.
 */
export function renderCartBadge() {
    const cartBadge = document.getElementById('cart-count-badge');
    if (!cartBadge) return; // No estamos en una página con el badge

    const carrito = getLocalStorage(CARRITO_KEY) || [];
    const totalItems = carrito.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'block';
    } else {
        cartBadge.style.display = 'none';
    }
}

/**
 * Añade un producto al carrito o incrementa su cantidad.
 */
export function agregarAlCarrito(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const existingProductIndex = carrito.findIndex(p => p.id === productId);

    if (existingProductIndex > -1) {
        carrito[existingProductIndex].quantity++;
    } else {
        carrito.push({ id: productId, quantity: 1 });
    }
    
    setLocalStorage(CARRITO_KEY, carrito);
    console.log(`Producto ${productId} añadido/incrementado.`);
    renderCartBadge(); // Actualiza el badge
    
    // Si estamos en la página del carrito, la recargamos dinámicamente
    if (document.getElementById('cart-items-container')) {
        // (La recarga se maneja en cart.js, pero actualizamos el badge)
    } else {
        alert('Producto añadido al carrito'); // Feedback en otras páginas
    }
}

/**
 * Disminuye la cantidad de un producto en el carrito.
 */
export function disminuirCantidad(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const existingProductIndex = carrito.findIndex(p => p.id === productId);

    if (existingProductIndex > -1) {
        carrito[existingProductIndex].quantity--;
        if (carrito[existingProductIndex].quantity <= 0) {
            carrito = carrito.filter(p => p.id !== productId);
        }
        setLocalStorage(CARRITO_KEY, carrito);
        renderCartBadge();
    }
}

/**
 * Remueve todas las unidades de un producto del carrito.
 */
export function removerDelCarrito(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    carrito = carrito.filter(p => p.id !== productId);
    setLocalStorage(CARRITO_KEY, carrito);
    renderCartBadge();
}

/**
 * Guarda el producto en "vistos recientemente" y redirige a la página de detalle.
 */
export function verProducto(productId) {
    let vistos = getLocalStorage(VISTOS_KEY) || [];
    
    vistos = vistos.filter(id => id !== productId); 
    vistos.unshift(productId); 
    if (vistos.length > 10) vistos.pop(); 
    
    setLocalStorage(VISTOS_KEY, vistos);
    console.log(`Producto ${productId} registrado como visto.`);
    
    window.location.href = `/paginas/producto.html?id=${productId}`;
}