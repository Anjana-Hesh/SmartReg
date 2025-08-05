// Enhanced toggle password visibility
function togglePassword(fieldId, iconId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);

    if (field.type === "password") {
        field.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        field.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

// Enhanced feedback display
function showFeedback(elementId, message, isValid = true) {
    const feedback = document.getElementById(elementId);
    const input = document.getElementById(elementId.replace('Feedback', ''));

    feedback.innerHTML = `<i class="fas fa-${isValid ? 'check' : 'times'}"></i> ${message}`;
    feedback.className = `feedback ${isValid ? 'valid' : 'invalid'}`;
    feedback.style.display = 'flex';

    input.classList.remove('is-valid', 'is-invalid');
    input.classList.add(isValid ? 'is-valid' : 'is-invalid');
}

function hideFeedback(elementId) {
    const feedback = document.getElementById(elementId);
    const input = document.getElementById(elementId.replace('Feedback', ''));

    feedback.style.display = 'none';
    input.classList.remove('is-valid', 'is-invalid');
}

// Enhanced password strength checker
function checkPasswordStrength(password) {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    // Update requirement indicators with icons
    const requirements = [
        { id: 'lengthReq', valid: hasMinLength },
        { id: 'upperReq', valid: hasUpperCase },
        { id: 'lowerReq', valid: hasLowerCase },
        { id: 'numberReq', valid: hasNumber },
        { id: 'specialReq', valid: hasSpecialChar }
    ];

    requirements.forEach(req => {
        const element = document.getElementById(req.id);
        const icon = element.querySelector('i');

        element.className = req.valid ? 'requirement valid' : 'requirement invalid';
        icon.className = req.valid ? 'fas fa-check' : 'fas fa-times';
    });

    let strength = 0;
    if (hasMinLength) strength++;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumber) strength++;
    if (hasSpecialChar) strength++;

    return strength;
}

// Enhanced password match checker
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (confirmPassword.length === 0) {
        hideFeedback('passwordMatchFeedback');
    } else if (password === confirmPassword) {
        showFeedback('passwordMatchFeedback', 'Passwords match', true);
    } else {
        showFeedback('passwordMatchFeedback', 'Passwords do not match', false);
    }
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Phone validation
function validatePhone(phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const re = /^\+?\d{8,15}$/;
    return re.test(cleaned);
}

// Username validation
function validateUsername(username) {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
}

// Name validation
function validateName(name) {
    return name.trim().length >= 2;
}

// Show SweetAlert notification
function showAlert(icon, title, text, confirmButtonColor = '#3085d6') {
    return Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonColor: confirmButtonColor,
        confirmButtonText: 'OK'
    });
}

// Show loading SweetAlert
function showLoading(title = 'Processing...') {
    Swal.fire({
        title: title,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });
}

// Close loading SweetAlert
function closeLoading() {
    Swal.close();
}

// Event listeners with enhanced validation
document.getElementById('firstName').addEventListener('blur', function() {
    if (!validateName(this.value)) {
        showFeedback('firstNameFeedback', 'Name must be at least 2 characters', false);
    } else {
        showFeedback('firstNameFeedback', 'Valid name', true);
    }
});

document.getElementById('username').addEventListener('blur', function() {
    if (!validateUsername(this.value)) {
        showFeedback('usernameFeedback', 'Username must be 3-20 characters (letters, numbers, underscore only)', false);
    } else {
        showFeedback('usernameFeedback', 'Valid username', true);
    }
});

document.getElementById('email').addEventListener('blur', function() {
    if (!validateEmail(this.value)) {
        showFeedback('emailFeedback', 'Please enter a valid email address', false);
    } else {
        showFeedback('emailFeedback', 'Valid email address', true);
    }
});

document.getElementById('phone').addEventListener('blur', function() {
    if (!validatePhone(this.value)) {
        showFeedback('phoneFeedback', 'Please enter a valid phone number (8-15 digits)', false);
    } else {
        showFeedback('phoneFeedback', 'Valid phone number', true);
    }
});

document.getElementById('password').addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    document.getElementById('passwordStrength').className = 'password-strength strength-' + strength;
    checkPasswordMatch();
});

document.getElementById('confirmPassword').addEventListener('input', checkPasswordMatch);

// Enhanced form submission with AJAX and SweetAlert
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form values
    const formData = {
        fullName: document.getElementById('firstName').value,
        userName: document.getElementById('username').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };

    // Client-side validation
    if (!validateName(formData.fullName)) {
        showFeedback('firstNameFeedback', 'Name must be at least 2 characters', false);
        await showAlert('error', 'Invalid Name', 'Please enter a valid name with at least 2 characters');
        document.getElementById('firstName').focus();
        return;
    }

    if (!validateUsername(formData.userName)) {
        showFeedback('usernameFeedback', 'Username must be 3-20 characters (letters, numbers, underscore only)', false);
        await showAlert('error', 'Invalid Username', 'Username must be 3-20 characters and can only contain letters, numbers, and underscores');
        document.getElementById('username').focus();
        return;
    }

    if (!validateEmail(formData.email)) {
        showFeedback('emailFeedback', 'Please enter a valid email address', false);
        await showAlert('error', 'Invalid Email', 'Please enter a valid email address');
        document.getElementById('email').focus();
        return;
    }

    if (!validatePhone(formData.phoneNumber)) {
        showFeedback('phoneFeedback', 'Please enter a valid phone number (8-15 digits)', false);
        await showAlert('error', 'Invalid Phone', 'Please enter a valid phone number with 8-15 digits');
        document.getElementById('phone').focus();
        return;
    }

    const passwordStrength = checkPasswordStrength(formData.password);
    if (passwordStrength < 3) {
        await showAlert('error', 'Weak Password', 'Please choose a stronger password that meets all requirements');
        document.getElementById('password').focus();
        return;
    }

    if (formData.password !== document.getElementById('confirmPassword').value) {
        showFeedback('passwordMatchFeedback', 'Passwords do not match', false);
        await showAlert('error', 'Password Mismatch', 'The passwords you entered do not match');
        document.getElementById('confirmPassword').focus();
        return;
    }

    if (!document.getElementById('terms').checked) {
        await showAlert('error', 'Terms Not Accepted', 'You must agree to the terms and conditions');
        document.getElementById('terms').focus();
        return;
    }

    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating account...';
    submitBtn.disabled = true;

    showLoading('Creating your account...');

    try {
        // Send data to backend
        const response = await fetch('http://localhost:8080/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle validation errors from backend
            if (response.status === 400 && data.data) {
                let errorMessages = [];
                for (const [field, message] of Object.entries(data.data)) {
                    const feedbackId = `${field}Feedback`;
                    if (document.getElementById(feedbackId)) {
                        showFeedback(feedbackId, message, false);
                        errorMessages.push(`${message}`);
                    } else {
                        errorMessages.push(`${field}: ${message}`);
                    }
                }

                await showAlert('error', 'Registration Failed', errorMessages.join('\n\n'));
                return;
            }
            throw new Error(data.message || 'Registration failed');
        }

        // Success handling with SweetAlert
        await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: 'Your account has been successfully created.',
            showConfirmButton: true,
            confirmButtonColor: '#28a745',
            willClose: () => {
                window.location.href = '../index.html'; // Redirect to login page
            }
        });

    } catch (error) {
        console.error('Error:', error);
        await showAlert('error', 'Registration Error', error.message || 'An error occurred during registration. Please try again.');
    } finally {
        // Reset button state
        submitBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i> Create Account';
        submitBtn.disabled = false;
        closeLoading();
    }
});

// Clear feedback on input focus
document.querySelectorAll('.form-control-glass').forEach(input => {
    input.addEventListener('focus', function() {
        const feedbackId = this.id + 'Feedback';
        if (document.getElementById(feedbackId)) {
            hideFeedback(feedbackId);
        }
    });
});