$(document).ready(function () {
  // Configuration
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

  // Check for logout flag on page load
  if (localStorage.getItem(config.logoutFlag)) {
    localStorage.removeItem(config.logoutFlag);
    showLogoutMessage();
  }

  // DOM Elements
  const $loginForm = $("#signinForm");
  const $usernameInput = $("#userName");
  const $passwordInput = $("#password");
  const $rememberCheckbox = $("#remember");
  const $loginBtn = $("#loginBtn");

  // Form Submission
  $loginForm.on("submit", async function (e) {
    e.preventDefault();
    await handleLogin();
  });

  // Handle Login
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

  // Helper Functions
  function validateInputs(username, password) {
    let isValid = true;

    // Clear previous validation errors
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
    // Clear existing tokens first
    localStorage.removeItem(config.tokenKey);
    sessionStorage.removeItem(config.tokenKey);
    
    // Store token based on remember me selection
    const storage = $rememberCheckbox.is(":checked") ? localStorage : sessionStorage;
    storage.setItem(config.tokenKey, authData.accessToken);

    // Store user data in localStorage (persists across sessions)
    const userData = {
      id: authData.id,           // Now correctly using authData.id
      role: authData.role,
      fullName: authData.fullName, // Now correctly using authData.fullName
      username: $usernameInput.val().trim() // Getting username from form input
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

  // Password Toggle
  $("#togglePasswordBtn").on("click", function () {
    const $password = $("#password");
    const $icon = $("#toggleIcon");
    const type = $password.attr("type") === "password" ? "text" : "password";
    $password.attr("type", type);
    $icon.toggleClass("fa-eye fa-eye-slash");
  });

  // Clear validation errors on input
  $usernameInput.on("input", function () {
    $(this).removeClass("is-invalid");
  });

  $passwordInput.on("input", function () {
    $(this).removeClass("is-invalid");
  });

  // Check if already logged in
  checkAuthStatus();

  async function checkAuthStatus() {
    // First check for logout flag
    if (localStorage.getItem(config.logoutFlag)) {
      localStorage.removeItem(config.logoutFlag);
      return;
    }

    // Check for token in both storage locations
    const token = localStorage.getItem(config.tokenKey) || sessionStorage.getItem(config.tokenKey);
    if (!token) return;

    // Get user data
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
        // Add this to properly handle 403 responses
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

// Global logout function
window.logout = function () {
  const config = {
    tokenKey: "smartreg_token",
    userKey: "smartreg_user",
    logoutFlag: "smartreg_logout",
  };

  // Set logout flag before clearing storage
  localStorage.setItem(config.logoutFlag, "true");

  // Clear all auth data
  localStorage.removeItem(config.tokenKey);
  localStorage.removeItem(config.userKey);
  sessionStorage.removeItem(config.tokenKey);

  // Redirect immediately to prevent automatic login
  window.location.href = "index.html";
};