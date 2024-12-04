// API module
export class ReservationAPI {
    constructor() {
        // Initialization logic if needed
        console.log('ReservationAPI initialized');
    }

    async fetchReservations() {
        try {
            // For development, return mock data
            const { getMockReservations } = await import('./mockData.js');
            return getMockReservations();
        } catch (error) {
            console.error('Error fetching reservations:', error);
            return [];
        }
    }

    async fetchReservationsByDate(date) {
        try {
            const dateStr = this.formatDateForAPI(date);
            // For development, filter mock data by date
            const { getMockReservations } = await import('./mockData.js');
            const allReservations = getMockReservations();
            return allReservations.filter(res => res.fields.date === dateStr);
        } catch (error) {
            console.error('Error fetching reservations by date:', error);
            return [];
        }
    }

    async createReservation(reservationData) {
        try {
            const response = await fetch('/api/reservations/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating reservation:', error);
            throw error;
        }
    }

    async updateReservation(id, reservationData) {
        try {
            const response = await fetch(`/api/reservations/${id}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating reservation:', error);
            throw error;
        }
    }

    async deleteReservation(id) {
        try {
            const response = await fetch(`/api/reservations/${id}/delete/`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting reservation:', error);
            throw error;
        }
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }
}
