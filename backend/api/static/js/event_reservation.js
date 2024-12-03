let currentDate = new Date();
let selectedDate = new Date();
let reservationsByDate = {};
let currentSortOption = 'date';
let currentSearchTerm = '';

const currentMonthElement = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const calendarDays = document.getElementById('calendar-days');
const selectedDateElement = document.getElementById('selected-date');
const reservationsList = document.getElementById('reservations-list');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');

prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn.addEventListener('click', () => changeMonth(1));
sortSelect.addEventListener('change', handleSort);
searchInput.addEventListener('input', handleSearch);

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    generateCalendar();
}

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthElement.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    calendarDays.innerHTML = '';
    
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarDays.appendChild(document.createElement('div'));
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.textContent = day;
        
        const currentDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (reservationsByDate[currentDateString]) {
            dayElement.classList.add('has-reservations');
        }
        
        if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
            dayElement.classList.add('selected');
        }
        
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', () => selectDate(new Date(year, month, day)));
        
        calendarDays.appendChild(dayElement);
    }
}

function selectDate(date) {
    selectedDate = date;
    generateCalendar();
    updateReservationsDisplay();
}

function updateReservationsDisplay() {
    const dateString = selectedDate.toISOString().split('T')[0];
    selectedDateElement.textContent = `Reservations for ${selectedDate.toLocaleDateString()}`;
    
    const reservations = reservationsByDate[dateString] || [];
    
    if (reservations.length === 0) {
        reservationsList.innerHTML = '<p>No reservations for this date.</p>';
    } else {
        reservationsList.innerHTML = `
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
                    ${reservations.map((reservation, index) => `
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
                                        onchange="updateOngoingStatus('${dateString}', ${index}, this.checked)"
                                    >
                                </label>
                            </td>
                            <td>
                                <button class="action-btn view" onclick="viewReservation('${dateString}', ${index})">View</button>
                                <button class="action-btn edit" onclick="editReservation('${dateString}', ${index})">Edit</button>
                                <button class="action-btn cancel" onclick="cancelReservation('${dateString}', ${index})">Cancel</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

function handleSort() {
    currentSortOption = sortSelect.value;
    updateAllReservations();
}

function handleSearch() {
    currentSearchTerm = searchInput.value.toLowerCase();
    updateAllReservations();
}

function updateAllReservations() {
    const allReservationsTable = document.getElementById('all-reservations-table').getElementsByTagName('tbody')[0];
    allReservationsTable.innerHTML = '';
    
    let allReservations = [];
    for (const [date, reservations] of Object.entries(reservationsByDate)) {
        reservations.forEach((reservation, index) => {
            allReservations.push({ date, index, ...reservation });
        });
    }
    
    // Filter reservations based on search term
    allReservations = allReservations.filter(reservation => 
        reservation.customerName.toLowerCase().includes(currentSearchTerm) ||
        reservation.type.toLowerCase().includes(currentSearchTerm) ||
        reservation.contactNumber.includes(currentSearchTerm) ||
        formatDate(reservation.date).toLowerCase().includes(currentSearchTerm)
    );

    // Sort reservations
    switch (currentSortOption) {
        case 'date':
            allReservations.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            allReservations.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'name':
            allReservations.sort((a, b) => a.customerName.localeCompare(b.customerName));
            break;
        case 'name-desc':
            allReservations.sort((a, b) => b.customerName.localeCompare(a.customerName));
            break;
        case 'type':
            allReservations.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'type-desc':
            allReservations.sort((a, b) => b.type.localeCompare(a.type));
            break;
    }
    
    // Render reservations
    allReservations.forEach(reservation => {
        const row = allReservationsTable.insertRow();
        row.innerHTML = `
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.type}</td>
            <td>${reservation.customerName}</td>
            <td>${reservation.contactNumber}</td>
            <td>
                <label class="ongoing-label">
                    <input type="checkbox" class="ongoing-checkbox" ${reservation.ongoing ? 'checked' : ''} onchange="updateOngoingStatus('${reservation.date}', ${reservation.index}, this.checked)">
                </label>
            </td>
            <td>
                <button class="action-btn view" onclick="viewReservation('${reservation.date}', ${reservation.index}')">
                    View
                </button>
                <button class="action-btn edit" onclick="editReservation('${reservation.date}', ${reservation.index}')">
                    Edit
                </button>
                <button class="action-btn cancel" onclick="cancelReservation('${reservation.date}', ${reservation.index}')">
                    Cancel
                </button>
            </td>
        `;
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function viewReservation(date, index) {
    const reservation = reservationsByDate[date][index];
    const modal = createViewModal('View Reservation', reservation);
    modal.show();
}

function editReservation(date, index) {
    const reservation = reservationsByDate[date][index];
    const modal = createEditModal('Edit Reservation', reservation, (formData) => {
        reservationsByDate[date][index] = { ...reservationsByDate[date][index], ...formData };
        updateReservationsDisplay();
        updateAllReservations();
    });
    modal.show();
}

function cancelReservation(date, index) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
        reservationsByDate[date].splice(index, 1);
        if (reservationsByDate[date].length === 0) {
            delete reservationsByDate[date];
        }
        updateReservationsDisplay();
        updateAllReservations();
    }
}

function updateOngoingStatus(date, index, isOngoing) {
    reservationsByDate[date][index].ongoing = isOngoing;
    updateAllReservations();
}

function populateTemporaryData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    reservationsByDate = {
        [today.toISOString().split('T')[0]]: [
            { time: '10:00 AM', type: 'Meeting', customerName: 'John Doe', contactNumber : '123-456-7890', ongoing: false },
            { time: '2:00 PM', type: 'Event', customerName: 'Jane Smith', contactNumber: '098-765-4321', ongoing: true }
        ],
        [tomorrow.toISOString().split('T')[0]]: [
            { time: '11:30 AM', type: 'Conference', customerName: 'Bob Johnson', contactNumber: '555-123-4567', ongoing: false }
        ]
    };
}

document.addEventListener('DOMContentLoaded', () => {
    populateTemporaryData();
    generateCalendar();
    updateReservationsDisplay();
    updateAllReservations();
});

function createViewModal(title, reservation) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="exit-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Type of Event:</label>
                    <p>${reservation.type}</p>
                </div>
                <div class="form-group">
                    <label>Customer Name:</label>
                    <p>${reservation.customerName}</p>
                </div>
                <div class="form-group">
                    <label>Contact Number:</label>
                    <p>${reservation.contactNumber}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.exit-btn');
    const closeButton = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    return {
        show: () => {
            modal.style.display = 'flex';
        }
    };
}

function createEditModal(title, reservation, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="exit-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="eventType">Type of Event:</label>
                    <input type="text" id="eventType" class="form-input" value="${reservation.type}">
                </div>
                <div class="form-group">
                    <label for="customerName">Customer Name:</label>
                    <input type="text" id="customerName" class="form-input" value="${reservation.customerName}">
                </div>
                <div class="form-group">
                    <label for="contactNumber">Contact Number:</label>
                    <input type="text" id="contactNumber" class="form-input" value="${reservation.contactNumber}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn">Cancel</button>
                <button class="save-btn">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const closeBtn = modal.querySelector('.exit-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const saveBtn = modal.querySelector('.save-btn');

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    saveBtn.addEventListener('click', () => {
        const formData = {
            type: modal.querySelector('#eventType').value,
            customerName: modal.querySelector('#customerName').value,
            contactNumber: modal.querySelector('#contactNumber').value
        };

        if (formData.type && formData.customerName && formData.contactNumber) {
            onSave(formData);
            modal.remove();
        } else {
            alert('Please fill in all fields');
        }
    });

    return {
        show: () => {
            modal.style.display = 'flex';
        }
    };
}

window.viewReservation = viewReservation;
window.editReservation = editReservation;
window.cancelReservation = cancelReservation;
window.updateOngoingStatus = updateOngoingStatus;

export { createViewModal, createEditModal };
