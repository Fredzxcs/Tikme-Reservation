document.addEventListener('DOMContentLoaded', function () {
    const reservationsByDate = {
        '2024-11-29': [
            {
                type: 'Birthday Party',
                customerName: 'John Smith',
                contactNumber: '123-456-7890'
            },
            {
                type: 'Wedding Reception',
                customerName: 'Mary Johnson',
                contactNumber: '234-567-8901'
            },
            {
                type: 'Corporate Event',
                customerName: 'Tech Corp',
                contactNumber: '345-678-9012'
            },
            {
                type: 'Anniversary Party',
                customerName: 'David & Sarah',
                contactNumber: '456-789-0123'
            }
        ],
        '2024-11-14': [
            {
                type: 'Birthday Party',
                customerName: 'Alice Brown',
                contactNumber: '567-890-1234'
            }
        ],
        '2024-12-05': [
            {
                type: 'Christmas Party',
                customerName: 'XYZ Company',
                contactNumber: '678-901-2345'
            }
        ],
        '2024-12-20': [
            {
                type: 'New Year Eve Party',
                customerName: 'City Hall',
                contactNumber: '789-012-3456'
            }
        ]
    };

    let currentDate = new Date(2024, 10, 29);
    let selectedDate = new Date(2024, 10, 29);

    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentMonthElement = document.getElementById('currentMonth');
    const sortSelect = document.getElementById('sortSelect');

    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
    sortSelect.addEventListener('change', handleSort);

    let currentSortOption = 'date';

    function changeMonth(delta) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        generateCalendar();
    }

    function generateCalendar() {
        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        currentMonthElement.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day other-month';
            daysContainer.appendChild(emptyDay);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = i;

            const currentDateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;

            if (reservationsByDate[currentDateString]) {
                dayElement.classList.add('highlighted');
            }

            if (i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }

            dayElement.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                generateCalendar();
                updateReservationsDisplay();
            });

            daysContainer.appendChild(dayElement);
        }
    }

    function updateReservationsDisplay() {
        const dateString = selectedDate.toISOString().split('T')[0];
        const reservations = reservationsByDate[dateString] || [];
        const reservationsList = document.getElementById('reservations-list');
        const selectedDateElement = document.getElementById('selected-date');

        selectedDateElement.textContent = `${selectedDate.toLocaleString('default', { month: 'long' }).toUpperCase()} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

        reservationsList.innerHTML = `
            <table class="daily-reservations-table">
                <thead>
                    <tr>
                        <th>Type of Event</th>
                        <th>Customer Name</th>
                        <th>Contact Number</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        `;

        const tableBody = reservationsList.querySelector('tbody');

        if (reservations.length === 0) {
            const noReservationsRow = document.createElement('tr');
            noReservationsRow.innerHTML = '<td colspan="4" class="no-reservations">No reservations for this date</td>';
            tableBody.appendChild(noReservationsRow);
        } else {
            reservations.forEach((reservation, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reservation.type}</td>
                    <td>${reservation.customerName}</td>
                    <td>${reservation.contactNumber}</td>
                    <td>
                        <button class="edit-btn" onclick="editReservation('${dateString}', ${index})">
                            Edit
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

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

        // Sort based on selected option
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

        allReservations.forEach(reservation => {
            const row = allReservationsTable.insertRow();
            row.innerHTML = `
                <td>${formatDate(reservation.date)}</td>
                <td>${reservation.type}</td>
                <td>${reservation.customerName}</td>
                <td>${reservation.contactNumber}</td>
                <td>
                    <button class="edit-btn" onclick="editReservation('${reservation.date}', ${reservation.index})">
                        Edit
                    </button>
                </td>
            `;
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function handleSort(event) {
        currentSortOption = event.target.value;
        updateAllReservations();
    }

    function openEditForm(date, index, reservation) {
        const newType = prompt('Edit Type of Event:', reservation.type);
        const newCustomerName = prompt('Edit Customer Name:', reservation.customerName);
        const newContactNumber = prompt('Edit Contact Number:', reservation.contactNumber);

        if (newType && newCustomerName && newContactNumber) {
            reservationsByDate[date][index] = {
                type: newType,
                customerName: newCustomerName,
                contactNumber: newContactNumber
            };
            updateReservationsDisplay();
        }
    }

    window.editReservation = function(date, index) {
        const reservation = reservationsByDate[date][index];
        openEditForm(date, index, reservation);
    };

    generateCalendar();
    updateReservationsDisplay();
});