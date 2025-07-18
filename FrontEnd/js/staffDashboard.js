// Staff Dashboard Functions
document.addEventListener('DOMContentLoaded', function() {
    initializeStaffDashboard();
    addStaffEventListeners();
});

function initializeStaffDashboard() {
    // Initialize search functionality
    document.getElementById('nicSearch')?.addEventListener('input', function() {
        if (this.value.length >= 10) {
            validateNIC(this.value);
        }
    });

    document.getElementById('vehicleSearch')?.addEventListener('input', function() {
        if (this.value.length >= 6) {
            validateVehicleNumber(this.value);
        }
    });
}

function addStaffEventListeners() {
    // Add search functionality
    document.querySelector('.btn-primary-glass')?.addEventListener('click', searchRecords);

    // Add Enter key support for search
    document.getElementById('nicSearch')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchRecords();
        }
    });

    document.getElementById('vehicleSearch')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchRecords();
        }
    });
}

function searchRecords() {
    const nicValue = document.getElementById('nicSearch').value.trim();
    const vehicleValue = document.getElementById('vehicleSearch').value.trim();

    if (!nicValue && !vehicleValue) {
        showAlert('Please enter either NIC or Vehicle Number to search', 'warning');
        return;
    }

    showLoading();

    // Simulate API call
    setTimeout(() => {
        hideLoading();

        // Mock data for demonstration
        const mockResults = [
            {
                nic: '199512345678',
                name: 'John Doe',
                license: 'B1234567',
                vehicle: 'ABC-1234',
                expiry: '2025-12-31',
                status: 'Active'
            },
            {
                nic: '198712345679',
                name: 'Jane Smith',
                license: 'B7654321',
                vehicle: 'XYZ-5678',
                expiry: '2024-08-15',
                status: 'Expiring Soon'
            }
        ];

        displaySearchResults(mockResults);
    }, 1500);
}

function displaySearchResults(results) {
    const tableBody = document.getElementById('searchResultsTable');

    if (results.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>No records found
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = results.map(result => `
        <tr>
            <td>${result.nic}</td>
            <td>${result.name}</td>
            <td>${result.license}</td>
            <td>${result.vehicle}</td>
            <td>${result.expiry}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(result.status)}">
                    ${result.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-glass me-1" onclick="viewRecord('${result.nic}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="requestUpdate('${result.nic}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch(status.toLowerCase()) {
        case 'active': return 'bg-success';
        case 'expiring soon': return 'bg-warning';
        case 'expired': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function validateNIC(nic) {
    // Sri Lankan NIC validation
    const nicPattern = /^(\d{9}[vVxX]|\d{12})$/;
    const input = document.getElementById('nicSearch');

    if (nicPattern.test(nic)) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
    }
}

function validateVehicleNumber(vehicleNumber) {
    // Sri Lankan vehicle number validation
    const vehiclePattern = /^[A-Z]{2,3}-\d{4}$/;
    const input = document.getElementById('vehicleSearch');

    if (vehiclePattern.test(vehicleNumber.toUpperCase())) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
    }
}

function viewRecord(nic) {
    // Open record details modal
    showRecordDetails(nic);
}

function requestUpdate(nic) {
    // Open update request modal
    showUpdateRequest(nic);
}

function showRecordDetails(nic) {
    // Create and show modal with record details
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content glass-strong">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-id-card me-2"></i>Record Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-primary">Personal Information</h6>
                            <p><strong>NIC:</strong> ${nic}</p>
                            <p><strong>Name:</strong> John Doe</p>
                            <p><strong>Address:</strong> 123 Main St, Colombo</p>
                            <p><strong>Phone:</strong> +94 77 123 4567</p>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-success">License Information</h6>
                            <p><strong>License No:</strong> B1234567</p>
                            <p><strong>Issue Date:</strong> 2020-01-15</p>
                            <p><strong>Expiry Date:</strong> 2025-12-31</p>
                            <p><strong>Vehicle No:</strong> ABC-1234</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary-glass" onclick="requestUpdate('${nic}')">
                        Request Update
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

function showUpdateRequest(nic) {
    // Show update request form
    showAlert('Update request feature will be implemented soon!', 'info');
}