// Mock data module
export function getMockReservations() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = formatDateString(today);
    const tomorrowStr = formatDateString(tomorrow);
    
    return [
        {
            pk: 1,
            fields: {
                date: todayStr,
                time: '10:00',
                type: 'Meeting',
                customer_name: 'John Doe',
                contact_number: '123-456-7890',
                ongoing: false
            }
        },
        {
            pk: 2,
            fields: {
                date: todayStr,
                time: '14:00',
                type: 'Event',
                customer_name: 'Jane Smith',
                contact_number: '098-765-4321',
                ongoing: true
            }
        },
        {
            pk: 3,
            fields: {
                date: tomorrowStr,
                time: '11:30',
                type: 'Conference',
                customer_name: 'Bob Johnson',
                contact_number: '555-123-4567',
                ongoing: false
            }
        }
    ];
}

function formatDateString(date) {
    return date.toISOString().split('T')[0];
}