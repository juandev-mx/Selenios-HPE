document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const submitBtn = document.getElementById('submitBtn');

        function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

        function clearErrors() {
        emailError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('input-error');
        passwordInput.classList.remove('input-error');
    }

        function showError(input, errorDiv, message) {
        input.classList.add('input-error');
        errorDiv.textContent = message;
    }

        loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        let hasError = false;

                if (!email) {
            showError(emailInput, emailError, 'El correo es requerido');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError(emailInput, emailError, 'El correo no es válido');
            hasError = true;
        }

                if (!password) {
            showError(passwordInput, passwordError, 'La contraseña es requerida');
            hasError = true;
        } else if (password.length < 6) {
            showError(passwordInput, passwordError, 'La contraseña debe tener mínimo 6 caracteres');
            hasError = true;
        }

        if (hasError) return;

                submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

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


                                console.log('Login exitoso:', data);
                
                                sessionStorage.setItem('user', JSON.stringify(data.user));

                                localStorage.setItem("role", data.user.role); 
                
                                redirectUser(data.user.role);
            } else {
                                showError(passwordInput, passwordError, data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(passwordInput, passwordError, 'Error de conexión. Intenta nuevamente.');
        } finally {
                        submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar sesión';
        }
    });

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