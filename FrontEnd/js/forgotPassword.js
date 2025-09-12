 document.addEventListener('DOMContentLoaded', function () {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const submitBtn = document.getElementById('submitBtn');

    forgotPasswordForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();

      if (!email) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Please enter your email address.',
        });
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';

      try {
        const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: email, // <-- Sending raw string, not object
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to send OTP');
        }

        const result = await response.text();

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: result,
        });

      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Something went wrong!',
        });
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Get A Link';
      }
    });
  });