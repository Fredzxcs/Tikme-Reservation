import { Calendar } from './calendar.js';
import { ReservationAPI } from './api.js';
import { formatDateForDisplay, groupReservationsByDate } from './utils.js';
import { createViewModal, createEditModal } from './modals.js';

class ReservationSystem {
    constructor() {
        this.api = new ReservationAPI();
        this.selectedDateElement = document.getElementById('selected-date');
        this.reservationsList = document.getElementById('reservations-list');
        this.sortSelect = document.getElementById('sortSelect');
        this.searchInput = document.getElementById('searchInput');
        
        this.calendar = new Calendar({
            onDateSelect: (date) => this.handleDateSelect(date)
        });
        
        this.sortSelect.addEventListener('change', () => this.handleSort());
        this.searchInput.addEventListener('input', () => this.handleSearch());
        
        this.initialize();
    }
    
    async initialize() {
        try {
            const reservations = await this.api.fetchReservations();
            const groupedReservations = groupReservationsByDate(reservations);
            this.calendar.updateReservations(groupedReservations);
            await this.handleDateSelect(new Date());
            this.updateAllReservations();
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }
    
    async handleDateSelect(date) {
        this.selectedDateElement.textContent = `Reservations for ${formatDateForDisplay(date)}`;
        const reservations = await this.api.fetchReservationsByDate(date);
        this.updateReservationsDisplay(reservations);
    }
    
    handleSort() {
        this.updateAllReservations();
    }
    
    handleSearch() {
        this.updateAllReservations();
    }
    
    updateReservationsDisplay(reservations = []) {
        if (reservations.length === 0) {
            this.reservationsList.innerHTML = '<p>No reservations for this date.</p>';
            return;
        }
        
        this.reservationsList.innerHTML = `
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
                    ${reservations.map(this.generateReservationRow).join('')}
                </tbody>
            </table>
        `;
    }
    
    generateReservationRow(reservation) {
        const { fields, pk } = reservation;
        return `
            <tr>
                <td>${fields.time}</td>
                <td>${fields.type}</td>
                <td>${fields.customer_name}</td>
                <td>${fields.contact_number}</td>
                <td>
                    <label class="ongoing-label">
                        <input type="checkbox" 
                               class="ongoing-checkbox" 
                               ${fields.ongoing ? 'checked' : ''} 
                               onchange="window.reservationSystem.updateOngoingStatus(${pk}, this.checked)">
                    </label>
                </td>
                <td>
                    <button class="action-btn view" onclick="window.reservationSystem.viewReservation(${pk})">View</button>
                    <button class="action-btn edit" onclick="window.reservationSystem.editReservation(${pk})">Edit</button>
                    <button class="action-btn cancel" onclick="window.reservationSystem.cancelReservation(${pk})">Cancel</button>
                </td>
            </tr>
        `;
    }
    
    async updateAllReservations() {
        const allReservations = await this.api.fetchReservations();
        const filteredReservations = this.filterReservations(allReservations);
        const sortedReservations = this.sortReservations(filteredReservations);
        
        const tbody = document.querySelector('#all-reservations-table tbody');
        tbody.innerHTML = sortedReservations.map(this.generateReservationRow).join('');
    }
    
    filterReservations(reservations) {
        const searchTerm = this.searchInput.value.toLowerCase();
        return reservations.filter(reservation => {
            const fields = reservation.fields;
            return fields.customer_name.toLowerCase().includes(searchTerm) ||
                   fields.type.toLowerCase().includes(searchTerm) ||
                   fields.contact_number.includes(searchTerm) ||
                   fields.date.toLowerCase().includes(searchTerm);
        });
    }
    
    sortReservations(reservations) {
        const sortOption = this.sortSelect.value;
        return [...reservations].sort((a, b) => {
            const aFields = a.fields;
            const bFields = b.fields;
            
            switch (sortOption) {
                case 'date':
                    return new Date(aFields.date) - new Date(bFields.date);
                case 'date-desc':
                    return new Date(bFields.date) - new Date(aFields.date);
                case 'name':
                    return aFields.customer_name.localeCompare(bFields.customer_name);
                case 'name-desc':
                    return bFields.customer_name.localeCompare(aFields.customer_name);
                case 'type':
                    return aFields.type.localeCompare(bFields.type);
                case 'type-desc':
                    return bFields.type.localeCompare(aFields.type);
                default:
                    return 0;
            }
        });
    }

    async viewReservation(pk) {
        const reservations = await this.api.fetchReservations();
        const reservation = reservations.find(r => r.pk === pk);
        if (reservation) {
            const modal = createViewModal('Reservation Details', {
                type: reservation.fields.type,
                customerName: reservation.fields.customer_name,
                contactNumber: reservation.fields.contact_number
            });
            modal.show();
        } else {
            console.error('Reservation not found:', pk);
        }
    }

    async editReservation(pk) {
        const reservations = await this.api.fetchReservations();
        const reservation = reservations.find(r => r.pk === pk);
        if (reservation) {
            const modal = createEditModal('Edit Reservation', {
                type: reservation.fields.type,
                customerName: reservation.fields.customer_name,
                contactNumber: reservation.fields.contact_number
            }, async (formData) => {
                try {
                    await this.api.updateReservation(pk, formData);
                    this.initialize();
                    alert('Reservation updated successfully');
                } catch (error) {
                    console.error('Failed to update reservation:', error);
                }
            });
            modal.show();
        } else {
            console.error('Reservation not found:', pk);
        }
    }

    async cancelReservation(pk) {
        if (confirm('Are you sure you want to cancel this reservation?')) {
            try {
                await this.api.deleteReservation(pk);
                this.initialize();
            } catch (error) {
                console.error('Failed to cancel reservation:', error);
            }
        }
    }

    async updateOngoingStatus(pk, isOngoing) {
        try {
            await this.api.updateReservation(pk, { ongoing: isOngoing });
            this.initialize();
        } catch (error) {
            console.error('Failed to update ongoing status:', error);
        }
    }
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reservationSystem = new ReservationSystem();
});
