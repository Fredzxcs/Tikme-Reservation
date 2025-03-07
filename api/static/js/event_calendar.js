document.addEventListener("DOMContentLoaded", async () => {
    let selectedDate = null;
    let selectedPlace = null;
    let selectedTimeSlot = null;
    let reservedDates = new Set(); // Stores fully booked dates

    const timeSlots = [
        '9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am',
        '12:00pm', '12:30pm', '1:00pm', '1:30pm', '2:00pm', '2:30pm',
        '3:00pm', '3:30pm', '4:00pm', '4:30pm', '5:00pm', '5:30pm'
    ];

    const eventPlaces = [
        'Violeta', 'Sampaguita', 'Rosas', 'Rosas Extension',
        'Bougainvillea Lounge', 'Bougainvillea Balcony',
        'African Talisay Trellis', 'Private Room', 'Royal Cafe'
    ];

    let currentDate = new Date();

    // ✅ Fetch reserved dates from the backend
    async function fetchReservedDates() {
        try {
            const response = await fetch('/api/event-reservation/');
            if (!response.ok) throw new Error("Failed to fetch reservations.");
            const reservations = await response.json();

            reservedDates = new Set(reservations.map(res => res.reservation_date));
            generateCalendar(currentDate); // Refresh calendar
        } catch (error) {
            console.error("Error fetching reserved dates:", error);
        }
    }

    function generateCalendar(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();

        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        document.getElementById('currentMonth').textContent =
            date.toLocaleString('default', { month: 'long', year: 'numeric' });

        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const currentDateObj = new Date(date.getFullYear(), date.getMonth(), day);
            const today = new Date();
            const formattedDate = formatDateForComparison(currentDateObj);

            if (currentDateObj < today || reservedDates.has(formattedDate) || isWithinRestrictedDays(currentDateObj)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(currentDateObj));
            }

            if (selectedDate && formattedDate === formatDateForComparison(selectedDate)) {
                dayElement.classList.add('selected');
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    function formatDateForComparison(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isWithinRestrictedDays(date) {
        const today = new Date();
        const restrictedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
        return date < restrictedStart;
    }

    function selectDate(date) {
        selectedDate = date;
        selectedPlace = null;
        selectedTimeSlot = null;
        generateCalendar(currentDate);
        updatePlaces();
        clearTimeSlots();
        document.getElementById('timeSlots').classList.remove('visible');
    }

    function updatePlaces() {
        const placesList = document.getElementById('placesList');
        placesList.innerHTML = ''; // ✅ Clear previous list

        eventPlaces.forEach(place => {
            const placeElement = document.createElement('div');
            placeElement.className = 'place-item';
            placeElement.textContent = place;
            placeElement.addEventListener('click', () => selectPlace(place));
            placesList.appendChild(placeElement);
        });
    }

    function selectPlace(place) {
        selectedPlace = place;
        document.querySelectorAll('.place-item').forEach(item => {
            item.classList.toggle('selected', item.textContent === place);
        });
        updateTimeSlots();
        document.getElementById('timeSlots').classList.add('visible');
    }

    function updateTimeSlots() {
        const container = document.getElementById('timeSlotContainer');
        container.innerHTML = '';

        if (!selectedDate || !selectedPlace) return;

        timeSlots.forEach(time => {
            const slot = document.createElement('button');
            slot.className = 'time-slot';
            if (time === selectedTimeSlot) {
                slot.classList.add('selected');
            }
            slot.textContent = time;
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                selectedTimeSlot = time;
            });
            container.appendChild(slot);
        });
    }

    function clearTimeSlots() {
        const container = document.getElementById('timeSlotContainer');
        container.innerHTML = '';
    }

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        generateCalendar(currentDate);
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });

    document.getElementById('continueBtn').addEventListener('click', () => {
        if (selectedDate && selectedPlace && selectedTimeSlot) {
            Swal.fire({
                title: 'Confirm Your Selection',
                html: `<p>Date: ${selectedDate.toLocaleDateString('en-CA')}</p>
                       <p>Place: ${selectedPlace}</p>
                       <p>Time: ${selectedTimeSlot}</p>`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Continue',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = `/event-reservation/?date=${encodeURIComponent(formatDateForComparison(selectedDate))}&place=${encodeURIComponent(selectedPlace)}&time=${encodeURIComponent(selectedTimeSlot)}`;
                }
            });
        } else {
            Swal.fire('Error', 'Please select a date, place, and time slot to continue.', 'error');
        }
    });

    await fetchReservedDates(); // ✅ Load reserved dates before generating calendar
});
