// Sign In Form Handler
$('#signinForm').on('submit', function (e) {
    e.preventDefault();

    const email = $('#email').val();
    const password = $('#password').val();
    const role = $('#role').val();

    showLoading();

    setTimeout(() => {
        hideLoading();

        if (role === 'admin') {
            window.location.href = '../views/adminDashboard.html';
        } else {
            window.location.href = '../views/starffDashboard.html';
        }
    }, 1500);
});

// Sign Up Form Handler
$('#signupForm').on('submit', function (e) {
    e.preventDefault();

    const password = $('#password').val();
    const confirmPassword = $('#confirmPassword').val();

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
$('#forgotPasswordForm').on('submit', function (e) {
    e.preventDefault();

    showLoading();

    setTimeout(() => {
        hideLoading();
        showAlert('Password reset link sent to your email!', 'success');
    }, 1500);
});

// Utility Functions
function showLoading() {
    const overlay = $(`
        <div id="loadingOverlay" style="
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
        ">
            <div class="loading-content text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Please wait...</p>
            </div>
        </div>
    `);
    $('body').append(overlay);
}

function hideLoading() {
    $('#loadingOverlay').remove();
}

function showAlert(message, type) {
    const alertDiv = $(`
        <div class="alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    $('body').append(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
