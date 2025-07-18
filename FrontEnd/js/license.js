// license.js

$(document).ready(function () {
    // Mock database
    const driverData = [
        {
            nic: "199812345678",
            name: "John Doe",
            address: "123 Main St, Colombo",
            contact: "0771234567",
            bloodGroup: "A+",
            medicalStatus: "Passed",
            issuedDate: "2022-05-10",
            expiryDate: "2026-05-10",
            image: "img/john.jpg",
            status: "Issued"
        },
        {
            nic: "200045678912",
            name: "Jane Smith",
            address: "456 Galle Rd, Galle",
            contact: "0765432109",
            bloodGroup: "O-",
            medicalStatus: "Pending",
            issuedDate: "",
            expiryDate: "",
            image: "img/jane.jpg",
            status: "Pending"
        }
    ];

    // NIC Search Form submit handler
    $('#searchForm').on('submit', function (e) {
        e.preventDefault();
        const nic = $('#nicInput').val().trim();

        if (!nic) {
            Swal.fire('Error', 'Please enter a NIC number.', 'error');
            return;
        }

        // Find driver in mock DB
        const person = driverData.find(d => d.nic === nic);

        if (person) {
            // Fill form fields
            $('#name').val(person.name);
            $('#type').val(person.status === 'Issued' ? "Full License" : "Learner's License");
            $('#vehicleClass').val("");  // You can extend mock data to include vehicleClass if needed
            $('#status').val(person.status === 'Issued' ? 'Active' : 'Pending');
            $('#expiry').val(person.expiryDate);
            $('#examDate').val(person.issuedDate);

            // Show photo preview or default
            if (person.image) {
                $('#photoPreview').attr('src', person.image).show();
            } else {
                $('#photoPreview').hide();
            }

            // Clear file inputs
            $('#photoUpload').val('');
            $('#medicalUpload').val('');
            $('#medicalPreview').hide();

            // Hide trial and retake dates on load
            $('#trialDateGroup').hide();
            $('#retakeDateGroup').hide();

            Swal.fire('Found', `Details found for NIC: ${nic}`, 'success');

        } else {
            Swal.fire({
                icon: 'warning',
                title: 'No Record Found',
                text: `No license record found for NIC: ${nic}`,
                showCancelButton: true,
                confirmButtonText: 'Create New',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Clear form for new entry
                    $('#name').val('');
                    $('#type').val('');
                    $('#vehicleClass').val('');
                    $('#status').val('Pending');
                    $('#expiry').val('');
                    $('#examDate').val('');
                    $('#trialDateGroup').hide();
                    $('#retakeDateGroup').hide();
                    $('#photoPreview').hide();
                    $('#photoUpload').val('');
                    $('#medicalUpload').val('');
                    $('#medicalPreview').hide();

                    Swal.fire('Ready', 'Please fill all the details.', 'info');
                }
            });
        }
    });

    // Photo upload preview
    $('#photoUpload').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#photoPreview').attr('src', e.target.result).show();
            };
            reader.readAsDataURL(file);
        }
    });

    // Medical PDF preview
    $('#medicalUpload').on('change', function () {
        const file = this.files[0];
        if (file && file.type === "application/pdf") {
            $('#pdfName').text(file.name);
            $('#medicalPreview').show();
        } else {
            $('#medicalPreview').hide();
            $('#pdfName').text('');
        }
    });

    // Exam marks input logic
    $('#examMarks').on('input', function () {
        const marks = $(this).val().trim().toUpperCase();

        // Hide both date groups initially
        $('#trialDateGroup').hide();
        $('#retakeDateGroup').hide();

        // If marks > 30 (assumed some logic)
        if (!isNaN(marks)) {
            const markNum = Number(marks);
            if (markNum > 30) {
                $('#trialDateGroup').show();
                $('#retakeDateGroup').hide();
            } else if (markNum <= 30 && markNum >= 0) {
                $('#trialDateGroup').hide();
                $('#retakeDateGroup').show();
            }
        } else {
            // For letter grades or invalid input, hide both
            $('#trialDateGroup').hide();
            $('#retakeDateGroup').hide();
        }
    });

    // Auto calculate expiry date = examDate + 5 years
    $('#examDate').on('change', function () {
        const examDateStr = $(this).val();
        if (examDateStr) {
            const examDate = new Date(examDateStr);
            examDate.setFullYear(examDate.getFullYear() + 5);
            const yyyy = examDate.getFullYear();
            let mm = examDate.getMonth() + 1;
            let dd = examDate.getDate();
            if (mm < 10) mm = '0' + mm;
            if (dd < 10) dd = '0' + dd;
            $('#expiry').val(`${yyyy}-${mm}-${dd}`);
        }
    });

    // License form submit
    $('#licenseForm').on('submit', function (e) {
        e.preventDefault();

        const nic = $('#nicInput').val().trim();
        const name = $('#name').val().trim();
        const type = $('#type').val();
        const vehicleClass = $('#vehicleClass').val().trim();
        const status = $('#status').val();
        const expiry = $('#expiry').val();
        const examDate = $('#examDate').val();

        if (!nic || !name || !type || !vehicleClass || !status || !expiry || !examDate) {
            Swal.fire('Error', 'Please fill all required fields.', 'error');
            return;
        }

        // Here you can add AJAX call to backend to save data

        Swal.fire('Success', 'License saved successfully!', 'success').then(() => {
            // Optional: clear form
            $('#searchForm')[0].reset();
            $('#licenseForm')[0].reset();
            $('#photoPreview').hide();
            $('#medicalPreview').hide();
            $('#trialDateGroup').hide();
            $('#retakeDateGroup').hide();
        });
    });
});
