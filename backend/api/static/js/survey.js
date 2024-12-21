
// Select the "Go Back" button
document.querySelector('.back-btn').addEventListener('click', function() {
    // Navigate to the specific URL
    window.location.href = '/';
});


document.addEventListener("DOMContentLoaded", () => {
    const surveyForm = document.getElementById("surveyForm");

    // Prevent duplicate IDs and ensure proper functionality
    const ratingSections = document.querySelectorAll(".rating-section tbody tr");

    ratingSections.forEach((row, index) => {
        const criteria = row.querySelector("td:first-child").textContent.trim().replace(/\s+/g, "_").toLowerCase();

        const inputs = row.querySelectorAll("input[type=radio]");
        const labels = row.querySelectorAll("label");

        inputs.forEach((input, i) => {
            const uniqueId = `${criteria}_rating_${i + 1}`;
            input.id = uniqueId;
            input.name = criteria;
            labels[i].setAttribute("for", uniqueId);
        });
    });

    // Handle form submission
    surveyForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent default form submission

        const formData = new FormData(surveyForm);
        const data = {};

        formData.forEach((value, key) => {
            if (!data[key]) {
                data[key] = value;
            } else {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            }
        });

        console.log("Survey Data:", data);

        // Placeholder: Submit the data to a server
        alert("Thank you for your feedback!");
        surveyForm.reset();
    });
});
