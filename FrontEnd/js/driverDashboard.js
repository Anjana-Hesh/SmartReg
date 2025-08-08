$(document).ready(function () {
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
            {
                value: "C1",
                text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)",
            },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
            { value: "G1", text: "Class G1 - Agricultural Tractors" },
            { value: "G", text: "Class G - Heavy Agricultural Vehicles" },
        ],
        heavy: [
            {
                value: "C1",
                text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)",
            },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            {
                value: "CE",
                text: "Class CE - Articulated Heavy Goods Vehicles",
            },
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
            {
                value: "CE",
                text: "Class CE - Articulated Heavy Goods Vehicles",
            },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
            { value: "DE", text: "Class DE - Articulated Buses" },
        ],
        international: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            { value: "A", text: "Class A - Heavy Motorcycles (above 125cc)" },
            { value: "B1", text: "Class B1 - Light Motor Cars (up to 1000cc)" },
            { value: "B", text: "Class B - Motor Cars (above 1000cc)" },
            {
                value: "C1",
                text: "Class C1 - Light Goods Vehicles (3.5t - 7.5t)",
            },
            { value: "C", text: "Class C - Heavy Goods Vehicles (above 7.5t)" },
            { value: "D1", text: "Class D1 - Minibuses (9-16 seats)" },
            { value: "D", text: "Class D - Large Buses (above 16 seats)" },
        ],
        motorcycle: [
            { value: "A1", text: "Class A1 - Light Motorcycles (up to 125cc)" },
            {
                value: "A2",
                text: "Class A2 - Medium Motorcycles (125cc - 400cc)",
            },
            { value: "A", text: "Class A - Heavy Motorcycles (above 400cc)" },
            { value: "AM", text: "Class AM - Mopeds (up to 50cc)" },
            { value: "Q", text: "Class Q - Three Wheelers (Private)" },
        ],
        special: [
            {
                value: "F",
                text: "Class F - Emergency Vehicles (Ambulance, Fire)",
            },
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

    // Toggle mobile menu
    $(".navbar-toggler").on("click", function () {
        $(".navbar-nav").toggleClass("show");
    });

    // License Modal Functions
    window.showLicenseForm = function () {
        $("#licenseModal").show();
    };

    window.closeLicenseModal = function () {
        $("#licenseModal").hide();
        resetForm();
    };

    // Reset form function
    function resetForm() {
        $("#licenseForm")[0].reset();
        selectedVehicleClasses = [];
        updateSelectedVehicleClassesDisplay();
        clearValidationMessages();
        hidePhotoPreview();
        hideMedicalPreview();
    }

    // Close modal when clicking outside
    $(window).on("click", function (event) {
        const modal = $("#licenseModal")[0];
        if (event.target == modal) {
            $(modal).hide();
            resetForm();
        }
    });

    // License type change handler
    $("#licenseType").on("change", function () {
        const licenseType = $(this).val();
        const vehicleClassSelect = $("#vehicleClass");

        // Clear previous options
        vehicleClassSelect.empty();
        selectedVehicleClasses = [];
        updateSelectedVehicleClassesDisplay();

        if (licenseType && vehicleClassesByLicense[licenseType]) {
            // Populate vehicle classes based on license type
            $.each(
                vehicleClassesByLicense[licenseType],
                function (index, vehicleClass) {
                    vehicleClassSelect.append(
                        $("<option></option>")
                            .val(vehicleClass.value)
                            .text(vehicleClass.text)
                    );
                }
            );

            // Enable the select
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

            // Check if not already selected
            if (!selectedVehicleClasses.some((item) => item.value === value)) {
                selectedVehicleClasses.push({ value, text });
            }
        });

        // Clear selection in the select element
        $(this).val([]);

        updateSelectedVehicleClassesDisplay();
    });

    // Update selected vehicle classes display
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

    // Remove vehicle class
    window.removeVehicleClass = function (value) {
        selectedVehicleClasses = selectedVehicleClasses.filter(
            (item) => item.value !== value
        );
        updateSelectedVehicleClassesDisplay();
    };

    // Photo validation function
    function validatePhoto(file) {
        const validationDiv = $("#photoValidation");
        const maxSize = 2 * 1024 * 1024; // 2MB
        const minDimension = 300;
        const maxDimension = 2000;
        const aspectRatioTolerance = 0.1;

        // Clear previous validation
        validationDiv.empty();

        if (!file) return false;

        // Check file type
        if (!file.type.match(/image\/(jpeg|jpg|png)$/i)) {
            showValidationMessage(
                "photoValidation",
                "Please upload a JPEG or PNG image file.",
                "error"
            );
            return false;
        }

        // Check file size
        if (file.size > maxSize) {
            showValidationMessage(
                "photoValidation",
                "Photo size must be less than 2MB.",
                "error"
            );
            return false;
        }

        // Check image dimensions and quality
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                const width = this.naturalWidth;
                const height = this.naturalHeight;
                const aspectRatio = width / height;

                let errors = [];

                // Check dimensions
                if (width < minDimension || height < minDimension) {
                    errors.push(
                        `Minimum dimensions: ${minDimension}x${minDimension}px`
                    );
                }

                if (width > maxDimension || height > maxDimension) {
                    errors.push(
                        `Maximum dimensions: ${maxDimension}x${maxDimension}px`
                    );
                }

                // Check aspect ratio (should be close to square for passport photo)
                if (Math.abs(aspectRatio - 1) > aspectRatioTolerance) {
                    errors.push(
                        "Photo should be square or nearly square (passport photo format)"
                    );
                }

                // Check if image is too blurry (basic check)
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(this, 0, 0);

                if (errors.length > 0) {
                    showValidationMessage(
                        "photoValidation",
                        errors.join(". "),
                        "error"
                    );
                    resolve(false);
                } else {
                    showValidationMessage(
                        "photoValidation",
                        "Photo validation successful! Image quality is good.",
                        "success"
                    );
                    resolve(true);
                }
            };

            img.onerror = function () {
                showValidationMessage(
                    "photoValidation",
                    "Unable to load image. Please try another file.",
                    "error"
                );
                resolve(false);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Show validation message
    function showValidationMessage(containerId, message, type) {
        const container = $("#" + containerId);
        const className =
            type === "error" ? "validation-error" : "validation-success";
        const icon =
            type === "error"
                ? "fas fa-exclamation-triangle"
                : "fas fa-check-circle";

        container.html(`
    <div class="validation-message ${className}">
        <i class="${icon} me-2"></i>${message}
    </div>
    `);
    }

    // Clear validation messages
    function clearValidationMessages() {
        ["photoValidation"].forEach((id) => {
            $("#" + id).empty();
        });
    }

    // File Preview Functions
    $("#photoUpload").on("change", async function (e) {
        const file = e.target.files[0];
        if (file) {
            const preview = $("#photoPreview");
            preview.show();
            preview.attr("src", URL.createObjectURL(file));

            // Validate photo
            await validatePhoto(file);
        } else {
            hidePhotoPreview();
        }
    });

    $("#medicalUpload").on("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            const preview = $("#medicalPreview");
            const pdfName = $("#pdfName");
            preview.show();
            pdfName.text(file.name);
        } else {
            hideMedicalPreview();
        }
    });

    function hidePhotoPreview() {
        const preview = $("#photoPreview");
        preview.hide();
        preview.attr("src", "#");
    }

    function hideMedicalPreview() {
        $("#medicalPreview").hide();
    }

    // Form Submission
    $("#licenseForm").on("submit", function (e) {
        e.preventDefault();

        // Validate that at least one vehicle class is selected
        if (selectedVehicleClasses.length === 0) {
            alert("Please select at least one vehicle class.");
            return;
        }

        // Get form data
        const formData = {
            licenseType: $("#licenseType").val(),
            examLanguage: $("#examLanguage").val(),
            vehicleClasses: selectedVehicleClasses,
            nicNumber: $("#nicNumber").val(),
            dateOfBirth: $("#dateOfBirth").val(),
            phoneNumber: $("#phoneNumber").val(),
            address: $("#address").val(),
            photo: $("#photoUpload")[0].files[0],
            medical: $("#medicalUpload")[0].files[0],
        };

        // Simple validation
        if (
            !formData.licenseType ||
            !formData.examLanguage ||
            !formData.nicNumber ||
            !formData.dateOfBirth ||
            !formData.phoneNumber ||
            !formData.address ||
            !formData.photo ||
            !formData.medical
        ) {
            alert("Please fill in all required fields.");
            return;
        }

        // Show success message
        alert(`License application submitted successfully!

    License Type: ${formData.licenseType}
    Exam Language: ${formData.examLanguage}
    Vehicle Classes: ${selectedVehicleClasses.map((vc) => vc.value).join(", ")}
    NIC: ${formData.nicNumber}

    Your application will be reviewed within 5-7 business days.`);

        closeLicenseModal();
    });

    // Phone number formatting
    $("#phoneNumber").on("input", function (e) {
        let value = $(this).val().replace(/\D/g, "");
        if (value.startsWith("94")) {
            value = value.substring(2);
        }
        if (value.startsWith("0")) {
            value = value.substring(1);
        }
        if (value.length > 0) {
            value = "+94 " + value.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
        }
        $(this).val(value);
    });

    // NIC validation
    $("#nicNumber").on("input", function (e) {
        let value = $(this).val().toUpperCase();
        // Remove any non-alphanumeric characters
        value = value.replace(/[^A-Z0-9]/g, "");
        $(this).val(value);
    });

    // Date validation (must be 18+ years old)
    $("#dateOfBirth").on("change", function (e) {
        const birthDate = new Date($(this).val());
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        if (age < 18) {
            alert("You must be at least 18 years old to apply for a license.");
            $(this).val("");
        }
    });

    // Logout Function
    window.logout = function () {
        if (confirm("Are you sure you want to logout?")) {
            window.location.href = "../index.html";
        }
    };

    // Payment Function
    window.showPaymentForm = function () {
        alert(
            "Payment functionality will redirect to secure payment gateway."
        );
    };

    // Initialize form
    // Disable vehicle class select initially
    $("#vehicleClass").prop("disabled", true);

    // Set today's date as max for date of birth (18 years ago)
    const today = new Date();
    const eighteenYearsAgo = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    );
    $("#dateOfBirth").attr(
        "max",
        eighteenYearsAgo.toISOString().split("T")[0]
    );
});

$(document).ready(function () {
    // ... (keep all your existing vehicle classes data and initialization code)

    // Form Submission - Updated with AJAX
    $("#licenseForm").on("submit", function (e) {
        e.preventDefault();

        // Validate that at least one vehicle class is selected
        if (selectedVehicleClasses.length === 0) {
            showAlert("Error", "Please select at least one vehicle class.", "error");
            return;
        }

        // Create FormData object to handle file uploads
        const formData = new FormData();
        formData.append("licenseType", $("#licenseType").val());
        formData.append("examLanguage", $("#examLanguage").val());
        formData.append("vehicleClasses", JSON.stringify(selectedVehicleClasses));
        formData.append("nicNumber", $("#nicNumber").val());
        formData.append("dateOfBirth", $("#dateOfBirth").val());
        formData.append("phoneNumber", $("#phoneNumber").val());
        formData.append("address", $("#address").val());
        formData.append("photo", $("#photoUpload")[0].files[0]);
        formData.append("medical", $("#medicalUpload")[0].files[0]);

        // Show loading indicator
        showLoading(true);

        // AJAX request to backend
        $.ajax({
            url: "api/v1/notification",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                showLoading(false);
                if (response.success) {
                    showApplicationModal(response.data);
                } else {
                    showAlert("Error", response.message || "Submission failed", "error");
                }
            },
            error: function(xhr) {
                showLoading(false);
                showAlert("Error", xhr.responseJSON?.message || "Server error occurred", "error");
            }
        });
    });

    // Show application status modal
    function showApplicationModal(data) {
        const modalHtml = `
            <div class="modal fade" id="applicationModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Application #${data.applicationId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Application Details</h6>
                                    <p><strong>License Type:</strong> ${data.licenseType}</p>
                                    <p><strong>Vehicle Classes:</strong> ${data.vehicleClasses.map(v => v.value).join(', ')}</p>
                                    <p><strong>Status:</strong> <span class="badge bg-${getStatusBadgeClass(data.status)}">${data.status}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Documents</h6>
                                    <div class="document-preview mb-3">
                                        <img src="${data.photoUrl}" class="img-thumbnail" id="modalPhotoPreview">
                                    </div>
                                    <div class="document-actions">
                                        <a href="${data.medicalUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-file-pdf"></i> View Medical
                                        </a>
                                        ${data.status === 'PENDING' ? `
                                        <button class="btn btn-sm btn-success ms-2" onclick="approveMedical('${data.applicationId}')">
                                            <i class="fas fa-check"></i> Approve
                                        </button>
                                        <button class="btn btn-sm btn-danger ms-2" onclick="rejectMedical('${data.applicationId}')">
                                            <i class="fas fa-times"></i> Reject
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            ${data.status === 'APPROVED' ? `
                            <button class="btn btn-primary" onclick="proceedToPayment('${data.applicationId}')">
                                <i class="fas fa-credit-card"></i> Proceed to Payment
                            </button>
                            ` : ''}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inject modal into DOM
        $('body').append(modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('applicationModal'));
        modal.show();

        // Remove modal when closed
        $('#applicationModal').on('hidden.bs.modal', function () {
            $(this).remove();
        });
    }

    // Helper function to get badge class based on status
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'PENDING': return 'warning';
            default: return 'secondary';
        }
    }

    // Approve medical document
    window.approveMedical = function(applicationId) {
        updateMedicalStatus(applicationId, 'APPROVED');
    };

    // Reject medical document
    window.rejectMedical = function(applicationId) {
        updateMedicalStatus(applicationId, 'REJECTED');
    };

    // Update medical status
    function updateMedicalStatus(applicationId, status) {
        showLoading(true);
        $.ajax({
            url: `api/v1/notification/${applicationId}/status`,
            type: "PUT",
            contentType: "application/json",
            data: JSON.stringify({ status }),
            success: function(response) {
                showLoading(false);
                if (response.success) {
                    // Refresh the modal with updated status
                    $('#applicationModal').modal('hide');
                    showApplicationModal(response.data);
                    // Update notification badge
                    updateNotificationBadge();
                } else {
                    showAlert("Error", response.message || "Update failed", "error");
                }
            },
            error: function(xhr) {
                showLoading(false);
                showAlert("Error", xhr.responseJSON?.message || "Server error occurred", "error");
            }
        });
    }

    // Proceed to payment
    window.proceedToPayment = function(applicationId) {
        // Implement payment integration here
        $('#applicationModal').modal('hide');
        showPaymentForm(applicationId);
    };

    // Show payment form
    function showPaymentForm(applicationId) {
        // This would integrate with your payment gateway
        // For demo purposes, we'll show a confirmation
        showAlert("Payment", `Redirecting to payment for application ${applicationId}`, "info");

        // In a real implementation, you would:
        // 1. Get payment details from backend
        // 2. Initialize payment gateway
        // 3. Handle payment callback
    }

    // Update notification badge
    function updateNotificationBadge() {
        $.get("api/v1/notification/count", function(response) {
            if (response.success) {
                const count = response.data.count;
                $('.notification-badge').text(count);
                count > 0 ? $('.notification-badge').show() : $('.notification-badge').hide();
            }
        });
    }

    // Show loading indicator
    function showLoading(show) {
        if (show) {
            $('#loadingOverlay').show();
        } else {
            $('#loadingOverlay').hide();
        }
    }

    // Show alert message
    function showAlert(title, message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <strong>${title}</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        $('#alertsContainer').append(alertHtml);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').alert('close');
        }, 5000);
    }

    // Initialize notification badge on page load
    updateNotificationBadge();
});