// Dashboard Functions - CORRECTED VERSION
document.addEventListener('DOMContentLoaded', function() {
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
    // Check if user is authenticated using the correct keys
    const token = sessionStorage.getItem('smartreg_token');
    const userData = localStorage.getItem('smartreg_user');
    
    if (!token || !userData) {
        // Not authenticated, redirect to login
        window.location.href = '../index.html';
        return;
    }
    
    // Parse user data and display user info
    try {
        const user = JSON.parse(userData);
        // Update user display elements if they exist
        const userNameElement = document.getElementById('userName') || document.getElementById('driverName');
        if (userNameElement && user.fullName) {
            userNameElement.textContent = user.fullName;
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
        // Clear corrupted data and redirect
        performLogout();
    }
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
            e.preventDefault();

            // Remove active class from all links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Load corresponding content
            const page = this.getAttribute('href').replace('#', '');
            loadPageContent(page);
        });
    });

    // Quick action buttons
    document.querySelectorAll('.btn-primary-glass, .btn-glass').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent.trim();
            handleQuickAction(action);
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Also handle global logout function if it exists
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
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout',
        background: '#1a1a1a',
        color: '#ffffff'
    }).then((result) => {
        if (result.isConfirmed) {
            performLogout();
        }
    });
}

function performLogout() {
    // CORRECTED: Use the exact same keys as in your login system
    
    // 1. Clear all auth tokens and user data - USING CORRECT KEYS
    localStorage.removeItem('smartreg_token');      // Correct key
    sessionStorage.removeItem('smartreg_token');    // Correct key
    localStorage.removeItem('smartreg_user');       // Correct key
    
    // 2. Set logout flag - USING CORRECT KEY
    localStorage.setItem('smartreg_logout', 'true'); // Correct key
    
    // 3. Show logout success message
    Swal.fire({
        title: 'Logged Out',
        text: 'You have been successfully logged out.',
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

function loadDashboardData() {
    // Simulate API calls to load dashboard data
    setTimeout(() => {
        updateStatsCards();
        loadRecentActivity();
        loadNotifications();
    }, 1000);
}

function updateStatsCards() {
    // Update stats with animation
    const stats = [
        { element: 'total-licenses', value: 1234 },
        { element: 'registered-vehicles', value: 856 },
        { element: 'pending-renewals', value: 45 },
        { element: 'staff-members', value: 12 }
    ];

    stats.forEach(stat => {
        const element = document.getElementById(stat.element);
        if (element) {
            animateCounter(element, stat.value);
        }
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20);
}

function loadRecentActivity() {
    // Simulate loading recent activity
    const activities = [
        { icon: 'fas fa-plus-circle', color: 'success', text: 'New license created for John Doe', time: '2 hours ago' },
        { icon: 'fas fa-sync', color: 'warning', text: 'License renewed for Jane Smith', time: '5 hours ago' },
        { icon: 'fas fa-car', color: 'primary', text: 'Vehicle registration updated', time: '1 day ago' }
    ];

    // Update activity list
    // Implementation would depend on your specific HTML structure
}

function loadNotifications() {
    // Load and display notifications
    const notifications = [
        { type: 'warning', message: '5 licenses expiring this week' },
        { type: 'info', message: 'System maintenance scheduled' }
    ];

    // Update notification area
    // Implementation would depend on your specific HTML structure
}

function handleQuickAction(action) {
    switch(action) {
        case 'Add License':
            window.location.href = 'add-license.html';
            break;
        case 'Search Records':
            window.location.href = 'search-records.html';
            break;
        case 'Generate Report':
            window.location.href = 'reports.html';
            break;
        case 'System Settings':
            window.location.href = 'settings.html';
            break;
        default:
            showAlert('Feature coming soon!', 'info');
    }
}

function loadPageContent(page) {
    // Simulate loading different page content
    showLoading();

    setTimeout(() => {
        hideLoading();
        // Load actual page content here
        console.log(`Loading ${page} content...`);
    }, 800);
}

function showLoading() {
    // Add loading spinner or overlay
    console.log('Loading...');
}

function hideLoading() {
    // Remove loading spinner or overlay
    console.log('Loading complete');
}

function showAlert(message, type) {
    // Show alert message
    Swal.fire({
        title: type === 'info' ? 'Information' : 'Alert',
        text: message,
        icon: type,
        background: '#1a1a1a',
        color: '#ffffff'
    });
}