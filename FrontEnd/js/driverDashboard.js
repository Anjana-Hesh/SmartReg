$(document).ready(function () {
    // Configuration
    const API_BASE_URL = "http://localhost:8080/api/v1"; // Update with your backend URL
    
    // Get authentication data from localStorage
    const authToken = localStorage.getItem('smartreg_token') || sessionStorage.getItem('smartreg_token');
    const userData = JSON.parse(localStorage.getItem('smartreg_user') || '{}');
    const currentDriverId = userData.id;
    const currentDriverName = userData.fullName || userData.name;

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
            xhr.setRequestHeader('Content-Type', 'application/json');
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
        
        // Disable vehicle class select initially
        $("#vehicleClass").prop("disabled", true);

        // Set date constraints
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        $("#dateOfBirth").attr("max", eighteenYearsAgo.toISOString().split("T")[0]);

        // Load initial data
        Promise.all([
            loadDriverProfile(),
            loadDriverApplications(),
            loadNotifications(),
            checkExistingLicense()
        ]).finally(() => {
            showLoading(false);
        });
    }

    // =================== API FUNCTIONS ===================

    // Load driver profile data
    function loadDriverProfile() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/drivers/${currentDriverId}`,
                method: 'GET',
                success: function(data) {
                    currentDriverData = data;
                    updateDriverInfo(data);
                    resolve(data);
                },
                error: function(xhr, status, error) {
                    console.warn("Failed to load driver profile from API, using cached data");
                    // Fallback to localStorage data
                    $("#driverName").text(currentDriverName || "Driver");
                    resolve(userData);
                }
            });
        });
    }

    // Check if driver already has a license
    function checkExistingLicense() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/licenses/driver/${currentDriverId}`,
                method: 'GET',
                success: function(license) {
                    if (license && license.id) {
                        updateLicenseStatus("active", license);
                        updateLicenseCard(license);
                    } else {
                        updateLicenseStatus("pending");
                    }
                    resolve(license);
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 404) {
                        updateLicenseStatus("none");
                    } else {
                        updateLicenseStatus("pending");
                    }
                    resolve(null);
                }
            });
        });
    }

    // Load driver applications
    function loadDriverApplications() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/applications/driver/${currentDriverId}`,
                method: 'GET',
                success: function(applications) {
                    updateApplicationsInfo(applications);
                    resolve(applications);
                },
                error: function(xhr, status, error) {
                    console.error("Failed to load applications:", error);
                    resolve([]);
                }
            });
        });
    }

    // Load notifications
    function loadNotifications() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/notifications/driver/${currentDriverId}`,
                method: 'GET',
                data: { limit: 10, offset: 0 },
                success: function(data) {
                    renderNotifications(data.notifications || data);
                    updateNotificationBadge(data.unreadCount || 0);
                    resolve(data);
                },
                error: function(xhr, status, error) {
                    console.error("Failed to load notifications:", error);
                    showDefaultNotifications();
                    resolve([]);
                }
            });
        });
    }

    // Submit license application
    function submitLicenseApplication(formData) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/applications`,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
                    // Remove Content-Type header for file uploads
                    xhr.setRequestHeader('Content-Type', undefined);
                },
                success: function(response) {
                    resolve(response);
                },
                error: function(xhr, status, error) {
                    reject({
                        status: xhr.status,
                        message: xhr.responseJSON?.message || "Failed to submit application",
                        error: error
                    });
                }
            });
        });
    }

    // Update driver profile
    function updateDriverProfile(profileData) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/drivers/${currentDriverId}`,
                method: 'PUT',
                data: JSON.stringify(profileData),
                success: function(response) {
                    // Update localStorage with new data
                    const updatedUserData = { ...userData, ...profileData };
                    localStorage.setItem('smartreg_user', JSON.stringify(updatedUserData));
                    resolve(response);
                },
                error: function(xhr, status, error) {
                    reject({
                        status: xhr.status,
                        message: xhr.responseJSON?.message || "Failed to update profile",
                        error: error
                    });
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

    // Search applications
    function searchApplications(searchParams) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `${API_BASE_URL}/applications/search`,
                method: 'GET',
                data: {
                    driverId: currentDriverId,
                    ...searchParams
                },
                success: function(applications) {
                    resolve(applications);
                },
                error: function(xhr, status, error) {
                    reject({
                        status: xhr.status,
                        message: xhr.responseJSON?.message || "Failed to search applications",
                        error: error
                    });
                }
            });
        });
    }

    // Mark notification as read
    function markNotificationAsRead(notificationId) {
        return $.ajax({
            url: `${API_BASE_URL}/notifications/${notificationId}/read`,
            method: 'PUT'
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
        const licenseCard = $(".license-info-card");
        
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

    function updateLicenseCard(licenseData) {
        const cardContent = $(".license-info-card .card-content");
        if (licenseData) {
            cardContent.html(`
                <p><strong>License Number:</strong> ${licenseData.licenseNumber}</p>
                <p><strong>Type:</strong> ${licenseData.licenseType}</p>
                <p><strong>Valid Until:</strong> ${new Date(licenseData.expiryDate).toLocaleDateString()}</p>
                <p><strong>Vehicle Classes:</strong> ${licenseData.vehicleClasses.map(v => v.code).join(', ')}</p>
                <button class="btn-card" onclick="downloadLicense('${licenseData.id}')">
                    <i class="fas fa-download me-1"></i> Download License
                </button>
            `);
        }
    }

    function updateApplicationsInfo(applications) {
        // Update pending applications count
        const pendingCount = applications.filter(app => app.status === 'PENDING').length;
        updateNotificationBadge(pendingCount);
        
        // You can add more application-specific UI updates here
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
            
            // Add click handler to mark as read
            item.on('click', function() {
                if (!notification.isRead) {
                    markNotificationAsRead(notification.id);
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
        if (count > 0) {
            badge.text(count).show();
        } else {
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
            $("#medicalPreview").show();
            $("#pdfName").text(file.name);
        } else {
            hideMedicalPreview();
        }
    });

    function hidePhotoPreview() {
        $("#photoPreview").hide().attr("src", "#");
    }

    function hideMedicalPreview() {
        $("#medicalPreview").hide();
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

            // Create FormData
            const formData = new FormData();
            formData.append("photo", photoFile);
            formData.append("medical", medicalFile);
            
            // Add application data
            const applicationData = {
                driverId: currentDriverId,
                licenseType: $("#licenseType").val(),
                examLanguage: $("#examLanguage").val(),
                vehicleClasses: selectedVehicleClasses,
                nicNumber: $("#nicNumber").val(),
                bloodGroup: $("#bloodGroup").val(),
                dateOfBirth: $("#dateOfBirth").val(),
                phoneNumber: $("#phoneNumber").val(),
                address: $("#address").val()
            };

            formData.append("application", new Blob([JSON.stringify(applicationData)], { type: "application/json" }));

            // Submit application
            const response = await submitLicenseApplication(formData);
            
            showLoading(false);
            Swal.fire({
                title: "Success",
                text: "Application submitted successfully!",
                icon: "success",
                background: "#1a1a1a",
                color: "#ffffff"
            });
            
            // Show application details modal
            showApplicationModal(response);
            closeLicenseModal();
            
            // Refresh data
            loadDriverApplications();
            loadNotifications();

        } catch (error) {
            showLoading(false);
            Swal.fire({
                title: "Error",
                text: error.message || "Failed to submit application",
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff"
            });
        }
    });

    // =================== UTILITY FUNCTIONS ===================

    function showApplicationModal(applicationData) {
        Swal.fire({
            title: `Application #${applicationData.id || applicationData.applicationId}`,
            html: `
                <div class="text-start">
                    <h6>Application Details</h6>
                    <p><strong>License Type:</strong> ${applicationData.licenseType}</p>
                    <p><strong>Vehicle Classes:</strong> ${applicationData.vehicleClasses?.map(v => v.value || v.code).join(', ')}</p>
                    <p><strong>Status:</strong> <span class="badge bg-warning">${applicationData.status || 'PENDING'}</span></p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'OK',
            background: '#1a1a1a',
            color: '#ffffff'
        });
    }

    function getStatusBadgeClass(status) {
        switch(status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'PENDING': return 'warning';
            default: return 'secondary';
        }
    }

    function handleUnauthorized() {
        localStorage.removeItem('smartreg_token');
        localStorage.removeItem('smartreg_user');
        sessionStorage.removeItem('smartreg_token');
        
        Swal.fire({
            title: "Session Expired",
            text: "Please login again to continue",
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
            $("body").append('<div id="loadingOverlay" class="loading-overlay"><div class="spinner-border text-primary"></div></div>');
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

    // Phone number formatting
    $("#phoneNumber").on("input", function (e) {
        let value = $(this).val().replace(/\D/g, "");
        if (value.startsWith("94")) value = value.substring(2);
        if (value.startsWith("0")) value = value.substring(1);
        if (value.length > 0) {
            value = "+94 " + value.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
        }
        $(this).val(value);
    });

    // NIC validation
    $("#nicNumber").on("input", function (e) {
        let value = $(this).val().toUpperCase().replace(/[^A-Z0-9]/g, "");
        $(this).val(value);
    });

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
                title: "Age Requirement",
                text: "You must be at least 18 years old to apply for a license.",
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff"
            });
            $(this).val("");
        }
    });

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
                // Clear all authentication data
                localStorage.removeItem('smartreg_token');
                localStorage.removeItem('smartreg_user');
                sessionStorage.removeItem('smartreg_token');
                
                // Set logout flag
                localStorage.setItem('smartreg_logout', 'true');
                
                // Show logout success message
                Swal.fire({
                    title: 'Logged Out',
                    text: 'You have been successfully logged out.',
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

    // Payment function
    window.showPaymentForm = function () {
        // Check if user has pending applications
        searchApplications({ status: 'PENDING' })
            .then(applications => {
                if (applications.length === 0) {
                    Swal.fire({
                        title: "No Pending Applications",
                        text: "You don't have any pending applications to pay for.",
                        icon: "info",
                        background: "#1a1a1a",
                        color: "#ffffff"
                    });
                    return;
                }

                // Show payment modal with application details
                showPaymentModal(applications);
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
        const applicationsList = applications.map(app => `
            <div class="payment-application-item" data-id="${app.id}">
                <input type="radio" name="paymentApplication" value="${app.id}" id="app_${app.id}">
                <label for="app_${app.id}">
                    <strong>Application #${app.id}</strong><br>
                    License Type: ${app.licenseType}<br>
                    Amount: Rs. ${app.examFee || '5000'}
                </label>
            </div>
        `).join('');

        Swal.fire({
            title: 'Exam Payment',
            html: `
                <div class="payment-modal-content">
                    <h6>Select Application to Pay:</h6>
                    ${applicationsList}
                    <div class="payment-methods mt-3">
                        <h6>Payment Method:</h6>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="paymentMethod" id="card" value="card" checked>
                            <label class="form-check-label" for="card">Credit/Debit Card</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="paymentMethod" id="bank" value="bank">
                            <label class="form-check-label" for="bank">Bank Transfer</label>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Proceed to Payment',
            background: '#1a1a1a',
            color: '#ffffff',
            preConfirm: () => {
                const selectedApp = $('input[name="paymentApplication"]:checked').val();
                const paymentMethod = $('input[name="paymentMethod"]:checked').val();
                
                if (!selectedApp) {
                    Swal.showValidationMessage('Please select an application');
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

    function processPayment(paymentData) {
        showLoading(true);
        
        // In a real application, this would integrate with a payment gateway
        $.ajax({
            url: `${API_BASE_URL}/payments/process`,
            method: 'POST',
            data: JSON.stringify({
                applicationId: paymentData.applicationId,
                driverId: currentDriverId,
                paymentMethod: paymentData.method,
                amount: 5000 // This should come from the application
            }),
            success: function(response) {
                showLoading(false);
                Swal.fire({
                    title: "Payment Successful",
                    text: "Your exam fee has been paid successfully!",
                    icon: "success",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
                loadDriverApplications(); // Refresh applications
            },
            error: function(xhr, status, error) {
                showLoading(false);
                Swal.fire({
                    title: "Payment Failed",
                    text: "Payment processing failed. Please try again.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            }
        });
    }

    // Download license function
    window.downloadLicense = function(licenseId) {
        showLoading(true);
        
        $.ajax({
            url: `${API_BASE_URL}/licenses/${licenseId}/download`,
            method: 'GET',
            xhrFields: {
                responseType: 'blob'
            },
            success: function(blob) {
                showLoading(false);
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `license_${licenseId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                Swal.fire({
                    title: "Success",
                    text: "License downloaded successfully!",
                    icon: "success",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            },
            error: function(xhr, status, error) {
                showLoading(false);
                Swal.fire({
                    title: "Download Failed",
                    text: "Failed to download license. Please try again.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            }
        });
    };

    // Search applications function
    window.searchApplications = function(params = {}) {
        return searchApplications({
            status: params.status,
            licenseType: params.licenseType,
            fromDate: params.fromDate,
            toDate: params.toDate,
            ...params
        });
    };

    // Refresh dashboard data
    window.refreshDashboard = function() {
        showLoading(true);
        
        Promise.all([
            loadDriverProfile(),
            loadDriverApplications(),
            loadNotifications(),
            checkExistingLicense()
        ]).then(() => {
            showLoading(false);
            Swal.fire({
                title: "Success",
                text: "Dashboard refreshed successfully!",
                icon: "success",
                background: "#1a1a1a",
                color: "#ffffff"
            });
        }).catch(error => {
            showLoading(false);
            Swal.fire({
                title: "Error",
                text: "Failed to refresh dashboard data.",
                icon: "error",
                background: "#1a1a1a",
                color: "#ffffff"
            });
        });
    };

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
        const vehicleClasses = application.vehicleClasses?.map(v => v.code || v.value).join(', ') || 'N/A';
        
        Swal.fire({
            title: `Application #${application.id}`,
            html: `
                <div class="application-details">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Application Information</h6>
                            <p><strong>Status:</strong> <span class="badge bg-${statusBadgeClass}">${application.status}</span></p>
                            <p><strong>License Type:</strong> ${application.licenseType}</p>
                            <p><strong>Vehicle Classes:</strong> ${vehicleClasses}</p>
                            <p><strong>Exam Language:</strong> ${application.examLanguage}</p>
                            <p><strong>Submitted Date:</strong> ${new Date(application.submittedDate).toLocaleDateString()}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Personal Information</h6>
                            <p><strong>NIC:</strong> ${application.nicNumber}</p>
                            <p><strong>Blood Group:</strong> ${application.bloodGroup}</p>
                            <p><strong>Date of Birth:</strong> ${new Date(application.dateOfBirth).toLocaleDateString()}</p>
                            <p><strong>Phone:</strong> ${application.phoneNumber}</p>
                        </div>
                    </div>
                    ${application.rejectionReason ? `
                        <div class="rejection-reason mt-3">
                            <h6 class="text-danger">Rejection Reason:</h6>
                            <p class="text-danger">${application.rejectionReason}</p>
                        </div>
                    ` : ''}
                    ${application.status === 'APPROVED' ? `
                        <div class="approval-info mt-3">
                            <h6 class="text-success">Approval Information:</h6>
                            <p>Your license will be ready for collection within 7 working days.</p>
                        </div>
                    ` : ''}
                </div>
            `,
            width: '800px',
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonText: 'Close'
        });
    }

    // Check application status
    window.checkApplicationStatus = function(applicationId) {
        getApplicationById(applicationId)
            .then(application => {
                const statusMessage = getStatusMessage(application.status);
                Swal.fire({
                    title: "Application Status",
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

    // Update profile function (if you have a profile update form)
    window.updateProfile = function(profileData) {
        showLoading(true);
        
        updateDriverProfile(profileData)
            .then(response => {
                showLoading(false);
                Swal.fire({
                    title: "Success",
                    text: "Profile updated successfully!",
                    icon: "success",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
                loadDriverProfile(); // Refresh profile data
            })
            .catch(error => {
                showLoading(false);
                Swal.fire({
                    title: "Error",
                    text: error.message || "Failed to update profile.",
                    icon: "error",
                    background: "#1a1a1a",
                    color: "#ffffff"
                });
            });
    };

    // Toggle mobile menu
    $(".navbar-toggler").on("click", function () {
        $(".navbar-nav").toggleClass("show");
    });

    // Auto-refresh notifications every 5 minutes
    setInterval(() => {
        loadNotifications();
    }, 5 * 60 * 1000);

    // Auto-refresh applications every 10 minutes
    setInterval(() => {
        loadDriverApplications();
    }, 10 * 60 * 1000);

    // Handle page visibility change to refresh data when page becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadNotifications();
            loadDriverApplications();
        }
    });

    // Initialize the application
    initialize();
});