document.addEventListener("DOMContentLoaded", () => {
    let selectedDate = null;
    let selectedPlace = null;
    let selectedTimeSlot = null;

    const maxGuestsPerSlot = 35; // Maximum allowed guests per slot
    const timeSlots = {
        weekday: generateTimeSlots("09:00", "20:00"), // 9:00 AM - 8:00 PM
        sunday: generateTimeSlots("09:00", "21:00")   // 9:00 AM - 9:00 PM
    };

    const eventPlaces = ["Air Conditioning", "Alfresco"];
    let currentDate = new Date();

    // ✅ Generate time slots every 30 minutes
    function generateTimeSlots(startTime, endTime) {
        let slots = [];
        let current = new Date(`2025-01-01T${startTime}`);
        let end = new Date(`2025-01-01T${endTime}`);

        while (current <= end) {
            let formattedTime = current.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            slots.push(formattedTime);
            current.setMinutes(current.getMinutes() + 30);
        }
        return slots;
    }

    // ✅ Generate Calendar
    function generateCalendar(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();

        const calendarGrid = document.getElementById("calendarGrid");
        calendarGrid.innerHTML = "";

        document.getElementById("currentMonth").textContent =
            date.toLocaleString("default", { month: "long", year: "numeric" });

        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement("div");
            emptyDay.className = "calendar-day";
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement("div");
            dayElement.className = "calendar-day";
            dayElement.textContent = day;

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize time to avoid conflicts
            const minDate = new Date(today);
            minDate.setDate(today.getDate() + 1); // Ensure at least 1 day before

            const currentDateObj = new Date(date.getFullYear(), date.getMonth(), day);

            if (currentDateObj.getTime() < minDate.getTime()) {
                dayElement.classList.add("disabled"); // Prevent selection of past & same-day dates
            } else {
                dayElement.addEventListener("click", () => selectDate(currentDateObj));
            }

            if (selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === date.getMonth() &&
                selectedDate.getFullYear() === date.getFullYear()) {
                dayElement.classList.add("selected");
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    function selectDate(date) {
        // Ensure the selected date is correct
        selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0); // Add 12:00 noon to avoid timezone shifts
        
        console.log("📌 Raw Selected Date Object:", selectedDate);
        console.log("🗓️ Corrected Selected Date:", 
            `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        ); 
        
        selectedPlace = null;
        selectedTimeSlot = null;
        generateCalendar(currentDate);
        updatePlaces();
        document.getElementById("availableSlotsText").textContent = "Select a time to see available slots.";
        document.getElementById("reservationTimeDropdown").innerHTML = `<option value="" disabled selected>Select Time</option>`;
    }
    
    function updatePlaces() {
        const placesList = document.getElementById("placesList");
        placesList.innerHTML = "";

        eventPlaces.forEach(place => {
            const placeElement = document.createElement("div");
            placeElement.className = "place-item";
            placeElement.textContent = place;
            placeElement.addEventListener("click", () => selectPlace(place));
            placesList.appendChild(placeElement);
        });
    }

    async function selectPlace(place) {
        selectedPlace = place;
        document.querySelectorAll(".place-item").forEach(item => {
            item.classList.toggle("selected", item.textContent === place);
        });
    
        if (selectedDate) {
            console.log(`✅ Fetching slots for: ${selectedDate.toISOString().split("T")[0]}`); // Debugging
            await updateTimeDropdown(); // ✅ Ensure it fetches the correct date
        } else {
            console.warn("⚠ No date selected yet!");
        }
    }
    
    async function updateTimeDropdown() {
        console.log("📌 Updating time dropdown...");
        
        const dropdown = document.getElementById("reservationTimeDropdown");
        dropdown.innerHTML = `<option value="" disabled selected>Loading...</option>`;
    
        if (!selectedDate || !selectedPlace) {
            console.warn("🚨 No date or place selected yet.");
            dropdown.innerHTML = `<option value="" disabled selected>Select Time</option>`;
            return;
        }
    
        const dayOfWeek = selectedDate.getDay();
        const slots = (dayOfWeek === 0) ? timeSlots.sunday : timeSlots.weekday;
        const formattedDate = selectedDate.toISOString().split("T")[0];
    
        dropdown.innerHTML = `<option value="" disabled selected>Select Time</option>`;
    
        for (const time of slots) {
            console.log(`⏳ Checking availability for ${time}...`);
    
            // Fetch only the available slots **within the session**
            const availableGuests = await fetchAvailableGuests(formattedDate, selectedPlace, time);
            const option = document.createElement("option");
            option.value = time;
            option.textContent = time;
    
            // ✅ Disable option if the session is fully booked
            if (availableGuests <= 0) {
                option.disabled = true;
                option.textContent += " (Fully Booked)";
            }
    
            dropdown.appendChild(option);
        }
    
        dropdown.addEventListener("change", function () {
            selectedTimeSlot = this.value;
            updateSlotAvailability();
        });
    
        console.log("✅ Time dropdown updated!");
    }
    
    async function fetchAvailableGuests(date, place, time) {
        try {
            // Ensure proper spacing in the time format (09:00 AM instead of 09:00AM)
            const formattedTime = time.replace(/(AM|PM)/, " $1");
    
            const apiUrl = `/api/dine-in-calendar/?date=${encodeURIComponent(date)}&place=${encodeURIComponent(place)}&time=${encodeURIComponent(formattedTime)}`;
            console.log(`🔍 Fetching available guests from: ${apiUrl}`); 
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
            const data = await response.json();
            console.log(`🟢 API Response:`, data);
    
            return data.available_slots; 
        } catch (error) {
            console.error("❌ Error fetching available guests:", error);
            return maxGuestsPerSlot;
        }
    }
    
    
    function updateSlotAvailability() {
        const availableText = document.getElementById("availableSlotsText");

        if (selectedTimeSlot) {
            fetchAvailableGuests(selectedDate.toISOString().split("T")[0], selectedPlace, selectedTimeSlot)
                .then(availableGuests => {
                    availableText.textContent = `Available Slots: ${availableGuests} Guests`;
                });
        } else {
            availableText.textContent = "Select a time to see available slots.";
        }
    }

    document.getElementById("prevMonth").addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        generateCalendar(currentDate);
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });

    document.getElementById("continueBtn").addEventListener("click", () => {
        if (selectedDate && selectedPlace && selectedTimeSlot) {
            const formattedDate = selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "2-digit"
            });

            Swal.fire({
                title: "Confirm Your Selection",
                html: `<p>Date: ${formattedDate}</p>
                       <p>Place: ${selectedPlace}</p>
                       <p>Time: ${selectedTimeSlot}</p>`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Continue",
                cancelButtonText: "Cancel"
            }).then((result) => {
                if (result.isConfirmed) {
                    const url = `/dine-in-reservation/?date=${selectedDate.toISOString().split("T")[0]}&place=${encodeURIComponent(selectedPlace)}&time=${encodeURIComponent(selectedTimeSlot)}`;
                    window.location.href = url;
                }
            });
        } else {
            Swal.fire("Error", "Please select a date, place, and time slot to continue.", "error");
        }
    });

    generateCalendar(currentDate);
    updatePlaces();
});