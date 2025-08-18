const API_BASE_URL = "http://localhost:8080/api/v1";

const authToken = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
const userData = JSON.parse(localStorage.getItem('smartreg_user') || sessionStorage.getItem('smartreg_user') || '{}');

const rejectionReasons = {
    'photo': 'Photo quality is poor or doesn\'t meet requirements',
    'medical': 'Medical certificate is invalid or expired',
    'documents': 'Required documents are missing or incomplete', 
    'information': 'Personal information doesn\'t match documents',
    'age': 'Applicant doesn\'t meet age requirements',
    'other': 'Other reason specified by administrator'
};

let allApplications = [];
let filteredApplications = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentApplicationId = null;
let selectedDeclineReason = '';
let showRejected = true;


if (!authToken) {
    Swal.fire({
        title: "Authentication Required",
        text: "Please login to continue",
        icon: "error",
        background: "rgba(30, 35, 50, 0.95)",
        color: "#ffffff",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#4e73df"
    }).then(() => {
        window.location.href = "../index.html";
    });
}

function goBack() {
    window.history.back();
}

function handleUnauthorized() {
    localStorage.removeItem('smartreg_token');
    localStorage.removeItem('smartreg_user');
    sessionStorage.removeItem('smartreg_token');
    sessionStorage.removeItem('smartreg_user');
    
    Swal.fire({
        title: "Session Expired",
        text: "Your session has expired. Please login again.",
        icon: "warning",
        background: "rgba(30, 35, 50, 0.95)",
        color: "#ffffff",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#4e73df"
    }).then(() => {
        window.location.href = "../index.html";
    });
}

$.ajaxSetup({
    beforeSend: function(xhr) {
        if (authToken) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
        }
        xhr.setRequestHeader('Content-Type', 'application/json');
    },
    error: function(xhr, status, error) {
        console.error('AJAX Error:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            error: error
        });
        
        if (xhr.status === 401) {
            handleUnauthorized();
        } else if (xhr.status === 403) {
            showError("Access Denied", "You don't have permission to perform this action");
        } else if (xhr.status === 404) {
            showError("Not Found", "The requested resource was not found");
        } else if (xhr.status >= 500) {
            showError("Server Error", "Internal server error. Please try again later.");
        } else if (xhr.status === 0) {
            showError("Connection Error", "Cannot connect to server. Please check if the server is running.");
        }
    }
});

$(document).ready(function() {
    
    if (userData.role !== 'ADMIN' && (!userData.roles || !userData.roles.includes('ADMIN'))) {
        showError("Access Denied", "Only administrators can access this page");
        setTimeout(() => window.history.back(), 2000);
        return;
    }
    
    // Set minimum date for exam date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    $('#examDate').attr('min', tomorrow.toISOString().split('T')[0]);
    
    // Initialize
    loadApplications();
    
    // Event listeners
    $('#refreshBtn').on('click', loadApplications);
    $('#searchInput').on('input', handleSearch);
    $('.filter-option').on('click', handleFilter);
    
    // Modal event listeners
    $(document).on('click', '.approve-btn:not(:disabled)', handleApproveClick);
    $(document).on('click', '.decline-btn:not(:disabled)', handleDeclineClick);
    $('#confirmApproveBtn').on('click', handleApproveConfirm);
    $('#confirmDeclineBtn').on('click', handleDeclineConfirm);
    
    // Status badge click handler for rejected applications
    $(document).on('click', '.status-rejected', function(e) {
        e.stopPropagation();
        const appId = $(this).data('app-id');
        const reasonDiv = $(`#rejection-reason-${appId}`);
        
        if (reasonDiv.hasClass('show')) {
            reasonDiv.removeClass('show').slideUp(300);
        } else {
            $('.rejection-reason.show').removeClass('show').slideUp(300);
            reasonDiv.addClass('show').slideDown(300);
        }
    });
    
    // Toggle rejected applications button
    $('#toggleRejectedBtn').on('click', function() {
        showRejected = !showRejected;
        $(this).html(showRejected ? 
            '<i class="fas fa-eye-slash me-1"></i> Hide Rejected' : 
            '<i class="fas fa-eye me-1"></i> Show Rejected');
        renderApplications();
    });
    
    // Decline reason selection
    $('.decline-reason-item').on('click', function() {
        $('.decline-reason-item').removeClass('selected').css('background', 'rgba(255, 255, 255, 0.05)');
        $(this).addClass('selected').css('background', 'rgba(231, 76, 60, 0.2)');
        
        selectedDeclineReason = $(this).data('reason');
        $('#confirmDeclineBtn').prop('disabled', false);
        
        if (selectedDeclineReason === 'other') {
            $('#customReasonDiv').show();
        } else {
            $('#customReasonDiv').hide();
        }
    });
    
    // Photo modal handler
    $(document).on('click', '.photo-thumbnail', function() {
        const photoUrl = $(this).data('photo');
        $('#enlargedPhoto').attr('src', photoUrl);
    });
    
    // PDF modal handler  
    $(document).on('click', '.pdf-icon', function() {
        const pdfUrl = $(this).data('pdf');
        $('#pdfViewer').attr('src', pdfUrl);
        $('#pdfDownloadBtn').attr('href', pdfUrl);
    });
    
    // Chevron click handler
    $(document).on('click', '.chevron-cell', function(e) {
        e.stopPropagation();
        $(this).find('.rotate-icon').toggleClass('rotated');
    });
});

async function loadApplications() {
    showLoading();
    try {
        // Load applications
        const [applicationsResponse, declinesResponse] = await Promise.all([
            $.ajax({
                url: `${API_BASE_URL}/applications/getall`,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json'
                }
            }),
            $.ajax({
                url: `${API_BASE_URL}/declines/getalldecines`,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json'
                }
            })
        ]);
        
        // Map decline reasons to applications
        allApplications = applicationsResponse.map(app => {
            const declineInfo = declinesResponse.find(d => d.applicationId === app.id);
            if (declineInfo) {
                return {
                    ...app,
                    status: 'REJECTED',
                    rejectionReason: declineInfo.declineReason,
                    rejectionNotes: declineInfo.declineNotes
                };
            }
            return app;
        });
        
        filteredApplications = [...allApplications];
        renderApplications();
        
        if (allApplications.length === 0) {
            showInfo('No Applications', 'No driver license applications found.');
        }
        
    } catch (error) {
        console.error('Error loading applications:', error);
        handleLoadError(error);
    } finally {
        hideLoading();
    }
}

function handleLoadError(error) {
    let errorMessage = 'Failed to load applications';
    
    if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please ensure the backend server is running on http://localhost:8080';
    } else if (error.status === 401) {
        handleUnauthorized();
        return;
    } else if (error.status === 403) {
        errorMessage = 'You don\'t have permission to view applications.';
    } else {
        errorMessage = `Failed to load applications: ${error.statusText || 'Unknown error'}`;
    }
    
    $('#applicationsTable').html(`
        <tr>
            <td colspan="7" class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle text-warning fa-3x mb-3"></i>
                    <h5>Failed to Load Applications</h5>
                    <p class="text-muted mb-3">${errorMessage}</p>
                    <button class="btn btn-outline-primary" onclick="loadApplications()">
                        <i class="fas fa-retry me-1"></i> Retry
                    </button>
                </div>
            </td>
        </tr>
    `);
    $('#emptyState').hide();
}

function renderApplications() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Filter applications based on showRejected flag
    const visibleApplications = showRejected ? 
        filteredApplications : 
        filteredApplications.filter(app => app.status !== 'REJECTED');
    
    const pageApplications = visibleApplications.slice(startIndex, endIndex);
    
    if (pageApplications.length === 0) {
        $('#applicationsTable').empty();
        $('#emptyState').show();
        updatePaginationInfo(0, 0, 0);
        return;
    }
    
    $('#emptyState').hide();
    
    const tbody = $('#applicationsTable');
    tbody.empty();
    
    pageApplications.forEach((app, index) => {
        const rowHtml = generateApplicationRow(app, startIndex + index);
        tbody.append(rowHtml);
        
        setTimeout(() => {
            loadApplicationFiles(app);
        }, 100);
    });
    
    updatePaginationInfo(startIndex + 1, Math.min(endIndex, visibleApplications.length), visibleApplications.length);
    generatePagination();
}

async function loadApplicationFiles(app) {
    if (app.photoPath) {
        try {
            const photoResponse = await fetch(`${API_BASE_URL}/files/${app.photoPath}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            if (photoResponse.ok) {
                const photoBlob = await photoResponse.blob();
                const photoUrl = URL.createObjectURL(photoBlob);
                
                const smallPhotoDiv = $(`#photo-${app.id}`);
                if (smallPhotoDiv.length) {
                    smallPhotoDiv.html(`<img src="${photoUrl}" class="rounded-circle" width="30" height="30" style="object-fit: cover;">`);
                }
                
                const detailPhotoDiv = $(`#photo-detail-${app.id}`);
                if (detailPhotoDiv.length) {
                    detailPhotoDiv.html(`
                        <img src="${photoUrl}" 
                             class="photo-thumbnail"
                             data-bs-toggle="modal" data-bs-target="#photoModal"
                             data-photo="${photoUrl}"
                             style="cursor: pointer;">
                    `);
                }
            }
        } catch (error) {
            console.error(`Error loading photo for application ${app.id}:`, error);
        }
    }
    
    if (app.medicalCertificatePath) {
        try {
            const pdfResponse = await fetch(`${API_BASE_URL}/files/${app.medicalCertificatePath}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                const pdfDiv = $(`#pdf-detail-${app.id}`);
                if (pdfDiv.length) {
                    pdfDiv.html(`
                        <i class="fas fa-file-pdf pdf-icon"
                           data-bs-toggle="modal" data-bs-target="#pdfModal"
                           data-pdf="${pdfUrl}" 
                           title="Medical Certificate"
                           style="cursor: pointer;"></i>
                    `);
                }
            }
        } catch (error) {
            console.error(`Error loading PDF for application ${app.id}:`, error);
        }
    }
}

function generateApplicationRow(app, index) {
    const statusClass = getStatusClass(app.status);
    const statusText = app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1).toLowerCase() : 'Unknown';
    const isDisabled = app.status !== 'PENDING' ? 'disabled' : '';
    
    const driverName = app.driver || 'Unknown Driver';
    
    let rejectionReasonHtml = '';
    if (app.status === 'REJECTED' && app.rejectionReason) {
        const reasonText = rejectionReasons[app.rejectionReason] || app.rejectionReason;
        rejectionReasonHtml = `
            <div id="rejection-reason-${app.id}" class="rejection-reason">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Rejection Reason:</strong> ${reasonText}
                ${app.rejectionNotes ? `<br><small>Notes: ${app.rejectionNotes}</small>` : ''}
            </div>
        `;
    }
    
    return `
        <tr>
            <td class="chevron-cell" data-bs-toggle="collapse" data-bs-target="#details${app.id}" aria-expanded="false">
                <i class="fas fa-chevron-down rotate-icon"></i>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div id="photo-${app.id}" class="rounded-circle me-2 d-flex align-items-center justify-content-center" style="width: 30px; height: 30px; background: rgba(78, 115, 223, 0.2); color: #4e73df; font-size: 0.7rem;">
                        <i class="fas fa-user"></i>
                    </div>
                    <span>${driverName}</span>
                </div>
            </td>
            <td>${app.licenseType || 'N/A'}</td>
            <td>${app.examLanguage || 'N/A'}</td>
            <td>
                <span class="status-badge ${statusClass}" ${app.status === 'REJECTED' ? `data-app-id="${app.id}" title="Click to view rejection reason"` : ''}>
                    ${statusText}
                </span>
                ${rejectionReasonHtml}
            </td>
            <td>${formatDate(app.submittedDate)}</td>
            <td class="action-cell">
                <button class="btn btn-sm btn-approve me-1 approve-btn" data-id="${app.id}" ${isDisabled}>
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-sm btn-decline decline-btn" data-id="${app.id}" ${isDisabled}>
                    <i class="fas fa-times"></i> Decline
                </button>
            </td>
        </tr>
        <tr class="collapse" id="details${app.id}">
            <td colspan="7" class="collapse-row">
                ${generateDetailsRow(app)}
            </td>
        </tr>
    `;
}

function generateDetailsRow(app) {
    return `
        <div class="row">
            <div class="col-md-4">
                <strong>Vehicle Classes:</strong> ${formatVehicleClasses(app.vehicleClasses)}<br>
                <strong>NIC:</strong> ${app.nicNumber || 'N/A'}<br>
                <strong>DOB:</strong> ${formatDate(app.dateOfBirth)}<br>
                <strong>Blood Group:</strong> ${app.bloodGroup || 'N/A'}
                ${app.examDate ? `<br><strong>Exam Date:</strong> ${formatDate(app.examDate)}` : ''}
            </div>
            <div class="col-md-4">
                <strong>Phone:</strong> ${app.phoneNumber || 'N/A'}<br>
                <strong>Email:</strong> ${app.email || 'N/A'}<br>
                <strong>Address:</strong> ${app.address || 'N/A'}
            </div>
            <div class="col-md-2 text-center">
                <strong>Photo</strong><br>
                <div id="photo-detail-${app.id}" class="photo-placeholder mt-1" style="width: 45px; height: 45px; margin: 0 auto;">
                    <i class="fas fa-user" style="line-height: 45px;"></i>
                </div>
            </div>
            <div class="col-md-2 text-center">
                <strong>Documents</strong><br>
                <div id="pdf-detail-${app.id}" class="mt-1">
                    <i class="fas fa-file-pdf pdf-placeholder" title="Loading..."></i>
                </div>
            </div>
        </div>
    `;
}

function formatVehicleClasses(classes) {
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
        return '<span class="text-muted">None</span>';
    }
    return classes.map(cls => `<span class="vehicle-class-badge">${cls}</span>`).join(' ');
}

function getStatusClass(status) {
    switch (status?.toUpperCase()) {
        case 'PENDING': return 'status-pending';
        case 'APPROVED': return 'status-approved';
        case 'REJECTED': return 'status-rejected';
        default: return 'status-pending';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function handleSearch() {
    const searchTerm = $('#searchInput').val().toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredApplications = [...allApplications];
    } else {
        filteredApplications = allApplications.filter(app => {
            const driverName = app.driver ? (app.driver.firstName + ' ' + app.driver.lastName).toLowerCase() : '';
            return driverName.includes(searchTerm) ||
                   (app.nicNumber?.toLowerCase().includes(searchTerm)) ||
                   (app.driver?.email?.toLowerCase().includes(searchTerm)) ||
                   (app.phoneNumber?.includes(searchTerm)) ||
                   (app.licenseType?.toLowerCase().includes(searchTerm));
        });
    }
    
    currentPage = 1;
    renderApplications();
}

function handleFilter(e) {
    e.preventDefault();
    const filterType = $(this).data('filter');
    const filterValue = $(this).data('value');
    
    if (filterValue === 'all') {
        filteredApplications = [...allApplications];
    } else {
        if (filterType === 'status') {
            filteredApplications = allApplications.filter(app => app.status?.toUpperCase() === filterValue);
        } else if (filterType === 'license') {
            filteredApplications = allApplications.filter(app => app.licenseType?.toUpperCase() === filterValue);
        }
    }
    
    currentPage = 1;
    renderApplications();
}

function handleApproveClick(e) {
    e.stopPropagation();
    currentApplicationId = $(this).data('id');
    
    $('#examDate').val('');
    $('#examTime').val('');
    $('#examLocation').val('Colombo DMT');
    $('#approvalNotes').val('');
    
    $('#examDate, #examTime').removeClass('is-invalid');
    
    const approveModal = new bootstrap.Modal(document.getElementById('approveModal'));
    approveModal.show();
}

function handleDeclineClick(e) {
    e.stopPropagation();
    currentApplicationId = $(this).data('id');
    
    $('.decline-reason-item').removeClass('selected').css('background', 'rgba(255, 255, 255, 0.05)');
    $('#customReason').val('');
    $('#declineNotes').val('');
    $('#customReasonDiv').hide();
    $('#confirmDeclineBtn').prop('disabled', true);
    selectedDeclineReason = '';
    
    const declineModal = new bootstrap.Modal(document.getElementById('declineModal'));
    declineModal.show();
}
// Updated handleApproveConfirm function in your frontend
async function handleApproveConfirm() {
    const examDate = $('#examDate').val();
    const examTime = $('#examTime').val();
    const examLocation = $('#examLocation').val();
    const approvalNotes = $('#approvalNotes').val();
    
    let isValid = true;
    
    // Validation
    if (!examDate) {
        $('#examDate').addClass('is-invalid');
        isValid = false;
    } else {
        const selectedDate = new Date(examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate <= today) {
            $('#examDate').addClass('is-invalid');
            isValid = false;
        } else {
            $('#examDate').removeClass('is-invalid');
        }
    }
    
    if (!examTime) {
        $('#examTime').addClass('is-invalid');
        isValid = false;
    } else {
        $('#examTime').removeClass('is-invalid');
    }
    
    if (!isValid) {
        return;
    }
    
    showLoading();
    
    try {
        // First, approve the application
        await $.ajax({
            url: `${API_BASE_URL}/applications/${currentApplicationId}/status?status=APPROVED`,
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            }
        });
        
        // Then, schedule the written exam
        const writtenExamData = {
            applicationId: currentApplicationId,
            writtenExamDate: examDate,
            writtenExamTime: examTime,
            writtenExamLocation: examLocation || 'Colombo Department of Motor Traffic',
            note: approvalNotes || 'Application approved and exam scheduled',
            writtenExamResult: null // Will be updated after exam
        };
        
        await $.ajax({
            url: `${API_BASE_URL}/written-exams/schedule`,
            method: 'POST',
            data: JSON.stringify(writtenExamData),
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            }
        });
        
        // Update local data
        updateApplicationStatus(currentApplicationId, 'APPROVED', examDate);
        
        // Hide modal and refresh display
        const approveModal = bootstrap.Modal.getInstance(document.getElementById('approveModal'));
        approveModal.hide();
        
        renderApplications();
        showSuccess('Application Approved', 
            `Application has been approved successfully. Written exam scheduled for ${formatDate(examDate)} at ${examTime} in ${examLocation}.`);
        
    } catch (error) {
        console.error('Error approving application:', error);
        if (error.responseJSON && error.responseJSON.message) {
            showError('Approval Failed', error.responseJSON.message);
        } else {
            handleActionError(error, 'approve');
        }
    } finally {
        hideLoading();
    }
}

async function handleDeclineConfirm() {
    if (!selectedDeclineReason) {
        showError('Error', 'Please select a decline reason');
        return;
    }

    showLoading();
    
    try {
        // Get decline notes and custom reason
        const declineNotes = $('#declineNotes').val();
        let customReason = '';
        if (selectedDeclineReason === 'other') {
            customReason = $('#customReason').val();
            if (!customReason || customReason.trim() === '') {
                showError('Error', 'Please specify a custom reason');
                hideLoading();
                return;
            }
        }

        // Prepare simple decline data
        const declineData = {
            applicationId: currentApplicationId,
            declineReason: selectedDeclineReason,
            declineNotes: declineNotes || customReason,
            declinedBy: userData.username || 'Admin'
            // declinedAt will be set by backend
        };

        // First, update the application status to REJECTED
        await $.ajax({
            url: `${API_BASE_URL}/applications/${currentApplicationId}/status?status=REJECTED`,
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            }
        });

        // Then, save the simple decline details
        await $.ajax({
            url: `${API_BASE_URL}/declines/create-decline`,
            method: 'POST',
            data: JSON.stringify(declineData),
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            }
        });

        // Update local data with rejection reason
        updateApplicationStatus(
            currentApplicationId, 
            'REJECTED', 
            null, 
            selectedDeclineReason, 
            declineNotes || customReason
        );

        // Hide modal and refresh display
        const declineModal = bootstrap.Modal.getInstance(document.getElementById('declineModal'));
        declineModal.hide();

        renderApplications();
        
        let reasonText = getDeclineReasonText(selectedDeclineReason);
        if (selectedDeclineReason === 'other') {
            reasonText = customReason || 'Other reason specified';
        }
        
        showSuccess('Application Declined', `Application has been declined. Reason: ${reasonText}`);
        
    } catch (error) {
        console.error('Error declining application:', error);
        showError('Decline Failed', 'Failed to decline application. Please try again.');
    } finally {
        hideLoading();
    }
}

function updateApplicationStatus(applicationId, status, examDate = null, rejectionReason = null, rejectionNotes = null) {
    const appIndex = allApplications.findIndex(app => app.id === applicationId);
    if (appIndex !== -1) {
        allApplications[appIndex].status = status;
        if (examDate) allApplications[appIndex].examDate = examDate;
        if (rejectionReason) allApplications[appIndex].rejectionReason = rejectionReason;
        if (rejectionNotes) allApplications[appIndex].rejectionNotes = rejectionNotes;
    }
    
    const filteredIndex = filteredApplications.findIndex(app => app.id === applicationId);
    if (filteredIndex !== -1) {
        filteredApplications[filteredIndex].status = status;
        if (examDate) filteredApplications[filteredIndex].examDate = examDate;
        if (rejectionReason) filteredApplications[filteredIndex].rejectionReason = rejectionReason;
        if (rejectionNotes) filteredApplications[filteredIndex].rejectionNotes = rejectionNotes;
    }
}

function handleActionError(error, action) {
    if (error.status === 401) {
        handleUnauthorized();
    } else if (error.status === 403) {
        showError('Access Denied', `You don't have permission to ${action} applications.`);
    } else if (error.status === 404) {
        showError('Not Found', 'Application not found or may have been deleted.');
    } else {
        showError('Error', `Failed to ${action} application: ${error.statusText || 'Unknown error'}`);
    }
}

function getDeclineReasonText(reason) {
    const reasons = {
        'photo': 'Photo Issues',
        'medical': 'Medical Certificate Issues', 
        'documents': 'Incomplete Documents',
        'information': 'Incorrect Information',
        'age': 'Age Requirements',
        'other': 'Other Reason'
    };
    return reasons[reason] || 'Unknown Reason';
}

function updatePaginationInfo(from, to, total) {
    $('#showingFrom').text(from);
    $('#showingTo').text(to);
    $('#totalItems').text(total);
}

function generatePagination() {
    const visibleApplications = showRejected ? 
        filteredApplications : 
        filteredApplications.filter(app => app.status !== 'REJECTED');
    
    const totalPages = Math.ceil(visibleApplications.length / itemsPerPage);
    const pagination = $('#pagination');
    pagination.empty();
    
    if (totalPages <= 1) return;
    
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    pagination.append(`
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `);
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pagination.append(`
            <li class="page-item ${activeClass}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `);
    }
    
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    pagination.append(`
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `);
    
    pagination.find('.page-link').on('click', function(e) {
        e.preventDefault();
        const newPage = parseInt($(this).data('page'));
        if (newPage && newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderApplications();
        }
    });
}

function showLoading() {
    $('.loading-spinner').show();
}

function hideLoading() {
    $('.loading-spinner').hide();
}

function showSuccess(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: "success",
        background: "rgba(30, 35, 50, 0.95)",
        color: "#ffffff",
        confirmButtonColor: "#2ecc71",
        timer: 3000,
        timerProgressBar: true
    });
}

function showError(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: "error",
        background: "rgba(30, 35, 50, 0.95)",
        color: "#ffffff",
        confirmButtonColor: "#e74c3c"
    });
}

function showInfo(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: "info",
        background: "rgba(30, 35, 50, 0.95)",
        color: "#ffffff",
        confirmButtonColor: "#4e73df"
    });
}
