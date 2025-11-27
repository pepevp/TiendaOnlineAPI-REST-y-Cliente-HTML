// front/js/app2.js (antes utils.js)

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
export function loadStoreData() {
    const tiendaData = getLocalStorage(TIENDA_KEY) || {};
    const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
    const categorias = Array.isArray(tiendaData.categorias) ? tiendaData.categorias : [];
    return { productos, categorias };
}

// --- SEGURIDAD Y AUTENTICACIÓN ---
export function checkAuth() {
    const token = localStorage.getItem("token");  // 🔥 sin JSON.parse
    if (!token) {
        window.location.href = "/paginas/login.html";
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

// --- LÓGICA DE CARRITO ---
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

export function agregarAlCarrito(productId) {
    let carrito = getLocalStorage(CARRITO_KEY) || [];
    const existingProductIndex = carrito.findIndex(p => p.id === productId);

    if (existingProductIndex > -1) {
        carrito[existingProductIndex].quantity++;
    } else {
        carrito.push({ id: productId, quantity: 1 });
    }
    
    setLocalStorage(CARRITO_KEY, carrito);
    renderCartBadge();

    if (!document.getElementById('cart-items-container')) {
        alert('Producto añadido al carrito');
    }
}

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
