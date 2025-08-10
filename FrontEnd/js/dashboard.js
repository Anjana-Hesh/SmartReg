// Admin Dashboard Functions - CORRECTED VERSION
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = "http://localhost:8080/api/v1"; // Update with your backend URL
    
    // Check authentication first
    checkAuthentication();
    
    // Initialize dashboard
    initializeDashboard();

    // Add event listeners
    addEventListeners();

    // Load initial data
    loadDashboardData();
});

function checkAuthentication() {
    // CORRECTED: Use the exact same keys as in your other files
    const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    const userData = localStorage.getItem('smartreg_user');
    
    if (!token || !userData) {
        // Not authenticated, redirect to login
        Swal.fire({
            title: "Authentication Required",
            text: "Please login to access the admin dashboard",
            icon: "error",
            background: "#1a1a1a",
            color: "#ffffff",
            confirmButtonText: "OK"
        }).then(() => {
            window.location.href = '../index.html';
        });
        return false;
    }
    
    // Parse user data and display user info
    try {
        const user = JSON.parse(userData);
        
        // Check if user has admin role (if your system has roles)
        if (user.role && user.role !== 'ADMIN') {
            Swal.fire({
                title: "Access Denied",
                text: "You don't have permission to access the admin dashboard",
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff",
                confirmButtonText: "OK"
            }).then(() => {
                window.location.href = '../index.html';
            });
            return false;
        }
        
        // Update user display elements
        updateUserDisplay(user);
        
        // Setup AJAX defaults with authentication
        setupAjaxDefaults(token);
        
        return true;
    } catch (e) {
        console.error('Error parsing user data:', e);
        // Clear corrupted data and redirect
        performLogout();
        return false;
    }
}

function setupAjaxDefaults(token) {
    // Setup jQuery AJAX defaults if jQuery is available
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
                    handleUnauthorized();
                } else if (xhr.status === 403) {
                    showAlert("Access Denied", "You don't have permission to perform this action", "error");
                } else if (xhr.status >= 500) {
                    showAlert("Server Error", "Internal server error. Please try again later.", "error");
                }
            }
        });
    }
}

function updateUserDisplay(user) {
    // Update admin name in navigation
    const adminName = document.querySelector('.navbar-nav .dropdown-toggle');
    if (adminName && user.fullName) {
        adminName.innerHTML = `<i class="fas fa-user-circle me-2"></i>${user.fullName}`;
    }
    
    // Update any other user-specific elements
    const userElements = document.querySelectorAll('[data-user-name]');
    userElements.forEach(element => {
        element.textContent = user.fullName || user.name || 'Admin';
    });
}

function initializeDashboard() {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation to cards
    const cards = document.querySelectorAll('.card-glass');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in');
    });
}

function addEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default for hash links, not actual page links
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();

                // Remove active class from all links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

                // Add active class to clicked link
                this.classList.add('active');

                // Load corresponding content
                const page = this.getAttribute('href').replace('#', '');
                if (page) {
                    loadPageContent(page);
                }
            }
            // For actual page links (like staffManagement.html), let them navigate normally
        });
    });

    // Quick action buttons - handle both links and buttons
    document.querySelectorAll('.btn-primary-glass, .btn-glass').forEach(btn => {
        // Only add click handler if it doesn't already have an href
        if (!btn.getAttribute('href') || btn.getAttribute('href').startsWith('#')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.textContent.trim();
                handleQuickAction(action);
            });
        }
    });

    // Logout button handlers
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Handle dropdown logout link
    const logoutLink = document.querySelector('a[href="../index.html"]');
    if (logoutLink && logoutLink.textContent.includes('Logout')) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Global logout function
    window.logout = handleLogout;
}

function handleLogout() {
    // Show confirmation dialog
    Swal.fire({
        title: 'Logout Confirmation',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        background: '#1a1a1a',
        color: '#ffffff'
    }).then((result) => {
        if (result.isConfirmed) {
            performLogout();
        }
    });
}

function performLogout() {
    // CORRECTED: Use the exact same keys as in your driver dashboard
    
    // 1. Clear all auth tokens and user data - USING CORRECT KEYS
    localStorage.removeItem('smartreg_token');      // Correct key
    sessionStorage.removeItem('smartreg_token');    // Correct key
    localStorage.removeItem('smartreg_user');       // Correct key
    
    // 2. Set logout flag - USING CORRECT KEY
    localStorage.setItem('smartreg_logout', 'true'); // Correct key
    
    // 3. Show logout success message
    Swal.fire({
        title: 'Logged Out Successfully',
        text: 'You have been logged out safely.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#1a1a1a',
        color: '#ffffff'
    }).then(() => {
        // 4. Redirect to login page
        window.location.href = '../index.html';
    });
}

function handleUnauthorized() {
    // CORRECTED: Use consistent key names
    localStorage.removeItem('smartreg_token');
    localStorage.removeItem('smartreg_user');
    sessionStorage.removeItem('smartreg_token');
    
    Swal.fire({
        title: "Session Expired",
        text: "Your session has expired. Please login again to continue.",
        icon: "error",
        background: "#1a1a1a",
        color: "#ffffff",
        confirmButtonText: "OK"
    }).then(() => {
        window.location.href = "../index.html";
    });
}

function loadDashboardData() {
    showLoading(true);
    
    // Load all dashboard data
    Promise.all([
        loadStatsData(),
        loadRecentActivity(),
        loadNotifications(),
        loadSystemStatus()
    ]).then(() => {
        showLoading(false);
        console.log('Dashboard data loaded successfully');
    }).catch(error => {
        showLoading(false);
        console.error('Error loading dashboard data:', error);
        showAlert("Loading Error", "Some dashboard data could not be loaded", "warning");
    });
}

// API Functions for fetching real data
async function loadStatsData() {
    try {
        // Replace with actual API endpoints
        const [licensesResponse, vehiclesResponse, pendingResponse, staffResponse] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/admin/stats/licenses`),
            fetch(`${API_BASE_URL}/admin/stats/vehicles`),
            fetch(`${API_BASE_URL}/admin/stats/pending-renewals`),
            fetch(`${API_BASE_URL}/admin/stats/staff`)
        ]);

        // Handle responses and update UI
        const stats = {
            totalLicenses: licensesResponse.status === 'fulfilled' ? await licensesResponse.value.json() : 1234,
            registeredVehicles: vehiclesResponse.status === 'fulfilled' ? await vehiclesResponse.value.json() : 856,
            pendingRenewals: pendingResponse.status === 'fulfilled' ? await pendingResponse.value.json() : 45,
            staffMembers: staffResponse.status === 'fulfilled' ? await staffResponse.value.json() : 12
        };

        updateStatsCards(stats);
        
    } catch (error) {
        console.error('Error loading stats:', error);
        // Use default values if API fails
        updateStatsCards({
            totalLicenses: 1234,
            registeredVehicles: 856,
            pendingRenewals: 45,
            staffMembers: 12
        });
    }
}

function updateStatsCards(stats = {}) {
    // Update stats with animation
    const statsConfig = [
        { selector: '.col-md-3:nth-child(1) h3', value: stats.totalLicenses || 1234 },
        { selector: '.col-md-3:nth-child(2) h3', value: stats.registeredVehicles || 856 },
        { selector: '.col-md-3:nth-child(3) h3', value: stats.pendingRenewals || 45 },
        { selector: '.col-md-3:nth-child(4) h3', value: stats.staffMembers || 12 }
    ];

    statsConfig.forEach(stat => {
        const element = document.querySelector(stat.selector);
        if (element) {
            animateCounter(element, stat.value);
        }
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50; // Reduced steps for smoother animation
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 30);
}

async function loadRecentActivity() {
    try {
        // Replace with actual API endpoint
        const response = await fetch(`${API_BASE_URL}/admin/recent-activity`);
        
        if (response.ok) {
            const activities = await response.json();
            updateRecentActivityUI(activities);
        } else {
            // Use mock data if API fails
            updateRecentActivityUI(getMockRecentActivity());
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        updateRecentActivityUI(getMockRecentActivity());
    }
}

function getMockRecentActivity() {
    return [
        { 
            icon: 'fas fa-plus-circle', 
            color: 'success', 
            text: 'New license created for John Doe', 
            time: '2 hours ago',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        { 
            icon: 'fas fa-sync', 
            color: 'warning', 
            text: 'License renewed for Jane Smith', 
            time: '5 hours ago',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
        },
        { 
            icon: 'fas fa-car', 
            color: 'primary', 
            text: 'Vehicle registration updated', 
            time: '1 day ago',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    ];
}

function updateRecentActivityUI(activities) {
    const activityContainer = document.querySelector('.list-group');
    if (!activityContainer) return;

    // Clear existing activities
    activityContainer.innerHTML = '';

    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'list-group-item bg-transparent border-0 px-0';
        activityItem.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${activity.icon} text-${activity.color} me-3"></i>
                <div>
                    <p class="mb-1">${activity.text}</p>
                    <small class="text-secondary">${activity.time}</small>
                </div>
            </div>
        `;
        activityContainer.appendChild(activityItem);
    });
}

async function loadNotifications() {
    try {
        // Replace with actual API endpoint
        const response = await fetch(`${API_BASE_URL}/admin/notifications`);
        
        if (response.ok) {
            const notifications = await response.json();
            updateNotificationsUI(notifications);
        } else {
            // Use mock data if API fails
            updateNotificationsUI(getMockNotifications());
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        updateNotificationsUI(getMockNotifications());
    }
}

function getMockNotifications() {
    return [
        { 
            type: 'warning', 
            icon: 'fas fa-exclamation-triangle',
            message: '5 licenses expiring this week',
            priority: 'high'
        },
        { 
            type: 'info', 
            icon: 'fas fa-info-circle',
            message: 'System maintenance scheduled for tonight',
            priority: 'medium'
        },
        { 
            type: 'success', 
            icon: 'fas fa-check-circle',
            message: 'Database backup completed successfully',
            priority: 'low'
        }
    ];
}

function updateNotificationsUI(notifications) {
    const notificationContainer = document.querySelector('.col-md-4 .card-glass .alert');
    if (!notificationContainer) return;

    const notificationParent = notificationContainer.parentElement;
    
    // Clear existing notifications
    notificationParent.querySelectorAll('.alert').forEach(alert => alert.remove());

    notifications.forEach(notification => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${notification.type} bg-transparent border-${notification.type} mb-2`;
        alertDiv.innerHTML = `
            <i class="${notification.icon} me-2"></i>
            ${notification.message}
        `;
        notificationParent.appendChild(alertDiv);
    });
}

async function loadSystemStatus() {
    try {
        // Replace with actual API endpoint
        const response = await fetch(`${API_BASE_URL}/admin/system-status`);
        
        if (response.ok) {
            const status = await response.json();
            updateSystemStatusUI(status);
        } else {
            console.log('System status endpoint not available');
        }
    } catch (error) {
        console.error('Error loading system status:', error);
    }
}

function updateSystemStatusUI(status) {
    // Update any system status indicators
    console.log('System status:', status);
}

function handleQuickAction(action) {
    showLoading(true);
    
    // Add delay to show loading effect
    setTimeout(() => {
        showLoading(false);
        
        switch(action.toLowerCase()) {
            case 'add license':
                window.location.href = 'licenseCreation.html';
                break;
            case 'search records':
                window.location.href = 'driverLicenseSearch.html';
                break;
            case 'generate report':
                showAlert('Generate Report', 'Report generation feature coming soon!', 'info');
                break;
            case 'system settings':
                showAlert('System Settings', 'Settings page coming soon!', 'info');
                break;
            default:
                showAlert('Feature Coming Soon', `${action} feature is under development!`, 'info');
        }
    }, 500);
}

function loadPageContent(page) {
    // Simulate loading different page content
    showLoading(true);

    setTimeout(() => {
        showLoading(false);
        console.log(`Loading ${page} content...`);
        
        // You can add specific content loading logic here
        switch(page) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'licenses':
                // Load license management content
                break;
            case 'vehicles':
                // Load vehicle management content
                break;
            case 'staff':
                // Load staff management content
                break;
            case 'reports':
                // Load reports content
                break;
            default:
                showAlert('Page Not Found', `Content for ${page} not implemented yet`, 'warning');
        }
    }, 800);
}

function showLoading(show = true) {
    if (show) {
        // Create loading overlay if it doesn't exist
        if (!document.getElementById('loadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
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
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
            `;
            document.body.appendChild(overlay);
        }
    } else {
        // Remove loading overlay
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

function showAlert(title, message, type = 'info') {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        background: '#1a1a1a',
        color: '#ffffff',
        confirmButtonColor: type === 'error' ? '#d33' : '#3085d6'
    });
}

// Refresh dashboard function
window.refreshDashboard = function() {
    showLoading(true);
    
    loadDashboardData().then(() => {
        Swal.fire({
            title: "Dashboard Refreshed",
            text: "All data has been updated successfully!",
            icon: "success",
            background: "#1a1a1a",
            color: "#ffffff",
            timer: 1500,
            showConfirmButton: false
        });
    }).catch(error => {
        showAlert("Refresh Failed", "Some data could not be updated. Please try again.", "warning");
    });
};

// Auto-refresh functionality
let refreshInterval;

function startAutoRefresh() {
    // Refresh data every 5 minutes for admin dashboard
    refreshInterval = setInterval(() => {
        if (!document.hidden) {
            loadStatsData();
            loadRecentActivity();
            loadNotifications();
        }
    }, 5 * 60 * 1000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible - refresh data
        loadDashboardData();
    }
});

// Handle browser beforeunload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R for refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshDashboard();
    }
    
    // Ctrl/Cmd + L for logout
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleLogout();
    }
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-LK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-LK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Start auto-refresh when page loads
startAutoRefresh();

console.log("Admin Dashboard initialized successfully");