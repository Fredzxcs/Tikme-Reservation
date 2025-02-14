document.addEventListener("DOMContentLoaded", () => { 
    const diningAreas = {
        "Air Conditioning": 1,
        "Alfresco": 2,
    };

    const urlParams = new URLSearchParams(window.location.search);
    let selectedDate = urlParams.get("date");  
    let selectedPlace = urlParams.get("place");
    let selectedTimeSlot = urlParams.get("time");

    const preferredAreaId = diningAreas[selectedPlace]; 

    console.log("📅 URL Selected Date:", selectedDate);  
    console.log("🏠 Preferred Area ID:", preferredAreaId);  

    if (selectedDate) {
        try {
            console.log("📅 URL Selected Date (Raw):", selectedDate);
    
            // Extract date components from format: "Saturday, Feb 15, 2025"
            const dateRegex = /([A-Za-z]+),\s([A-Za-z]+)\s(\d{1,2}),\s(\d{4})/;
            const match = selectedDate.match(dateRegex);
    
            if (!match) {
                throw new Error("Invalid date format");
            }
    
            const [_, dayOfWeek, monthStr, day, year] = match;
    
            // Convert month string (e.g., "Feb") to month index (0-11)
            const monthNames = {
                "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
                "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
            };
    
            if (!(monthStr in monthNames)) {
                throw new Error("Invalid month name");
            }
    
            const month = monthNames[monthStr];
    
            // Create date object without timezone shift
            const localDate = new Date(year, month, day);
    
            // Format into YYYY-MM-DD for backend
            const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
            console.log("📅 Final Date Sent to Backend:", formattedDate);
    
            // Display formatted date in human-readable format
            document.getElementById("selectedDate").textContent = localDate.toLocaleDateString("en-GB", {
                weekday: "long",
                month: "short",
                day: "2-digit",
                year: "numeric"
            });
    
            document.getElementById("selectedDateInput").value = formattedDate; // Send correct format to backend
    
        } catch (error) {
            console.error("❌ Invalid date format:", selectedDate, error);
            Swal.fire("Error", "Invalid date format. Please select a valid date.", "error");
            return;
        }
    }
    
    
    
    // Set the place if available
    if (selectedPlace) {
        document.getElementById("selectedPlace").textContent = selectedPlace;
        document.getElementById("preferredAreaIdInput").value = preferredAreaId; 
    }

    if (!preferredAreaId) {
        console.error("❌ Invalid preferred area:", selectedPlace);
    } else {
        document.getElementById("preferredAreaIdInput").value = preferredAreaId;
    }

    // Validate and properly format `selectedTimeSlot`
    if (selectedTimeSlot) {
        const formattedTimeSlot = selectedTimeSlot.toUpperCase();
        const match = formattedTimeSlot.match(/(\d{1,2}):(\d{2})(?:\s?(am|pm))?/i);
        if (!match) {
            console.error("❌ Invalid time format:", formattedTimeSlot);
            Swal.fire("Error", "Invalid time format. Please select a valid time.", "error");
            return;
        }

        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        let modifier = match[3] ? match[3].toUpperCase() : "AM"; 

        if (hours > 12) {
            hours -= 12;
            modifier = "PM"; 
        } else if (hours === 12) {
            modifier = "PM"; 
        } else {
            modifier = "AM"; 
        }

        const formattedTime = `${String(hours).padStart(2, "0")}:${minutes} ${modifier}`;
        document.getElementById("selectedTimeSlot").textContent = formattedTime;
        document.getElementById("selectedTimeSlotInput").value = formattedTime;
    } else {
        console.error("❌ No time slot found in URL!");
        Swal.fire("Error", "No time slot found in the URL.", "error");
        return;
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

    // Function to show error message
    const showError = (input, message, errorElement) => {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        input.classList.add("is-invalid");
    };

    // Function to clear error message
    const clearError = (input, errorElement) => {
        errorElement.textContent = "";
        errorElement.style.display = "none";
        input.classList.remove("is-invalid");
    };

    // **Real-time Validation (As Users Type)**
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
    const renderFilteredMenuItems = (filteredItems) => {
        Object.keys(menuContainers).forEach(category => {
            const container = menuContainers[category];
            container.innerHTML = ""; // Clear container before adding new items
        });
    
        if (filteredItems.length === 0) {
            Object.keys(menuContainers).forEach(category => {
                menuContainers[category].innerHTML = "<p class='text-muted'>No items found.</p>";
            });
            return;
        }
    
        filteredItems.forEach(item => {
            const mappedCategory = categoryMapping[item.ProductCategory];
            if (!menuContainers[mappedCategory]) return; // Ensure category container exists
    
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
    
            menuContainers[mappedCategory].appendChild(menuItem);
        });
    
        attachEventListeners(); // Ensure new items have event listeners
    };
    

    const applyFilters = () => {
        const searchQuery = searchBar.value.toLowerCase();
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);
    
        // Filter menu items based on search term
        const filteredItems = menuItems.filter((item) => {
            const matchesSearch = item.ProductName.toLowerCase().includes(searchQuery);
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes("All") || selectedCategories.includes(categoryMapping[item.ProductCategory]);
            return matchesSearch && matchesCategory;
        });
    
        // Render filtered menu items
        renderFilteredMenuItems(filteredItems);
    
        // Automatically expand categories that contain matching items
        toggleAccordionItems(filteredItems);
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

    const toggleAccordionItems = (filteredItems) => {
        accordionItems.forEach((item) => {
            const category = item.getAttribute("data-category");
            const button = item.querySelector(".accordion-button");
            const collapse = item.querySelector(".accordion-collapse");
    
            // Check if the filtered items contain this category
            const categoryHasItems = filteredItems.some(item => categoryMapping[item.ProductCategory] === category);
    
            if (categoryHasItems) {
                new bootstrap.Collapse(collapse, { toggle: false }).show();
                button.classList.remove("collapsed");
            } else {
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


    document.getElementById("bookingForm").addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const formData = new FormData(event.target);
    
        const selectedDateInput = document.getElementById("selectedDateInput").value;
        const dateParts = selectedDateInput.split('-'); // Prevents UTC conversion
        const formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`; // Keep YYYY-MM-DD
        console.log("📅 Final Date Sent to Backend:", formattedDate); // Debugging
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
        if (modifier === "pm" && hours !== 12) {
            hours += 12;
        }
        if (modifier === "am" && hours === 12) {
            hours = 0;
        }
    
        // Ensure it's properly formatted as HH:MM:SS
        const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
        console.log(`Formatted Time (24H): ${formattedTime}`);
    
        formData.set("reservation_time", formattedTime);
        
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


        // ✅ FIX: If no menu items are selected, set payment method to "none"
        let finalPaymentMethod = "none";
        if (advanceOrder.length > 0) {
            const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');
            if (!paymentMethodInput) {
                Swal.fire("Error", "Please select a payment method.", "error");
                return;
            }
            finalPaymentMethod = paymentMethodInput.value;
        }
        formData.append("payment_method", finalPaymentMethod);
        

        let isValid = true; // Track form validity

        // **Validation Checks (On Submit)**
        if (firstName.value.trim() === "" || !nameRegex.test(firstName.value) || firstName.value.length < 2) {
            showError(firstName, "Only letters allowed (Min: 2 characters)", firstNameError);
            isValid = false;
        } else {
            clearError(firstName, firstNameError);
        }

        if (lastName.value.trim() === "" || !nameRegex.test(lastName.value) || lastName.value.length < 2) {
            showError(lastName, "Only letters allowed (Min: 2 characters)", lastNameError);
            isValid = false;
        } else {
            clearError(lastName, lastNameError);
        }

        if (phone.value.trim() === "" || !phoneRegex.test(phone.value)) {
            showError(phone, "Enter valid PH number (09XXXXXXXXX)", phoneError);
            isValid = false;
        } else {
            clearError(phone, phoneError);
        }

        if (email.value.trim() === "" || !emailRegex.test(email.value)) {
            showError(email, "Enter a valid email (example@mail.com)", emailError);
            isValid = false;
        } else {
            clearError(email, emailError);
        }

        if (guests.value.trim() === "" || parseInt(guests.value) < 1) {
            showError(guests, "Minimum 1 guest required", guestsError);
            isValid = false;
        } else {
            clearError(guests, guestsError);
        }

        if (parking.value.trim() === "" || isNaN(parking.value) || parking.value < 0 || parking.value > 15) {
            showError(parking, "Enter a number (0-15)", parkingError);
            isValid = false;
        } else {
            clearError(parking, parkingError);
        }

        // **Stop Submission if Validation Fails**
        if (!isValid) {
            return;
        }

        try {
            const reservationResponse = await fetch("/api/dine-in/", {
                method: "POST",
                body: formData,
            });
        
            if (!reservationResponse.ok) {
                const errorData = await reservationResponse.json();
                console.error("❌ Backend error response:", errorData);
                throw new Error(errorData.detail || "Failed to submit reservation.");
            }
        
            const reservationData = await reservationResponse.json();
            console.log("✅ Reservation Data from Backend:", reservationData);
        
            // ✅ Check if an advance order exists before proceeding
            if (advanceOrder.length > 0) {
                const orderData = {
                    product_id: reservationData?.product_id || null,  // ✅ Extract product_id from response
                    quantity: advanceOrder.reduce((total, item) => total + item.quantity, 0)
                };
        
                console.log("📌 Prepared Order Data:", orderData);
        
                // ✅ Ensure valid order data before sending
                if (!orderData.product_id || !orderData.quantity) {
                    console.error("🚨 Missing required fields in orderData:", orderData);
                    Swal.fire("Error", "Invalid order data. Please try again.", "error");
                } else {
                    // ✅ Send order data only if it's valid
                    const orderResponse = await fetch("http://192.168.100.31:8004/api/receive-order/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(orderData),
                    });
        
                    if (!orderResponse.ok) {
                        const orderErrorData = await orderResponse.json();
                        console.error("❌ Error sending order data:", orderErrorData);
                        Swal.fire("Error", "Failed to submit order. Please try again.", "error");
                    } else {
                        console.log("✅ Order data sent successfully!");
                        Swal.fire("Success", "Your reservation and order have been submitted!", "success");
                    }
                }
            } else {
                console.log("ℹ No advance order selected. Skipping order submission.");
                Swal.fire("Success", "Your reservation has been submitted!", "success");
            }

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
        
            let validPaymentMethods = ["none"]; // Default to "none" if no items are selected
            const hasSelectedMenuItem = advanceOrder.length > 0;
        
            if (hasSelectedMenuItem) {
                // ✅ If a menu item is selected, require payment method
                const selectedPaymentMethod = document.querySelector('input[name="payment_method"]:checked');
        
                if (!selectedPaymentMethod || !paymentMethods.includes(selectedPaymentMethod.value)) {
                    Swal.fire("Error", "Please select a valid payment method.", "error");
                    return;
                }
        
                validPaymentMethods = [selectedPaymentMethod.value]; // Set user-selected payment method
            }
        
            console.log("✅ Final Payment Methods:", validPaymentMethods);
        
            if (!hasSelectedMenuItem) {
                // ✅ No menu item selected -> Show success message, then redirect to home
                Swal.fire({
                    title: "Success!",
                    text: "Your reservation has been successfully submitted.",
                    icon: "success",
                    confirmButtonText: "OK",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/home"; // ✅ Redirect to home after user clicks "OK"
                    }
                });
                return; // ✅ Stop execution here if no menu items are selected
            }
            
                
            const calculateTotalAmount = () => {
                let total = 0;
                document.querySelectorAll(".menu-checkbox:checked").forEach((checkbox) => {
                    const productId = checkbox.id.split("-")[1];
                    const menuItem = menuItems.find((item) => item.Product_ID.toString() === productId);
                    if (menuItem) {
                        const quantity = parseInt(document.getElementById(`quantity-${menuItem.Product_ID}`).value, 10);
                        const price = parseFloat(menuItem.PurchasePrice);
                        total += (price * quantity); // Ensure proper calculation
                    }
                });
                console.log("✅ Final Total Amount:", total); // Debugging
                return total;
            };
            

            // Access reservation ID and reference number from the backend response
            const reservationId = reservationData.reservation?.id; // Access reservation ID
            const referenceNumber = reservationData.reservation?.reference_number; // Access reference number
            const success_url = "http://127.0.0.1:8002/home"; // ✅ Correct format


            if (!reservationId || !referenceNumber) {
                console.error("Missing reservation ID or reference number:", {
                    reservationId,
                    referenceNumber,
                    fullResponse: reservationData,
                });
                throw new Error("Invalid reservation ID or reference number received from the backend.");
            }

        const total_amount = calculateTotalAmount();
        const payload = {
            data: {
                attributes: {
                    description: "Reservation Dine-in",
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
        console.log("✅ Payload to PayMongo:", payload); // Debugging


            console.log("Payload to PayMongo:", payload);
      
            // Step 2: Send the payload to PayMongo
            const paymongoResponse = await fetch("http://192.168.100.31:8006/create-checkout-session/", {
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
    fetchMenuItems();
});
