// front/js/app2.js

// --- CONSTANTES ---
export const TIENDA_KEY = 'tienda_data_json';
export const CARRITO_KEY = 'carrito';
export const VISTOS_KEY = 'productos_vistos';

// --- LOCALSTORAGE ---
export function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error al leer LocalStorage (${key}):`, e);
        return null;
    }
}

export function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error al guardar LocalStorage (${key}):`, e);
    }
}

// --- CARGA DE DATOS ---
export function loadStoreData() {
    const tiendaData = getLocalStorage(TIENDA_KEY) || {};
    const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
    const categorias = Array.isArray(tiendaData.categorias) ? tiendaData.categorias : [];
    return { productos, categorias };
}

// --- AUTENTICACIÓN ---
export function checkAuth() {
    const token = getLocalStorage('token');
    if (!token) {
        window.location.href = '/paginas/login.html';
        return false;
    }
    return true;
}

export function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem(TIENDA_KEY);
    localStorage.removeItem(CARRITO_KEY);
    localStorage.removeItem(VISTOS_KEY);
    window.location.href = '/paginas/login.html';
}

// --- CARRITO ---
export function renderCartBadge() {
    const cartBadge = document.getElementById('cart-count-badge');
    if (!cartBadge) return;
    const carrito = getLocalStorage(CARRITO_KEY) || [];
    const totalItems = carrito.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'block';
    } else {
        cartBadge.style.display = 'none';
    }
}

// Agrega producto completo al carrito
export function agregarAlCarrito(producto) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const existingIndex = carrito.findIndex(p => p.id === producto.id);

    if (existingIndex > -1) {
        carrito[existingIndex].quantity++;
    } else {
        carrito.push({ ...producto, quantity: 1 });
    }

    setLocalStorage(CARRITO_KEY, carrito);
    renderCartBadge();
}

// Disminuye cantidad
export function disminuirCantidad(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const index = carrito.findIndex(p => p.id === productId);
    if (index > -1) {
        carrito[index].quantity--;
        if (carrito[index].quantity <= 0) {
            carrito = carrito.filter(p => p.id !== productId);
        }
        setLocalStorage(CARRITO_KEY, carrito);
        renderCartBadge();
    }
}

// Remueve producto
export function removerDelCarrito(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    carrito = carrito.filter(p => p.id !== productId);
    setLocalStorage(CARRITO_KEY, carrito);
    renderCartBadge();
}

// Producto visto
export function verProducto(productId) {
    let vistos = getLocalStorage(VISTOS_KEY) || [];
    vistos = vistos.filter(id => id !== productId);
    vistos.unshift(productId);
    if (vistos.length > 10) vistos.pop();
    setLocalStorage(VISTOS_KEY, vistos);
    window.location.href = `/paginas/producto.html?id=${productId}`;
}
