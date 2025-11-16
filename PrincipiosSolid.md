
---

## 2. Flujo de Datos

1. **Login**
   - Usuario ingresa nombre y contraseña.
   - Envío al backend (`back/auth/login.php`).
   - Backend valida y devuelve token + información completa de la tienda.
   - Se guarda en **LocalStorage**:
     - `token`
     - `tienda` (productos y categorías)

2. **Dashboard, Categorías y Producto**
   - Se cargan datos desde LocalStorage.
   - Cada sección verifica que el **token** existe antes de mostrar información.
   - Los productos destacados, categorías y productos vistos recientemente se muestran dinámicamente.

3. **Carrito**
   - Productos añadidos al carrito se guardan en `localStorage.carrito`.
   - Al realizar la compra, se envía al backend (`back/api/carrito.php`) con token.
   - Backend valida que los precios no hayan sido manipulados.
   - Si todo correcto, carrito se vacía.

4. **Productos Vistos Recientemente**
   - Cada producto visualizado se guarda en `localStorage.productos_vistos`.
   - Se muestran como recomendaciones en el dashboard o carrito.
   - Se limita a los últimos 5 productos.

---

## 3. Principios SOLID aplicados

1. **S - Single Responsibility Principle (SRP)**
   - Cada script tiene una responsabilidad:
     - `product.js`: mostrar detalle de producto y guardar productos vistos.
     - `categories.js`: mostrar categorías y productos filtrados.
     - `cart.js`: gestionar carrito y validar compra.
     - `app.js`: login y dashboard.

2. **O - Open/Closed Principle (OCP)**
   - Código diseñado para añadir nuevas funcionalidades sin modificar las existentes.  
     - Ej.: se pueden agregar nuevas páginas o endpoints sin tocar login.js.

3. **L - Liskov Substitution Principle (LSP)**
   - Funciones como `agregarAlCarrito()` aceptan cualquier producto válido, garantizando consistencia.

4. **I - Interface Segregation Principle (ISP)**
   - Cada módulo (login, carrito, productos) expone solo las funciones necesarias para su interacción.

5. **D - Dependency Inversion Principle (DIP)**
   - El frontend depende de interfaces (token + JSON de tienda) y no de implementaciones concretas del backend.

---

## 4. Personalización de Bootstrap

- Los estilos propios van en `front/estilos/custom.css`.
- Se pueden sobreescribir variables de Bootstrap, colores, fuentes, etc.
- Ejemplo: cambiar color de botón primario:

```css
.btn-primary {
    background-color: #ff6600;
    border-color: #ff6600;
}
