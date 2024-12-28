let currentDate = new Date();
let selectedDate = null;

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
        
        if (currentDateObj.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        if (currentDateObj < today) {
            dayElement.classList.add('disabled');
        } else {
            if (day % 2 === 0) {
                dayElement.classList.add('has-slots');
            }

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

function selectDate(date) {
    selectedDate = date;
    selectedPlace = null;
    selectedTimeSlot = null;
    generateCalendar(currentDate);
    updatePlaces();
    clearTimeSlots();
    document.getElementById('timeSlots').classList.remove('visible');
}