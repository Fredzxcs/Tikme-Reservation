document.addEventListener("DOMContentLoaded", () => {
    const surveyForm = document.getElementById("surveyForm");
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Automatically set the current date in the date field
    const dateField = document.getElementById("date");
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    dateField.value = today;

    // Handle form submission
    surveyForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        const formData = new FormData(surveyForm);
        const data = {};

        // Convert form data to JSON format
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Validate the form before submission
        if (!validateForm(data)) {
            return;
        }

        // Submit the data to the backend
        fetch("/api/survey/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken, // Include CSRF token for security
            },
            body: JSON.stringify(data),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((err) => {
                        throw new Error(err.detail || "Failed to submit survey.");
                    });
                }
                return response.json();
            })
            .then((responseData) => {
                // Show success alert using SweetAlert2
                Swal.fire({
                    title: "Success",
                    text: responseData.detail || "Your survey has been submitted successfully!",
                    icon: "success",
                    confirmButtonText: "OK",
                }).then(() => {
                    // Reset the form after successful submission
                    surveyForm.reset();
                    dateField.value = today; // Reset the date field to the current date
                });
            })
            .catch((error) => {
                // Show error alert using SweetAlert2
                Swal.fire({
                    title: "Error",
                    text: error.message,
                    icon: "error",
                    confirmButtonText: "OK",
                });
            });
    });

    // Validation function for the form
    function validateForm(data) {
        const requiredFields = ["name", "email", "date"];

        // Check if all required fields are filled
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === "") {
                Swal.fire({
                    title: "Validation Error",
                    text: `The field "${field}" is required.`,
                    icon: "warning",
                    confirmButtonText: "OK",
                });
                return false;
            }
        }

        // Check if at least one rating is selected for each criteria
        const ratingCriteria = [
            "food_quality",
            "order_accuracy",
            "speed_of_service",
            "price",
            "ambiance",
            "cleanliness",
            "overall_experience",
        ];
        for (const criteria of ratingCriteria) {
            if (!data[criteria]) {
                Swal.fire({
                    title: "Validation Error",
                    text: `Please select a rating for "${criteria.replace(/_/g, " ")}".`,
                    icon: "warning",
                    confirmButtonText: "OK",
                });
                return false;
            }
        }

        return true;
    }

    // Handle "Go Back" button click
    const backButton = document.querySelector(".back-btn");
    backButton.addEventListener("click", () => {
        Swal.fire({
            title: "Go Back?",
            text: "Are you sure you want to leave this page? Your progress will be lost.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Go Back",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "/"; // Redirect to the homepage or previous page
            }
        });
    });
});
