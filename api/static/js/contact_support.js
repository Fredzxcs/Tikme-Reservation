document.getElementById('contactForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form from reloading the page

    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    // CSRF Token
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
        console.error('CSRF token not found. Cannot send the form.');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'CSRF token not found. Please refresh the page and try again.',
        });
        return;
    }

    // Prepare data
    const emailData = { name, email, phone, message };

    // Debug: Log data
    console.log('Sending data:', emailData);

    // Send data to backend
    fetch('/send_contact_email/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(emailData)
    })
        .then(response => {
            if (response.ok) {
                console.log('Email sent successfully.');
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Your message has been sent successfully.',
                });
                document.getElementById('contactForm').reset(); // Clear the form
            } else {
                return response.json().then(data => {
                    console.error('Failed to send email:', data);
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed',
                        text: data.error || 'Failed to send your message. Please try again later.',
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred. Please try again later.',
            });
        });
});

// Function to retrieve CSRF token from cookies
function getCSRFToken() {
    const name = 'csrftoken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return '';
}