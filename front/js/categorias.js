// front/js/categorias.js
import { 
    checkAuth, 
    handleLogout, 
    loadStoreData, 
    renderCartBadge,
    // Importamos las funciones globales para asignarlas a 'window'
    agregarAlCarrito, 
    verProducto 
} from './app2.js';

// --- CORRECCIÓN CLAVE ---
// Asignar funciones al objeto global 'window' para que los 'onclick' del HTML funcionen
window.agregarAlCarrito = agregarAlCarrito;
window.verProducto = verProducto;

document.addEventListener('DOMContentLoaded', () => {

    // 1. Seguridad y Carga de Datos
    if (!checkAuth()) return;
    const { productos, categorias } = loadStoreData();
    
    // 2. Selectores de Página
    const categoryTitleEl = document.getElementById('category-title');
    const categoryProductListEl = document.getElementById('category-product-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const logoutBtn = document.getElementById('logoutBtn');

    // 3. Renderizar componentes comunes
    renderCartBadge();
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // 4. Lógica de Página de Categoría
    if (categoryProductListEl) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const categoryId = parseInt(urlParams.get('id')); 

            if (isNaN(categoryId)) { throw new Error('ID de categoría no válido.'); }

            const category = categorias.find(c => c.id === categoryId);
            const filteredProducts = productos.filter(p => p.id_categoria === categoryId);

            if (category) {
                categoryTitleEl.textContent = `Mostrando productos de: ${category.nombre}`;
            } else {
                categoryTitleEl.textContent = 'Categoría no encontrada';
            }

            if (filteredProducts.length > 0) {
                categoryProductListEl.innerHTML = filteredProducts.map(p => `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 shadow-sm border-0 rounded-lg">
                            <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}" style="height: 200px; object-fit: cover;">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title text-primary">${p.nombre}</h5>
                                <p class="card-text text-muted">Precio: $${p.precio}</p>
                                <div class="mt-auto">
                                    <button class="btn btn-primary btn-sm" onclick="agregarAlCarrito(${p.id})">Añadir al carrito</button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="verProducto(${p.id})">Ver Detalle</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                categoryProductListEl.innerHTML = '<p class="text-muted col-12">No hay productos disponibles en esta categoría.</p>';
            }

        } catch (error) {
            console.error('Error al renderizar productos de categoría:', error.message);
            categoryTitleEl.textContent = 'Error al cargar productos.';
            categoryProductListEl.innerHTML = '<p class="text-danger col-12">Hubo un error al procesar los datos.</p>';
        
        } finally {
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    }
});