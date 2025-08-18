// Admin Dashboard Functions - CORRECTED VERSION WITH REAL DB VALUES AND NAVIGATION
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = "http://localhost:8080/api/v1"; // Update with your backend URL
    
    // Check authentication first
    checkAuthentication();
    
    // Initialize dashboard
    initializeDashboard();

    // Add event listeners
    addEventListeners();

    // Load initial data with real database values
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

    // Add click handlers to stats cards for navigation
    addStatsCardClickHandlers();
}

function addStatsCardClickHandlers() {
    // Get all stats cards
    const statsCards = document.querySelectorAll('.floating-element');
    
    if (statsCards.length >= 4) {
        // Total Licenses card - navigate to all licenses
        statsCards[0].style.cursor = 'pointer';
        statsCards[0].addEventListener('click', function() {
            navigateToDriverSearch('all');
        });

        // Registered Vehicles card - navigate to all vehicles (if you have vehicle page)
        statsCards[1].style.cursor = 'pointer';
        statsCards[1].addEventListener('click', function() {
            // Navigate to vehicle records or show info
            showAlert('Vehicle Records', 'Vehicle management coming soon!', 'info');
        });

        // Pending Renewals card - navigate to pending licenses
        statsCards[2].style.cursor = 'pointer';
        statsCards[2].addEventListener('click', function() {
            navigateToDriverSearch('pending');
        });

        // Staff Members card - navigate to staff management
        statsCards[3].style.cursor = 'pointer';
        statsCards[3].addEventListener('click', function() {
            window.location.href = 'staffManagement.html';
        });
    }

    // Add hover effects
    statsCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function navigateToDriverSearch(filterType) {
    // Store the filter type in localStorage to be used by driverLicenseSearch page
    localStorage.setItem('dashboard_filter', filterType);
    
    // Navigate to driver license search page
    window.location.href = 'driverLicenseSearch.html';
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
    
    // Load all dashboard data with real API calls
    Promise.all([
        loadRealStatsData(),
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

// CORRECTED: Load real stats data from database
async function loadRealStatsData() {
    try {
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        
        // Make parallel API calls to get real statistics
        const [
            totalLicensesResponse,
            vehiclesResponse,
            pendingResponse,
            approvedResponse,
            rejectedResponse,
            expiredResponse,
            staffResponse
        ] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/admin/licenses/count/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/admin/vehicles/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/admin/licenses/count/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/admin/licenses/count/approved`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/admin/licenses/count/rejected`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/admin/licenses/count/expired`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/admin/staff/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        // Process responses and get actual counts
        const stats = {
            totalLicenses: 0,
            registeredVehicles: 0,
            pendingRenewals: 0,
            approvedLicenses: 0,
            rejectedLicenses: 0,
            expiredLicenses: 0,
            staffMembers: 0
        };

        // Handle total licenses
        if (totalLicensesResponse.status === 'fulfilled' && totalLicensesResponse.value.ok) {
            const data = await totalLicensesResponse.value.json();
            stats.totalLicenses = data.count || data.total || 0;
        }

        // Handle vehicles
        if (vehiclesResponse.status === 'fulfilled' && vehiclesResponse.value.ok) {
            const data = await vehiclesResponse.value.json();
            stats.registeredVehicles = data.count || data.total || 0;
        }

        // Handle pending
        if (pendingResponse.status === 'fulfilled' && pendingResponse.value.ok) {
            const data = await pendingResponse.value.json();
            stats.pendingRenewals = data.count || data.total || 0;
        }

        // Handle approved
        if (approvedResponse.status === 'fulfilled' && approvedResponse.value.ok) {
            const data = await approvedResponse.value.json();
            stats.approvedLicenses = data.count || data.total || 0;
        }

        // Handle rejected
        if (rejectedResponse.status === 'fulfilled' && rejectedResponse.value.ok) {
            const data = await rejectedResponse.value.json();
            stats.rejectedLicenses = data.count || data.total || 0;
        }

        // Handle expired
        if (expiredResponse.status === 'fulfilled' && expiredResponse.value.ok) {
            const data = await expiredResponse.value.json();
            stats.expiredLicenses = data.count || data.total || 0;
        }

        // Handle staff
        if (staffResponse.status === 'fulfilled' && staffResponse.value.ok) {
            const data = await staffResponse.value.json();
            stats.staffMembers = data.count || data.total || 0;
        }

        // Update the UI with real statistics
        updateStatsCards(stats);
        
        // Store stats globally for navigation
        window.dashboardStats = stats;
        
    } catch (error) {
        console.error('Error loading real stats:', error);
        // Use fallback values if API fails
        updateStatsCards({
            totalLicenses: 0,
            registeredVehicles: 0,
            pendingRenewals: 0,
            staffMembers: 0
        });
    }
}

function updateStatsCards(stats = {}) {
    // Update stats with animation - CORRECTED to show real database values
    const statsConfig = [
        { 
            selector: '.col-md-3:nth-child(1) h3', 
            value: stats.totalLicenses || 0,
            label: 'Total Licenses'
        },
        { 
            selector: '.col-md-3:nth-child(2) h3', 
            value: stats.registeredVehicles || 0,
            label: 'Registered Vehicles'
        },
        { 
            selector: '.col-md-3:nth-child(3) h3', 
            value: stats.pendingRenewals || 0,
            label: 'Pending Renewals'
        },
        { 
            selector: '.col-md-3:nth-child(4) h3', 
            value: stats.staffMembers || 0,
            label: 'Staff Members'
        }
    ];

    statsConfig.forEach(stat => {
        const element = document.querySelector(stat.selector);
        if (element) {
            animateCounter(element, stat.value);
            
            // Update the label if needed
            const labelElement = element.nextElementSibling;
            if (labelElement && labelElement.classList.contains('text-secondary')) {
                labelElement.textContent = stat.label;
            }
        }
    });

    console.log('Stats updated with real database values:', stats);
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
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        
        // Replace with actual API endpoint
        const response = await fetch(`${API_BASE_URL}/admin/recent-activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
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
            text: 'New license application received', 
            time: '2 hours ago',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        { 
            icon: 'fas fa-sync', 
            color: 'warning', 
            text: 'License renewal approved', 
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
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        
        // Replace with actual API endpoint
        const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
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
    const pendingCount = window.dashboardStats?.pendingRenewals || 0;
    
    return [
        { 
            type: 'warning', 
            icon: 'fas fa-exclamation-triangle',
            message: `${pendingCount} licenses pending approval`,
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
    const notificationContainer = document.querySelector('.col-md-4 .card-glass');
    if (!notificationContainer) return;

    // Find or create notifications area
    let notificationArea = notificationContainer.querySelector('.notifications-area');
    if (!notificationArea) {
        // Clear existing content and create new structure
        notificationContainer.innerHTML = `
            <h5 class="fw-bold mb-3">
                <i class="fas fa-bell text-warning me-2"></i>Notifications
            </h5>
            <div class="notifications-area"></div>
        `;
        notificationArea = notificationContainer.querySelector('.notifications-area');
    } else {
        notificationArea.innerHTML = '';
    }

    notifications.forEach(notification => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${notification.type} bg-transparent border-${notification.type} mb-2`;
        alertDiv.innerHTML = `
            <i class="${notification.icon} me-2"></i>
            ${notification.message}
        `;
        notificationArea.appendChild(alertDiv);
    });
}

async function loadSystemStatus() {
    try {
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        
        // Replace with actual API endpoint
        const response = await fetch(`${API_BASE_URL}/admin/system-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
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
                navigateToDriverSearch('all');
                break;
            case 'vehicles':
                // Load vehicle management content
                break;
            case 'staff':
                window.location.href = 'staffManagement.html';
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
            loadRealStatsData();
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

console.log("Admin Dashboard initialized successfully with real database integration");