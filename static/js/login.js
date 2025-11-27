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
            showError(emailInput, emailError, 'Email is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError(emailInput, emailError, 'The email address is invalid.');
            hasError = true;
        }

                if (!password) {
            showError(passwordInput, passwordError, 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            showError(passwordInput, passwordError, 'The password must be at least 6 characters long');
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
                                showError(passwordInput, passwordError, data.error || 'Error logging in');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(passwordInput, passwordError, 'Connection error. Please try again.');
        } finally {
                        submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
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
                notify.warning('We could not detect the user role. Please contact support.', { title: 'Unknown role' });
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