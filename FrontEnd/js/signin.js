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
        showSuccessAlert(response.data.name || username);
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
    // Store token either in localStorage or sessionStorage
    const storage = $rememberCheckbox.is(":checked")
      ? localStorage
      : sessionStorage;
    storage.setItem(config.tokenKey, authData.accessToken);

    // Store user data
    const userData = {
      id: authData.userId,
      username: authData.userName,
      role: authData.role,
      name: authData.name,
    };
    localStorage.setItem(config.userKey, JSON.stringify(userData));
  }

  function showSuccessAlert(username) {
    Swal.fire({
      title: "Login Successful!",
      text: `Welcome back, ${username}`,
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
    console.log("User role:", role);

    if (!role) {
      console.error("No role provided");
      showRoleError();
      return;
    }

    // Convert role to uppercase for consistent matching
    const normalizedRole = role.toString().toUpperCase();
    console.log("Normalized role:", normalizedRole);

    // Get the dashboard URL based on role
    const dashboardUrl = config.dashboardUrls[normalizedRole];

    if (dashboardUrl) {
      console.log("Redirecting to:", dashboardUrl);
      // Add a small delay to ensure the success message is visible
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

    console.error("Login error:", error);

    if (error.responseJSON && error.responseJSON.message) {
      errorMessage = error.responseJSON.message;
    } else if (error.status === 401) {
      errorMessage = "Invalid username or password.";
    } else if (error.status === 0) {
      errorMessage =
        "Connection failed. Please check your internet connection.";
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
      $loginBtn.html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...'
      );
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

  function checkAuthStatus() {
    const token =
      localStorage.getItem(config.tokenKey) ||
      sessionStorage.getItem(config.tokenKey);
    if (!token) return;

    // Additional check to prevent automatic redirect after logout
    if (localStorage.getItem(config.logoutFlag)) {
      localStorage.removeItem(config.logoutFlag);
      return;
    }

    // Verify token with backend (optional but recommended)
    verifyToken(token)
      .then((isValid) => {
        if (isValid) {
          const userData = JSON.parse(
            localStorage.getItem(config.userKey) || "{}"
          );
          if (userData && userData.role) {
            console.log("User already logged in with role:", userData.role);
            redirectToDashboard(userData.role);
          }
        } else {
          // Token is invalid, clear storage
          clearAuthData();
        }
      })
      .catch(() => {
        clearAuthData();
      });
  }

  async function verifyToken(token) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error("Token verification failed:", error);
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
