import { TIENDA_KEY, setLocalStorage, getLocalStorage } from './app2.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm'); 
    const mensaje = document.getElementById('mensaje'); 

    // 1. Si ya está logueado, pasar directo
    if (getLocalStorage('token')) {
        window.location.href = '/paginas/dashboard.html'; 
        return; 
    }

    // 2. Evento del formulario
    if (loginForm) {
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

                    // 👉 Guardamos AQUÍ el token real que manda el servidor
                    localStorage.setItem('token', data.token);   // 🔥 sin JSON.stringify


                    // Guardamos los datos de tienda
                    setLocalStorage(TIENDA_KEY, {
                        productos: data.productos || [],
                        categorias: data.categorias || []
                    });

                    // Redirigir
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
});
