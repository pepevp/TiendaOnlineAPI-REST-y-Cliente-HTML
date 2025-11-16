// front/js/cart.js
import { 
    checkAuth, 
    handleLogout, 
    loadStoreData, 
    renderCartBadge,
    getLocalStorage,
    CARRITO_KEY,
    // Importamos las funciones globales para asignarlas a 'window'
    agregarAlCarrito,
    disminuirCantidad,
    removerDelCarrito
} from './app2.js';

// Asignar funciones al objeto global 'window' para que los 'onclick' del HTML funcionen
// Y para que 'agregarAlCarrito' (que es importada) pueda llamar a renderCart()
window.agregarAlCarrito = (id) => {
    agregarAlCarrito(id); // Llama a la función de utils
    renderCart(); // Vuelve a pintar el carrito
};
window.disminuirCantidad = (id) => {
    disminuirCantidad(id);
    renderCart();
};
window.removerDelCarrito = (id) => {
    removerDelCarrito(id);
    renderCart();
};


// --- Carga de Datos ---
const { productos } = loadStoreData();
const token = getLocalStorage('token');

// --- Lógica de Renderizado de Carrito (Función local) ---
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalContainer = document.getElementById('cart-total-container');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsContainer) return; // Salir si no estamos en la pág. de carrito

    const carrito = getLocalStorage(CARRITO_KEY) || [];
    
    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted">Tu carrito está vacío.</p>';
        cartTotalContainer.innerHTML = '<p class="text-muted">Añade productos para ver el total.</p>';
        checkoutBtn.disabled = true;
        return;
    }
    
    let htmlItems = '';
    let subtotal = 0;

    carrito.forEach(item => {
        const productData = productos.find(p => p.id === item.id);
        if (!productData) return; 

        const itemTotal = productData.precio * item.quantity;
        subtotal += itemTotal;

        htmlItems += `
        <div class="card mb-3 shadow-sm border-0">
            <div class="row g-0">
                <div class="col-md-2 d-none d-md-block">
                    <img src="${productData.imagen}" class="img-fluid rounded-start" alt="${productData.nombre}" style="height: 100%; object-fit: cover;">
                </div>
                <div class="col-md-7">
                    <div class="card-body">
                        <h5 class="card-title">${productData.nombre}</h5>
                        <p class="card-text text-muted">Precio unitario: $${productData.precio}</p>
                    </div>
                </div>
                <div class="col-md-3 col-12 d-flex align-items-center justify-content-center p-3 p-md-0">
                    <button class="btn btn-outline-secondary btn-sm" onclick="disminuirCantidad(${productData.id})">-</button>
                    <strong class="mx-2">${item.quantity}</strong>
                    <button class="btn btn-outline-secondary btn-sm" onclick="agregarAlCarrito(${productData.id})">+</button>
                    <button class="btn btn-danger btn-sm ms-3" onclick="removerDelCarrito(${productData.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    });
    
    cartItemsContainer.innerHTML = htmlItems;
    
    // Renderizar Total
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
        </div>
    `;
    checkoutBtn.disabled = false;
}

// --- Lógica de Checkout (Función local) ---
async function handleCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutMessage = document.getElementById('checkout-message');
    const loadingSpinner = document.getElementById('loading-spinner');

    console.log("Iniciando validación de checkout...");
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Validando...';
    if (loadingSpinner) loadingSpinner.style.display = 'block';

    const carrito = getLocalStorage(CARRITO_KEY) || [];
    
    const carritoParaServidor = carrito.map(item => {
        const productData = productos.find(p => p.id === item.id);
        return {
            id: item.id,
            quantity: item.quantity,
            price: productData.precio 
        };
    });

    try {
        const response = await fetch('/api/validar-carrito', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ carrito: carritoParaServidor })
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


// --- INICIALIZACIÓN DE LA PÁGINA DE CARRITO ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seguridad
    if (!checkAuth()) return;

    // 2. Selectores
    const logoutBtn = document.getElementById('logoutBtn');
    const checkoutBtn = document.getElementById('checkout-btn');

    // 3. Renderizado inicial
    renderCartBadge();
    renderCart();
    
    // 4. Listeners
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});