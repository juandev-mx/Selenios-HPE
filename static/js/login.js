// login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const submitBtn = document.getElementById('submitBtn');

    // Validación de email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Limpiar errores
    function clearErrors() {
        emailError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('input-error');
        passwordInput.classList.remove('input-error');
    }

    // Mostrar error
    function showError(input, errorDiv, message) {
        input.classList.add('input-error');
        errorDiv.textContent = message;
    }

    // Validación del formulario
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        let hasError = false;

        // Validar email
        if (!email) {
            showError(emailInput, emailError, 'El correo es requerido');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError(emailInput, emailError, 'El correo no es válido');
            hasError = true;
        }

        // Validar contraseña
        if (!password) {
            showError(passwordInput, passwordError, 'La contraseña es requerida');
            hasError = true;
        } else if (password.length < 6) {
            showError(passwordInput, passwordError, 'La contraseña debe tener mínimo 6 caracteres');
            hasError = true;
        }

        if (hasError) return;

        // Deshabilitar botón mientras se procesa
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mail: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Login exitoso
                console.log('Login exitoso:', data);
                
                // Guardar datos del usuario en sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirigir según el tipo de usuario
                redirectUser(data.user.role);
            } else {
                // Error en login
                showError(passwordInput, passwordError, data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(passwordInput, passwordError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            // Rehabilitar botón
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar sesión';
        }
    });

    // Función para redirigir según el rol
    function redirectUser(role) {
        switch(role) {
            case 'CLIENT':
                window.location.href = '/home_cliente.html';
                break;
            case 'HPE_REP':
            case 'HPE_MANAGER':
                window.location.href = '/home_hpe.html';
                break;
            default:
                alert('Rol de usuario desconocido');
        }
    }

    // Limpiar errores al escribir
    emailInput.addEventListener('input', function() {
        if (emailError.textContent) {
            emailInput.classList.remove('input-error');
            emailError.textContent = '';
        }
    });

    passwordInput.addEventListener('input', function() {
        if (passwordError.textContent) {
            passwordInput.classList.remove('input-error');
            passwordError.textContent = '';
        }
    });
});