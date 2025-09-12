const API_BASE_URL = 'http://localhost:8080/api/v1/staff';
let staffData = [];
let isEditing = false;

$(document).ready(function() {
    loadStaffData();
    setupEventListeners();
    generateStaffId();
});

function setupEventListeners() {
    $('#staffForm').on('submit', handleFormSubmit);
    $('#generateIdBtn').on('click', generateStaffId);
    $('#searchInput').on('input', filterStaff);
    $('#statusFilter, #departmentFilter').on('change', filterStaff);

    $('#staffModal').on('show.bs.modal', function() {
        if (!isEditing) {
            resetForm();
            generateStaffId();
        }
    });

    $('#staffModal').on('hidden.bs.modal', function() {
        resetForm();
        isEditing = false;
    });

    $("#backButton").on("click", function() {
        if ($(window).width() < 768) {
            showMobileMenu();
        } else {
            window.history.back();
        }
    });

    $('#drawerClose, #drawerOverlay').on('click', closeMobileDrawer);
    $('#drawerBack').on('click', function() {
        window.history.back();
    });
}

async function makeApiCall(url, options = {}) {
    try {
        const token = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

async function loadStaffData() {
    showLoading(true);
    try {
        const response = await makeApiCall(API_BASE_URL);
        if (response.success) {
            staffData = response.data;
            renderStaffTable(staffData);
        } else {
            throw new Error(response.message || 'Failed to load staff data');
        }
    } catch (error) {
        console.error('Error loading staff data:', error);
        showError('Failed to load staff data. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function generateStaffId() {
    try {
        const response = await makeApiCall(`${API_BASE_URL}/generate-staff-id`);
        if (response.success) $('#staffId').val(response.data.staffId);
    } catch (error) {
        console.error('Error generating staff ID:', error);
    }
}

async function saveStaff(staffData) {
    const url = isEditing ? `${API_BASE_URL}/${$('#editingId').val()}` : API_BASE_URL;
    const method = isEditing ? 'PUT' : 'POST';
    return await makeApiCall(url, { method, body: JSON.stringify(staffData) });
}

async function deleteStaff(id) {
    return await makeApiCall(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
}

async function updateStaffStatus(id, status) {
    return await makeApiCall(`${API_BASE_URL}/${id}/status?status=${status}`, { method: 'PATCH' });
}

async function updateAdminStatus(id, isAdmin) {
    return await makeApiCall(`${API_BASE_URL}/${id}/admin?isAdmin=${isAdmin}`, { method: 'PATCH' });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
        staffId: $('#staffId').val(),
        name: $('#name').val(),
        department: $('#department').val(),
        email: $('#email').val(),
        phone: $('#phone').val(),
        status: $('#status').val(),
        isAdmin: $('#isAdmin').prop('checked')
    };
    try {
        showLoading(true);
        const response = await saveStaff(formData);
       
        if (response.success) {
            showSuccess(response.message || `Staff ${isEditing ? 'updated' : 'created'} successfully!`);
            $('#staffModal').modal('hide');
            await loadStaffData();

        } else {
            throw new Error(response.message || `Failed to ${isEditing ? 'update' : 'create'} staff`);
        }
   
    } catch (error) {
        console.error('Error saving staff:', error);
        showError(error.message || `Failed to ${isEditing ? 'update' : 'create'} staff`);
    } finally {
        showLoading(false);
    }
}


function resetForm() {
    $('#staffForm')[0].reset();
    $('#editingId').val('');
    $('#staffModalLabel').text('Add Staff Member');
    isEditing = false;
}

function renderStaffTable(data) {
    const $tbody = $('#staffTable');
    $tbody.empty();

    if (!data || data.length === 0) {
        $tbody.html('<tr><td colspan="9" class="text-center">No staff members found</td></tr>');
        return;
    }

    data.forEach((staff, index) => {
        const row = `
            <tr>
                <td data-label="#">${index + 1}</td>
                <td data-label="Staff ID">${staff.staffId}</td>
                <td data-label="Name">${staff.name}</td>
                <td data-label="Department">${staff.department}</td>
                <td data-label="Email">${staff.email}</td>
                <td data-label="Phone">${staff.phone}</td>
                <td data-label="Status"><span class="status-${staff.status.toLowerCase()}">${staff.status}</span></td>
                <td data-label="Admin">${staff.isAdmin ? '<span class="admin-badge">Admin</span>' : 'Staff'}</td>
                <td data-label="Actions">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-warning" onclick="editStaff(${staff.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-${staff.status === 'ACTIVE' ? 'secondary' : 'success'}" 
                                onclick="toggleStatus(${staff.id}, '${staff.status}')" 
                                title="${staff.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}">
                            <i class="fas fa-${staff.status === 'ACTIVE' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-${staff.isAdmin ? 'secondary' : 'info'}" 
                                onclick="toggleAdmin(${staff.id}, ${staff.isAdmin})" 
                                title="${staff.isAdmin ? 'Remove Admin' : 'Make Admin'}">
                            <i class="fas fa-${staff.isAdmin ? 'user-minus' : 'user-shield'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${staff.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        $tbody.append(row);
    });
}

function editStaff(id) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;

    isEditing = true;
    $('#editingId').val(id);
    $('#staffModalLabel').text('Edit Staff Member');
    
    $('#staffId').val(staff.staffId);
    $('#name').val(staff.name);
    $('#department').val(staff.department);
    $('#email').val(staff.email);
    $('#phone').val(staff.phone);
    $('#status').val(staff.status);
    $('#isAdmin').prop('checked', staff.isAdmin);

    $('#staffModal').modal('show');
}

async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
        const response = await updateStaffStatus(id, newStatus);
        if (response.success) {
            showSuccess(`Staff status updated to ${newStatus}`);
            await loadStaffData();
        } else throw new Error(response.message || 'Failed to update status');
    } catch (error) {
        console.error('Error updating status:', error);
        showError(error.message || 'Failed to update status');
    }
}

async function toggleAdmin(id, currentAdmin) {
    const newAdmin = !currentAdmin;
    try {
        const response = await updateAdminStatus(id, newAdmin);
        if (response.success) {
            showSuccess(`Admin status ${newAdmin ? 'granted' : 'revoked'} successfully`);
            await loadStaffData();
        } else throw new Error(response.message || 'Failed to update admin status');
    } catch (error) {
        console.error('Error updating admin status:', error);
        showError(error.message || 'Failed to update admin status');
    }
}

async function confirmDelete(id) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `This will permanently delete ${staff.name}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        background: '#2b2b2b',
        color: '#e0e0e0'
    });

    if (result.isConfirmed) {
        try {
            const response = await deleteStaff(id);
            if (response.success) {
                showSuccess('Staff deleted successfully!');
                await loadStaffData();
            } else throw new Error(response.message || 'Failed to delete staff');
        } catch (error) {
            console.error('Error deleting staff:', error);
            showError(error.message || 'Failed to delete staff');
        }
    }
}

function filterStaff() {
    const searchTerm = $('#searchInput').val().toLowerCase();
    const statusFilter = $('#statusFilter').val();
    const departmentFilter = $('#departmentFilter').val();

    const filteredData = staffData.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm) ||
                              staff.email.toLowerCase().includes(searchTerm) ||
                              staff.staffId.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || staff.status === statusFilter;
        const matchesDepartment = !departmentFilter || staff.department === departmentFilter;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    renderStaffTable(filteredData);
}

function showLoading(show) {
    $('#loading').css('display', show ? 'block' : 'none');
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: message,
        background: '#2b2b2b',
        color: '#e0e0e0',
        confirmButtonColor: '#28a745'
    });
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: message,
        background: '#2b2b2b',
        color: '#e0e0e0',
        confirmButtonColor: '#dc3545'
    });
}

function showMobileMenu() {
    Swal.fire({
        title: "Menu",
        html: `
            <button class="btn btn-secondary w-100 mb-2" onclick="window.history.back(); Swal.close();">
                <i class="fas fa-arrow-left"></i> Back
            </button>
            <button class="btn btn-primary w-100 mb-2" onclick="window.location.href='profile.html'; Swal.close();">
                <i class="fas fa-user"></i> Profile
            </button>
            <button class="btn btn-dark w-100" onclick="window.location.href='settings.html'; Swal.close();">
                <i class="fas fa-cog"></i> Settings
            </button>
        `,
        background: "#2b2b2b",
        color: "#e0e0e0",
        showConfirmButton: false
    });
}

function closeMobileDrawer() {
    $('#mobileDrawer').removeClass('open');
    $('#drawerOverlay').hide();
}
