// front/js/app.js

// --- CLAVES GLOBALES ---
const TIENDA_KEY = 'tienda_data_json'; 
const CARRITO_KEY = 'carrito'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // --- SELECTORES ---
    // Login
    const loginForm = document.getElementById('loginForm'); 
    const mensaje = document.getElementById('mensaje'); 
    
    // Dashboard
    const productosDestacadosDiv = document.getElementById('productosDestacados');
    const categoriasDiv = document.getElementById('categorias');
    const productosVistosDiv = document.getElementById('productosVistos');
    const logoutBtn = document.getElementById('logoutBtn'); 

    // Página de Categoría
    const categoryTitleEl = document.getElementById('category-title');
    const categoryProductListEl = document.getElementById('category-product-list');
    
    // Página de Producto
    const productDetailContainer = document.getElementById('product-detail-container');
    const productTitleEl = document.getElementById('product-title');
    const productPriceEl = document.getElementById('product-price');
    const productImageEl = document.getElementById('product-image');
    const productDescEl = document.getElementById('product-description');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    // Página de Carrito
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalContainer = document.getElementById('cart-total-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutMessage = document.getElementById('checkout-message');

    // Spinner
    const loadingSpinner = document.getElementById('loading-spinner');


    // --- CARGA DE DATOS ---
    const token = localStorage.getItem('token');
    const tiendaData = JSON.parse(localStorage.getItem(TIENDA_KEY) || '{}');
    const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
    const categorias = Array.isArray(tiendaData.categorias) ? tiendaData.categorias : [];

    
    // --- (NUEVO) INICIALIZAR BADGE DEL CARRITO ---
    renderCartBadge();


    // --- GUARDIA DE SEGURIDAD ---
    const isProtectedPage = productosDestacadosDiv || categoryProductListEl || productDetailContainer || cartItemsContainer;
    if (isProtectedPage && !token) {
        console.warn('Acceso denegado. Redirigiendo a login.');
        window.location.href = '/paginas/login.html'; 
        return; 
    }


    // --- LÓGICA DE LOGIN ---
    if (loginForm) {
        // ... (Sin cambios) ...
        if (token) {
            window.location.href = '/paginas/dashboard.html'; 
            return; 
        }
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const usuario = document.getElementById('usuario').value;
            const password = document.getElementById('password').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Cargando...';
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, password })
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem(TIENDA_KEY, JSON.stringify({
                         productos: data.productos || [],
                         categorias: data.categorias || []
                    }));
                    window.location.href = '/paginas/dashboard.html';
                } else {
                    mensaje.textContent = data.mensaje;
                }
            } catch (error) {
                mensaje.textContent = 'Error en la conexión con el servidor.';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar'; 
            }
        });
    }


    // --- LÓGICA DE DASHBOARD ---
    if (productosDestacadosDiv) {
        // ... (Sin cambios) ...
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
    if (categoriasDiv) {
        // ... (Sin cambios) ...
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
    if (productosVistosDiv) {
        // ... (Sin cambios) ...
        const vistosIds = JSON.parse(localStorage.getItem('productos_vistos') || '[]');
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


    // --- LÓGICA DE PÁGINA DE CATEGORÍA ---
    if (categoryProductListEl) {
        // ... (Sin cambios) ...
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

    
    // --- LÓGICA DE PÁGINA DE PRODUCTO ---
    if (productDetailContainer) {
        // ... (Sin cambios) ...
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


    // --- LÓGICA DE PÁGINA DE CARRITO ---
    // (Función local 'renderCart' movida fuera para ser reutilizable)
    if (cartItemsContainer) {
        console.log("-> Cargando página de Carrito...");
        
        // Renderizar el carrito al cargar la página
        renderCart(productos);
        
        // Función local para manejar el checkout
        async function handleCheckout() {
            console.log("Iniciando validación de checkout...");
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Validando...';
            if (loadingSpinner) loadingSpinner.style.display = 'block';

            const carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
            
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
                    renderCart(productos); // Volver a pintar el carrito (vacío)
                    renderCartBadge(); // Actualizar el badge global
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

        checkoutBtn.addEventListener('click', handleCheckout);
    }


    // --- LÓGICA DE CERRAR SESIÓN (Logout) ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem(TIENDA_KEY); 
            localStorage.removeItem(CARRITO_KEY);
            localStorage.removeItem('productos_vistos');
            window.location.href = '/paginas/login.html'; 
        });
    }
});


// --- FUNCIONES GLOBALES ---

/**
 * (NUEVO)
 * Renderiza el contenido de la página del carrito.
 * (Movida aquí para ser reutilizable por las funciones de modificar carrito).
 */
function renderCart(productos) {
    // Esta función solo debe ejecutarse si estamos en la página del carrito
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (!cartItemsContainer) return;

    const cartTotalContainer = document.getElementById('cart-total-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    const carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
    
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

/**
 * (NUEVO)
 * Actualiza el contador (badge) del carrito en la barra de navegación.
 */
function renderCartBadge() {
    const cartBadge = document.getElementById('cart-count-badge');
    if (!cartBadge) return; // No estamos en una página con el badge

    const carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
    
    // Sumar la *cantidad* de cada item
    const totalItems = carrito.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'block'; // Mostrarlo
    } else {
        cartBadge.style.display = 'none'; // Ocultarlo
    }
}

/**
 * (ACTUALIZADO)
 * Añade un producto al carrito o incrementa su cantidad.
 */
function agregarAlCarrito(productId) {
    let carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
    
    const existingProductIndex = carrito.findIndex(p => p.id === productId);

    if (existingProductIndex > -1) {
        carrito[existingProductIndex].quantity++;
    } else {
        carrito.push({ id: productId, quantity: 1 });
    }
    
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    console.log(`Producto ${productId} añadido/incrementado.`); 
    
    // Actualizar UI dinámicamente
    renderCartBadge(); // Actualiza el badge de la nav
    
    if (document.getElementById('cart-items-container')) {
        // Si estamos en el carrito, volver a pintarlo sin recargar
        const tiendaData = JSON.parse(localStorage.getItem(TIENDA_KEY) || '{}');
        const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
        renderCart(productos);
    } else {
        alert('Producto añadido al carrito'); // Feedback en otras páginas
    }
}

/**
 * (ACTUALIZADO)
 * Disminuye la cantidad de un producto en el carrito.
 */
function disminuirCantidad(productId) {
    let carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
    const existingProductIndex = carrito.findIndex(p => p.id === productId);

    if (existingProductIndex > -1) {
        carrito[existingProductIndex].quantity--;
        
        if (carrito[existingProductIndex].quantity <= 0) {
            carrito = carrito.filter(p => p.id !== productId);
        }
        
        localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
        
        // Actualizar UI dinámicamente
        renderCartBadge(); // Actualiza el badge de la nav
        
        if (document.getElementById('cart-items-container')) {
            const tiendaData = JSON.parse(localStorage.getItem(TIENDA_KEY) || '{}');
            const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
            renderCart(productos);
        }
    }
}

/**
 * (ACTUALIZADO)
 * Remueve todas las unidades de un producto del carrito.
 */
function removerDelCarrito(productId) {
    let carrito = JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
    carrito = carrito.filter(p => p.id !== productId);
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    
    // Actualizar UI dinámicamente
    renderCartBadge(); // Actualiza el badge de la nav
    
    if (document.getElementById('cart-items-container')) {
        const tiendaData = JSON.parse(localStorage.getItem(TIENDA_KEY) || '{}');
        const productos = Array.isArray(tiendaData.productos) ? tiendaData.productos : [];
        renderCart(productos);
    }
}


/**
 * (ACTUALIZADO)
 * Guarda el producto en "vistos recientemente" y redirige a la página de detalle.
 */
function verProducto(productId) {
    // 1. Guardar en "vistos recientemente"
    let vistos = JSON.parse(localStorage.getItem('productos_vistos') || '[]');
    
    vistos = vistos.filter(id => id !== productId); 
    vistos.unshift(productId); 
    if (vistos.length > 10) vistos.pop(); 
    
    localStorage.setItem('productos_vistos', JSON.stringify(vistos));
    console.log(`Producto ${productId} registrado como visto.`);
    
    // 2. Redirigir a la página de detalle del producto
    window.location.href = `/paginas/producto.html?id=${productId}`;
}