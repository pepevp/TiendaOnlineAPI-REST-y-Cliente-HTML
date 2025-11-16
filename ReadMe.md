Orden:

1. Instalar node:

npm init -y

2. Instalar express:

npm install express

3. Instalar boostrap:

npm install bootstrap

4. Settear la estructura de carpetas:

TiendaOnlineAPI-REST-y-Cliente-HTML/
│
├─ front/              # Todo lo que ve y usa el cliente
│  ├─ estilos/                # Estilos (Bootstrap + personalización propia)
│  ├─ js/                 # Scripts JS, gestión del LocalStorage
│  ├─ paginas/              # Páginas HTML independientes (productos, carrito, login)
│  └─ index.html          # Página principal
│
├─ back/               # Lógica del servidor
│  ├─ auth/               # Login, registro, validación de credenciales
│  ├─ api/                # Endpoints PHP para validar precios, devolver info de la tienda
│  ├─ config/             # Configuración (tokens)
   ├─ data/
│  └─ index.php           # Punto de entrada (puede redirigir al login o API)
│
├─ node_modules/          # directorio de node
├─ package.json           # Dependencias Node
└─ README.md
