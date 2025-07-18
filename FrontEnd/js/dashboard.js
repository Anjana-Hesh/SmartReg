// Dashboard Functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeDashboard();

    // Add event listeners
    addEventListeners();

    // Load initial data
    loadDashboardData();
});

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