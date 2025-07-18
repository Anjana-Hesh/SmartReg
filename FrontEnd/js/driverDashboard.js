// Driver Dashboard JavaScript
class DriverDashboard {
    constructor() {
        this.currentUser = null;
        this.notifications = [];
        this.licenseData = null;
        this.init();
    }

    init() {
        this.checkUserAuth();
        this.loadUserData();
        this.loadNotifications();
        this.setupEventListeners();
    }

    // checkUserAuth() {
    //     const user = JSON.parse(localStorage.getItem('currentUser'));
    //     if (!user || user.role !== 'driver') {
    //         alert('Please login as a driver to access this dashboard');
    //         window.location.href = 'index.html';
    //         return;
    //     }
    //     this.currentUser = user;
    //     document.getElementById('driverName').textContent = user.name || 'Driver';
    // }

    loadUserData() {
        const licenseData = JSON.parse(localStorage.getItem(`license_${this.currentUser.email}`));
        if (licenseData) {
            this.licenseData = licenseData;
            this.updateLicenseStatus();
            this.updateLicenseInfo();
        }
    }

    updateLicenseStatus() {
        const statusElement = document.getElementById('licenseStatus');
        if (!this.licenseData) {
            statusElement.textContent = 'License Status: Not Registered';
            statusElement.className = 'status-badge status-pending';
            return;
        }

        const now = new Date();
        const expiryDate = new Date(this.licenseData.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        if (this.licenseData.status === 'active') {
            if (daysUntilExpiry <= 0) {
                statusElement.textContent = 'License Status: Expired';
                statusElement.className = 'status-badge status-expired';
            } else if (daysUntilExpiry <= 30) {
                statusElement.textContent = 'License Status: Expiring Soon';
                statusElement.className = 'status-badge status-pending';
            } else {
                statusElement.textContent = 'License Status: Active';
                statusElement.className = 'status-badge status-active';
            }
        } else {
            statusElement.textContent = `License Status: ${this.licenseData.status}`;
            statusElement.className = 'status-badge status-pending';
        }
    }

    updateLicenseInfo() {
        const licenseInfo = document.getElementById('licenseInfo');
        if (!this.licenseData) {
            licenseInfo.textContent = 'Complete your license registration to get started with your driving journey.';
            return;
        }

        licenseInfo.innerHTML = `
            <strong>License Type:</strong> ${this.licenseData.licenseType}<br>
            <strong>Vehicle Class:</strong> Class ${this.licenseData.vehicleClass}<br>
            <strong>Issue Date:</strong> ${this.licenseData.issueDate}<br>
            <strong>Expiry Date:</strong> ${this.licenseData.expiryDate}<br>
            <strong>Status:</strong> ${this.licenseData.status}
        `;
    }

    loadNotifications() {
        const notifications = JSON.parse(localStorage.getItem(`notifications_${this.currentUser.email}`)) || [];
        this.notifications = notifications;

        // Add system notifications
        this.addSystemNotifications();

        this.updateNotificationsList();
    }

    addSystemNotifications() {
        const now = new Date();

        // Check for license expiry
        if (this.licenseData && this.licenseData.expiryDate) {
            const expiryDate = new Date(this.licenseData.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                this.addNotification(
                    'License Expiry Warning',
                    `Your license will expire in ${daysUntilExpiry} days. Please renew soon.`,
                    'warning'
                );
            } else if (daysUntilExpiry <= 0) {
                this.addNotification(
                    'License Expired',
                    'Your license has expired. Please renew immediately.',
                    'error'
                );
            }
        }

        // Add upcoming exam notifications (example)
        const upcomingExams = [
            { date: '2025-08-15', type: 'Theory Exam' },
            { date: '2025-08-22', type: 'Practical Exam' }
        ];

        upcomingExams.forEach(exam => {
            const examDate = new Date(exam.date);
            const daysUntilExam = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExam <= 7 && daysUntilExam >= 0) {
                this.addNotification(
                    'Upcoming Exam',
                    `${exam.type} scheduled for ${exam.date}. Days remaining: ${daysUntilExam}`,
                    'info'
                );
            }
        });
    }

    addNotification(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            date: new Date().toISOString(),
            read: false
        };

        // Check if notification already exists
        const exists = this.notifications.some(n => n.title === title && n.message === message);
        if (!exists) {
            this.notifications.unshift(notification);
            this.saveNotifications();
        }
    }

    updateNotificationsList() {
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = '';

        if (this.notifications.length === 0) {
            notificationList.innerHTML = '<li class="notification-item"><div class="notification-text">No notifications</div></li>';
            return;
        }

        this.notifications.slice(0, 5).forEach(notification => {
            const listItem = document.createElement('li');
            listItem.className = 'notification-item';
            listItem.innerHTML = `
                <div class="notification-date">${this.formatDate(notification.date)}</div>
                <div class="notification-text">${notification.message}</div>
            `;
            notificationList.appendChild(listItem);
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    }

    saveNotifications() {
        localStorage.setItem(`notifications_${this.currentUser.email}`, JSON.stringify(this.notifications));
    }

    setupEventListeners() {
        // License form submission
        const licenseForm = document.getElementById('licenseForm');
        if (licenseForm) {
            licenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitLicenseApplication();
            });
        }
    }

    submitLicenseApplication() {
        const formData = {
            licenseType: document.getElementById('licenseType').value,
            vehicleClass: document.getElementById('vehicleClass').value,
            nicNumber: document.getElementById('nicNumber').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            address: document.getElementById('address').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            issueDate: new Date().toISOString().split('T')[0],
            expiryDate: this.calculateExpiryDate(document.getElementById('licenseType').value),
            status: 'pending',
            applicationDate: new Date().toISOString()
        };

        // Validate age
        const birthDate = new Date(formData.dateOfBirth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 18) {
            alert('You must be at least 18 years old to apply for a license');
            return;
        }

        // Save license data
        localStorage.setItem(`license_${this.currentUser.email}`, JSON.stringify(formData));
        this.licenseData = formData;

        // Add notification
        this.addNotification(
            'License Application Submitted',
            'Your license application has been submitted successfully. You will be notified of the status.',
            'success'
        );

        // Update UI
        this.updateLicenseStatus();
        this.updateLicenseInfo();
        this.updateNotificationsList();
        this.closeLicenseModal();

        alert('License application submitted successfully!');
    }

    calculateExpiryDate(licenseType) {
        const now = new Date();
        const expiryDate = new Date(now);

        switch (licenseType) {
            case 'learner':
                expiryDate.setFullYear(now.getFullYear() + 1); // 1 year
                break;
            case 'full':
                expiryDate.setFullYear(now.getFullYear() + 5); // 5 years
                break;
            case 'heavy':
                expiryDate.setFullYear(now.getFullYear() + 3); // 3 years
                break;
            default:
                expiryDate.setFullYear(now.getFullYear() + 1);
        }

        return expiryDate.toISOString().split('T')[0];
    }
}

// Modal functions
function showLicenseForm() {
    document.getElementById('licenseModal').style.display = 'flex';
}

function closeLicenseModal() {
    document.getElementById('licenseModal').style.display = 'none';
}

function showProfileForm() {
    alert('Profile management feature coming soon!');
}

function showHistory() {
    alert('License history feature coming soon!');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DriverDashboard();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('licenseModal');
    if (e.target === modal) {
        closeLicenseModal();
    }
});