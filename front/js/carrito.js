// front/js/cart.js
import { 
    checkAuth, handleLogout, renderCartBadge, getLocalStorage, 
    CARRITO_KEY, agregarAlCarrito, disminuirCantidad, removerDelCarrito,
    loadStoreData
} from './app2.js';

// Asignar funciones globales
window.agregarAlCarrito = (id) => { agregarAlCarrito(id); renderCart(); };
window.disminuirCantidad = (id) => { disminuirCantidad(id); renderCart(); };
window.removerDelCarrito = (id) => { removerDelCarrito(id); renderCart(); };

const token = getLocalStorage('token'); // token real del login
const { productos } = loadStoreData();

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
        subtotal += item.precio * item.quantity;
        htmlItems += `
        <div class="card mb-3 shadow-sm border-0">
            <div class="row g-0">
                <div class="col-md-2 d-none d-md-block">
                    <img src="${item.imagen}" class="img-fluid rounded-start" alt="${item.nombre}" style="height:100%; object-fit:cover;">
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
                    <button class="btn btn-outline-secondary btn-sm" onclick="agregarAlCarrito(${item.id})">+</button>
                    <button class="btn btn-danger btn-sm ms-3" onclick="removerDelCarrito(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    });

    cartItemsContainer.innerHTML = htmlItems;
    cartTotalContainer.innerHTML = `<h4>Total: $${subtotal.toFixed(2)}</h4>`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

// Checkout
async function handleCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutMessage = document.getElementById('checkout-message');

    if (!checkoutBtn || !checkoutMessage) return;

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Validando...';

    const carrito = getLocalStorage(CARRITO_KEY) || [];

    try {
        const response = await fetch('/api/validar-carrito', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ carrito }) // enviamos TODO el objeto con precio
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
    } catch (err) {
        console.error(err);
        checkoutMessage.innerHTML = `<div class="alert alert-danger">Error de conexión.</div>`;
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Realizar Pedido';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    renderCartBadge();
    renderCart();

    const logoutBtn = document.getElementById('logoutBtn');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
});
