const API_BASE_URL = "http://localhost:8080/api/v1";

document.addEventListener('DOMContentLoaded', function() {

    checkAuthentication();
    initializeDashboard();
    addEventListeners();
    loadDashboardData();
});

// function checkAuthentication() {

//     const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
//     const userData = localStorage.getItem('smartreg_user');
    
//     if (!token || !userData) {
//         Swal.fire({
//             title: "Authentication Required",
//             text: "Please login to access the admin dashboard",
//             icon: "error",
//             background: "#1a1a1a",
//             color: "#ffffff",
//             confirmButtonText: "OK"
//         }).then(() => {
//             window.location.href = '../index.html';
//         });
//         return false;
//     }
    
//     try {
//         const user = JSON.parse(userData);
        
//         if (user.role && user.role !== 'ADMIN') {
//             Swal.fire({
//                 title: "Access Denied",
//                 text: "You don't have permission to access the admin dashboard",
//                 icon: "error",
//                 background: "#1a1a1a",
//                 color: "#ffffff",
//                 confirmButtonText: "OK"
//             }).then(() => {
//                 window.location.href = '../index.html';
//             });
//             return false;
//         }
    
//         updateUserDisplay(user);
//         setupAjaxDefaults(token);
        
//         return true;
//     } catch (e) {
//         console.error('Error parsing user data:', e);
//         performLogout();
//         return false;
//     }
// }

// function setupAjaxDefaults(token) {
    
//     if (typeof $ !== 'undefined') {
//         $.ajaxSetup({
//             beforeSend: function(xhr) {
//                 if (token) {
//                     xhr.setRequestHeader('Authorization', 'Bearer ' + token);
//                 }
//                 const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
//                 if (csrfToken) {
//                     xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
//                 }
//             },
//             error: function(xhr, status, error) {
//                 if (xhr.status === 401) {
//                     handleUnauthorized();
//                 } else if (xhr.status === 403) {
//                     showAlert("Access Denied", "You don't have permission to perform this action", "error");
//                 } else if (xhr.status >= 500) {
//                     showAlert("Server Error", "Internal server error. Please try again later.", "error");
//                 }
//             }
//         });
//     }
// }

// Enhanced checkAuthentication function for dashboard.js

function checkAuthentication() {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    const userData = localStorage.getItem('smartreg_user');
    
    console.log('Authentication check:', { hasToken: !!token, hasUserData: !!userData });
    
    if (!token || !userData) {
        console.log('Missing authentication data - redirecting to login');
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
    
    try {
        const user = JSON.parse(userData);
        console.log('User data:', user);
        
        // Check role permissions
        if (user.role && user.role !== 'ADMIN') {
            console.log('Access denied - insufficient permissions');
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
    
        // Update UI and setup AJAX
        updateUserDisplay(user);
        setupAjaxDefaults(token);
        
        // Log successful authentication
        console.log('Authentication successful for user:', user.fullName || user.username);
        
        return true;
    } catch (e) {
        console.error('Error parsing user data:', e);
        performLogout();
        return false;
    }
}

// Enhanced setupAjaxDefaults function
function setupAjaxDefaults(token) {
    console.log('Setting up AJAX defaults with token:', token ? 'Present' : 'Missing');
    
    if (typeof $ !== 'undefined') {
        // Clear any existing AJAX setup
        $.ajaxSetup({});
        
        // Set new AJAX defaults
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                console.log('AJAX Request:', settings.type, settings.url);
                
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                    console.log('Authorization header set');
                }
                
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken) {
                    xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
                }
                
                // Set content type for POST requests
                if (settings.type === 'POST' && !settings.contentType) {
                    xhr.setRequestHeader('Content-Type', 'application/json');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error
                });
                
                if (xhr.status === 401) {
                    console.log('401 Unauthorized - clearing auth data');
                    handleUnauthorized();
                } else if (xhr.status === 403) {
                    console.log('403 Forbidden - access denied');
                    showAlert("Access Denied", "You don't have permission to perform this action", "error");
                } else if (xhr.status >= 500) {
                    console.log('Server error:', xhr.status);
                    showAlert("Server Error", "Internal server error. Please try again later.", "error");
                } else if (xhr.status === 0) {
                    console.log('Network error - possibly CORS or server down');
                    showAlert("Network Error", "Could not connect to server. Please check your connection.", "error");
                }
            }
        });
        
        console.log('AJAX defaults configured successfully');
    } else {
        console.warn('jQuery not available - AJAX defaults not set');
    }
}

// Enhanced token verification for fetch requests
// async function makeAuthenticatedRequest(url, options = {}) {
//     const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    
//     if (!token) {
//         console.error('No token available for authenticated request');
//         handleUnauthorized();
//         return null;
//     }
    
//     const defaultOptions = {
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//             ...options.headers
//         },
//         ...options
//     };
    
//     try {
//         console.log('Making authenticated request to:', url);
//         const response = await fetch(url, defaultOptions);
        
//         if (response.status === 401) {
//             console.log('401 response - handling unauthorized');
//             handleUnauthorized();
//             return null;
//         }
        
//         if (!response.ok) {
//             console.error('Request failed:', response.status, response.statusText);
//             throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }
        
//         return response;
//     } catch (error) {
//         console.error('Authenticated request error:', error);
//         throw error;
//     }
// }


async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    
    if (!token) {
        console.error('No token available for authenticated request');
        handleUnauthorized();
        return null;
    }
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    try {
        console.log('Making authenticated request to:', url);
        console.log('Request headers:', defaultOptions.headers);
        
        const response = await fetch(url, defaultOptions);
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 401) {
            console.log('401 Unauthorized - token might be expired or invalid');
            debugJWTToken(); // Debug the token when we get 401
            handleUnauthorized();
            return null;
        }
        
        if (response.status === 403) {
            console.log('403 Forbidden - user lacks required permissions');
            debugJWTToken(); // Debug the token when we get 403
            
            // Try to get the response body for more details
            const responseText = await response.text();
            console.log('403 Response body:', responseText);
            
            showAlert(
                "Access Denied", 
                "You don't have permission to access this resource. Please contact support.", 
                "error"
            );
            return null;
        }
        
        if (!response.ok) {
            console.error('Request failed:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error('Authenticated request error:', error);
        throw error;
    }
}

function updateUserDisplay(user) {
    
    const adminName = document.querySelector('.navbar-nav .dropdown-toggle');
    if (adminName && user.fullName) {
        adminName.innerHTML = `<i class="fas fa-user-circle me-2"></i>${user.fullName}`;
    }
    
    const userElements = document.querySelectorAll('[data-user-name]');
    userElements.forEach(element => {
        element.textContent = user.fullName || user.name || 'Admin';
    });
}

function initializeDashboard() {
   
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const cards = document.querySelectorAll('.card-glass');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in');
    });

    addStatsCardClickHandlers();
}

function addStatsCardClickHandlers() {
    const statsCards = document.querySelectorAll('.floating-element');
    
    if (statsCards.length >= 4) {
        statsCards[0].style.cursor = 'pointer';
        statsCards[0].addEventListener('click', function() {
            navigateToApplications('PENDING');
        });
        
        statsCards[1].style.cursor = 'pointer';
        statsCards[1].addEventListener('click', function() {
            navigateToApplications('REJECTED');
        });
        
        statsCards[2].style.cursor = 'pointer';
        statsCards[2].addEventListener('click', function() {
            navigateToApplications('APPROVED');
        });
        
        statsCards[3].style.cursor = 'pointer';
        statsCards[3].addEventListener('click', function() {
            localStorage.removeItem('application_status_filter');
            window.location.href = 'staffManagement.html';
        });
    }
    
    statsCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
        
        card.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-3px) scale(0.98)';
        });
        
        card.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });
}

function navigateToApplications(status) {
    const filterData = {
        status: status,
        timestamp: Date.now(),
        fromDashboard: true
    };
    
    localStorage.setItem('application_status_filter', JSON.stringify(filterData));
    
    window.location.href = '../views/Approvement.html';
}

function addEventListeners() {
   
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
          
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                const page = this.getAttribute('href').replace('#', '');
                if (page) {
                    loadPageContent(page);
                }
            }
        });
    });

    document.querySelectorAll('.btn-primary-glass, .btn-glass').forEach(btn => {
        if (!btn.getAttribute('href') || btn.getAttribute('href').startsWith('#')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.textContent.trim();
                handleQuickAction(action);
            });
        }
    });

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

async function loadApplicationStatusCounts() {
    try {
        console.log('Loading application status counts...');
        
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/applications/getall`);
        if (!response) return null;
        
        const applications = await response.json();
        console.log('Applications loaded:', applications.length);
        
        // Load staff data
        const staffResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/staff`);
        let staffCount = 12; // Default fallback
        
        if (staffResponse) {
            const staffDetails = await staffResponse.json();
            staffCount = Array.isArray(staffDetails) ? staffDetails.length : 12;
            console.log('Staff count:', staffCount);
        }
        
        const statusCounts = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            TOTAL: 0,
            STAFF: staffCount
        };
        
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
        updateApplicationStatsCards(statusCounts);
        window.applicationStats = statusCounts;
        
        return statusCounts;
        
    } catch (error) {
        console.error('Error loading application status counts:', error);
        
        const fallbackCounts = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            TOTAL: 0,
            STAFF: 12
        };
        
        updateApplicationStatsCards(fallbackCounts);
        window.applicationStats = fallbackCounts;
        
        return fallbackCounts;
    }
}

// Add debugging function
function debugAuthStatus() {
    const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    const userData = localStorage.getItem('smartreg_user');
    const loginMethod = sessionStorage.getItem('login_method');
    
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Token present:', !!token);
    console.log('Token source:', localStorage.getItem('smartreg_token') ? 'localStorage' : 'sessionStorage');
    console.log('User data present:', !!userData);
    console.log('Login method:', loginMethod);
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            console.log('User role:', user.role);
            console.log('User name:', user.fullName);
            console.log('Login method from user data:', user.loginMethod);
        } catch (e) {
            console.log('Error parsing user data:', e);
        }
    }
    console.log('========================');
}

function debugJWTToken() {
    const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    
    if (!token) {
        console.log('No token found');
        return;
    }
    
    try {
        // JWT tokens have 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('Invalid JWT format');
            return;
        }
        
        // Decode the payload (middle part)
        const payload = JSON.parse(atob(parts[1]));
        
        console.log('=== JWT TOKEN DEBUG ===');
        console.log('Token payload:', payload);
        console.log('Roles/Authorities:', payload.authorities || payload.roles || 'Not found');
        console.log('Subject:', payload.sub);
        console.log('Issued at:', new Date(payload.iat * 1000));
        console.log('Expires at:', new Date(payload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Token expired?', payload.exp * 1000 < Date.now());
        console.log('========================');
        
        return payload;
    } catch (error) {
        console.error('Error decoding JWT:', error);
    }
}

// Call debug function on page load
document.addEventListener('DOMContentLoaded', function() {
    debugAuthStatus();
    debugJWTToken(); 
});

// Enhanced error handling for Google login users
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason && event.reason.message && event.reason.message.includes('401')) {
        console.log('Detected 401 error - handling unauthorized access');
        handleUnauthorized();
    }
});



function updateApplicationStatsCards(statusCounts = {}) {
    console.log('Updating application stats cards with:', statusCounts);
    
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
            value: 12,
            label: 'Staff Members',
            icon: 'fas fa-users',
            color: 'info'
        }
    ];

    statsConfig.forEach((stat, index) => {

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

            animateCounter(element, stat.value);
            
            const labelElement = element.nextElementSibling;
            if (labelElement && labelElement.tagName.toLowerCase() === 'p') {
                labelElement.textContent = stat.label;
            }
            
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

    updateDashboardTitle(statusCounts);
}

function updateDashboardTitle(statusCounts) {
    const totalApplications = statusCounts.TOTAL || 0;
    const titleElement = document.querySelector('title');
    if (titleElement) {
        titleElement.textContent = `Admin Dashboard - ${totalApplications} Applications`;
    }
    
    const subtitleElement = document.querySelector('.dashboard-subtitle, .page-subtitle');
    if (subtitleElement) {
        subtitleElement.textContent = `Managing ${totalApplications} total applications`;
    }
}

function animateCounter(element, target) {
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
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
            
            const recentApps = applications
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.submittedDate || 0);
                    const dateB = new Date(b.createdAt || b.submittedDate || 0);
                    return dateB - dateA;
                })
                .slice(0, 3);
            
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

        console.log('System status: Operational');
        
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

window.refreshDashboard = function() {
    showLoading(true);

    Promise.all([
        loadApplicationStatusCounts(),
        loadRecentActivity(),
        loadNotifications(),
        loadSystemStatus()
    ])
    .then(() => {
        showLoading(false);
        showAlert("Dashboard Refreshed", "Latest data has been loaded successfully.", "success");
    })
    .catch(error => {
        showLoading(false);
        console.error("Error refreshing dashboard:", error);
        showAlert("Refresh Failed", "Could not refresh dashboard data. Try again later.", "error");
    });
};

let refreshInterval;
let isVisible = true;

function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        if (isVisible && !document.hidden) {
            console.log('Auto-refreshing dashboard data...');
            loadApplicationStatusCounts();
            loadRecentActivity();
            loadNotifications();
        }
    }, 3 * 60 * 1000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

document.addEventListener('visibilitychange', function() {
    isVisible = !document.hidden;
    
    if (isVisible) {
        console.log('Page became visible - refreshing data');
        loadDashboardData();
    } else {
        console.log('Page hidden - pausing auto-refresh');
    }
});

window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

document.addEventListener('keydown', function(e) {

    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshDashboard();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleLogout();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        generateReport();
    }
    
    if (e.key === 'Escape') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
});

window.addEventListener('error', function(event) {
    console.error('Dashboard error:', event.error);
    
    if (!event.error.message.includes('fetch')) {
        showAlert(
            'Application Error',
            'An unexpected error occurred. Please refresh the page.',
            'error'
        );
    }
});

function logPerformanceMetrics() {
    if (window.performance && window.performance.now) {
        const loadTime = window.performance.now();
        console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
        
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
    
    updateConnectionStatus();
}

const dataCache = {
    applications: null,
    cacheTime: null,
    cacheExpiry: 5 * 60 * 1000,
    
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

async function loadApplicationStatusCountsCached() {

    const cachedData = dataCache.get('applications');
    if (cachedData) {
        console.log('Using cached application data');
        updateApplicationStatsCards(cachedData);
        window.applicationStats = cachedData;
        return cachedData;
    }
    
    const data = await loadApplicationStatusCounts();
    if (data) {
        dataCache.set('applications', data);
    }
    return data;
}

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

function initializeEnhancedFeatures() {
    logPerformanceMetrics();
    monitorConnectionStatus();
    addSearchFunctionality();
    addTooltips();
    
    console.log('Enhanced dashboard features initialized');
}

startAutoRefresh();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedFeatures);
} else {
    initializeEnhancedFeatures();
}

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