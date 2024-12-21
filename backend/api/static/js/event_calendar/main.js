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
        // Redirect to event reservation page
        window.location.href = "/event_reservation/";

    } else {
        alert('Please select a date, place, and time slot to continue.');
    }
});

// Initialize calendar and places
generateCalendar(currentDate);
updatePlaces();
