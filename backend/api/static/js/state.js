import { mockReservations } from './mockData.js';

// Global state management
export const state = {
    currentDate: new Date(),
    selectedDate: new Date(),
    reservationsByDate: {},
    currentSortOption: 'date',
    currentSearchTerm: ''
};

// Initialize with temporary data
export function initializeData() {
    state.reservationsByDate = mockReservations();
}