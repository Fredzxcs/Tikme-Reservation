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

    // Menu filtering and rendering logic
    const searchBar = document.getElementById("searchBar");
    const categoryCheckboxes = document.querySelectorAll(".category-checkbox");
    const accordionItems = document.querySelectorAll(".accordion-item");
    const menuContainers = {
        "1": document.getElementById("breakfastMenuContainer"),
        "2": document.getElementById("snacksMenuContainer"),
        "3": document.getElementById("dessertsMenuContainer"),
    };

    let menuItems = []; // Store fetched menu items

    // Fetch menu items from the server
    const fetchMenuItems = async () => {
        try {   
            const response = await fetch("http://192.168.1.82:8004/products/");
            if (!response.ok) throw new Error("Failed to fetch menu items.");
            menuItems = await response.json();
            applyFilters(); // Apply initial filters after fetching data
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    };

    // Render filtered menu items into their respective containers
    const renderMenuItems = (items) => {
        // Clear all menu containers
        Object.keys(menuContainers).forEach((category) => {
            menuContainers[category].innerHTML = "";
        });

        items.forEach((item) => {
            const menuItem = document.createElement("div");
            menuItem.classList.add("col-md-4", "mb-4");
            menuItem.innerHTML = `
                <div class="menu-item p-3 border rounded">
                    <div class="menu-item-header d-flex align-items-center">
                        <input type="checkbox" class="menu-checkbox" id="product-${item.Product_ID}" />
                        <h5 class="mb-0">${item.ProductName}</h5>
                    </div>
                    <p class="mt-2">${item.ProductDescription || "No description available"}</p>
                    <p><strong>${item.PurchasePrice} PHP</strong></p>
                    <div class="quantity-selector mt-2">
                        <label for="quantity-${item.Product_ID}" class="me-2">Quantity:</label>
                        <select id="quantity-${item.Product_ID}" class="form-select">
                            ${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;

            // Add event listener to checkbox for showing payment method
            menuItem.querySelector(`#product-${item.Product_ID}`).addEventListener("change", () => {
                togglePaymentMethodVisibility();
                updateTotalPrice();
            });

            // Add event listener to dropdown for checkbox toggle and total price update
            menuItem.querySelector(`#quantity-${item.Product_ID}`).addEventListener("change", (event) => {
                const checkbox = menuItem.querySelector(`#product-${item.Product_ID}`);
                if (!checkbox.checked) {
                    checkbox.checked = true;
                }
                togglePaymentMethodVisibility();
                updateTotalPrice();
            });

            if (menuContainers[item.ProductCategory]) {
                menuContainers[item.ProductCategory].appendChild(menuItem);
            }
        });
    };

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

// Proceed with the rest of your logic, as no capacity checks are required.

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
                total += price * (isNaN(quantity) ? 0 : quantity); // Avoid NaN issues
            }
        });
        return total;
    };

    // Updated function to display the total price on the UI
    const updateTotalPrice = () => {
        const total = calculateTotalPrice();
        document.getElementById("totalPrice").textContent = `${total.toFixed(2)} PHP`;
    };

    // Apply filters based on search and selected categories
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
        toggleAccordionItems(selectedCategories);
    };

    // Automatically toggle accordion dropdowns based on selected categories
    const toggleAccordionItems = (categories) => {
        accordionItems.forEach((item) => {
            const category = item.getAttribute("data-category");
            const button = item.querySelector(".accordion-button");
            const collapse = item.querySelector(".accordion-collapse");

            if (categories.includes("All") || categories.includes(category)) {
                if (!collapse.classList.contains("show")) {
                    new bootstrap.Collapse(collapse, { toggle: true }).show();
                }
                button.classList.remove("collapsed");
            } else {
                if (collapse.classList.contains("show")) {
                    new bootstrap.Collapse(collapse, { toggle: true }).hide();
                }
                button.classList.add("collapsed");
            }
        });
    };

    // Event listener for category checkbox changes
    categoryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            const allCheckbox = document.querySelector(".category-checkbox[value='All']");
            if (checkbox.value === "All") {
                categoryCheckboxes.forEach((cb) => (cb.checked = checkbox.checked));
            } else {
                allCheckbox.checked = Array.from(categoryCheckboxes)
                    .filter((cb) => cb.value !== "All")
                    .every((cb) => cb.checked);
            }
            applyFilters();
        });
    });

    // Event listener for search bar input
    searchBar.addEventListener("input", applyFilters);

 
    document.getElementById("bookingForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        // Format date to YYYY-MM-DD
        const selectedDateInput = document.getElementById("selectedDateInput").value;
        const formattedDate = new Date(selectedDateInput).toISOString().split("T")[0];
        formData.set("reservation_date", formattedDate);

        // Format time to HH:MM
        const rawTime = document.getElementById("selectedTimeSlotInput").value;
        const [time, modifier] = rawTime.split(/(am|pm)/i);
        let [hours, minutes] = time.split(":");
        if (modifier.toLowerCase() === "pm" && hours !== "12") {
            hours = parseInt(hours, 10) + 12;
        }
        if (modifier.toLowerCase() === "am" && hours === "12") {
            hours = "00";
        }
        const formattedTime = `${hours}:${minutes}`;
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
            const totalPrice = calculateTotalPrice() * 100; // Convert to cents
            
           // Define available payment methods
            const paymentMethods = [
                "gcash",
                "grab_pay",
                "card",
                "qrph",
                "brankas_bdo",
                "brankas_landbank",
                "paymaya"
            ];

            // Get the user-selected payment method
            const selectedPaymentMethod = document.querySelector('input[name="payment_method"]:checked'); // Ensure this is the correct selector

            if (!selectedPaymentMethod || !paymentMethods.includes(selectedPaymentMethod.value)) {
                Swal.fire("Error", "Please select a valid payment method.", "error");
                return;
            }

            // Construct validPaymentMethods with the user-selected payment method
            const validPaymentMethods = [selectedPaymentMethod.value];

            const total_amount_text = document.getElementById("totalPrice").textContent;
            const total_amount = parseInt(total_amount_text.replace(/[^\d]/g, ""), 10);
            // Access reservation ID and reference number from the backend response
            const reservationId = reservationData.reservation?.id; // Access reservation ID
            const referenceNumber = reservationData.reservation?.reference_number; // Access reference number
            const success_url = "127:0.0.1:8002/home";

            if (!reservationId || !referenceNumber) {
                console.error("Missing reservation ID or reference number:", {
                    reservationId,
                    referenceNumber,
                    fullResponse: reservationData,
                });
                throw new Error("Invalid reservation ID or reference number received from the backend.");
            }

            // Construct the payload for PayMongo
            const payload = {
                data: {
                    attributes: {
                        description: "Dine-in reservation payment",
                        success_url: success_url,
                        line_items: [
                            {
                            name: "Dine-in-Purchases",
                            amount: total_amount, // Convert to cents
                            currency: "PHP",
                            quantity: 1,
                            description: "Customer Purchase"
                            }
                        ],
                        payment_method_types: validPaymentMethods, // Use the selected payment method
                        reference_number: referenceNumber, // Construct a valid reference number
                        send_email_receipt: true,
                    },
                },
            };

            console.log("Payload to PayMongo:", payload);
      
            // Step 2: Send the payload to PayMongo
            const paymongoResponse = await fetch("http://192.168.1.25:8006/create-checkout-session/", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(payload),
            }).then((response) => {
                if (!response.ok) {
                    return response.json().then((error) => {
                        console.error("Error details:", error);
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then((data) => {
                console.log("Response:", data); // Log the response for debugging
                const checkout_url = data.details?.data?.attributes?.checkout_url;
                if (checkout_url) {
                    // Redirect to the PayMongo checkout page
                    window.location.href = checkout_url;
                } else {
                    console.error("Checkout URL not found in response.");
                }
            })
        } catch (error) {
            Swal.fire("Error", error.message, "error");
        }
    });

    // Fetch menu items on page load
    fetchMenuItems();
});

    