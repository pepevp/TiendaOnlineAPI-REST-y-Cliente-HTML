// front/js/dashboard.js
import { 
    checkAuth, 
    handleLogout, 
    loadStoreData, 
    renderCartBadge, 
    getLocalStorage,
    VISTOS_KEY,
    // Importamos las funciones globales para asignarlas a 'window'
    agregarAlCarrito, 
    verProducto 
} from './app2.js';

// Asignar funciones al objeto global 'window' para que los 'onclick' del HTML funcionen
window.agregarAlCarrito = agregarAlCarrito;
window.verProducto = verProducto;

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seguridad: Verificar autenticación
    if (!checkAuth()) return;

    // 2. Cargar datos
    const { productos, categorias } = loadStoreData();
    
    // 3. Selectores de página
    const productosDestacadosDiv = document.getElementById('productosDestacados');
    const categoriasDiv = document.getElementById('categorias');
    const productosVistosDiv = document.getElementById('productosVistos');
    const logoutBtn = document.getElementById('logoutBtn');

    // 4. Renderizar componentes
    renderCartBadge();
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Renderizar productos destacados
    if (productosDestacadosDiv) {
        const destacados = productos.filter(p => p.destacado === true);
        if (destacados.length > 0) {
            productosDestacadosDiv.innerHTML = destacados.map(p => `
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
            productosDestacadosDiv.innerHTML = '<p class="text-muted">No hay productos destacados disponibles.</p>';
        }
    }

    // Renderizar categorías
    if (categoriasDiv) {
        categoriasDiv.innerHTML = categorias.map(c => `
            <div class="col-md-3 mb-4">
                <div class="card text-center h-100 bg-secondary border-0 shadow-sm category-card rounded-lg">
                    <div class="card-body">
                        <h5 class="card-title text-dark">${c.nombre}</h5>
                        <a href="/paginas/categorias.html?id=${c.id}" class="stretched-link"></a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Renderizar productos vistos recientemente
    if (productosVistosDiv) {
        const vistosIds = getLocalStorage(VISTOS_KEY) || [];
        const uniqueVistosIds = [...new Set(vistosIds)].slice(0, 3);
        if (uniqueVistosIds.length > 0) {
            let htmlContent = '<div class="row">';
            uniqueVistosIds.forEach(id => {
                const p = productos.find(prod => prod.id == id);
                if (!p) return;
                htmlContent += `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-dashed-primary rounded-lg">
                            <div class="card-body p-3">
                                <h6 class="card-title">${p.nombre}</h6>
                                <small class="text-success">$${p.precio}</small>
                                <button class="btn btn-outline-primary btn-sm mt-2 w-100" onclick="verProducto(${p.id})">Ver Detalle</button>
                            </div>
                        </div>
                    </div>`;
            });
            htmlContent += '</div>';
            productosVistosDiv.innerHTML = htmlContent;
        } else {
             productosVistosDiv.innerHTML = '<p class="text-muted">Aún no has visto ningún producto.</p>';
        }
    }
});