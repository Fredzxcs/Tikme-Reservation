// Calendar module
export class Calendar {
    constructor(options) {
        console.log('Initializing Calendar module'); // Debugging: Module loaded

        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.options = options || {};
        this.reservationsByDate = {};

        // DOM Elements
        this.currentMonthElement = document.getElementById('current-month');
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.calendarDays = document.getElementById('calendar-days');

        // Debugging: Check if DOM elements are found
        console.log('DOM Elements:', {
            currentMonthElement: this.currentMonthElement,
            prevMonthBtn: this.prevMonthBtn,
            nextMonthBtn: this.nextMonthBtn,
            calendarDays: this.calendarDays,
        });

        // Ensure elements are found
        if (!this.currentMonthElement || !this.prevMonthBtn || !this.nextMonthBtn || !this.calendarDays) {
            throw new Error("Required DOM elements are missing.");
        }

        // Bind event listeners
        this.prevMonthBtn.addEventListener('click', () => {
            console.log('Previous month button clicked'); // Debugging: Button click
            this.changeMonth(-1);
        });

        this.nextMonthBtn.addEventListener('click', () => {
            console.log('Next month button clicked'); // Debugging: Button click
            this.changeMonth(1);
        });

        this.calendarDays.addEventListener('click', (event) => {
            if (event.target.classList.contains('day') && !event.target.classList.contains('empty')) {
                const day = parseInt(event.target.textContent, 10);
                console.log('Day clicked:', day); // Debugging: Day clicked
                const newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
                this.selectDate(newDate);
            }
        });

        // Initial render
        console.log('Rendering initial calendar');
        this.generateCalendar();
    }

    changeMonth(delta) {
        console.log('Changing month by:', delta); // Debugging: Change month
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.generateCalendar();
    }

    generateCalendar() {
        console.log('Generating calendar for:', this.currentDate); // Debugging: Calendar generation

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.currentMonthElement.textContent = `${this.currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        console.log('Current Month:', this.currentMonthElement.textContent); // Debugging: Current month

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        console.log('First day of the month:', firstDay); // Debugging: First day
        console.log('Last day of the month:', lastDay);  // Debugging: Last day

        this.calendarDays.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            this.calendarDays.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            console.log('Adding day:', day); // Debugging: Adding day
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;

            const currentDateString = this.formatDateString(year, month, day);
            console.log('Formatted date string:', currentDateString); // Debugging: Date string

            if (this.reservationsByDate[currentDateString]) {
                console.log('Day has reservations:', currentDateString); // Debugging: Reservation day
                dayElement.classList.add('has-reservations');
            }

            if (day === this.selectedDate.getDate() &&
                month === this.selectedDate.getMonth() &&
                year === this.selectedDate.getFullYear()) {
                console.log('Day is selected:', day); // Debugging: Selected day
                dayElement.classList.add('selected');
            }

            const today = new Date();
            if (day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()) {
                console.log('Day is today:', day); // Debugging: Today
                dayElement.classList.add('today');
            }

            this.calendarDays.appendChild(dayElement);
        }
    }

    formatDateString(year, month, day) {
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        console.log('Formatted date:', formattedDate); // Debugging: Format date
        return formattedDate;
    }

    selectDate(date) {
        console.log('Selecting date:', date); // Debugging: Select date
        this.selectedDate = date;
        this.generateCalendar();
        if (this.options.onDateSelect) {
            this.options.onDateSelect(date);
        }
    }

    updateReservations(reservations) {
        console.log('Updating reservations:', reservations); // Debugging: Update reservations
        this.reservationsByDate = reservations;
        this.generateCalendar();
    }
}
