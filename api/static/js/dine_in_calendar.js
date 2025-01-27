document.addEventListener("DOMContentLoaded", () => {
    let selectedDate = null;
    let selectedPlace = null;
    let selectedTimeSlot = null;

    // Operating hours based on the day
    const timeSlots = {
        weekday: [
            '9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am',
            '12:00pm', '12:30pm', '1:00pm', '1:30pm', '2:00pm', '2:30pm',
            '3:00pm', '3:30pm', '4:00pm', '4:30pm', '5:00pm', '5:30pm',
            '6:00pm', '6:30pm', '7:00pm', '7:30pm', '8:00pm'
        ],
        sunday: [
            '9:00am', '9:30am', '10:00am', '10:30am', '11:00am', '11:30am',
            '12:00pm', '12:30pm', '1:00pm', '1:30pm', '2:00pm', '2:30pm',
            '3:00pm', '3:30pm', '4:00pm', '4:30pm', '5:00pm', '5:30pm',
            '6:00pm', '6:30pm', '7:00pm', '7:30pm', '8:00pm', '8:30pm', '9:00pm'
        ]
    };

    const eventPlaces = ['Air Conditioning', 'Alfresco'];
    let currentDate = new Date();

    // Generate Calendar
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
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const currentDateObj = new Date(date.getFullYear(), date.getMonth(), day);
            const today = new Date();

            if (currentDateObj <= today || isWithinRestrictedDays(currentDateObj)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(currentDateObj));
            }

            if (selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === date.getMonth() &&
                selectedDate.getFullYear() === date.getFullYear()) {
                dayElement.classList.add('selected');
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    function isWithinRestrictedDays(date) {
        const today = new Date();
        const restrictedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
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
        placesList.innerHTML = '';

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

        const dayOfWeek = selectedDate.getDay();
        const slots = dayOfWeek === 0 ? timeSlots.sunday : timeSlots.weekday;

        slots.forEach(time => {
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

    // Navigation and Continue Button
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
                html: `<p>Date: ${selectedDate.toDateString()}</p>
                       <p>Place: ${selectedPlace}</p>
                       <p>Time: ${selectedTimeSlot}</p>`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Continue',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    const url = `/dine-in-reservation/?date=${selectedDate.toISOString()}&place=${encodeURIComponent(selectedPlace)}&time=${encodeURIComponent(selectedTimeSlot)}`;
                    window.location.href = url;
                }
            });
        } else {
            Swal.fire('Error', 'Please select a date, place, and time slot to continue.', 'error');
        }
    });

    generateCalendar(currentDate);
    updatePlaces();
});