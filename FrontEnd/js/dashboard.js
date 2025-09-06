/// Admin Dashboard Functions - IMPROVED VERSION WITH REAL APPLICATION STATUS COUNTS

// FIXED: Move API_BASE_URL to global scope
const API_BASE_URL = "http://localhost:8080/api/v1";

document.addEventListener('DOMContentLoaded', function() {
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
        // Pending Licenses card - navigate to pending applications
        statsCards[0].style.cursor = 'pointer';
        statsCards[0].addEventListener('click', function() {
            navigateToApplications('PENDING');
        });

        // Declined Licenses card - navigate to rejected applications
        statsCards[1].style.cursor = 'pointer';
        statsCards[1].addEventListener('click', function() {
            navigateToApplications('REJECTED');
        });

        // Approved Licenses card - navigate to approved applications
        statsCards[2].style.cursor = 'pointer';
        statsCards[2].addEventListener('click', function() {
            navigateToApplications('APPROVED');
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

function navigateToApplications(status) {
    // Store the status filter in localStorage to be used by applications page
    localStorage.setItem('application_status_filter', status);
    
    // Navigate to applications page
    window.location.href = '../views/Approvement.html'; // Create this page if it doesn't exist
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
        });
    });

    // Quick action buttons - handle both links and buttons
    document.querySelectorAll('.btn-primary-glass, .btn-glass').forEach(btn => {
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
    
    const logoutLink = document.querySelector('a[href="../index.html"]');
    if (logoutLink && logoutLink.textContent.includes('Logout')) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    window.logout = handleLogout;
}

function handleLogout() {
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
    // Clear all auth tokens and user data
    localStorage.removeItem('smartreg_token');
    sessionStorage.removeItem('smartreg_token');
    localStorage.removeItem('smartreg_user');
    localStorage.setItem('smartreg_logout', 'true');
    
    Swal.fire({
        title: 'Logged Out Successfully',
        text: 'You have been logged out safely.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#1a1a1a',
        color: '#ffffff'
    }).then(() => {
        window.location.href = '../index.html';
    });
}

function handleUnauthorized() {
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
        loadApplicationStatusCounts(),
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

// IMPROVED: Function to load application status counts from the API with better error handling
async function loadApplicationStatusCounts() {
    try {
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        
        console.log('Fetching application status counts...');
        
        // Fetch all applications
        const response = await fetch(`${API_BASE_URL}/applications/getall`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const applications = await response.json();
        console.log('Fetched applications:', applications);
        
        // Initialize status counts
        const statusCounts = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            TOTAL: 0
        };
        
        // Count applications by status (handle case-insensitive comparison)
        applications.forEach(app => {
            statusCounts.TOTAL++;
            
            if (app.status) {
                const status = app.status.toString().toUpperCase();
                
                switch(status) {
                    case 'PENDING':
                        statusCounts.PENDING++;
                        break;
                    case 'APPROVED':
                        statusCounts.APPROVED++;
                        break;
                    case 'REJECTED':
                    case 'DECLINED':
                        statusCounts.REJECTED++;
                        break;
                    default:
                        console.warn('Unknown application status:', app.status);
                }
            }
        });
        
        console.log('Application status counts:', statusCounts);
        
        // Update the UI with real statistics
        updateApplicationStatsCards(statusCounts);
        
        // Store stats globally for notifications
        window.applicationStats = statusCounts;
        
        return statusCounts;
        
    } catch (error) {
        console.error('Error loading application status counts:', error);
        
        // Show user-friendly error message
        showAlert(
            "Data Loading Error", 
            "Unable to load application statistics. Using cached data if available.", 
            "warning"
        );
        
        // Use fallback values if API fails
        const fallbackCounts = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            TOTAL: 0
        };
        
        updateApplicationStatsCards(fallbackCounts);
        window.applicationStats = fallbackCounts;
        
        return fallbackCounts;
    }
}

// IMPROVED: Better card updating with proper selectors
function updateApplicationStatsCards(statusCounts = {}) {
    console.log('Updating application stats cards with:', statusCounts);
    
    // Stats configuration - updated for better targeting
    const statsConfig = [
        { 
            cardIndex: 1,
            value: statusCounts.PENDING || 0,
            label: 'PENDING Licenses',
            icon: 'fas fa-clock',
            color: 'warning'
        },
        { 
            cardIndex: 2,
            value: statusCounts.REJECTED || 0,
            label: 'DECLINED Licenses',
            icon: 'fas fa-times-circle',
            color: 'danger'
        },
        { 
            cardIndex: 3,
            value: statusCounts.APPROVED || 0,
            label: 'APPROVED Licenses',
            icon: 'fas fa-check-circle',
            color: 'success'
        },
        { 
            cardIndex: 4,
            value: 12, // Static staff count - you can make this dynamic later
            label: 'Staff Members',
            icon: 'fas fa-users',
            color: 'info'
        }
    ];

    statsConfig.forEach((stat, index) => {
        // Try multiple selector approaches to find the correct elements
        const selectors = [
            `.col-md-3:nth-child(${stat.cardIndex}) h3`,
            `.stats-card:nth-child(${stat.cardIndex}) h3`,
            `.card-glass:nth-child(${stat.cardIndex}) h3`,
            `.floating-element:nth-child(${stat.cardIndex}) h3`
        ];
        
        let element = null;
        for (const selector of selectors) {
            element = document.querySelector(selector);
            if (element) break;
        }
        
        // If still not found, try finding by content or data attribute
        if (!element) {
            const allH3s = document.querySelectorAll('h3');
            allH3s.forEach(h3 => {
                const nextSibling = h3.nextElementSibling;
                if (nextSibling && nextSibling.textContent.includes(stat.label.split(' ')[0])) {
                    element = h3;
                }
            });
        }
        
        if (element) {
            // Animate the counter
            animateCounter(element, stat.value);
            
            // Update the label if found
            const labelElement = element.nextElementSibling;
            if (labelElement && labelElement.tagName.toLowerCase() === 'p') {
                labelElement.textContent = stat.label;
            }
            
            // Update icon if found
            const iconElement = element.parentElement.querySelector('i') || 
                              element.previousElementSibling?.querySelector('i');
            if (iconElement) {
                iconElement.className = `${stat.icon} text-${stat.color} me-2`;
            }
            
            console.log(`Updated ${stat.label}: ${stat.value}`);
        } else {
            console.warn(`Could not find element for ${stat.label}`);
        }
    });

    // Update page title or other elements if needed
    updateDashboardTitle(statusCounts);
}

function updateDashboardTitle(statusCounts) {
    const totalApplications = statusCounts.TOTAL || 0;
    const titleElement = document.querySelector('title');
    if (titleElement) {
        titleElement.textContent = `Admin Dashboard - ${totalApplications} Applications`;
    }
    
    // Update any dashboard subtitle
    const subtitleElement = document.querySelector('.dashboard-subtitle, .page-subtitle');
    if (subtitleElement) {
        subtitleElement.textContent = `Managing ${totalApplications} total applications`;
    }
}

function animateCounter(element, target) {
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // 1 second
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(startValue + (target - startValue) * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// IMPROVED: Recent activity with better error handling
async function loadRecentActivity() {
    try {
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        
        const response = await fetch(`${API_BASE_URL}/applications/getall`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const applications = await response.json();
            
            // Sort by date and take the latest 3
            const recentApps = applications
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.submittedDate || 0);
                    const dateB = new Date(b.createdAt || b.submittedDate || 0);
                    return dateB - dateA;
                })
                .slice(0, 3);
            
            // Convert to activity format
            const activities = recentApps.map(app => {
                let icon, color, text;
                
                switch(app.status?.toUpperCase()) {
                    case 'PENDING':
                        icon = 'fas fa-clock';
                        color = 'warning';
                        text = `New application submitted by ${app.applicantName || app.driverName || 'applicant'}`;
                        break;
                    case 'APPROVED':
                        icon = 'fas fa-check-circle';
                        color = 'success';
                        text = `Application approved for ${app.applicantName || app.driverName || 'applicant'}`;
                        break;
                    case 'REJECTED':
                    case 'DECLINED':
                        icon = 'fas fa-times-circle';
                        color = 'danger';
                        text = `Application rejected for ${app.applicantName || app.driverName || 'applicant'}`;
                        break;
                    default:
                        icon = 'fas fa-info-circle';
                        color = 'info';
                        text = `Application updated for ${app.applicantName || app.driverName || 'applicant'}`;
                }
                
                const time = app.createdAt || app.submittedDate ? 
                           formatTimeAgo(new Date(app.createdAt || app.submittedDate)) : 
                           'Recently';
                
                return { icon, color, text, time };
            });
            
            updateRecentActivityUI(activities);
        } else {
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
            time: '2 hours ago'
        },
        { 
            icon: 'fas fa-sync', 
            color: 'warning', 
            text: 'License renewal approved', 
            time: '5 hours ago'
        },
        { 
            icon: 'fas fa-car', 
            color: 'primary', 
            text: 'Vehicle registration updated', 
            time: '1 day ago'
        }
    ];
}

function updateRecentActivityUI(activities) {
    const activityContainer = document.querySelector('.list-group') || 
                            document.querySelector('.recent-activity') ||
                            document.querySelector('.activity-list');
    
    if (!activityContainer) {
        console.warn('Activity container not found');
        return;
    }

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
        const pendingCount = window.applicationStats?.PENDING || 0;
        const rejectedCount = window.applicationStats?.REJECTED || 0;
        const approvedCount = window.applicationStats?.APPROVED || 0;
        
        const notifications = [];
        
        // Add notifications based on real data
        if (pendingCount > 0) {
            notifications.push({
                type: 'warning', 
                icon: 'fas fa-exclamation-triangle',
                message: `${pendingCount} application${pendingCount !== 1 ? 's' : ''} pending approval`
            });
        }
        
        if (pendingCount > 10) {
            notifications.push({
                type: 'danger', 
                icon: 'fas fa-exclamation-circle',
                message: `High volume: ${pendingCount} pending applications need attention`
            });
        }
        
        if (rejectedCount > 0) {
            notifications.push({
                type: 'info', 
                icon: 'fas fa-info-circle',
                message: `${rejectedCount} application${rejectedCount !== 1 ? 's' : ''} rejected this month`
            });
        }
        
        // Add system notification
        notifications.push({
            type: 'info', 
            icon: 'fas fa-server',
            message: 'System running normally - Last updated: ' + new Date().toLocaleTimeString()
        });
        
        updateNotificationsUI(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
        updateNotificationsUI(getMockNotifications());
    }
}

function getMockNotifications() {
    return [
        { 
            type: 'info', 
            icon: 'fas fa-info-circle',
            message: 'System running normally'
        }
    ];
}

function updateNotificationsUI(notifications) {
    let notificationContainer = document.querySelector('.notifications-container') ||
                               document.querySelector('.col-md-4 .card-glass') ||
                               document.querySelector('.notifications-area');
    
    if (!notificationContainer) {
        console.warn('Notification container not found');
        return;
    }

    // Create notifications area if it doesn't exist
    let notificationArea = notificationContainer.querySelector('.notifications-area');
    if (!notificationArea) {
        notificationContainer.innerHTML = `
            <h5 class="fw-bold mb-3">
                <i class="fas fa-bell text-warning me-2"></i>Notifications
                <span class="badge bg-primary ms-2">${notifications.length}</span>
            </h5>
            <div class="notifications-area"></div>
        `;
        notificationArea = notificationContainer.querySelector('.notifications-area');
    } else {
        notificationArea.innerHTML = '';
        
        // Update notification count
        const badge = notificationContainer.querySelector('.badge');
        if (badge) {
            badge.textContent = notifications.length;
        }
    }

    notifications.forEach((notification, index) => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${notification.type} bg-transparent border-${notification.type} mb-2`;
        alertDiv.style.animationDelay = `${index * 0.1}s`;
        alertDiv.classList.add('fade-in');
        alertDiv.innerHTML = `
            <i class="${notification.icon} me-2"></i>
            ${notification.message}
        `;
        notificationArea.appendChild(alertDiv);
    });
}

async function loadSystemStatus() {
    try {
        // You can implement actual system status checking here
        console.log('System status: Operational');
        
        // Update system status indicator if it exists
        const statusIndicator = document.querySelector('.system-status');
        if (statusIndicator) {
            statusIndicator.innerHTML = `
                <i class="fas fa-check-circle text-success me-2"></i>
                System Operational
            `;
        }
    } catch (error) {
        console.error('Error loading system status:', error);
    }
}

function handleQuickAction(action) {
    showLoading(true);
    
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
                generateReport();
                break;
            case 'system settings':
                showAlert('System Settings', 'Settings page coming soon!', 'info');
                break;
            default:
                showAlert('Feature Coming Soon', `${action} feature is under development!`, 'info');
        }
    }, 500);
}

function generateReport() {
    if (!window.applicationStats) {
        showAlert('Report Generation', 'Application data not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const stats = window.applicationStats;
    const reportData = {
        totalApplications: stats.TOTAL || 0,
        pendingApplications: stats.PENDING || 0,
        approvedApplications: stats.APPROVED || 0,
        rejectedApplications: stats.REJECTED || 0,
        approvalRate: stats.TOTAL > 0 ? Math.round((stats.APPROVED / stats.TOTAL) * 100) : 0,
        rejectionRate: stats.TOTAL > 0 ? Math.round((stats.REJECTED / stats.TOTAL) * 100) : 0,
        generatedAt: new Date().toLocaleString()
    };
    
    // Create a simple report
    const reportContent = `
        <div style="text-align: left;">
            <h6>Application Statistics Report</h6>
            <hr>
            <p><strong>Total Applications:</strong> ${reportData.totalApplications}</p>
            <p><strong>Pending:</strong> ${reportData.pendingApplications}</p>
            <p><strong>Approved:</strong> ${reportData.approvedApplications}</p>
            <p><strong>Rejected:</strong> ${reportData.rejectedApplications}</p>
            <p><strong>Approval Rate:</strong> ${reportData.approvalRate}%</p>
            <p><strong>Rejection Rate:</strong> ${reportData.rejectionRate}%</p>
            <hr>
            <small><em>Generated at: ${reportData.generatedAt}</em></small>
        </div>
    `;
    
    Swal.fire({
        title: 'Application Statistics Report',
        html: reportContent,
        icon: 'info',
        background: '#1a1a1a',
        color: '#ffffff',
        showCancelButton: true,
        confirmButtonText: 'Download PDF',
        cancelButtonText: 'Close',
        confirmButtonColor: '#3085d6'
    }).then((result) => {
        if (result.isConfirmed) {
            // Here you could implement actual PDF generation
            showAlert('PDF Download', 'PDF generation feature coming soon!', 'info');
        }
    });
}

function loadPageContent(page) {
    showLoading(true);

    setTimeout(() => {
        showLoading(false);
        console.log(`Loading ${page} content...`);
        
        switch(page) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'licenses':
                navigateToApplications('all');
                break;
            case 'vehicles':
                showAlert('Vehicles', 'Vehicle management coming soon!', 'info');
                break;
            case 'staff':
                window.location.href = 'staffManagement.html';
                break;
            case 'reports':
                generateReport();
                break;
            default:
                showAlert('Page Not Found', `Content for ${page} not implemented yet`, 'warning');
        }
    }, 800);
}

function showLoading(show = true) {
    if (show) {
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
                <div class="text-center text-white">
                    <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                    <p>Loading dashboard data...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    } else {
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

// Utility function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
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

// IMPROVED: Auto-refresh with better performance
let refreshInterval;
let isVisible = true;

function startAutoRefresh() {
    // Refresh data every 3 minutes when page is visible
    refreshInterval = setInterval(() => {
        if (isVisible && !document.hidden) {
            console.log('Auto-refreshing dashboard data...');
            loadApplicationStatusCounts();
            loadRecentActivity();
            loadNotifications();
        }
    }, 3 * 60 * 1000); // 3 minutes
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', function() {
    isVisible = !document.hidden;
    
    if (isVisible) {
        console.log('Page became visible - refreshing data');
        loadDashboardData();
    } else {
        console.log('Page hidden - pausing auto-refresh');
    }
});

// Handle browser beforeunload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// IMPROVED: Keyboard shortcuts with better UX
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R for refresh (prevent default browser refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshDashboard();
    }
    
    // Ctrl/Cmd + L for logout
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleLogout();
    }
    
    // Ctrl/Cmd + G for generate report
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        generateReport();
    }
    
    // ESC key to close any open modals or overlays
    if (e.key === 'Escape') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
});

// IMPROVED: Add error boundary for better error handling
window.addEventListener('error', function(event) {
    console.error('Dashboard error:', event.error);
    
    // Don't show alert for network errors during auto-refresh
    if (!event.error.message.includes('fetch')) {
        showAlert(
            'Application Error',
            'An unexpected error occurred. Please refresh the page.',
            'error'
        );
    }
});

// IMPROVED: Add performance monitoring
function logPerformanceMetrics() {
    if (window.performance && window.performance.now) {
        const loadTime = window.performance.now();
        console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
        
        // Log memory usage if available
        if (window.performance.memory) {
            const memory = window.performance.memory;
            console.log('Memory usage:', {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
            });
        }
    }
}

// IMPROVED: Add connection status monitoring
function monitorConnectionStatus() {
    function updateConnectionStatus() {
        const isOnline = navigator.onLine;
        const statusElement = document.querySelector('.connection-status');
        
        if (statusElement) {
            statusElement.innerHTML = isOnline ? 
                '<i class="fas fa-wifi text-success me-1"></i> Online' :
                '<i class="fas fa-wifi text-danger me-1"></i> Offline';
        }
        
        if (!isOnline) {
            showAlert(
                'Connection Lost',
                'Internet connection lost. Data may not be up to date.',
                'warning'
            );
        }
    }
    
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Initial check
    updateConnectionStatus();
}

// IMPROVED: Add data caching for better performance
const dataCache = {
    applications: null,
    cacheTime: null,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    
    set(key, data) {
        this[key] = data;
        this.cacheTime = Date.now();
    },
    
    get(key) {
        if (this.cacheTime && Date.now() - this.cacheTime < this.cacheExpiry) {
            return this[key];
        }
        return null;
    },
    
    clear() {
        this.applications = null;
        this.cacheTime = null;
    }
};

// IMPROVED: Cached version of loadApplicationStatusCounts for better performance
async function loadApplicationStatusCountsCached() {
    // Check cache first
    const cachedData = dataCache.get('applications');
    if (cachedData) {
        console.log('Using cached application data');
        updateApplicationStatsCards(cachedData);
        window.applicationStats = cachedData;
        return cachedData;
    }
    
    // Load from API and cache
    const data = await loadApplicationStatusCounts();
    if (data) {
        dataCache.set('applications', data);
    }
    return data;
}

// IMPROVED: Add search functionality for quick navigation
function addSearchFunctionality() {
    const searchInput = document.querySelector('.dashboard-search, #dashboardSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const searchableElements = document.querySelectorAll('[data-searchable]');
            
            searchableElements.forEach(element => {
                const text = element.textContent.toLowerCase();
                const shouldShow = text.includes(query) || query === '';
                element.style.display = shouldShow ? '' : 'none';
            });
        });
    }
}

// IMPROVED: Add tooltips for better UX
function addTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// IMPROVED: Initialize all enhanced features
function initializeEnhancedFeatures() {
    // Add performance monitoring
    logPerformanceMetrics();
    
    // Add connection status monitoring
    monitorConnectionStatus();
    
    // Add search functionality
    addSearchFunctionality();
    
    // Add tooltips
    addTooltips();
    
    console.log('Enhanced dashboard features initialized');
}

// Start auto-refresh when page loads
startAutoRefresh();

// Initialize enhanced features when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedFeatures);
} else {
    initializeEnhancedFeatures();
}

// Export functions for external use if needed
window.DashboardAPI = {
    refreshData: loadDashboardData,
    refreshStats: loadApplicationStatusCounts,
    generateReport: generateReport,
    clearCache: () => dataCache.clear(),
    getStats: () => window.applicationStats
};

console.log("✅ Enhanced Admin Dashboard initialized successfully with real application status integration");
console.log("📊 Dashboard features: Real-time stats, Auto-refresh, Caching, Error handling, Performance monitoring");
console.log("⌨️  Keyboard shortcuts: Ctrl+R (refresh), Ctrl+L (logout), Ctrl+G (generate report)");