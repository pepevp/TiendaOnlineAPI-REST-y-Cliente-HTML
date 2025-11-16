🧩 Aplicación de Principios SOLID en el Proyecto

A continuación se explica cómo se aplican los principios SOLID dentro de la arquitectura del proyecto, y por qué mejoran la mantenibilidad, escalabilidad y claridad del código.

📌 1. Principio de Responsabilidad Única (SRP)

Qué significa:
Cada módulo debe tener una sola razón para cambiar. Una responsabilidad, un propósito.

Cómo lo aplicamos en el proyecto:
Antes había un app.js gigante que manejaba login, dashboard, carrito, detalles de producto… todo a la vez.
Ahora:

login.js → solo gestiona la autenticación.

cart.js → solo gestiona el carrito.

dashboard.js → solo gestiona los productos destacados.

utils.js → contiene funciones reutilizables.

Beneficio:
Si algo falla en el carrito, sabes exactamente qué archivo tocar. El código es más simple y más mantenible.

📌 2. Principio de Abierto/Cerrado (OCP)

Qué significa:
El software debe estar abierto a extensión, pero cerrado a modificación.

Cómo lo aplicamos:
El archivo utils.js se mantiene estable: rara vez se toca.
Si queremos añadir nueva funcionalidad, por ejemplo una página perfil.html:

Creamos perfil.js

Importamos checkAuth(), handleLogout() o lo que necesitemos de utils.js

No tocamos ni login.js, ni dashboard.js, ni cart.js

Beneficio:
El proyecto crece sin romper nada existente ni modificar código estable.

📌 3. Principio de Segregación de Interfaces (ISP)

Qué significa:
Un módulo no debe depender de funciones que no utiliza.

Cómo lo aplicamos:
Antes:

login.html cargaba un app.js enorme con funciones de carrito, productos, navegación… aunque no usaba nada de eso.

Ahora:

login.js solo importa las funciones que necesita (setLocalStorage, getLocalStorage, etc.).

cart.js importa solo lo relacionado con el carrito.

dashboard.js solo usa funciones de carga de tienda.

Beneficio:
Cada archivo es ligero, claro y no está “contaminado” de funciones innecesarias.

📌 4. Principio de Inversión de Dependencias (DIP)

Qué significa:
Los módulos de alto nivel no deben depender de detalles de bajo nivel.
Ambos deben depender de abstracciones.

Cómo lo aplicamos:
Ejemplo clave: el almacenamiento de datos.

Ninguna página llama directamente a localStorage.getItem()

En su lugar, todas dependen de una abstracción:

loadStoreData()


(y otras funciones de utils.js)

Si mañana decidimos cambiar LocalStorage → SessionStorage, filesystem, o indexedDB:

Solo modificamos utils.js

Ninguna otra parte de la aplicación necesita ser cambiada

Beneficio:
El proyecto es más escalable y adaptable a cambios futuros.