// front/js/product.js
import { 
    checkAuth, 
    handleLogout, 
    loadStoreData, 
    renderCartBadge,
    // Importamos la función global para asignarla a 'window'
    agregarAlCarrito 
} from './app2.js';

// Asignar función al objeto global 'window' para que el 'onclick' del HTML funcione
window.agregarAlCarrito = agregarAlCarrito;

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seguridad y Carga de Datos
    if (!checkAuth()) return;
    const { productos } = loadStoreData();

    // 2. Selectores de Página
    const productDetailContainer = document.getElementById('product-detail-container');
    const productTitleEl = document.getElementById('product-title');
    const productPriceEl = document.getElementById('product-price');
    const productImageEl = document.getElementById('product-image');
    const productDescEl = document.getElementById('product-description');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const logoutBtn = document.getElementById('logoutBtn');

    // 3. Renderizar componentes comunes
    renderCartBadge();
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 4. Lógica de Página de Producto
    if (productDetailContainer) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = parseInt(urlParams.get('id'));

            if (isNaN(productId)) { throw new Error('ID de producto no válido.'); }

            const product = productos.find(p => p.id === productId);

            if (product) {
                productTitleEl.textContent = product.nombre;
                productPriceEl.textContent = `$${product.precio}`;
                productImageEl.src = product.imagen;
                productImageEl.alt = product.nombre;
                productDescEl.textContent = `Descubre ${product.nombre}, un producto de alta calidad en nuestra tienda. Perfecto para cualquier ocasión y al mejor precio.`;
                
                // Asignamos el evento al botón (mejor que 'onclick' en HTML)
                addToCartBtn.onclick = () => agregarAlCarrito(product.id);
                
                productDetailContainer.classList.remove('d-none');
            } else {
                throw new Error('Producto no encontrado.');
            }
        } catch (error) {
            console.error('Error al cargar el producto:', error.message);
            if (productDetailContainer) {
                productDetailContainer.innerHTML = `<p class="text-danger text-center col-12">Error: ${error.message}. Intente volver al inicio.</p>`;
                productDetailContainer.classList.remove('d-none');
            }
        } finally {
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    }
});