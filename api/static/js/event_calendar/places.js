let selectedPlace = null;

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