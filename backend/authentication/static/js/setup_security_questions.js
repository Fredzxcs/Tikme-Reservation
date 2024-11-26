function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
    }
}

function clearError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = "";
        errorElement.classList.add('d-none');
    }
}

function validateSecurityAnswers(questions, answers) {
    const uniqueQuestions = new Set(questions);
    if (questions.length !== uniqueQuestions.size) {
        showError("Please choose different questions for each field.");
        return false;
    }
    if (answers.some(answer => answer.trim() === "")) {
        showError("Please answer all security questions.");
        return false;
    }
    return true;
}

function getUidb64() {
    const uidb64Field = document.querySelector('input[name="uidb64"]');
    if (uidb64Field) {
        return uidb64Field.value;
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uidb64') || "default-uidb64";
}

function submitSecurityAnswers(event) {
    event.preventDefault();

    const form = document.getElementById('security-questions-form');
    const questions = Array.from(form.querySelectorAll('select[name^="security_question"]')).map(field => field.value);
    const answers = Array.from(form.querySelectorAll('input[name^="security_answer"]')).map(input => input.value);

    if (!validateSecurityAnswers(questions, answers)) return;

    const token = document.querySelector('input[name="token"]').value;
    const uidb64 = getUidb64();

    if (!uidb64 || !token) {
        console.error("Invalid UID or token.");
        window.location.href = "/api-auth/invalid_link/";
        return;
    }

    // Save the security questions and answers in sessionStorage
    sessionStorage.setItem('security_answers', JSON.stringify({ questions, answers }));

    // Redirect to the password setup page
    window.location.href = `/api-auth/setup_password/${uidb64}/${token}/`;
}

document.getElementById('security-questions-form')?.addEventListener('submit', submitSecurityAnswers);
