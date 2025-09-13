  $(document).ready(function () {
        const config = {
            apiBaseUrl: "http://localhost:8080/api/v1/auth",
            dashboardUrls: {
                ADMIN: "views/adminDashboard.html",
                DRIVER: "views/driverDashboard.html",
            },
            tokenKey: "smartreg_token",
            userKey: "smartreg_user",
            logoutFlag: "smartreg_logout",
        };

        if (localStorage.getItem(config.logoutFlag)) {
            localStorage.removeItem(config.logoutFlag);
            showLogoutMessage();
        }

        const $loginForm = $("#signinForm");
        const $usernameInput = $("#userName");
        const $passwordInput = $("#password");
        const $rememberCheckbox = $("#remember");
        const $loginBtn = $("#loginBtn");

        $loginForm.on("submit", async function (e) {
            e.preventDefault();
            await handleLogin();
        });

        async function handleLogin() {
            const username = $usernameInput.val().trim();
            const password = $passwordInput.val();

            if (!validateInputs(username, password)) return;

            setLoadingState(true);

            try {
                const response = await $.ajax({
                    url: `${config.apiBaseUrl}/login`,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({
                        userName: username,
                        password: password,
                    }),
                });

                if (response.data && response.data.accessToken) {
                    storeAuthData(response.data);
                    showSuccessAlert(response.data);
                    redirectToDashboard(response.data.role);
                } else {
                    throw new Error("Invalid server response");
                }
            } catch (error) {
                handleLoginError(error);
            } finally {
                setLoadingState(false);
            }
        }

        function validateInputs(username, password) {
            let isValid = true;
            $usernameInput.removeClass("is-invalid");
            $passwordInput.removeClass("is-invalid");

            if (!username) {
                $usernameInput.addClass("is-invalid");
                isValid = false;
            }

            if (!password) {
                $passwordInput.addClass("is-invalid");
                isValid = false;
            }
            return isValid;
        }

        function storeAuthData(authData) {
            localStorage.removeItem(config.tokenKey);
            sessionStorage.removeItem(config.tokenKey);
            
            const storage = $rememberCheckbox.is(":checked") ? localStorage : sessionStorage;
            storage.setItem(config.tokenKey, authData.accessToken);

            const userData = {
                id: authData.id,
                role: authData.role,
                fullName: authData.fullName,
                username: $usernameInput.val()
            };
            localStorage.setItem(config.userKey, JSON.stringify(userData));
        }

        function showSuccessAlert(authData) {
            const displayName = authData.fullName || $usernameInput.val().trim() || "User";
            Swal.fire({
                title: "Login Successful!",
                text: `Welcome back, ${displayName}`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
                background: "#1a1a1a",
                color: "#ffffff",
            });
        }

        function showLogoutMessage() {
            Swal.fire({
                title: "Logged Out",
                text: "You have been successfully logged out.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
                background: "#1a1a1a",
                color: "#ffffff",
            });
        }

        function redirectToDashboard(role) {
            if (!role) {
                console.error("No role provided");
                showRoleError();
                return;
            }

            const normalizedRole = role.toString().toUpperCase();
            const dashboardUrl = config.dashboardUrls[normalizedRole];

            if (dashboardUrl) {
                setTimeout(() => {
                    window.location.href = dashboardUrl;
                }, 1500);
            } else {
                console.error("No dashboard URL found for role:", normalizedRole);
                showRoleError();
            }
        }

        function showRoleError() {
            Swal.fire({
                title: "Access Error",
                text: "Your account role is not properly configured. Please contact support.",
                icon: "warning",
                background: "#1a1a1a",
                color: "#ffffff",
                confirmButtonText: "OK",
            });
        }

        function handleLoginError(error) {
            let errorMessage = "Login failed. Please try again.";

            if (error.responseJSON && error.responseJSON.message) {
                errorMessage = error.responseJSON.message;
            } else if (error.status === 401) {
                errorMessage = "Invalid username or password.";
            } else if (error.status === 403) {
                errorMessage = "Access denied. Please login again.";
                clearAuthData();
            } else if (error.status === 0) {
                errorMessage = "Connection failed. Please check your internet connection.";
            }

            Swal.fire({
                title: "Login Failed",
                text: errorMessage,
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff",
            });
        }

        function setLoadingState(isLoading) {
            if (isLoading) {
                $loginBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Signing In...');
                $loginBtn.prop("disabled", true);
            } else {
                $loginBtn.html('<i class="fas fa-sign-in-alt me-2"></i>Sign In');
                $loginBtn.prop("disabled", false);
            }
        }

        $("#togglePasswordBtn").on("click", function () {
            const $password = $("#password");
            const $icon = $("#toggleIcon");
            const type = $password.attr("type") === "password" ? "text" : "password";
            $password.attr("type", type);
            $icon.toggleClass("fa-eye fa-eye-slash");
        });

        $usernameInput.on("input", function () {
            $(this).removeClass("is-invalid");
        });

        $passwordInput.on("input", function () {
            $(this).removeClass("is-invalid");
        });

        checkAuthStatus();

        async function checkAuthStatus() {
            if (localStorage.getItem(config.logoutFlag)) {
                localStorage.removeItem(config.logoutFlag);
                return;
            }

            const token = localStorage.getItem(config.tokenKey) || sessionStorage.getItem(config.tokenKey);
            if (!token) return;

            const userData = JSON.parse(localStorage.getItem(config.userKey) || "{}");
            
            try {
                const isValid = await verifyToken(token);
                if (isValid && userData.role) {
                    redirectToDashboard(userData.role);
                } else {
                    clearAuthData();
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                clearAuthData();
            }
        }

        async function verifyToken(token) {
            try {
                const response = await $.ajax({
                    url: `${config.apiBaseUrl}/validate`,
                    type: "GET",
                    headers: { 
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    statusCode: {
                        403: function() {
                            console.log("Token validation failed - 403 Forbidden");
                        }
                    }
                });
                return true;
            } catch (error) {
                console.error("Token verification failed:", error);
                if (error.status === 403) {
                    clearAuthData();
                }
                return false;
            }
        }

        function clearAuthData() {
            localStorage.removeItem(config.tokenKey);
            localStorage.removeItem(config.userKey);
            sessionStorage.removeItem(config.tokenKey);
        }
    });

    /**
     * The callback function that handles the Google Sign-In response.
     * This function is triggered when a user successfully signs in with Google.
     * @param {Object} response - The credential response object from Google.
     */
    // Update the handleCredentialResponse function
async function handleCredentialResponse(response) {
    console.log("Google Credential Response:", response);
    
    if (!response.credential) {
        Swal.fire({
            title: "Google Sign-In Failed",
            text: "Could not retrieve Google credential.",
            icon: "error",
            background: "#1a1a1a",
            color: "#ffffff"
        });
        return;
    }

    showGoogleLoginLoading(true);

    try {
        const googleAuthDTO = { tokenId: response.credential };
        
        const res = await fetch("http://localhost:8080/api/v1/auth/google", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(googleAuthDTO)
        });
        
        const data = await res.json();
        console.log("Google login response:", data);
        
        if (res.ok && data.data) {
            const authData = data.data;
            
            if (!authData.accessToken || !authData.role) {
                throw new Error("Incomplete authentication data received");
            }
            
            // Store authentication data using the same method as normal login
            storeGoogleAuthData(authData);
            
            // Setup AJAX defaults immediately after storing token
            setupAjaxDefaultsForGoogleLogin(authData.accessToken);
            
            showGoogleSuccessAlert(authData);
            redirectToDashboard(authData.role);
            
        } else {
            throw new Error(data.message || "Authentication failed");
        }
        
    } catch (error) {
        console.error("Google login error:", error);
        
        let errorMessage = "Google login failed. Please try again.";
        if (error.message.includes("fetch")) {
            errorMessage = "Network error. Please check your connection and ensure the backend is running.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        Swal.fire({
            title: "Google Login Failed",
            text: errorMessage,
            icon: "error",
            background: "#1a1a1a",
            color: "#ffffff",
            confirmButtonText: "Try Again"
        });
        
    } finally {
        showGoogleLoginLoading(false);
    }
}

// Updated storeGoogleAuthData function - consistent with normal login
function storeGoogleAuthData(authData) {
    const config = {
        tokenKey: "smartreg_token",
        userKey: "smartreg_user"
    };
    
    // Clear any existing tokens
    localStorage.removeItem(config.tokenKey);
    sessionStorage.removeItem(config.tokenKey);
    
    // Store token in localStorage for consistency (Google login acts like "Remember me")
    // If you prefer sessionStorage, change this to sessionStorage
    localStorage.setItem(config.tokenKey, authData.accessToken);
    
    // Store user data with consistent structure
    const userData = {
        id: authData.id,
        role: authData.role,
        fullName: authData.fullName || authData.name,
        username: authData.username || authData.email || "Google User",
        email: authData.email,
        loginMethod: "GOOGLE"
    };
    
    localStorage.setItem(config.userKey, JSON.stringify(userData));
    console.log("Google auth data stored:", userData);
}

// Setup AJAX defaults immediately for Google login
function setupAjaxDefaultsForGoogleLogin(token) {
    if (typeof $ !== 'undefined') {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken) {
                    xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
                }
            },
            error: function(xhr, status, error) {
                if (xhr.status === 401) {
                    console.log("Unauthorized access detected");
                    clearAuthData();
                    window.location.href = '../index.html';
                } else if (xhr.status === 403) {
                    Swal.fire({
                        title: "Access Denied",
                        text: "You don't have permission to perform this action",
                        icon: "error",
                        background: "#1a1a1a",
                        color: "#ffffff"
                    });
                }
            }
        });
    }
}

// Utility function to clear auth data
function clearAuthData() {
    localStorage.removeItem("smartreg_token");
    localStorage.removeItem("smartreg_user");
    sessionStorage.removeItem("smartreg_token");
}

// Enhanced redirectToDashboard function
window.redirectToDashboard = function(role) {
    const config = {
        dashboardUrls: {
            ADMIN: "views/adminDashboard.html",
            DRIVER: "views/driverDashboard.html",
        }
    };
    
    if (!role) {
        console.error("No role provided for dashboard redirect");
        Swal.fire({
            title: "Access Error",
            text: "User role not found. Please contact support.",
            icon: "warning",
            background: "#1a1a1a",
            color: "#ffffff"
        });
        return;
    }
    
    const normalizedRole = role.toString().toUpperCase();
    const dashboardUrl = config.dashboardUrls[normalizedRole];
    
    console.log(`Redirecting to dashboard for role: ${normalizedRole}`);
    
    if (dashboardUrl) {
        // Store redirect info for debugging
        sessionStorage.setItem('login_method', 'GOOGLE');
        sessionStorage.setItem('redirect_role', normalizedRole);
        
        setTimeout(() => {
            window.location.href = dashboardUrl;
        }, 1500);
    } else {
        console.error(`No dashboard URL found for role: ${normalizedRole}`);
        Swal.fire({
            title: "Access Error",
            text: `Dashboard not available for your role: ${normalizedRole}. Please contact support.`,
            icon: "warning",
            background: "#1a1a1a",
            color: "#ffffff"
        });
    }
};

// Store Google authentication data with proper structure
function storeGoogleAuthData(authData) {
    // Clear any existing tokens
    localStorage.removeItem("smartreg_token");
    sessionStorage.removeItem("smartreg_token");
    
    // Store token in sessionStorage for Google login (more secure for OAuth)
    sessionStorage.setItem("smartreg_token", authData.accessToken);
    
    // Store user data with consistent structure
    const userData = {
        id: authData.id,
        role: authData.role,
        fullName: authData.fullName || authData.name,
        username: authData.username || authData.email || "Google User",
        email: authData.email,
        loginMethod: "GOOGLE"
    };
    
    localStorage.setItem("smartreg_user", JSON.stringify(userData));
    console.log("Google auth data stored:", userData);
}

// Show success alert for Google login
function showGoogleSuccessAlert(authData) {
    const displayName = authData.fullName || authData.name || "User";
    
    Swal.fire({
        title: "Google Login Successful!",
        text: `Welcome, ${displayName}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: "#1a1a1a",
        color: "#ffffff"
    });
}

// Show/hide loading state for Google login
function showGoogleLoginLoading(isLoading) {
    const googleButton = document.querySelector('.g_id_signin');
    
    if (isLoading) {
        if (googleButton) {
            googleButton.style.opacity = '0.6';
            googleButton.style.pointerEvents = 'none';
        }
        
        // Show loading overlay
        if (!document.getElementById('googleLoginOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'googleLoginOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            overlay.innerHTML = `
                <div class="text-center text-white">
                    <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                    <p>Signing in with Google...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    } else {
        if (googleButton) {
            googleButton.style.opacity = '1';
            googleButton.style.pointerEvents = 'auto';
        }
        
        const overlay = document.getElementById('googleLoginOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
    
   window.redirectToDashboard = function (role) {
    const config = {
        dashboardUrls: {
            ADMIN: "views/adminDashboard.html",
            DRIVER: "views/driverDashboard.html",
        },
        userKey: "smartreg_user"
    };
    
    if (!role) {
        console.error("No role provided for dashboard redirect");
        Swal.fire({
            title: "Access Error",
            text: "User role not found. Please contact support.",
            icon: "warning",
            background: "#1a1a1a",
            color: "#ffffff"
        });
        return;
    }
    
    const normalizedRole = role.toString().toUpperCase();
    const dashboardUrl = config.dashboardUrls[normalizedRole];
    
    console.log(`Redirecting to dashboard for role: ${normalizedRole}`);
    
    if (dashboardUrl) {

        setTimeout(() => {
            window.location.href = dashboardUrl;
        }, 1500);
    } else {
        console.error(`No dashboard URL found for role: ${normalizedRole}`);
        Swal.fire({
            title: "Access Error",
            text: `Dashboard not available for your role: ${normalizedRole}. Please contact support.`,
            icon: "warning",
            background: "#1a1a1a",
            color: "#ffffff"
        });
    }
};

    window.logout = function () {
        const config = {
            tokenKey: "smartreg_token",
            userKey: "smartreg_user",
            logoutFlag: "smartreg_logout",
        };
        localStorage.setItem(config.logoutFlag, "true");
        localStorage.removeItem(config.tokenKey);
        localStorage.removeItem(config.userKey);
        sessionStorage.removeItem(config.tokenKey);
        window.location.href = "index.html";
    };