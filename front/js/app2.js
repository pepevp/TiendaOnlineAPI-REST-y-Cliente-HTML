// front/js/app2.js

export const TIENDA_KEY = 'tienda_data_json';
export const CARRITO_KEY = 'carrito';
export const VISTOS_KEY = 'productos_vistos';

export function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error leyendo LocalStorage (${key})`, e);
        return null;
    }
}

export function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error guardando LocalStorage (${key})`, e);
    }
}

export function loadStoreData() {
    const tiendaData = getLocalStorage(TIENDA_KEY) || {};
    return {
        productos: Array.isArray(tiendaData.productos) ? tiendaData.productos : [],
        categorias: Array.isArray(tiendaData.categorias) ? tiendaData.categorias : []
    };
}

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

// --- FUNCIONES DE CARRITO ---

// Agrega producto completo al carrito (guarda precio, nombre, imagen, etc)
export function agregarAlCarrito(productId) {
    const { productos } = loadStoreData();
    const producto = productos.find(p => p.id === productId);
    if (!producto) return;

    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const index = carrito.findIndex(p => p.id === productId);

    if (index > -1) {
        carrito[index].quantity++;
    } else {
        carrito.push({ ...producto, quantity: 1 }); // <-- guardamos toda la info del producto
    }

    setLocalStorage(CARRITO_KEY, carrito);
    renderCartBadge();
}

export function disminuirCantidad(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const index = carrito.findIndex(p => p.id === productId);

    if (index > -1) {
        carrito[index].quantity--;
        if (carrito[index].quantity <= 0) {
            carrito.splice(index, 1);
        }
        setLocalStorage(CARRITO_KEY, carrito);
        renderCartBadge();
    }
}

export function removerDelCarrito(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    carrito = carrito.filter(p => p.id !== productId);
    setLocalStorage(CARRITO_KEY, carrito);
    renderCartBadge();
}

export function verProducto(productId) {
    let vistos = getLocalStorage(VISTOS_KEY) || [];
    vistos = vistos.filter(id => id !== productId);
    vistos.unshift(productId);
    if (vistos.length > 10) vistos.pop();
    setLocalStorage(VISTOS_KEY, vistos);
    window.location.href = `/paginas/producto.html?id=${productId}`;
}
