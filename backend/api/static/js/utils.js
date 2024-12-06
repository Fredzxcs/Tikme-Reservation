// Utility functions
export function formatDateForDisplay(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function groupReservationsByDate(reservations) {
    const grouped = {};
    reservations.forEach(reservation => {
        const dateKey = reservation.fields.date;
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(reservation.fields);
    });
    return grouped;
}