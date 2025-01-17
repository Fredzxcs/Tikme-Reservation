document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("bookingForm");
    const cancelButton = document.getElementById("cancelButton");
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Venue capacities and corresponding IDs
    const venueCapacities = {
        "Violeta": { id: 1, capacity: 80 },
        "Sampaguita": { id: 2, capacity: 70 },
        "Rosas": { id: 3, capacity: 80 },
        "Rosas Extension": { id: 4, capacity: 25 },
        "Lounge": { id: 5, capacity: 20 },
        "Bougainvillea Balcony": { id: 6, capacity: 25 },
        "African Talisay Trellis": { id: 7, capacity: 120 },
        "Private Room": { id: 8, capacity: 30 },
        "Royal Cafe": { id: 9, capacity: 15 },
    };

    // Package prices and corresponding IDs
    const packageDetails = {
        "Silver": { id: 1, price: 500 },
        "Gold": { id: 2, price: 700 },
        "Diamond": { id: 3, price: 900 },
    };

    // Selected event details from URL
    const params = new URLSearchParams(window.location.search);
    const selectedDate = params.get("date");
    const selectedPlace = params.get("place");
    const selectedTimeSlot = params.get("time");

    // Format the date to `YYYY-MM-DD`
    const formattedDate = selectedDate ? new Date(selectedDate).toISOString().split("T")[0] : null;

    // Convert 12-hour time format to 24-hour time format
    const convertTo24HourFormat = (time12h) => {
        const [time, modifier] = time12h.split(/(am|pm)/i);
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier.toLowerCase() === "pm" && hours !== 12) {
            hours += 12;
        }
        if (modifier.toLowerCase() === "am" && hours === 12) {
            hours = 0;
        }
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
    };

    const formattedTimeSlot = selectedTimeSlot ? convertTo24HourFormat(selectedTimeSlot) : null;

    // Check if selected details exist
    if (formattedDate && selectedPlace && formattedTimeSlot) {
        document.getElementById("selectedDate").textContent = new Date(selectedDate).toDateString();
        document.getElementById("selectedPlace").textContent = selectedPlace;
        document.getElementById("selectedTimeSlot").textContent = selectedTimeSlot;
    } else {
        Swal.fire("Error", "Missing event details. Please return to the calendar.", "error").then(() => {
            window.location.href = "/event-calendar/";
        });
        return;
    }

    const selectedVenueDetails = venueCapacities[selectedPlace];
    if (!selectedVenueDetails) {
        Swal.fire("Error", "Invalid venue selected. Please return to the calendar.", "error").then(() => {
            window.location.href = "/event-calendar/";
        });
        return;
    }

    // Calculate total cost
    const calculateTotalCost = () => {
        const guests = parseInt(document.getElementById("guests").value) || 0;
        const packageSelected = document.querySelector('input[name="package"]:checked');
        if (!packageSelected) {
            return 0;
        }

        const packageName = packageSelected.value;
        const packagePrice = packageDetails[packageName]?.price || 0;
        return guests * packagePrice;
    };

    // Update total cost in the UI
    const updateTotalCost = () => {
        const totalCost = calculateTotalCost();
        document.getElementById("totalCost").textContent = `Total Cost: PHP ${totalCost.toLocaleString()}`;
    };

    // Add event listeners to calculate total dynamically
    document.getElementById("guests").addEventListener("input", updateTotalCost);
    document.querySelectorAll('input[name="package"]').forEach(radio => {
        radio.addEventListener("change", updateTotalCost);
    });

    // Form submission
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        Swal.fire({
            title: "Confirm Booking",
            html: `
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Place:</strong> ${selectedPlace}</p>
                <p><strong>Time:</strong> ${formattedTimeSlot}</p>
                <p><strong>Total Cost:</strong> PHP ${calculateTotalCost().toLocaleString()}</p>
            `,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Submit",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                const formData = new FormData(form);
                formData.append("reservation_date", formattedDate);
                formData.append("reservation_time", formattedTimeSlot);
                formData.append("venue_id", selectedVenueDetails.id);

                // Add package ID
                const selectedPackage = document.querySelector('input[name="package"]:checked');
                if (selectedPackage) {
                    formData.append("package_id", packageDetails[selectedPackage.value].id);
                }

                fetch("/api/event-reservation/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                    body: formData,
                })
                    .then((response) => {
                        if (!response.ok) {
                            return response.json().then((data) => {
                                throw new Error(data.detail || "Failed to submit reservation.");
                            });
                        }
                        return response.json();
                    })
                    .then((data) => {
                        Swal.fire("Success", "Your reservation has been confirmed. A confirmation email has been sent.", "success").then(() => {
                            window.location.href = "/event-calendar/";
                        });
                    })
                    .catch((error) => {
                        Swal.fire("Error", error.message, "error");
                    });
            }
        });
    });

    // Cancel button functionality
    cancelButton.addEventListener("click", () => {
        Swal.fire({
            title: "Cancel Booking",
            text: "Are you sure you want to cancel? All entered data will be lost.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Cancel",
            cancelButtonText: "No",
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "/event-calendar/";
            }
        });
    });

    // Form validation
    const validateForm = () => {
        let isValid = true;

        // Clear error messages
        document.querySelectorAll(".error-message").forEach((el) => el.remove());

        // Validate required fields
        ["firstName", "lastName", "phoneNumber", "email", "guests", "parking"].forEach((field) => {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                showError(input, "This field is required");
                isValid = false;
            }
        });

        // Validate guest count
        const guests = parseInt(document.getElementById("guests").value);
        if (guests > selectedVenueDetails.capacity) {
            Swal.fire("Error", `The selected venue can only cater to a maximum of ${selectedVenueDetails.capacity} guests.`, "error");
            isValid = false;
        }

        // Validate parking slots count
        const parkingSlots = parseInt(document.getElementById("parking").value);
        if (parkingSlots > 15) {
            Swal.fire("Error", "The maximum number of parking slots allowed is 15.", "error");
            isValid = false;
        }

        // Validate email format
        const emailInput = document.getElementById("email");
        if (!isValidEmail(emailInput.value)) {
            showError(emailInput, "Please enter a valid email address");
            isValid = false;
        }

        return isValid;
    };

    // Show error messages
    const showError = (input, message) => {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.style.color = "red";
        errorDiv.style.fontSize = "12px";
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    };

    // Validate email
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
});
