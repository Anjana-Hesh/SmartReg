$(document).ready(function () {
    // Configuration
    const API_BASE_URL = "http://localhost:8080/api/v1"; // Update with your backend URL
    
    // Get authentication data from localStorage
    const authToken = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    const userData = JSON.parse(localStorage.getItem('smartreg_user') || '{}');
    const currentDriverId = userData.id;
    const currentDriverName = userData.fullName || userData.name;

    // Get CSRF token from meta tag (if your backend uses CSRF protection)
    const csrfToken = $('meta[name="csrf-token"]').attr('content') || '';

    // Check authentication
    if (!authToken || !currentDriverId) {
        Swal.fire({
            title: "Authentication Required",
            text: "Please login to continue",
            icon: "error",
            background: "#1a1a1a",
            color: "#ffffff",
            confirmButtonText: "OK"
        }).then(() => {
            window.location.href = "../index.html";
        });
        return;
    }

    // Setup AJAX defaults with authentication
    $.ajaxSetup({
        beforeSend: function(xhr) {
            if (authToken) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
            }
            if (csrfToken) {
                xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
            }
        },
        error: function(xhr, status, error) {
            if (xhr.status === 401) {
                handleUnauthorized();
            } else if (xhr.status === 403) {
                Swal.fire({
                    title: "Access Denied",
                    text: "You don't have permission to perform this action",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            } else if (xhr.status >= 500) {
                Swal.fire({
                    title: "Server Error",
                    text: "Internal server error. Please try again later.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            }
        }
    });

    // Vehicle classes data organized by license type
    const vehicleClassesByLicense = {
        learner: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
            { value: "G1", text: "Class G1 - Agricultural Tractors" },
        ],
        restricted: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
            { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
            { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
            { value: "G1", text: "Class G1 - Agricultural Tractors" },
        ],
        full: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
            { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
            { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
            { value: "C1", text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)" },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
            { value: "G1", text: "Class G1 - Agricultural Tractors" },
            { value: "G", text: "Class G - Heavy Agricultural Vehicles" },
        ],
        heavy: [
            { value: "C1", text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)" },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            { value: "CE", text: "Class CE - Articulated Heavy Goods Vehicles" },
            { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
            { value: "DE", text: "Class DE - Articulated Buses" },
            { value: "G", text: "Class G - Heavy Agricultural Vehicles" },
            { value: "H", text: "Class H - Construction Vehicles" },
        ],
        commercial: [
            { value: "J1", text: "Class J1 - Three Wheeler (Commercial)" },
            { value: "J2", text: "Class J2 - Taxi/Hire Cars" },
            { value: "J3", text: "Class J3 - Tourist Transport Vehicles" },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            { value: "CE", text: "Class CE - Articulated Heavy Goods Vehicles" },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
            { value: "DE", text: "Class DE - Articulated Buses" },
        ],
        international: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
            { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
            { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
            { value: "C1", text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)" },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
        ],
        motorcycle: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            { value: "A2", text: "Class A2 - Medium Motorcycles (125cc - 400cc)" },
            { value: "A", text: "Class A - Heavy Motorcycles (above 400cc)" },
            { value: "AM", text: "Class AM - Mopeds (up to 50cc)" },
            { value: "Q", text: "Class Q - Three Wheelers (Private)" },
        ],
        special: [
            { value: "F", text: "Class F - Emergency Vehicles (Ambulance, Fire)" },
            { value: "K", text: "Class K - Military Vehicles" },
            { value: "L", text: "Class L - Special Construction Vehicles" },
            { value: "M", text: "Class M - Cranes and Mobile Equipment" },
            { value: "N", text: "Class N - Road Maintenance Vehicles" },
            { value: "P", text: "Class P - Police Vehicles" },
            { value: "R", text: "Class R - Racing Vehicles" },
            { value: "S", text: "Class S - School Transport" },
        ],
    };

    let selectedVehicleClasses = [];
    let currentDriverData = {};

    // =================== INITIALIZATION ===================
    function initialize() {
        showLoading(true);
        
        // Set driver name from userData
        $("#driverName").text(currentDriverName || "Driver");
        
        // Disable vehicle class select initially
        $("#vehicleClass").prop("disabled", true);

        // Set date constraints
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        $("#dateOfBirth").attr("max", eighteenYearsAgo.toISOString().split("T")[0]);

        // Load initial data
        Promise.all([
            loadDriverApplications(),
            loadNotifications(),
            checkExistingLicense()
        ]).finally(() => {
            showLoading(false);
        });
    }

    // =================== API FUNCTIONS ===================

    // Submit license application - Updated to match backend structure
    function submitLicenseApplication(applicationData, photoFile, medicalFile) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            
            // Create application JSON object
            const applicationJson = {
                driverId: currentDriverId,
                licenseType: applicationData.licenseType,
                examLanguage: applicationData.examLanguage,
                vehicleClasses: selectedVehicleClasses.map(vc => vc.value), // Send as array of strings
                nicNumber: applicationData.nicNumber,
                bloodGroup: applicationData.bloodGroup,
                dateOfBirth: applicationData.dateOfBirth,
                phoneNumber: applicationData.phoneNumber,
                address: applicationData.address,
            };
            
            console.log("Submitting application with data:", {
                applicationData: applicationJson,
                photoFile: photoFile.name,
                medicalFile: medicalFile.name
            });
            
            // Append JSON as string to match @RequestPart("application")
            formData.append("application", JSON.stringify(applicationJson));
            
            // Append files to match @RequestPart("photo") and @RequestPart("medical")
            formData.append("photo", photoFile);
            formData.append("medical", medicalFile);

            $.ajax({
                url: `${API_BASE_URL}/applications/create-application`,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function(xhr) {
                    if (authToken) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
                    }
                    if (csrfToken) {
                        xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
                    }
                    // Don't set Content-Type for multipart/form-data
                },
                success: function(response) {
                    console.log("Application submitted successfully:", response);
                    resolve(response);
                },
                error: function(xhr, status, error) {
                    console.error("Application submission failed:", xhr.responseJSON);
                    reject({
                        status: xhr.status,
                        message: xhr.responseJSON?.message || xhr.responseText || "Failed to submit application",
                        error: error,
                        response: xhr.responseJSON
                    });
                }
            });
        });
    }

    // Load driver applications using the backend endpoint
    function loadDriverApplications() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/applications/driver/${currentDriverId}`,
                method: 'GET',
                success: function(applications) {
                    console.log("Applications loaded:", applications);
                    updateApplicationsInfo(applications);
                    updateDashboardWithApplications(applications);
                    resolve(applications);
                },
                error: function(xhr, status, error) {
                    console.error("Failed to load applications:", error);
                    if (xhr.status !== 404) {
                        showAlert("Error", "Failed to load applications", "error");
                    }
                    resolve([]);
                }
            });
        });
    }

    // Get application by ID
    function getApplicationById(applicationId) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/applications/${applicationId}`,
                method: 'GET',
                success: function(application) {
                    resolve(application);
                },
                error: function(xhr, status, error) {
                    reject({
                        status: xhr.status,
                        message: xhr.responseJSON?.message || "Failed to load application",
                        error: error
                    });
                }
            });
        });
    }

    // Get pending application count
    function getPendingApplicationCount() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/applications/driver/${currentDriverId}/pending-count`,
                method: 'GET',
                success: function(count) {
                    resolve(count);
                },
                error: function(xhr, status, error) {
                    console.error("Failed to get pending count:", error);
                    resolve(0);
                }
            });
        });
    }

    // Load notifications (mock implementation - replace with your actual endpoint)
    function loadNotifications() {
        return new Promise((resolve, reject) => {
            // Since no notification endpoint was provided, using mock data
            // Replace this with your actual notification API endpoint
            const mockNotifications = [
                {
                    id: 1,
                    message: "Welcome to the License Management System!",
                    createdDate: new Date().toISOString(),
                    isRead: false,
                    type: "WELCOME"
                },
                {
                    id: 2,
                    message: "Your application is being processed",
                    createdDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    isRead: true,
                    type: "APPLICATION_UPDATE"
                }
            ];
            
            renderNotifications(mockNotifications);
            updateNotificationBadge(mockNotifications.filter(n => !n.isRead).length);
            resolve(mockNotifications);
        });
    }

    // Check if driver already has a license (mock implementation)
    function checkExistingLicense() {
        return new Promise((resolve, reject) => {
            // This is a mock implementation since no license endpoint was provided
            // Replace with your actual license API endpoint
            loadDriverApplications().then(applications => {
                const approvedApp = applications.find(app => app.status === 'APPROVED');
                if (approvedApp) {
                    updateLicenseStatus("active", approvedApp);
                    updateLicenseCard(approvedApp);
                } else if (applications.some(app => app.status === 'PENDING')) {
                    updateLicenseStatus("pending");
                } else {
                    updateLicenseStatus("none");
                }
                resolve(approvedApp);
            }).catch(error => {
                updateLicenseStatus("none");
                resolve(null);
            });
        });
    }

    // =================== UI UPDATE FUNCTIONS ===================

    function updateDriverInfo(driverData) {
        $("#driverName").text(driverData.fullName || driverData.name || currentDriverName || "Driver");
        
        // Update any other driver-specific UI elements
        if (driverData.profileImage) {
            $(".driver-avatar").attr("src", driverData.profileImage);
        }
    }

    function updateLicenseStatus(status, licenseData = null) {
        const statusBadge = $("#licenseStatus");
        
        switch (status) {
            case "active":
                statusBadge.removeClass("status-pending status-none")
                          .addClass("status-active")
                          .html('<i class="fas fa-check-circle me-1"></i> License Active');
                break;
            case "pending":
                statusBadge.removeClass("status-active status-none")
                          .addClass("status-pending")
                          .html('<i class="fas fa-clock me-1"></i> Application Pending');
                break;
            default:
                statusBadge.removeClass("status-active status-pending")
                          .addClass("status-none")
                          .html('<i class="fas fa-exclamation-circle me-1"></i> No License');
        }
    }

    function updateLicenseCard(applicationData) {
        const cardContent = $(".license-info-card .card-content");
        if (applicationData && applicationData.status === 'APPROVED') {
            const vehicleClasses = applicationData.vehicleClasses ? 
                applicationData.vehicleClasses.map(v => v.code || v.value).join(', ') : 'N/A';
                
            cardContent.html(`
                <p><strong>Application ID:</strong> ${applicationData.id}</p>
                <p><strong>License Type:</strong> ${applicationData.licenseType}</p>
                <p><strong>Vehicle Classes:</strong> ${vehicleClasses}</p>
                <p><strong>Status:</strong> <span class="badge bg-success">${applicationData.status}</span></p>
                <p><strong>Submitted:</strong> ${new Date(applicationData.submittedDate).toLocaleDateString()}</p>
                <button class="btn-card" onclick="viewApplicationDetails('${applicationData.id}')">
                    <i class="fas fa-eye me-1"></i> View Details
                </button>
            `);
        } else {
            cardContent.html(`
                <p>Complete your license registration to get started with your driving journey.</p>
                <button class="btn-card" onclick="showLicenseForm()">
                    <i class="fas fa-edit me-1"></i> Register License
                </button>
            `);
        }
    }

    function updateApplicationsInfo(applications) {
        // Update pending applications count
        const pendingCount = applications.filter(app => app.status === 'PENDING').length;
        
        // Update license card based on applications
        if (applications.length > 0) {
            const latestApplication = applications[0]; // Assuming sorted by date
            updateLicenseCard(latestApplication);
        }
        
        // Update notification badge with pending count
        updateNotificationBadge(pendingCount);
    }

    function updateDashboardWithApplications(applications) {
        const licenseInfo = $("#licenseInfo");
        const licenseCard = $(".license-info-card .card-content");
        
        if (applications.length === 0) {
            licenseInfo.text("Complete your license registration to get started with your driving journey.");
            return;
        }

        const latestApplication = applications[0];
        const statusBadgeClass = getStatusBadgeClass(latestApplication.status);
        // Handle vehicleClasses as array of strings
        const vehicleClasses = Array.isArray(latestApplication.vehicleClasses) ? 
            latestApplication.vehicleClasses.join(', ') : 'N/A';

        licenseCard.html(`
            <div class="application-summary">
                <p><strong>Latest Application:</strong> #${latestApplication.id}</p>
                <p><strong>License Type:</strong> ${latestApplication.licenseType}</p>
                <p><strong>Vehicle Classes:</strong> ${vehicleClasses}</p>
                <p><strong>Status:</strong> <span class="badge bg-${statusBadgeClass}">${latestApplication.status}</span></p>
                <p><strong>Submitted:</strong> ${new Date(latestApplication.submittedDate).toLocaleDateString()}</p>
                
                <div class="mt-3">
                    <button class="btn-card me-2" onclick="viewApplicationDetails('${latestApplication.id}')">
                        <i class="fas fa-eye me-1"></i> View Details
                    </button>
                    ${latestApplication.status === 'REJECTED' ? `
                        <button class="btn-card btn-warning" onclick="showLicenseForm()">
                            <i class="fas fa-redo me-1"></i> Reapply
                        </button>
                    ` : ''}
                    ${applications.filter(app => app.status === 'PENDING').length === 0 ? `
                        <button class="btn-card btn-secondary" onclick="showLicenseForm()">
                            <i class="fas fa-plus me-1"></i> New Application
                        </button>
                    ` : ''}
                </div>
            </div>
        `);
    }

    function renderNotifications(notifications) {
        const container = $("#notificationList");
        container.empty();

        if (!notifications || notifications.length === 0) {
            showDefaultNotifications();
            return;
        }

        notifications.forEach(notification => {
            const item = $(`
                <li class="notification-item ${!notification.isRead ? 'unread' : ''}" data-id="${notification.id}">
                    <div class="notification-date">
                        <i class="far fa-calendar-alt me-1"></i> 
                        ${new Date(notification.createdDate).toLocaleDateString()}
                    </div>
                    <div class="notification-text">${notification.message}</div>
                    ${!notification.isRead ? '<div class="unread-indicator"></div>' : ''}
                </li>
            `);
            
            // Add click handler to mark as read (if you have this endpoint)
            item.on('click', function() {
                if (!notification.isRead) {
                    // Mark as read locally
                    $(this).removeClass('unread').find('.unread-indicator').remove();
                }
            });
            
            container.append(item);
        });
    }

    function showDefaultNotifications() {
        const container = $("#notificationList");
        container.html(`
            <li class="notification-item">
                <div class="notification-date">
                    <i class="far fa-calendar-alt me-1"></i> Today
                </div>
                <div class="notification-text">
                    Welcome to the License Management System!
                </div>
            </li>
        `);
    }

    function updateNotificationBadge(count) {
        const badge = $("#notificationBadge");
        if (badge.length && count > 0) {
            badge.text(count).show();
        } else if (badge.length) {
            badge.hide();
        }
    }

    // =================== FORM HANDLERS ===================

    // License Modal Functions
    window.showLicenseForm = function () {
        $("#licenseModal").show();
    };

    window.closeLicenseModal = function () {
        $("#licenseModal").hide();
        resetForm();
    };

    function resetForm() {
        $("#licenseForm")[0].reset();
        selectedVehicleClasses = [];
        updateSelectedVehicleClassesDisplay();
        clearValidationMessages();
        hidePhotoPreview();
        hideMedicalPreview();
        $("#vehicleClass").prop("disabled", true);
    }

    // License type change handler
    $("#licenseType").on("change", function () {
        const licenseType = $(this).val();
        const vehicleClassSelect = $("#vehicleClass");

        vehicleClassSelect.empty();
        selectedVehicleClasses = [];
        updateSelectedVehicleClassesDisplay();

        if (licenseType && vehicleClassesByLicense[licenseType]) {
            $.each(vehicleClassesByLicense[licenseType], function (index, vehicleClass) {
                vehicleClassSelect.append(
                    $("<option></option>")
                        .val(vehicleClass.value)
                        .text(vehicleClass.text)
                );
            });
            vehicleClassSelect.prop("disabled", false);
        } else {
            vehicleClassSelect.prop("disabled", true);
        }
    });

    // Vehicle class selection handler
    $("#vehicleClass").on("change", function () {
        const selectedOptions = $(this).find("option:selected");

        selectedOptions.each(function () {
            const value = $(this).val();
            const text = $(this).text();

            if (!selectedVehicleClasses.some((item) => item.value === value)) {
                selectedVehicleClasses.push({ value, text });
            }
        });

        $(this).val([]);
        updateSelectedVehicleClassesDisplay();
    });

    function updateSelectedVehicleClassesDisplay() {
        const container = $("#selectedVehicleClasses");

        if (selectedVehicleClasses.length === 0) {
            container.html(
                '<span style="color: #6c757d; font-size: 0.9rem;">No vehicle classes selected</span>'
            );
        } else {
            container.html(
                selectedVehicleClasses
                    .map(
                        (item) => `
                        <div class="selected-item">
                            ${item.text}
                            <span class="remove-item" onclick="removeVehicleClass('${item.value}')">×</span>
                        </div>
                        `
                    )
                    .join("")
            );
        }
    }

    window.removeVehicleClass = function (value) {
        selectedVehicleClasses = selectedVehicleClasses.filter(
            (item) => item.value !== value
        );
        updateSelectedVehicleClassesDisplay();
    };

    // =================== FORM VALIDATION ===================

    async function validatePhoto(file) {
        const validationDiv = $("#photoValidation");
        const maxSize = 2 * 1024 * 1024; // 2MB
        const minDimension = 300;
        const maxDimension = 2000;
        const aspectRatioTolerance = 0.1;

        validationDiv.empty();

        if (!file) return false;

        if (!file.type.match(/image\/(jpeg|jpg|png)$/i)) {
            showValidationMessage("photoValidation", "Please upload a JPEG or PNG image file.", "error");
            return false;
        }

        if (file.size > maxSize) {
            showValidationMessage("photoValidation", "Photo size must be less than 2MB.", "error");
            return false;
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                const width = this.naturalWidth;
                const height = this.naturalHeight;
                const aspectRatio = width / height;

                let errors = [];

                if (width < minDimension || height < minDimension) {
                    errors.push(`Minimum dimensions: ${minDimension}x${minDimension}px`);
                }

                if (width > maxDimension || height > maxDimension) {
                    errors.push(`Maximum dimensions: ${maxDimension}x${maxDimension}px`);
                }

                if (Math.abs(aspectRatio - 1) > aspectRatioTolerance) {
                    errors.push("Photo should be square or nearly square (passport photo format)");
                }

                if (errors.length > 0) {
                    showValidationMessage("photoValidation", errors.join(". "), "error");
                    resolve(false);
                } else {
                    showValidationMessage("photoValidation", "Photo validation successful!", "success");
                    resolve(true);
                }
            };

            img.onerror = function () {
                showValidationMessage("photoValidation", "Unable to load image. Please try another file.", "error");
                resolve(false);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    function validateMedicalFile(file) {
        if (!file) return false;
        
        if (file.type !== 'application/pdf') {
            showAlert("Invalid File", "Medical certificate must be a PDF file.", "error");
            return false;
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showAlert("File Too Large", "Medical certificate must be less than 5MB.", "error");
            return false;
        }
        
        return true;
    }

    function showValidationMessage(containerId, message, type) {
        const container = $("#" + containerId);
        const className = type === "error" ? "validation-error" : "validation-success";
        const icon = type === "error" ? "fas fa-exclamation-triangle" : "fas fa-check-circle";

        container.html(`
            <div class="validation-message ${className}">
                <i class="${icon} me-2"></i>${message}
            </div>
        `);
    }

    function clearValidationMessages() {
        $("#photoValidation").empty();
    }

    // =================== FILE HANDLING ===================

    $("#photoUpload").on("change", async function (e) {
        const file = e.target.files[0];
        if (file) {
            const preview = $("#photoPreview");
            preview.show();
            preview.attr("src", URL.createObjectURL(file));
            await validatePhoto(file);
        } else {
            hidePhotoPreview();
        }
    });

    $("#medicalUpload").on("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            if (validateMedicalFile(file)) {
                $("#medicalPreview").show();
                $("#pdfName").text(file.name);
            } else {
                $(this).val(''); // Clear the input
                hideMedicalPreview();
            }
        } else {
            hideMedicalPreview();
        }
    });

    function hidePhotoPreview() {
        $("#photoPreview").hide().attr("src", "#");
    }

    function hideMedicalPreview() {
        $("#medicalPreview").hide();
        $("#pdfName").text("");
    }

    // =================== FORM SUBMISSION ===================

    $("#licenseForm").on("submit", async function (e) {
        e.preventDefault();
        showLoading(true);

        try {
            // Validate form data
            if (selectedVehicleClasses.length === 0) {
                throw new Error("Please select at least one vehicle class.");
            }

            const photoFile = $("#photoUpload")[0].files[0];
            if (!photoFile) {
                throw new Error("Please upload a passport photo.");
            }

            const isPhotoValid = await validatePhoto(photoFile);
            if (!isPhotoValid) {
                throw new Error("Please upload a valid passport photo.");
            }

            const medicalFile = $("#medicalUpload")[0].files[0];
            if (!medicalFile) {
                throw new Error("Please upload a medical certificate.");
            }

            if (!validateMedicalFile(medicalFile)) {
                throw new Error("Please upload a valid medical certificate.");
            }

            // Collect form data
            const applicationData = {
                licenseType: $("#licenseType").val(),
                examLanguage: $("#examLanguage").val(),
                nicNumber: $("#nicNumber").val(),
                bloodGroup: $("#bloodGroup").val(),
                dateOfBirth: $("#dateOfBirth").val(),
                phoneNumber: $("#phoneNumber").val(),
                address: $("#address").val()
            };

            // Submit application
            const response = await submitLicenseApplication(applicationData, photoFile, medicalFile);

            showLoading(false);
            Swal.fire({
                title: "Application Submitted Successfully!",
                html: `
                    <div class="text-start">
                        <p><strong>Application ID:</strong> ${response.id}</p>
                        <p><strong>License Type:</strong> ${applicationData.licenseType}</p>
                        <p><strong>Status:</strong> <span class="badge bg-warning">PENDING</span></p>
                        <p><strong>Next Steps:</strong> Your application will be reviewed by our team. You will receive notifications about the status updates.</p>
                    </div>
                `,
                icon: "success",
                background: "#1a1a1a",
                color: "#ffffff",
                confirmButtonText: "OK"
            });
            
            closeLicenseModal();
            
            // Refresh data
            loadDriverApplications();
            loadNotifications();

        } catch (error) {
            showLoading(false);
            let errorMessage = error.message || "Failed to submit application";
            
            // Include server error message if available
            if (error.response && error.response.message) {
                errorMessage += `: ${error.response.message}`;
            }
            
            console.error("Application submission error:", error);
            
            Swal.fire({
                title: "Application Submission Failed",
                text: errorMessage,
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff"
            });
        }
    });

    // =================== PAYMENT FUNCTIONS ===================

    // Payment function
    window.showPaymentForm = function () {
        // Check if user has pending applications
        loadDriverApplications()
            .then(applications => {
                const pendingApps = applications.filter(app => app.status === 'PENDING');
                
                if (pendingApps.length === 0) {
                    Swal.fire({
                        title: "No Pending Applications",
                        text: "You don't have any pending applications to pay for. Please submit an application first.",
                        icon: "info",
                        background: "#1a1a1a",
                        color: "#ffffff"
                    });
                    return;
                }

                // Show payment modal with application details
                showPaymentModal(pendingApps);
            })
            .catch(error => {
                Swal.fire({
                    title: "Error",
                    text: "Failed to check applications for payment.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            });
    };

    function showPaymentModal(applications) {
        const applicationsList = applications.map(app => {
            const vehicleClasses = app.vehicleClasses ? 
                app.vehicleClasses.map(v => v.code || v.value).join(', ') : 'N/A';
            const examFee = calculateExamFee(app.licenseType, app.vehicleClasses);
            
            return `
                <div class="payment-application-item" data-id="${app.id}">
                    <input type="radio" name="paymentApplication" value="${app.id}" id="app_${app.id}">
                    <label for="app_${app.id}" class="w-100 text-start">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>Application #${app.id}</strong><br>
                                <small>License Type: ${app.licenseType}</small><br>
                                <small>Vehicle Classes: ${vehicleClasses}</small>
                            </div>
                            <div class="text-end">
                                <strong>Rs. ${examFee}</strong>
                            </div>
                        </div>
                    </label>
                </div>
            `;
        }).join('');

        Swal.fire({
            title: 'Exam Fee Payment',
            html: `
                <div class="payment-modal-content">
                    <h6 class="mb-3">Select Application to Pay:</h6>
                    <div class="applications-list">
                        ${applicationsList}
                    </div>
                    <div class="payment-methods mt-4">
                        <h6>Payment Method:</h6>
                        <div class="form-check text-start">
                            <input class="form-check-input" type="radio" name="paymentMethod" id="card" value="card" checked>
                            <label class="form-check-label" for="card">
                                <i class="fas fa-credit-card me-2"></i>Credit/Debit Card
                            </label>
                        </div>
                        <div class="form-check text-start">
                            <input class="form-check-input" type="radio" name="paymentMethod" id="bank" value="bank">
                            <label class="form-check-label" for="bank">
                                <i class="fas fa-university me-2"></i>Bank Transfer
                            </label>
                        </div>
                        <div class="form-check text-start">
                            <input class="form-check-input" type="radio" name="paymentMethod" id="mobile" value="mobile">
                            <label class="form-check-label" for="mobile">
                                <i class="fas fa-mobile-alt me-2"></i>Mobile Payment
                            </label>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed to Payment',
            cancelButtonText: 'Cancel',
            background: '#1a1a1a',
            color: '#ffffff',
            width: '600px',
            preConfirm: () => {
                const selectedApp = $('input[name="paymentApplication"]:checked').val();
                const paymentMethod = $('input[name="paymentMethod"]:checked').val();
                
                if (!selectedApp) {
                    Swal.showValidationMessage('Please select an application to pay for');
                    return false;
                }
                
                return { applicationId: selectedApp, method: paymentMethod };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                processPayment(result.value);
            }
        });
    }

    function calculateExamFee(licenseType, vehicleClasses) {
        // Base fee calculation based on license type
        let baseFee = 3000;
        
        switch(licenseType) {
            case 'learner':
                baseFee = 2500;
                break;
            case 'restricted':
                baseFee = 3000;
                break;
            case 'full':
                baseFee = 4000;
                break;
            case 'heavy':
                baseFee = 6000;
                break;
            case 'commercial':
                baseFee = 7500;
                break;
            case 'international':
                baseFee = 5000;
                break;
            case 'motorcycle':
                baseFee = 3500;
                break;
            case 'special':
                baseFee = 8000;
                break;
            default:
                baseFee = 3000;
        }
        
        // Additional fee per vehicle class
        const additionalFee = vehicleClasses ? (vehicleClasses.length - 1) * 500 : 0;
        
        return baseFee + additionalFee;
    }

    function processPayment(paymentData) {
        showLoading(true);
        
        // Mock payment processing - replace with actual payment gateway integration
        setTimeout(() => {
            showLoading(false);
            
            // Simulate successful payment
            Swal.fire({
                title: "Payment Successful!",
                html: `
                    <div class="text-start">
                        <p><strong>Transaction ID:</strong> TXN${Date.now()}</p>
                        <p><strong>Application ID:</strong> ${paymentData.applicationId}</p>
                        <p><strong>Payment Method:</strong> ${paymentData.method.toUpperCase()}</p>
                        <p><strong>Status:</strong> <span class="badge bg-success">Paid</span></p>
                        <p class="mt-3">Your exam fee has been processed successfully. You will receive an exam date notification soon.</p>
                    </div>
                `,
                icon: "success",
                background: "#1a1a1a",
                color: "#ffffff",
                confirmButtonText: "OK"
            });
            
            // Refresh applications to show updated payment status
            loadDriverApplications();
            loadNotifications();
            
        }, 2000); // Simulate processing time
    }

    // =================== APPLICATION MANAGEMENT ===================

    // View application details
    window.viewApplicationDetails = function(applicationId) {
        showLoading(true);
        
        getApplicationById(applicationId)
            .then(application => {
                showLoading(false);
                showDetailedApplicationModal(application);
            })
            .catch(error => {
                showLoading(false);
                Swal.fire({
                    title: "Error",
                    text: "Failed to load application details.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            });
    };

    function showDetailedApplicationModal(application) {
        const statusBadgeClass = getStatusBadgeClass(application.status);
        // Handle vehicleClasses as array of strings
        const vehicleClasses = Array.isArray(application.vehicleClasses) ? 
            application.vehicleClasses.join(', ') : 'N/A';
        
        const examFee = calculateExamFee(application.licenseType, application.vehicleClasses);
        
        Swal.fire({
            title: `Application Details - #${application.id}`,
            html: `
                <div class="application-details text-start">
                    <div class="row">
                        <div class="col-md-6">
                            <h6><i class="fas fa-file-alt me-2"></i>Application Information</h6>
                            <p><strong>Status:</strong> <span class="badge bg-${statusBadgeClass}">${application.status}</span></p>
                            <p><strong>License Type:</strong> ${application.licenseType}</p>
                            <p><strong>Vehicle Classes:</strong> ${vehicleClasses}</p>
                            <p><strong>Exam Language:</strong> ${application.examLanguage}</p>
                            <p><strong>Exam Fee:</strong> Rs. ${examFee}</p>
                            <p><strong>Submitted:</strong> ${new Date(application.submittedDate).toLocaleDateString()}</p>
                        </div>
                        <div class="col-md-6">
                            <h6><i class="fas fa-user me-2"></i>Personal Information</h6>
                            <p><strong>NIC:</strong> ${application.nicNumber}</p>
                            <p><strong>Blood Group:</strong> ${application.bloodGroup}</p>
                            <p><strong>Date of Birth:</strong> ${new Date(application.dateOfBirth).toLocaleDateString()}</p>
                            <p><strong>Phone:</strong> ${application.phoneNumber}</p>
                            <p><strong>Address:</strong> ${application.address}</p>
                        </div>
                    </div>
                    ${application.rejectionReason ? `
                        <div class="rejection-reason mt-3 p-3" style="background-color: #2d1b1b; border-left: 4px solid #dc3545;">
                            <h6 class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Rejection Reason:</h6>
                            <p class="text-danger mb-0">${application.rejectionReason}</p>
                        </div>
                    ` : ''}
                    ${application.status === 'APPROVED' ? `
                        <div class="approval-info mt-3 p-3" style="background-color: #1b2d1b; border-left: 4px solid #28a745;">
                            <h6 class="text-success"><i class="fas fa-check-circle me-2"></i>Application Approved!</h6>
                            <p class="text-success mb-0">Your license will be ready for collection within 7 working days. You will receive a notification with collection details.</p>
                        </div>
                    ` : ''}
                    ${application.status === 'PENDING' ? `
                        <div class="pending-info mt-3 p-3" style="background-color: #2d2a1b; border-left: 4px solid #ffc107;">
                            <h6 class="text-warning"><i class="fas fa-clock me-2"></i>Application Under Review</h6>
                            <p class="text-warning mb-0">Your application is currently being reviewed. This process typically takes 3-5 business days.</p>
                        </div>
                    ` : ''}
                </div>
            `,
            width: '900px',
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonText: 'Close',
            showCancelButton: application.status === 'REJECTED',
            cancelButtonText: application.status === 'REJECTED' ? 'Reapply' : null,
            cancelButtonColor: '#28a745'
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel && application.status === 'REJECTED') {
                showLicenseForm();
            }
        });
    }

    function getStatusBadgeClass(status) {
        switch(status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'PENDING': return 'warning';
            case 'UNDER_REVIEW': return 'info';
            default: return 'secondary';
        }
    }

    // Check application status
    window.checkApplicationStatus = function(applicationId) {
        getApplicationById(applicationId)
            .then(application => {
                const statusMessage = getStatusMessage(application.status);
                Swal.fire({
                    title: "Application Status Update",
                    text: statusMessage,
                    icon: getStatusIcon(application.status),
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            })
            .catch(error => {
                Swal.fire({
                    title: "Error",
                    text: "Failed to check application status.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            });
    };

    function getStatusMessage(status) {
        switch(status) {
            case 'PENDING':
                return 'Your application is currently under review. We will notify you once it has been processed.';
            case 'APPROVED':
                return 'Congratulations! Your application has been approved. Your license will be ready for collection soon.';
            case 'REJECTED':
                return 'Unfortunately, your application has been rejected. Please check the rejection reason and reapply if necessary.';
            case 'UNDER_REVIEW':
                return 'Your application is currently being reviewed by our team.';
            default:
                return 'Application status is currently unavailable.';
        }
    }

    function getStatusIcon(status) {
        switch(status) {
            case 'APPROVED':
                return 'success';
            case 'REJECTED':
                return 'error';
            case 'PENDING':
            case 'UNDER_REVIEW':
                return 'info';
            default:
                return 'question';
        }
    }

    // =================== UTILITY FUNCTIONS ===================

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

    function showLoading(show) {
        if (show) {
            if ($("#loadingOverlay").length === 0) {
                $("body").append(`
                    <div id="loadingOverlay" class="loading-overlay" style="
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
                    ">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                    </div>
                `);
            }
        } else {
            $("#loadingOverlay").remove();
        }
    }

    function showAlert(title, message, type) {
        Swal.fire({
            title: title,
            text: message,
            icon: type,
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonColor: type === 'error' ? '#d33' : '#3085d6'
        });
    }

    // =================== INPUT FORMATTERS ===================

    // Phone number formatting for Sri Lankan numbers
    $("#phoneNumber").on("input", function (e) {
        let value = $(this).val().replace(/\D/g, "");
        
        // Remove country code if present
        if (value.startsWith("94")) {
            value = value.substring(2);
        }
        if (value.startsWith("0")) {
            value = value.substring(1);
        }
        
        // Format the number
        if (value.length > 0) {
            if (value.length <= 9) {
                value = "+94 " + value.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
            } else {
                value = "+94 " + value.substring(0, 9).replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
            }
        }
        
        $(this).val(value);
    });

    // NIC validation for Sri Lankan format
    $("#nicNumber").on("input", function (e) {
        let value = $(this).val().toUpperCase().replace(/[^A-Z0-9]/g, "");
        
        // Limit length based on NIC format (old: 9 digits + V, new: 12 digits)
        if (value.length > 12) {
            value = value.substring(0, 12);
        }
        
        $(this).val(value);
    });

    // Validate NIC format
    function validateNIC(nic) {
        const oldNICPattern = /^[0-9]{9}[VvXx]$/; // Old format: 123456789V
        const newNICPattern = /^[0-9]{12}$/;      // New format: 123456789012
        
        return oldNICPattern.test(nic) || newNICPattern.test(nic);
    }

    // Date validation
    $("#dateOfBirth").on("change", function (e) {
        const birthDate = new Date($(this).val());
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            Swal.fire({
                title: "Age Requirement Not Met",
                text: "You must be at least 18 years old to apply for a driving license.",
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff"
            });
            $(this).val("");
        } else if (age > 80) {
            Swal.fire({
                title: "Age Verification Required",
                text: "Applicants over 80 years may require additional medical clearance.",
                icon: "warning",
                background: "#1a1a1a",
                color: "#ffffff"
            });
        }
    });

    // =================== DASHBOARD FUNCTIONS ===================

    // Refresh dashboard data
    window.refreshDashboard = function() {
        showLoading(true);
        
        Promise.all([
            loadDriverApplications(),
            loadNotifications(),
            checkExistingLicense(),
            getPendingApplicationCount()
        ]).then(() => {
            showLoading(false);
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
            showLoading(false);
            Swal.fire({
                title: "Refresh Failed",
                text: "Some data could not be updated. Please try again.",
                icon: "warning",
                background: "#1a1a1a",
                color: "#ffffff"
            });
        });
    };

    // Search applications function
    window.searchApplications = function(params = {}) {
        return loadDriverApplications().then(applications => {
            let filteredApps = applications;
            
            if (params.status) {
                filteredApps = filteredApps.filter(app => app.status === params.status);
            }
            
            if (params.licenseType) {
                filteredApps = filteredApps.filter(app => app.licenseType === params.licenseType);
            }
            
            if (params.fromDate) {
                filteredApps = filteredApps.filter(app => 
                    new Date(app.submittedDate) >= new Date(params.fromDate)
                );
            }
            
            if (params.toDate) {
                filteredApps = filteredApps.filter(app => 
                    new Date(app.submittedDate) <= new Date(params.toDate)
                );
            }
            
            return filteredApps;
        });
    };

    // =================== EVENT HANDLERS ===================

    // Close modal when clicking outside
    $(window).on("click", function (event) {
        const modal = $("#licenseModal")[0];
        if (event.target == modal) {
            $(modal).hide();
            resetForm();
        }
    });

    // Logout function
    window.logout = function () {
        Swal.fire({
            title: 'Confirm Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            background: '#1a1a1a',
            color: '#ffffff'
        }).then((result) => {
            if (result.isConfirmed) {
                // Clear all authentication data
                localStorage.removeItem('smartreg_token');
                localStorage.removeItem('smartreg_user');
                sessionStorage.removeItem('smartreg_token');
                
                // Set logout flag
                localStorage.setItem('smartreg_logout', 'true');
                
                // Show logout success message
                Swal.fire({
                    title: 'Logged Out Successfully',
                    text: 'You have been logged out safely.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a1a',
                    color: '#ffffff'
                }).then(() => {
                    // Redirect to login page
                    window.location.href = "../index.html";
                });
            }
        });
    };

    // Toggle mobile menu
    $(".navbar-toggler").on("click", function () {
        $(".navbar-nav").toggleClass("show");
    });

    // Auto-refresh functionality
    let refreshInterval;

    function startAutoRefresh() {
        // Refresh notifications every 2 minutes
        refreshInterval = setInterval(() => {
            if (!document.hidden) {
                loadNotifications();
                getPendingApplicationCount().then(count => {
                    updateNotificationBadge(count);
                });
            }
        }, 2 * 60 * 1000);
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    }

    // Handle page visibility change
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Page became visible - refresh data
            loadNotifications();
            loadDriverApplications();
        }
    });

    // Handle browser beforeunload
    window.addEventListener('beforeunload', function() {
        stopAutoRefresh();
    });

    // =================== FORM VALIDATION HELPERS ===================

    function validateFormData() {
        const errors = [];
        
        // Validate required fields
        if (!$("#licenseType").val()) {
            errors.push("License type is required");
        }
        
        if (!$("#examLanguage").val()) {
            errors.push("Exam language is required");
        }
        
        if (selectedVehicleClasses.length === 0) {
            errors.push("At least one vehicle class must be selected");
        }
        
        const nicNumber = $("#nicNumber").val();
        if (!nicNumber) {
            errors.push("NIC number is required");
        } else if (!validateNIC(nicNumber)) {
            errors.push("Invalid NIC number format");
        }
        
        if (!$("#bloodGroup").val()) {
            errors.push("Blood group is required");
        }
        
        if (!$("#dateOfBirth").val()) {
            errors.push("Date of birth is required");
        }
        
        const phoneNumber = $("#phoneNumber").val();
        if (!phoneNumber) {
            errors.push("Phone number is required");
        } else if (phoneNumber.replace(/\D/g, "").length < 9) {
            errors.push("Invalid phone number format");
        }
        
        if (!$("#address").val().trim()) {
            errors.push("Address is required");
        }
        
        return errors;
    }

    // =================== HELPER FUNCTIONS ===================

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

    // =================== KEYBOARD SHORTCUTS ===================

    $(document).on('keydown', function(e) {
        // Ctrl/Cmd + R for refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshDashboard();
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            if ($("#licenseModal").is(':visible')) {
                closeLicenseModal();
            }
        }
    });

    // =================== ERROR HANDLING ===================

    function handleApiError(error, defaultMessage = "An error occurred") {
        console.error("API Error:", error);
        
        let errorMessage = defaultMessage;
        
        if (error.response && error.response.message) {
            errorMessage = error.response.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        return errorMessage;
    }

    // =================== INITIALIZATION ===================

    // Start auto-refresh
    startAutoRefresh();
    
    // Initialize the application
    initialize();

    // Log successful initialization
    console.log("Driver Dashboard initialized successfully");
    console.log("Current Driver ID:", currentDriverId);
    console.log("Current Driver Name:", currentDriverName);
});