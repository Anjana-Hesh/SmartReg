// signin.js
$(document).ready(function() {
    $("form").submit(function(e) {
        e.preventDefault();

        // Get input values
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();

        // Remove previous error messages and classes
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").remove();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let isValid = true;

        if (!email) {
            showError("#email", "Email is required");
            isValid = false;
        } else if (!emailRegex.test(email)) {
            showError("#email", "Please enter a valid email address");
            isValid = false;
        }

        if (!password) {
            showError("#password", "Password is required");
            isValid = false;
        } else if (password.length < 6) {
            showError("#password", "Password must be at least 6 characters");
            isValid = false;
        }

        if (isValid) {
            // Disable button during submission
            $("button[type='submit']").prop("disabled", true).html(`
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Logging in...
            `);

            // Simulate AJAX login (replace with actual AJAX call)
            setTimeout(() => {
                alert("Login successful!");
                // Reset form and button
                $("button[type='submit']").prop("disabled", false).text("Login");
                // window.location.href = "/dashboard"; // Redirect on success
            }, 1500);
        }
    });

    function showError(selector, message) {
        $(selector).addClass("is-invalid");
        $(selector).after(`<div class="invalid-feedback">${message}</div>`);
    }
});