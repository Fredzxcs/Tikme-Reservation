import { state } from './state.js';
import { formatDate } from './utils.js';
import { createViewModal, createEditModal } from './modals.js';

const selectedDateElement = document.getElementById('selected-date');
const reservationsList = document.getElementById('reservations-list');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');

export function initializeReservations() {
    sortSelect.addEventListener('change', handleSort);
    searchInput.addEventListener('input', handleSearch);
}

export function updateReservationsDisplay() {
    const dateString = state.selectedDate.toISOString().split('T')[0];
    selectedDateElement.textContent = `Reservations for ${state.selectedDate.toLocaleDateString()}`;
    
    const reservations = state.reservationsByDate[dateString] || [];
    
    if (reservations.length === 0) {
        reservationsList.innerHTML = '<p>No reservations for this date.</p>';
        return;
    }

    reservationsList.innerHTML = generateReservationsTable(dateString, reservations);
}

function generateReservationsTable(dateString, reservations) {
    return `
        <table class="daily-reservations-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Ongoing</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${reservations.map((reservation, index) => generateReservationRow(dateString, reservation, index)).join('')}
            </tbody>
        </table>
    `;
}

function generateReservationRow(dateString, reservation, index) {
    return `
        <tr>
            <td>${reservation.time}</td>
            <td>${reservation.type}</td>
            <td>${reservation.customerName}</td>
            <td>${reservation.contactNumber}</td>
            <td>
                <label class="ongoing-label">
                    <input 
                        type="checkbox" 
                        class="ongoing-checkbox" 
                        ${reservation.ongoing ? 'checked' : ''} 
                        onchange="window.updateOngoingStatus('${dateString}', ${index}, this.checked)"
                    >
                </label>
            </td>
            <td>
                <button class="action-btn view" onclick="window.viewReservation('${dateString}', ${index})">View</button>
                <button class="action-btn edit" onclick="window.editReservation('${dateString}', ${index})">Edit</button>
                <button class="action-btn cancel" onclick="window.cancelReservation('${dateString}', ${index})">Cancel</button>
            </td>
        </tr>
    `;
}

function handleSort() {
    state.currentSortOption = sortSelect.value;
    updateAllReservations();
}

function handleSearch() {
    state.currentSearchTerm = searchInput.value.toLowerCase();
    updateAllReservations();
}

export function updateAllReservations() {
    const allReservationsTable = document.getElementById('all-reservations-table').getElementsByTagName('tbody')[0];
    allReservationsTable.innerHTML = '';
    
    let allReservations = getAllReservations();
    allReservations = filterReservations(allReservations);
    sortReservations(allReservations);
    
    allReservations.forEach(reservation => {
        const row = allReservationsTable.insertRow();
        row.innerHTML = generateAllReservationsRow(reservation);
    });
}

function getAllReservations() {
    const allReservations = [];
    for (const [date, reservations] of Object.entries(state.reservationsByDate)) {
        reservations.forEach((reservation, index) => {
            allReservations.push({ date, index, ...reservation });
        });
    }
    return allReservations;
}

function filterReservations(reservations) {
    return reservations.filter(reservation => 
        reservation.customerName.toLowerCase().includes(state.currentSearchTerm) ||
        reservation.type.toLowerCase().includes(state.currentSearchTerm) ||
        reservation.contactNumber.includes(state.currentSearchTerm) ||
        formatDate(reservation.date).toLowerCase().includes(state.currentSearchTerm)
    );
}

function sortReservations(reservations) {
    switch (state.currentSortOption) {
        case 'date':
            reservations.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'name':
            reservations.sort((a, b) => a.customerName.localeCompare(b.customerName));
            break;
        case 'name-desc':
            reservations.sort((a, b) => b.customerName.localeCompare(a.customerName));
            break;
        case 'type':
            reservations.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'type-desc':
            reservations.sort((a, b) => b.type.localeCompare(a.type));
            break;
    }
}

function generateAllReservationsRow(reservation) {
    return `
        <td>${formatDate(reservation.date)}</td>
        <td>${reservation.type}</td>
        <td>${reservation.customerName}</td>
        <td>${reservation.contactNumber}</td>
        <td>
            <label class="ongoing-label">
                <input type="checkbox" class="ongoing-checkbox" 
                    ${reservation.ongoing ? 'checked' : ''} 
                    onchange="window.updateOngoingStatus('${reservation.date}', ${reservation.index}, this.checked)">
            </label>
        </td>
        <td>
            <button class="action-btn view" onclick="window.viewReservation('${reservation.date}', ${reservation.index}')">
                View
            </button>
            <button class="action-btn edit" onclick="window.editReservation('${reservation.date}', ${reservation.index}')">
                Edit
            </button>
            <button class="action-btn cancel" onclick="window.cancelReservation('${reservation.date}', ${reservation.index}')">
                Cancel
            </button>
        </td>
    `;
}

// Global functions for event handlers
window.viewReservation = (date, index) => {
    const reservation = state.reservationsByDate[date][index];
    const modal = createViewModal('View Reservation', reservation);
    modal.show();
};

window.editReservation = (date, index) => {
    const reservation = state.reservationsByDate[date][index];
    const modal = createEditModal('Edit Reservation', reservation, (formData) => {
        state.reservationsByDate[date][index] = { ...state.reservationsByDate[date][index], ...formData };
        updateReservationsDisplay();
        updateAllReservations();
    });
    modal.show();
};

window.cancelReservation = (date, index) => {
    if (confirm('Are you sure you want to cancel this reservation?')) {
        state.reservationsByDate[date].splice(index, 1);
        if (state.reservationsByDate[date].length === 0) {
            delete state.reservationsByDate[date];
        }
        updateReservationsDisplay();
        updateAllReservations();
    }
};

window.updateOngoingStatus = (date, index, isOngoing) => {
    state.reservationsByDate[date][index].ongoing = isOngoing;
    updateAllReservations();
};