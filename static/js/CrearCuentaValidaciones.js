(function(){
      const form = document.getElementById('registerForm');
      const fullName = document.getElementById('fullName');
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const confirmPassword = document.getElementById('confirmPassword');
      const companyName = document.getElementById('companyName');
      const submitBtn = document.getElementById('submitBtn');

      const fullNameError = document.getElementById('fullNameError');
      const emailError = document.getElementById('emailError');
      const passwordError = document.getElementById('passwordError');
      const confirmPasswordError = document.getElementById('confirmPasswordError');
      const companyNameError = document.getElementById('companyNameError');

      function validateFullName() {
        const val = fullName.value.trim();
        if (!val) {
          fullNameError.textContent = 'Full name is required.';
          fullName.setAttribute('aria-invalid','true');
          return false;
        }
        fullNameError.textContent = '';
        fullName.removeAttribute('aria-invalid');
        return true;
      }

      function validateEmail() {
        const val = email.value.trim();
        if (!val) {
          emailError.textContent = 'Email is required.';
          email.setAttribute('aria-invalid','true');
          return false;
        }
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(val)){
          emailError.textContent = 'Please enter a valid email.';
          email.setAttribute('aria-invalid','true');
          return false;
        }
        emailError.textContent = '';
        email.removeAttribute('aria-invalid');
        return true;
      }

      function validatePassword(){
        const val = password.value;
        if (!val) {
          passwordError.textContent = 'Password is required.';
          password.setAttribute('aria-invalid','true');
          return false;
        }
        if (val.length < 6){
          passwordError.textContent = 'Password must be at least 6 characters.';
          password.setAttribute('aria-invalid','true');
          return false;
        }
        passwordError.textContent = '';
        password.removeAttribute('aria-invalid');
        return true;
      }

      function validateConfirmPassword(){
        const val = confirmPassword.value;
        if (!val) {
          confirmPasswordError.textContent = 'Please confirm your password.';
          confirmPassword.setAttribute('aria-invalid','true');
          return false;
        }
        if (val !== password.value){
          confirmPasswordError.textContent = 'Passwords do not match.';
          confirmPassword.setAttribute('aria-invalid','true');
          return false;
        }
        confirmPasswordError.textContent = '';
        confirmPassword.removeAttribute('aria-invalid');
        return true;
      }

      function validateCompanyName() {
        const val = companyName.value.trim();
        if (!val) {
          companyNameError.textContent = 'Company name is required.';
          companyName.setAttribute('aria-invalid','true');
          return false;
        }
        companyNameError.textContent = '';
        companyName.removeAttribute('aria-invalid');
        return true;
      }

      function updateSubmitState(){
        const isValid = validateFullName() && validateEmail() && validatePassword() && validateConfirmPassword() && validateCompanyName();
        submitBtn.disabled = !isValid;
      }

      fullName.addEventListener('input', () => { validateFullName(); updateSubmitState(); });
      email.addEventListener('input', () => { validateEmail(); updateSubmitState(); });
      password.addEventListener('input', () => { validatePassword(); updateSubmitState(); });
      confirmPassword.addEventListener('input', () => { validateConfirmPassword(); updateSubmitState(); });
      companyName.addEventListener('input', () => { validateCompanyName(); updateSubmitState(); });

      form.addEventListener('submit', function(e){
        e.preventDefault();
        
        const okFullName = validateFullName();
        const okEmail = validateEmail();
        const okPass = validatePassword();
        const okConfirm = validateConfirmPassword();
        const okCompany = validateCompanyName();
        
        if (!okFullName || !okEmail || !okPass || !okConfirm || !okCompany) return;

        const accountType = document.querySelector('input[name="accountType"]:checked').value;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign Up';
          alert('Account created successfully! Type: ' + accountType);
          form.reset();
          updateSubmitState();
        }, 1000);
      });

      updateSubmitState();
    })();