function showModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function redirectToLogin() {
    window.location.href = "{% url 'admin_login' %}";
}

function checkPasswordStrength(password) {
    const lengthCriteria = /.{8,}/;
    const digitCriteria = /\d/;
    const lowercaseCriteria = /[a-z]/;
    const uppercaseCriteria = /[A-Z]/;

    if (password.match(lengthCriteria) && password.match(digitCriteria) && password.match(lowercaseCriteria) && password.match(uppercaseCriteria)) {
        return 'Strong';
    } else if (password.length >= 6) {
        return 'Medium';
    } else {
        return 'Weak';
    }
}

function validatePassword(password, confirmPassword) {
    if (password !== confirmPassword) {
        return 'Passwords do not match.';
    }

    const strength = checkPasswordStrength(password);
    if (strength === 'Weak') {
        return 'Your password is too weak. Please choose a stronger password.';
    }

    return null;
}

document.getElementById('password-setup-form')?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const form = event.target;
    const password = form.querySelector('input[name="new_password1"]').value;
    const confirmPassword = form.querySelector('input[name="new_password2"]').value;

    const validationError = validatePassword(password, confirmPassword);
    if (validationError) {
        document.getElementById('error-message').textContent = validationError;
        document.getElementById('error-message').classList.remove('d-none');
        return;
    }

    const securityData = JSON.parse(sessionStorage.getItem('security_answers') || '{}');
    const formData = new FormData(form);

    formData.append('security_questions', JSON.stringify(securityData.questions || []));
    formData.append('security_answers', JSON.stringify(securityData.answers || []));
    formData.append('new_password', password);

    showModal('loadingModal');

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
        });

        bootstrap.Modal.getInstance(document.getElementById('loadingModal')).hide();

        if (response.ok) {
            showModal('successModal');
            setTimeout(redirectToLogin, 2000);
        } else {
            const errorData = await response.json();
            document.getElementById('error-message').textContent = errorData.detail || "An error occurred.";
            document.getElementById('error-message').classList.remove('d-none');
        }
    } catch (error) {
        bootstrap.Modal.getInstance(document.getElementById('loadingModal')).hide();
        showModal('errorModal');
    }
});
