// register.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    // Si no existe el formulario de registro, no hacer nada
    if (!registerForm) {
        return;
    }

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const companyInput = document.getElementById('company');
    
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const companyError = document.getElementById('companyError');
    
    const submitBtn = document.getElementById('submitBtn');

    // Validación de email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validación de nombre (solo letras y espacios)
    function validateName(name) {
        const re = /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$/;
        return re.test(name);
    }

    // Limpiar errores
    function clearErrors() {
        nameError.textContent = '';
        emailError.textContent = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
        companyError.textContent = '';
        
        fullNameInput.classList.remove('input-error');
        emailInput.classList.remove('input-error');
        passwordInput.classList.remove('input-error');
        confirmPasswordInput.classList.remove('input-error');
        companyInput.classList.remove('input-error');
    }

    // Mostrar error
    function showError(input, errorDiv, message) {
        input.classList.add('input-error');
        errorDiv.textContent = message;
    }

    // Limpiar errores individuales al escribir
    fullNameInput.addEventListener('input', function() {
        if (nameError.textContent) {
            fullNameInput.classList.remove('input-error');
            nameError.textContent = '';
        }
    });

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

    confirmPasswordInput.addEventListener('input', function() {
        if (confirmPasswordError.textContent) {
            confirmPasswordInput.classList.remove('input-error');
            confirmPasswordError.textContent = '';
        }
    });

    companyInput.addEventListener('input', function() {
        if (companyError.textContent) {
            companyInput.classList.remove('input-error');
            companyError.textContent = '';
        }
    });

    // Validación del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const company = companyInput.value.trim();
        
        let hasError = false;

        // Validar nombre completo
        if (!fullName) {
            showError(fullNameInput, nameError, 'El nombre es requerido');
            hasError = true;
        } else if (!validateName(fullName)) {
            showError(fullNameInput, nameError, 'El nombre solo puede contener letras y espacios');
            hasError = true;
        }

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

        // Validar confirmación de contraseña
        if (!confirmPassword) {
            showError(confirmPasswordInput, confirmPasswordError, 'Debes confirmar la contraseña');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError(confirmPasswordInput, confirmPasswordError, 'Las contraseñas no coinciden');
            hasError = true;
        }

        // Validar nombre de empresa
        if (!company) {
            showError(companyInput, companyError, 'El nombre de la empresa es requerido');
            hasError = true;
        }

        if (hasError) return;

        // Deshabilitar botón mientras se procesa
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando cuenta...';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: fullName,
                    mail: email,
                    password: password,
                    company_name: company
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Registro exitoso
                alert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
                window.location.href = '/login.html';
            } else {
                // Error en registro
                if (data.error.includes('correo')) {
                    showError(emailInput, emailError, data.error);
                } else {
                    showError(companyInput, companyError, data.error || 'Error al crear la cuenta');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showError(companyInput, companyError, 'Error de conexión. Intenta nuevamente.');
        } finally {
            // Rehabilitar botón
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear cuenta';
        }
    });
});