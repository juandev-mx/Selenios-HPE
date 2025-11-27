document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
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

        function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

        function validateName(name) {
        const re = /^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$/;
        return re.test(name);
    }

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

        function showError(input, errorDiv, message) {
        input.classList.add('input-error');
        errorDiv.textContent = message;
    }

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

        registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const company = companyInput.value.trim();
        
        let hasError = false;

                if (!fullName) {
            showError(fullNameInput, nameError, 'Name is required');
            hasError = true;
        } else if (!validateName(fullName)) {
            showError(fullNameInput, nameError, 'The name can only contain letters and spaces.');
            hasError = true;
        }

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

                if (!confirmPassword) {
            showError(confirmPasswordInput, confirmPasswordError, 'You must confirm the password');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError(confirmPasswordInput, confirmPasswordError, 'The passwords do not match');
            hasError = true;
        }

                if (!company) {
            showError(companyInput, companyError, 'The company name is required');
            hasError = true;
        }

        if (hasError) return;

                submitBtn.disabled = true;
        submitBtn.textContent = 'Creating an account...';

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
                                notify.success('Your account was created successfully. You can now sign in.', { duration: 5000 });
                                window.location.reload();
                                window.location.href = '/login.html';
            } else {
                                if (data.error.includes('email')) {
                    showError(emailInput, emailError, data.error);
                } else {
                    showError(companyInput, companyError, data.error || 'Error creating account');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showError(companyInput, companyError, 'Connection error. Please try again.');
        } finally {
                        submitBtn.disabled = false;
            submitBtn.textContent = 'Create account';
        }
    });
});