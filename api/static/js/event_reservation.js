document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("bookingForm");
    const cancelButton = document.getElementById("cancelButton");
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const totalCostElement = document.getElementById("totalAmount");

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

    // Validation Regex
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^09\d{9}$/; // Only accepts PH mobile numbers (09XXXXXXXXX)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Input Elements
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const phone = document.getElementById("phoneNumber");
    const email = document.getElementById("email");
    const guests = document.getElementById("guests");
    const parking = document.getElementById("parking");

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

    const showError = (input, message) => {
        let error = input.parentNode.querySelector(".error-message");
    
        if (!error) {
            error = document.createElement("div");
            error.classList.add("error-message");
            input.parentNode.appendChild(error);
        }
    
        error.textContent = message;
        error.style.display = "block";  // ✅ Ensure the message is visible
        input.classList.add("is-invalid");
    };
    

    const clearError = (input) => {
        let error = input.parentNode.querySelector(".error-message");
        if (error) {
            error.style.display = "none"; // ✅ Instead of removing, just hide it
        }
        input.classList.remove("is-invalid");
    };
    

    // Apply validation when the user **leaves** the field (on blur) OR **corrects while typing** (on input)
    const applyValidation = (input, regex, message) => {
        input.addEventListener("blur", () => {
            regex.test(input.value) ? clearError(input) : showError(input, message);
        });
        input.addEventListener("input", () => {
            if (regex.test(input.value)) {
                clearError(input);
            }
        });
    };

    applyValidation(firstName, nameRegex, "Only letters allowed (Min: 2 characters)");
    applyValidation(lastName, nameRegex, "Only letters allowed (Min: 2 characters)");
    applyValidation(phone, phoneRegex, "Enter a valid PH number (09XXXXXXXXX)");
    applyValidation(email, emailRegex, "Enter a valid email (example@mail.com)");

    // Guests and Parking Validation
    guests.addEventListener("blur", () => {
        const guestCount = parseInt(guests.value, 10) || 0;
        if (guestCount < 1) {
            showError(guests, "Minimum 1 guest required");
        } else if (guestCount > selectedVenueDetails.capacity) {
            showError(guests, `Max capacity for this venue is ${selectedVenueDetails.capacity}`);
        } else {
            clearError(guests);
        }
    });

    parking.addEventListener("blur", () => {
        const parkingSlots = parseInt(parking.value, 10) || 0;
        if (parkingSlots < 0 || parkingSlots > 15) {
            showError(parking, "Parking slots must be between 0 and 15");
        } else {
            clearError(parking);
        }
    });

    // Prevent form submission if fields are invalid
    form.addEventListener("submit", (event) => {
        let isValid = true;

        if (!phoneRegex.test(phone.value)) {
            showError(phone, "Enter a valid PH number (09XXXXXXXXX)");
            isValid = false;
        }
        if (!nameRegex.test(firstName.value) || firstName.value.length < 2) {
            showError(firstName, "Only letters allowed (Min: 2 characters)");
            isValid = false;
        }
        if (!nameRegex.test(lastName.value) || lastName.value.length < 2) {
            showError(lastName, "Only letters allowed (Min: 2 characters)");
            isValid = false;
        }
        if (!emailRegex.test(email.value)) {
            showError(email, "Enter a valid email (example@mail.com)");
            isValid = false;
        }

        const guestCount = parseInt(guests.value, 10) || 0;
        if (guestCount < 1) {
            showError(guests, "Minimum 1 guest required");
            isValid = false;
        } else if (guestCount > selectedVenueDetails.capacity) {
            showError(guests, `Max capacity for this venue is ${selectedVenueDetails.capacity}`);
            isValid = false;
        }

        const parkingSlots = parseInt(parking.value, 10) || 0;
        if (parkingSlots < 0 || parkingSlots > 15) {
            showError(parking, "Parking slots must be between 0 and 15");
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault(); // Stop form submission if validation fails
        }
    });

    const calculateTotalCost = () => {
        const guestCount = parseInt(guests.value) || 0;
        const selectedPackage = document.querySelector('input[name="package"]:checked');
    
        if (!selectedPackage) {
            console.log("❌ No package selected. Total cost remains 0.");
            return 0;
        }
    
        const packageName = selectedPackage.value;
        const packagePrice = packageDetails[packageName]?.price || 0;
    
        console.log(`✅ Selected Package: ${packageName}, Price per Guest: ${packagePrice}, Guests: ${guestCount}`);
        
        return guestCount * packagePrice;
    };
    
    const updateTotalCost = () => {
        const totalCost = calculateTotalCost();
        console.log(`🔄 Updating total cost: ${totalCost} PHP`);
        totalCostElement.textContent = `${totalCost.toLocaleString()} PHP`;
    };
    
    // Attach event listeners
    document.querySelectorAll('input[name="package"]').forEach(radio => {
        radio.addEventListener("change", () => {
            console.log(`📦 Package Selected: ${radio.value}`);
            updateTotalCost();
        });
    });
    
    guests.addEventListener("input", () => {
        console.log(`👥 Guests Updated: ${guests.value}`);
        updateTotalCost();
    });
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        if (document.querySelector(".is-invalid")) {
            Swal.fire("Error", "Please correct the errors before submitting.", "error");
            return;
        }
    
        const selectedPackage = document.querySelector('input[name="package"]:checked');
        if (!selectedPackage) {
            Swal.fire("Error", "Please select a package before proceeding.", "error");
            return;
        }
    
        const selectedPaymentMethod = document.querySelector('input[name="payment_method"]:checked');
        if (!selectedPaymentMethod) {
            Swal.fire("Error", "Please select a payment method.", "error");
            return;
        }
    
        const totalAmount = calculateTotalCost();
        const referenceNumber = `EVT${Date.now()}`;
    
        // First, Submit the Reservation Data to Django
        const reservationPayload = {
            reservation_date: formattedDate,
            reservation_time: formattedTimeSlot,
            venue_id: venueCapacities[selectedPlace].id,
            first_name: firstName.value,
            last_name: lastName.value,
            phone_number: phone.value,
            email: email.value,
            package_id: packageDetails[selectedPackage.value].id,
            number_of_guests: parseInt(guests.value),
            parking_slots_needed: parseInt(parking.value),
            payment_method: selectedPaymentMethod.value,
        };
    
        try {
            const reservationResponse = await fetch("/api/event-reservation/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
                body: JSON.stringify(reservationPayload),
            });
    
            const reservationData = await reservationResponse.json();
            
            if (!reservationResponse.ok) {
                console.error("❌ Reservation Error:", reservationData);
                Swal.fire("Reservation Error", reservationData.detail || "Failed to create reservation.", "error");
                return;
            }
    
            console.log("✅ Reservation Created:", reservationData);
    
            // Now Send Payment Data to PayMongo
            const paymentPayload = {
                data: {
                    attributes: {
                        description: "Event reservation payment",
                        amount: totalAmount * 100, // Convert to cents
                        currency: "PHP",
                        reference_number: referenceNumber,
                        payment_method_types: [selectedPaymentMethod.value],
                        line_items: [{
                            name: selectedPackage.value,
                            amount: packageDetails[selectedPackage.value].price * 100,
                            currency: "PHP",
                            quantity: parseInt(guests.value),
                            description: "Event Booking Package"
                        }],
                        success_url: "http://127.0.0.1:8002/home",
                    }
                }
            };
    
            const paymongoResponse = await fetch("http://192.168.100.31:8006/create-checkout-session/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentPayload),
            });
    
            const paymongoData = await paymongoResponse.json();
    
            if (!paymongoResponse.ok) {
                console.error("❌ PayMongo Error:", paymongoData);
                Swal.fire("Payment Error", "Failed to process payment.", "error");
                return;
            }
    
            const checkoutUrl = paymongoData.details?.data?.attributes?.checkout_url;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error("Payment failed.");
            }
    
        } catch (error) {
            console.error("❌ Error:", error);
            Swal.fire("Error", "Something went wrong. Please try again.", "error");
        }
    });
    

    cancelButton.addEventListener("click", () => {
        Swal.fire({
            title: "Cancel Booking",
            text: "Are you sure you want to cancel?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "/event-calendar/";
            }
        });
    });
});