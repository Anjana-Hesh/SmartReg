// Authentication Functions
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Sign In Form Handler
document.getElementById('signinForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    // Show loading state
    showLoading();

    // Simulate API call
    setTimeout(() => {
        hideLoading();

        // Redirect based on role
        if (role === 'admin') {
            window.location.href = '../views/adminDashboard.html';
        } else {
            window.location.href = '../views/starffDashboard.html';
        }
    }, 1500);
});

// Sign Up Form Handler
document.getElementById('signupForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('Passwords do not match!', 'error');
        return;
    }

    showLoading();

    setTimeout(() => {
        hideLoading();
        showAlert('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 2000);
    }, 1500);
});

// Forgot Password Form Handler
document.getElementById('forgotPasswordForm')?.addEventListener('submit', function(e) {
    e.preventDefault();

    showLoading();

    setTimeout(() => {
        hideLoading();
        showAlert('Password reset link sent to your email!', 'success');
    }, 1500);
});

// Utility Functions
function showLoading() {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Please wait...</p>
        </div>
    `;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        text-align: center;
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}