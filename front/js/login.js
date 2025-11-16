// front/js/login.js
import { TIENDA_KEY, setLocalStorage, getLocalStorage } from './app2.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm'); 
    const mensaje = document.getElementById('mensaje'); 

    // 1. Guardia: Si ya está logueado, redirigir al dashboard
    if (getLocalStorage('token')) {
        console.log('Token encontrado. Redirigiendo a dashboard...');
        window.location.href = '/paginas/dashboard.html'; 
        return; 
    }

    // 2. Lógica del formulario de login
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
                    setLocalStorage('token', data.token);
                    setLocalStorage(TIENDA_KEY, {
                         productos: data.productos || [],
                         categorias: data.categorias || []
                    });
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