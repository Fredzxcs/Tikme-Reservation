document.addEventListener("DOMContentLoaded", () => {
    let selectedDate = null;
    let selectedPlace = null;
    let selectedTimeSlot = null;
    const eventPlaces = ["Air Conditioning", "Alfresco"];
    let currentDate = new Date();

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
            today.setHours(0, 0, 0, 0);
            const minDate = new Date(today);
            minDate.setDate(today.getDate() + 1);

            const currentDateObj = new Date(date.getFullYear(), date.getMonth(), day);

            if (currentDateObj.getTime() < minDate.getTime()) {
                dayElement.classList.add("disabled");
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
        selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        
        console.log("📌 Selected Date:", selectedDate.toISOString().split("T")[0]);
        
        selectedPlace = null;
        selectedTimeSlot = null;
        generateCalendar(currentDate);
        updatePlaces();
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
            console.log(`✅ Fetching slots for: ${selectedDate.toISOString().split("T")[0]}`);
            await updateTimeSlots();
        } else {
            console.warn("⚠ No date selected yet!");
        }
    }
    
    async function updateTimeSlots() {
        console.log("📌 Updating time slots...");

        if (!selectedDate || !selectedPlace) {
            console.warn("🚨 No date or place selected yet.");
            return;
        }

        const formattedDate = selectedDate.toISOString().split("T")[0];

        document.getElementById("morningSlots").textContent = "Loading...";
        document.getElementById("afternoonSlots").textContent = "Loading...";
        document.getElementById("eveningSlots").textContent = "Loading...";
        
        try {
            const response = await fetch(`/api/dine-in-calendar/?date=${encodeURIComponent(formattedDate)}&place=${encodeURIComponent(selectedPlace)}`);
            const data = await response.json();

            console.log("🟢 Available Slots Data:", data);

            document.getElementById("morningSlots").textContent = `${data.available_slots.Morning} Slots Available`;
            document.getElementById("afternoonSlots").textContent = `${data.available_slots.Afternoon} Slots Available`;
            document.getElementById("eveningSlots").textContent = `${data.available_slots.Evening} Slots Available`;

            generateSessionTimes("morningTimes", "Morning", data.available_slots.Morning);
            generateSessionTimes("afternoonTimes", "Afternoon", data.available_slots.Afternoon);
            generateSessionTimes("eveningTimes", "Evening", data.available_slots.Evening);

        } catch (error) {
            console.error("❌ Error fetching available slots:", error);
        }
    }
    
    function generateSessionTimes(containerId, session, availableSlots) {
        const timeContainer = document.getElementById(containerId);
        timeContainer.innerHTML = "";

        const timeSlots = {
            "Morning": ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM"],
            "Afternoon": ["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"],
            "Evening": ["05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM"]
        };

        timeSlots[session].forEach(time => {
            const button = document.createElement("button");
            button.className = "time-slot";
            button.textContent = time;

            if (availableSlots <= 0) {
                button.disabled = true;
                button.textContent += " (Fully Booked)";
            }

            button.addEventListener("click", (event) => selectTimeSlot(event, time));
            timeContainer.appendChild(button);
        });
    }

    function selectTimeSlot(event, time) {
        selectedTimeSlot = time;
        document.querySelectorAll(".time-slot").forEach(btn => btn.classList.remove("selected"));
        event.target.classList.add("selected");
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
            Swal.fire({
                title: "Confirm Your Selection",
                html: `<p>Date: ${selectedDate.toDateString()}</p>
                       <p>Place: ${selectedPlace}</p>
                       <p>Time: ${selectedTimeSlot}</p>`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Continue",
                cancelButtonText: "Cancel"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = `/dine-in-reservation/?date=${selectedDate.toISOString().split("T")[0]}&place=${encodeURIComponent(selectedPlace)}&time=${encodeURIComponent(selectedTimeSlot)}`;
                }
            });
        } else {
            Swal.fire("Error", "Please select a date, place, and time slot to continue.", "error");
        }
    });

    generateCalendar(currentDate);
    updatePlaces();
});
