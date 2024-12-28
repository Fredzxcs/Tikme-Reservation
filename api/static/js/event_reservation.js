document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bookingForm');
    const phoneInput = document.getElementById('phoneNumber');
    const cancelButton = document.getElementById('cancelButton');

    // Phone number formatting
    phoneInput.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            // Here you would typically send the form data to a server
            console.log('Form submitted successfully');
            alert('Form submitted successfully!');
            form.reset();
        }
    });

    document.getElementById('cancelButton').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            // Reset the form
            const form = document.querySelector('form');
            if (form) form.reset();

            // Remove any existing error messages
            document.querySelectorAll('.error-message').forEach(el => el.remove());

            window.location.href = "/event_calendar/";

        }
    });
    

    function validateForm() {
        let isValid = true;

        // Reset previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // Validate required fields
        ['firstName', 'lastName', 'phoneNumber', 'email'].forEach(field => {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                showError(input, 'This field is required');
                isValid = false;
            }
        });

        // Validate email format
        const emailInput = document.getElementById('email');
        if (emailInput.value && !isValidEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }

        // Validate phone number format
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput.value && !isValidPhoneNumber(phoneInput.value)) {
            showError(phoneInput, 'Please enter a valid phone number');
            isValid = false;
        }

        // Validate package selection
        const packages = document.getElementsByName('package');
        if (!Array.from(packages).some(radio => radio.checked)) {
            showError(packages[0], 'Please select a package');
            isValid = false;
        }

        // Validate payment method selection
        const paymentMethods = document.getElementsByName('paymentMethod');
        if (!Array.from(paymentMethods).some(radio => radio.checked)) {
            showError(paymentMethods[0], 'Please select a payment method');
            isValid = false;
        }

        return isValid;
    }

    function showError(input, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '12px';
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhoneNumber(phone) {
        return /^$$\d{3}$$ \d{3}-\d{4}$/.test(phone);
    }
});

