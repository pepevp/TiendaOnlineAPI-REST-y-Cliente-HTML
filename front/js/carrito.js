// front/js/cart.js
import { 
    checkAuth, 
    handleLogout, 
    loadStoreData, 
    renderCartBadge,
    getLocalStorage,
    CARRITO_KEY,
    agregarAlCarrito,
    disminuirCantidad,
    removerDelCarrito
} from './app2.js';

window.agregarAlCarrito = (producto) => {
    agregarAlCarrito(producto);
    renderCart();
};
window.disminuirCantidad = (id) => {
    disminuirCantidad(id);
    renderCart();
};
window.removerDelCarrito = (id) => {
    removerDelCarrito(id);
    renderCart();
};

const { productos } = loadStoreData();
const token = getLocalStorage('token');

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalContainer = document.getElementById('cart-total-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!cartItemsContainer) return;

    const carrito = getLocalStorage(CARRITO_KEY) || [];
    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted">Tu carrito está vacío.</p>';
        cartTotalContainer.innerHTML = '<p class="text-muted">Añade productos para ver el total.</p>';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    let htmlItems = '';
    let subtotal = 0;
    carrito.forEach(item => {
        const itemTotal = item.precio * item.quantity;
        subtotal += itemTotal;
        htmlItems += `
        <div class="card mb-3 shadow-sm border-0">
            <div class="row g-0">
                <div class="col-md-2 d-none d-md-block">
                    <img src="${item.imagen}" class="img-fluid rounded-start" alt="${item.nombre}" style="height: 100%; object-fit: cover;">
                </div>
                <div class="col-md-7">
                    <div class="card-body">
                        <h5 class="card-title">${item.nombre}</h5>
                        <p class="card-text text-muted">Precio unitario: $${item.precio}</p>
                    </div>
                </div>
                <div class="col-md-3 col-12 d-flex align-items-center justify-content-center p-3 p-md-0">
                    <button class="btn btn-outline-secondary btn-sm" onclick="disminuirCantidad(${item.id})">-</button>
                    <strong class="mx-2">${item.quantity}</strong>
                    <button class="btn btn-outline-secondary btn-sm" onclick="agregarAlCarrito(${JSON.stringify(item)})">+</button>
                    <button class="btn btn-danger btn-sm ms-3" onclick="removerDelCarrito(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    });

    cartItemsContainer.innerHTML = htmlItems;
    cartTotalContainer.innerHTML = `
        <div class="d-flex justify-content-between my-3">
            <span class="text-muted">Subtotal</span>
            <strong>$${subtotal.toFixed(2)}</strong>
        </div>
        <div class="d-flex justify-content-between my-3">
            <span class="text-muted">Envío</span>
            <strong>GRATIS</strong>
        </div>
        <hr>
        <div class="d-flex justify-content-between my-3">
            <h4>Total</h4>
            <h4><strong>$${subtotal.toFixed(2)}</strong></h4>
        </div>`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

async function handleCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutMessage = document.getElementById('checkout-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    if (!checkoutBtn || !checkoutMessage) return;

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Validando...';
    if (loadingSpinner) loadingSpinner.style.display = 'block';

    const carrito = getLocalStorage(CARRITO_KEY) || [];

    try {
        const response = await fetch('/api/validar-carrito', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ carrito })
        });

        const data = await response.json();

        if (data.success) {
            checkoutMessage.innerHTML = `<div class="alert alert-success">${data.mensaje}</div>`;
            localStorage.removeItem(CARRITO_KEY);
            renderCart(); 
            renderCartBadge(); 
        } else {
            checkoutMessage.innerHTML = `<div class="alert alert-danger">${data.mensaje}</div>`;
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Realizar Pedido';
        }

    } catch (error) {
        console.error("Error en checkout:", error);
        checkoutMessage.innerHTML = `<div class="alert alert-danger">Error de conexión con el servidor.</div>`;
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Realizar Pedido';
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    const logoutBtn = document.getElementById('logoutBtn');
    const checkoutBtn = document.getElementById('checkout-btn');
    renderCartBadge();
    renderCart();
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
});
