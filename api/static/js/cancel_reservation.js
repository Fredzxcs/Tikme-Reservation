document.addEventListener("DOMContentLoaded", function () {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const successMessage = document.getElementById("success");
  const progressBar = document.getElementById("progressBar");

  const reservationForm = document.getElementById("reservationForm");
  const reservationCodeInput = document.getElementById("reservationCode");
  const emailInput = document.getElementById("email");
  const reservationCodeError = document.getElementById("reservationCodeError");
  const emailError = document.getElementById("emailError");

  const verifyOtpBtn = document.getElementById("verifyOtp");
  const confirmCancelBtn = document.getElementById("confirmCancel");
  const resendOtpBtn = document.getElementById("resendOtp"); // Resend OTP button

  let otpCode = "";  // Declare otpCode globally to store the OTP
  let countdown = 30;  // 30 seconds cooldown
  let countdownInterval;

  // Get the CSRF token from the HTML template
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

  // Step 1: Validate and send OTP
  reservationForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Reset errors
      reservationCodeError.textContent = "";
      emailError.textContent = "";

      let valid = true;

      if (reservationCodeInput.value.trim() === "") {
          reservationCodeError.textContent = "Reference code is required.";
          valid = false;
      }

      if (!emailInput.value.match(/^\S+@\S+\.\S+$/)) {
          emailError.textContent = "Enter a valid email address.";
          valid = false;
      }

      if (!valid) return;

      // Send data to the server for OTP generation and email sending
      fetch('/send-otp/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,  // Add CSRF token to the headers
          },
          body: JSON.stringify({
              reference_code: reservationCodeInput.value.trim(),
              email_address: emailInput.value.trim(), // Ensure 'email_address' is being used here
          }),
      })
      .then(response => response.json())
      .then(data => {
          if (data.detail) {
              Swal.fire("Invalid Details", data.detail, "error");
          } else {
              // Simulate sending OTP
              Swal.fire("OTP Sent!", "A verification code has been sent to your email.", "success");

              // Move to Step 2
              step1.classList.add("d-none");
              step2.classList.remove("d-none");
              progressBar.style.width = "66%";
          }
      })
      .catch(error => {
          console.error("Error:", error);
          Swal.fire("Error", "An error occurred. Please try again.", "error");
      });
  });

  // Step 2: Verify OTP
  verifyOtpBtn.addEventListener("click", function () {
    const otpInputs = document.querySelectorAll(".otp-input");
    otpCode = Array.from(otpInputs).map(input => input.value.trim()).join("");

    if (otpCode.length !== 6) {
        Swal.fire("Invalid OTP", "Please enter the full 6-digit code.", "error");
        return;
    }

    Swal.fire("OTP Verified!", "Your OTP has been confirmed.", "success");

    // Move to Step 3
    step2.classList.add("d-none");
    step3.classList.remove("d-none");
    progressBar.style.width = "100%";
  });


  // Resend OTP functionality
  resendOtpBtn.addEventListener("click", function () {
      if (resendOtpBtn.disabled) {
          return; // Do nothing if the button is disabled
      }

      // Disable the button and start the countdown
      resendOtpBtn.disabled = true;
      resendOtpBtn.style.backgroundColor = "#cccccc";  // Set to gray color
      resendOtpBtn.textContent = `Resend in ${countdown} seconds`;

      // Start countdown
      countdownInterval = setInterval(function () {
          countdown--;
          resendOtpBtn.textContent = `Resend in ${countdown} seconds`;

          // If countdown reaches zero, enable the button again
          if (countdown <= 0) {
              clearInterval(countdownInterval);
              resendOtpBtn.disabled = false;
              resendOtpBtn.style.backgroundColor = "";  // Restore original color
              resendOtpBtn.textContent = "Resend OTP";  // Reset the text
              countdown = 30;  // Reset countdown for next click
          }
      }, 1000);

      // Send data again to the server for OTP generation and resend
      fetch('/send-otp/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,  // Add CSRF token to the headers
          },
          body: JSON.stringify({
              reference_code: reservationCodeInput.value.trim(),
              email_address: emailInput.value.trim(),
          }),
      })
      .then(response => response.json())
      .then(data => {
          if (data.detail) {
              Swal.fire("Invalid Details", data.detail, "error");
          } else {
              // Simulate sending OTP again
              Swal.fire("OTP Resent!", "A new verification code has been sent to your email.", "success");
          }
      })
      .catch(error => {
          console.error("Error:", error);
          Swal.fire("Error", "An error occurred. Please try again.", "error");
      });
  });

   // Ensure otpCode is passed correctly when cancelling
  confirmCancelBtn.addEventListener("click", function () {
    Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, cancel it!",
        cancelButtonText: "No, keep it"
    }).then((result) => {
        if (result.isConfirmed) {
            console.log("Sending cancellation with the following data:");
            console.log({
                reference_code: reservationCodeInput.value.trim(),
                otp: otpCode, // Ensure otpCode is captured
                email_address: emailInput.value.trim(),
            });

            let cancelUrl = '';
            if (reservationCodeInput.value.trim().startsWith("RES")) {
                cancelUrl = `/cancel/dinein/${reservationCodeInput.value.trim()}/`;
            } else if (reservationCodeInput.value.trim().startsWith("EVT")) {
                cancelUrl = `/cancel/event/${reservationCodeInput.value.trim()}/`;
            }

            if (cancelUrl) {
                fetch(cancelUrl, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({
                        reference_code: reservationCodeInput.value.trim(),
                        otp: otpCode, // ✅ Ensure OTP is passed here
                        email_address: emailInput.value.trim(),
                    }),
                })
                .then(response => {
                    console.log("Response status: ", response.status);
                    return response.json();
                })
                .then(data => {
                    if (data.detail) {
                        Swal.fire("Error", data.detail, "error");
                    } else {
                        Swal.fire("Reservation Canceled", "Your reservation has been successfully canceled.", "success");

                        step3.classList.add("d-none");
                        successMessage.classList.remove("d-none");
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    Swal.fire("Error", "An error occurred. Please try again.", "error");
                });
            } else {
                Swal.fire("Invalid Reference", "The reference code is invalid for cancellation.", "error");
            }
        }
    });
  });
});