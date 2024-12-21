let selectedTimeSlot = null;

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