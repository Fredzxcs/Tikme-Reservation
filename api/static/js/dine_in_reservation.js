document.addEventListener("DOMContentLoaded", () => { 
    // Example mapping of dining area names to IDs
    const diningAreas = {
        "Air Conditioning": 1,
        "Alfresco": 2,
    };

    // Fetch details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedDate = urlParams.get("date");
    const selectedPlace = urlParams.get("place");
    const selectedTimeSlot = urlParams.get("time");
    const preferredAreaId = diningAreas[selectedPlace]; // Map name to numeric ID

    // Pre-fill selected details in the form
    if (selectedDate) {
        document.getElementById("selectedDate").textContent = new Date(selectedDate).toDateString();
        document.getElementById("selectedDateInput").value = selectedDate; // Hidden input for form submission
    }
    if (selectedPlace && preferredAreaId) {
        document.getElementById("selectedPlace").textContent = selectedPlace; // Display the name
        document.getElementById("selectedPlaceInput").value = preferredAreaId; // Hidden input for numeric ID
    } else if (selectedPlace) {
        console.error(`Invalid dining area selected: ${selectedPlace}`);
    }
    if (selectedTimeSlot) {
        document.getElementById("selectedTimeSlot").textContent = selectedTimeSlot;
        document.getElementById("selectedTimeSlotInput").value = selectedTimeSlot; // Hidden input for form submission
    }   

    // Hide payment method initially
    const paymentMethodSection = document.querySelector(".form-group");
    paymentMethodSection.style.display = "none";

    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^09\d{9}$/; // Accepts only PH mobile numbers (09XXXXXXXXX)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Form Elements
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    const guests = document.getElementById("guests");
    const parking = document.getElementById("parking");

    // Error Message Containers
    const firstNameError = document.getElementById("firstNameError");
    const lastNameError = document.getElementById("lastNameError");
    const phoneError = document.getElementById("phoneError");
    const emailError = document.getElementById("emailError");
    const guestsError = document.getElementById("guestsError");
    const parkingError = document.getElementById("parkingError");

    // Function to show an error message
    const showError = (input, message, errorElement) => {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        errorElement.style.position = "absolute";
        errorElement.style.left = input.offsetLeft + "px";
        errorElement.style.top = input.offsetTop + input.offsetHeight + "px";
        input.classList.add("is-invalid");
    };

    // Function to remove error message
    const clearError = (input, errorElement) => {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        input.classList.remove("is-invalid");
    };

    // Real-time Validation Functions
    firstName.addEventListener("input", () => {
        if (!nameRegex.test(firstName.value) || firstName.value.length < 2) {
            showError(firstName, "Only letters allowed (Min: 2 characters)", firstNameError);
        } else {
            clearError(firstName, firstNameError);
        }
    });

    lastName.addEventListener("input", () => {
        if (!nameRegex.test(lastName.value) || lastName.value.length < 2) {
            showError(lastName, "Only letters allowed (Min: 2 characters)", lastNameError);
        } else {
            clearError(lastName, lastNameError);
        }
    });

    phone.addEventListener("input", () => {
        if (!phoneRegex.test(phone.value)) {
            showError(phone, "Enter valid PH number (09XXXXXXXXX)", phoneError);
        } else {
            clearError(phone, phoneError);
        }
    });

    email.addEventListener("input", () => {
        if (!emailRegex.test(email.value)) {
            showError(email, "Enter a valid email (example@mail.com)", emailError);
        } else {
            clearError(email, emailError);
        }
    });

    guests.addEventListener("input", () => {
        if (guests.value < 1) {
            showError(guests, "Minimum 1 guest required", guestsError);
        } else {
            clearError(guests, guestsError);
        }
    });

    parking.addEventListener("input", () => {
        if (isNaN(parking.value) || parking.value < 0 || parking.value > 15) {
            showError(parking, "Enter a number (0-15)", parkingError);
        } else {
            clearError(parking, parkingError);
        }
    });

    // Prevent Form Submission if Invalid Fields Exist
    document.getElementById("bookingForm").addEventListener("submit", (event) => {
        if (document.querySelector(".is-invalid")) {
            event.preventDefault();
        }
    });

    // Menu filtering and rendering logic
    const searchBar = document.getElementById("searchBar");
    const categoryCheckboxes = document.querySelectorAll(".category-checkbox");
    const accordionItems = document.querySelectorAll(".accordion-item");
    // Correct category mapping
    const categoryMapping = {
        1: "Breakfast & Meals",
        2: "Snacks & Appetizers",
        3: "Desserts & Beverages"
    };

    const menuContainers = {
        "Breakfast & Meals": document.getElementById("breakfastMenuContainer"),
        "Snacks & Appetizers": document.getElementById("snacksMenuContainer"),
        "Desserts & Beverages": document.getElementById("dessertsMenuContainer")
    };

    let menuItems = []; // Store fetched menu items
   
     // Function to toggle visibility of the payment method section
     const togglePaymentMethodVisibility = () => {
        const hasSelectedMenuItem = document.querySelectorAll(".menu-checkbox:checked").length > 0;
        paymentMethodSection.style.display = hasSelectedMenuItem ? "block" : "none";
    };

    // Function to calculate the total price
    const calculateTotalPrice = () => {
        let total = 0;
        document.querySelectorAll(".menu-checkbox:checked").forEach((checkbox) => {
            const productId = checkbox.id.split("-")[1];
            const menuItem = menuItems.find((item) => item.Product_ID.toString() === productId);
            if (menuItem) {
                const quantity = parseInt(document.getElementById(`quantity-${menuItem.Product_ID}`).value, 10);
                const price = parseFloat(menuItem.PurchasePrice);
                total += price * (isNaN(quantity) ? 0 : quantity);
            }
        });
        return total;
    };

    // Function to display the total price on the UI
    const updateTotalPrice = () => {
        const total = calculateTotalPrice();
        document.getElementById("totalPrice").textContent = `${total.toFixed(2)} PHP`;
    };

    // Function to attach event listeners to checkboxes and quantity selectors
    const attachEventListeners = () => {
        document.querySelectorAll(".menu-checkbox").forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                togglePaymentMethodVisibility();
                updateTotalPrice();
            });
        });

        document.querySelectorAll(".form-select").forEach((select) => {
            select.addEventListener("change", () => {
                const checkbox = select.closest(".menu-item").querySelector(".menu-checkbox");
                if (!checkbox.checked) {
                    checkbox.checked = true;
                }
                togglePaymentMethodVisibility();
                updateTotalPrice();
            });
        });
    };


    // Fetch menu items from the server
    const fetchMenuItems = async () => {
        try {   
            const response = await fetch("http://192.168.100.31:8004/products/");
            if (!response.ok) throw new Error("Failed to fetch menu items.");
            menuItems = await response.json();

            // Extract unique categories dynamically
            console.log("Fetched Menu Items:", menuItems);

            applyFilters();
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    };


          // Function to render menu items per category
    const renderMenuItems = () => {
        Object.keys(menuContainers).forEach(category => {
            const container = menuContainers[category];
            container.innerHTML = ""; // Clear container before adding new items

            const filteredItems = menuItems.filter(item => {
                const mappedCategory = categoryMapping[item.ProductCategory];
                return mappedCategory === category;
            });

            if (filteredItems.length === 0) {
                container.innerHTML = "<p class='text-muted'>No items available.</p>";
                return;
            }

            filteredItems.forEach(item => {
                const menuItem = document.createElement("div");
                menuItem.classList.add("col-md-4", "mb-3");
                menuItem.innerHTML = `
                    <div class="menu-item p-3 border rounded shadow-sm">
                        <div class="menu-item-header d-flex align-items-center">
                            <input type="checkbox" class="menu-checkbox" id="product-${item.Product_ID}" />
                            <h6 class="mb-0 ms-2">${item.ProductName}</h6>
                        </div>
                        <p class="mt-2 small text-muted">${item.ProductDescription || "No description available"}</p>
                        <p class="text-primary fw-bold">${parseFloat(item.PurchasePrice).toFixed(2)} PHP</p>
                        <div class="quantity-selector mt-2">
                            <label for="quantity-${item.Product_ID}" class="me-2">Quantity:</label>
                            <select id="quantity-${item.Product_ID}" class="form-select">
                                ${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                `;

                container.appendChild(menuItem);
            });
        });

        // Attach event listeners to new items
        attachEventListeners();
    };

     // Function to apply filters based on search and selected categories
     const applyFilters = () => {
        const searchQuery = searchBar.value.toLowerCase();
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);

        const filteredItems = menuItems.filter((item) => {
            const matchesSearch = item.ProductName.toLowerCase().includes(searchQuery);
            const matchesCategory =
                selectedCategories.includes("All") ||
                selectedCategories.includes(item.ProductCategory);
            return matchesSearch && matchesCategory;
        });

        renderMenuItems(filteredItems);
    };

    // Event listener for category checkbox changes
    categoryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            applyFilters();
        });
    });

    // Event listener for search bar input
    searchBar.addEventListener("input", applyFilters);
    
        // Define available dine-in places
        const availablePlaces = ["Alfresco", "Air Conditioning"];

        // Check if selected details exist
        const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : null;

        if (formattedDate && selectedPlace && selectedTimeSlot) {
            document.getElementById("selectedDate").textContent = formattedDate;
            document.getElementById("selectedPlace").textContent = selectedPlace;
            document.getElementById("selectedTimeSlot").textContent = selectedTimeSlot;
        } else {
            Swal.fire("Error", "Missing reservation details. Please return to the calendar.", "error").then(() => {
                window.location.href = "/dine-in-calendar/";
            });
            return;
        }

        // Validate if the selected place is valid
        if (!availablePlaces.includes(selectedPlace)) {
            Swal.fire("Error", "Invalid place selected. Please return to the calendar.", "error").then(() => {
                window.location.href = "/dine-in-calendar/";
            });
            return;
        }

    // Function to toggle accordion dropdowns based on selected categories
    const toggleAccordionItems = (selectedCategories) => {
        accordionItems.forEach((item) => {
            const category = item.getAttribute("data-category");
            const button = item.querySelector(".accordion-button");
            const collapse = item.querySelector(".accordion-collapse");

            if (selectedCategories.includes(category)) {
                // Expand if selected
                new bootstrap.Collapse(collapse, { toggle: false }).show();
                button.classList.remove("collapsed");
            } else {
                // Collapse if not selected
                new bootstrap.Collapse(collapse, { toggle: false }).hide();
                button.classList.add("collapsed");
            }
        });
    };

    // Event listener for category checkbox changes
    categoryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            const allCheckbox = document.querySelector(".category-checkbox[value='All']");
            let selectedCategories = Array.from(categoryCheckboxes)
                .filter((cb) => cb.checked && cb.value !== "All") // Get only checked categories except "All"
                .map((cb) => cb.value);

            // If "All" is checked, select all categories and expand all
            if (checkbox.value === "All") {
                const isChecked = checkbox.checked;
                categoryCheckboxes.forEach((cb) => (cb.checked = isChecked)); 
                selectedCategories = isChecked ? Object.keys(menuContainers) : [];
            } else {
                // Uncheck "All" if any individual category is unchecked
                allCheckbox.checked = selectedCategories.length === Object.keys(menuContainers).length;
            }

            // Toggle accordion dropdowns based on selected categories
            toggleAccordionItems(selectedCategories);
            applyFilters();
        });
    });


    document.addEventListener("DOMContentLoaded", () => { 
        document.getElementById("bookingForm").addEventListener("submit", async (event) => {
            event.preventDefault();
    
            const formData = new FormData(event.target);
    
            // Format date to YYYY-MM-DD
            const selectedDateInput = document.getElementById("selectedDateInput").value;
            const formattedDate = new Date(selectedDateInput).toISOString().split("T")[0];
            formData.set("reservation_date", formattedDate);
    
            const timeInput = document.getElementById("selectedTimeSlotInput");
    
            // Ensure timeInput exists and has a value
            if (!timeInput || !timeInput.value) {
                console.error("Error: No time slot selected.");
                return;
            }
    
            const rawTime = timeInput.value;
            console.log(`Raw Time: ${rawTime}`); // 🔥 Debugging log
    
            // Extract time and modifier (am/pm)
            const match = rawTime.match(/(\d{1,2}):(\d{2})(\s?(am|pm))?/i);
            if (!match) {
                console.error("Error: Invalid time format.", { rawTime });
                return;
            }
    
            let hours = parseInt(match[1], 10);
            const minutes = match[2];
            const modifier = match[4] ? match[4].toLowerCase() : "";
    
            // Convert to 24-hour format if necessary
            if (modifier === "pm" && hours !== 12) hours += 12;
            if (modifier === "am" && hours === 12) hours = 0;
    
            // Ensure it's properly formatted as HH:MM:SS
            const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
            console.log(`Formatted Time (24H): ${formattedTime}`);
    
            formData.set("reservation_time", formattedTime);
    
            // Validate payment method
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
            if (!paymentMethod) {
                Swal.fire("Error", "Please select a payment method.", "error");
                return;
            }
            formData.set("payment_method", paymentMethod.value);
    
            // Prepare advance orders
            const advanceOrder = [];
            document.querySelectorAll(".menu-checkbox:checked").forEach((checkbox) => {
                const productId = checkbox.id.split("-")[1];
                const menuItem = menuItems.find((item) => item.Product_ID.toString() === productId);
                if (menuItem) {
                    const quantity = parseInt(document.getElementById(`quantity-${menuItem.Product_ID}`).value, 10);
                    const price = parseFloat(menuItem.PurchasePrice);
                    advanceOrder.push({
                        product_id: menuItem.Product_ID,
                        product_name: menuItem.ProductName,
                        quantity: isNaN(quantity) ? 0 : quantity,
                        price: isNaN(price) ? 0 : price,
                    });
                }
            });
    
            formData.append("advance_order", JSON.stringify(advanceOrder));
    
            try {
                // Step 1: Submit reservation
                const reservationResponse = await fetch("/api/dine-in/", {
                    method: "POST",
                    body: formData,
                });
    
                if (!reservationResponse.ok) {
                    const errorData = await reservationResponse.json();
                    console.error("Backend error response:", errorData);
                    throw new Error(errorData.detail || "Failed to submit reservation.");
                }
    
                const reservationData = await reservationResponse.json();
                console.log("Reservation Data from Backend:", reservationData);
    
                // Step 2: If advance orders exist, send them to logistics
                if (advanceOrder.length > 0) {
                    await sendOrdersToLogistics(advanceOrder);
                }
    
                // Step 3: Continue with PayMongo integration
                await processPayment(reservationData, advanceOrder);
    
            } catch (error) {
                console.error("❌ Error:", error);
                Swal.fire("Error", error.message, "error");
            }
        });
    
        /**
         * Function to send multiple orders to the logistics API
         * @param {Array} orders - The list of advance orders
         */
        async function sendOrdersToLogistics(orders) {
            for (const order of orders) {
                try {
                    const response = await fetch("http://127.0.0.1:8000/api/receive-order/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            product_id: order.product_id,
                            quantity: order.quantity,
                        }),
                    });
    
                    const responseData = await response.json();
    
                    if (!response.ok) {
                        console.error("❌ Logistics Order Error:", responseData.error);
                        Swal.fire("Order Error", `Issue sending order for Product ID ${order.product_id}.`, "warning");
                    } else {
                        console.log(`✅ Order sent successfully for Product ID ${order.product_id}:`, responseData);
                    }
                } catch (error) {
                    console.error("❌ Logistics Order Network Error:", error);
                    Swal.fire("Order Error", "There was an issue sending your order. Please check later.", "warning");
                }
            }
        }
    
        /**
         * Function to process payment via PayMongo
         * @param {Object} reservationData - Data from the reservation API response
         * @param {Array} advanceOrder - List of items for payment
         */
        async function processPayment(reservationData, advanceOrder) {
            // Define available payment methods
            const paymentMethods = ["gcash", "grab_pay", "card", "qrph", "brankas_bdo", "brankas_landbank", "paymaya"];
    
            // Get the user-selected payment method
            const selectedPaymentMethod = document.querySelector('input[name="payment_method"]:checked');
            if (!selectedPaymentMethod || !paymentMethods.includes(selectedPaymentMethod.value)) {
                Swal.fire("Error", "Please select a valid payment method.", "error");
                return;
            }
    
            const validPaymentMethods = [selectedPaymentMethod.value];
    
            // Access reservation ID and reference number from backend response
            const reservationId = reservationData.reservation?.id;
            const referenceNumber = reservationData.reservation?.reference_number;
            const success_url = "http://127.0.0.1:8002/home"; // ✅ Correct format
    
            if (!reservationId || !referenceNumber) {
                console.error("Missing reservation ID or reference number:", { reservationId, referenceNumber, fullResponse: reservationData });
                throw new Error("Invalid reservation ID or reference number received from the backend.");
            }
    
            const total_amount = advanceOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const payload = {
                data: {
                    attributes: {
                        description: "Dine-in reservation payment",
                        success_url: success_url,
                        amount: Math.round(total_amount * 100), // Convert PHP to cents
                        line_items: advanceOrder.map((item) => ({
                            name: item.product_name,
                            amount: Math.round(item.price * 100), // Convert unit price to cents
                            currency: "PHP",
                            quantity: item.quantity,
                            description: "Customer Purchase",
                        })),
                        payment_method_types: validPaymentMethods,
                        reference_number: referenceNumber,
                        send_email_receipt: true,
                    },
                },
            };
    
            try {
                const response = await fetch("http://192.168.100.31:8006/create-checkout-session/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
    
                if (!response.ok) {
                    const error = await response.json();
                    console.error("Error details:", error);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
    
                const data = await response.json();
                const checkout_url = data.details?.data?.attributes?.checkout_url;
    
                if (checkout_url) {
                    window.location.href = checkout_url;
                } else {
                    console.error("Checkout URL not found in response.");
                }
            } catch (error) {
                Swal.fire("Payment Error", error.message, "error");
            }
        }
    
        // Fetch menu items on page load
        fetchMenuItems();
    });
});
    
    