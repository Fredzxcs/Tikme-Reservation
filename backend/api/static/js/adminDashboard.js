 const ctx = document.getElementById('reservationChart').getContext('2d');
    // const dineInData = {{ dine_in_data|safe }};
    // const eventData = {{ event_data|safe }};
    
    // Extract months and totals
    const months = dineInData.map(item => new Date(item.month).toLocaleString('default', { month: 'long', year: 'numeric' }));
    const dineInTotals = dineInData.map(item => item.total);
    const eventTotals = eventData.map(item => item.total);

    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Dine In Reservations',
                    data: dineInTotals,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    yAxisID: 'y1',
                },
                {
                    label: 'Event Reservations',
                    data: eventTotals,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    yAxisID: 'y2',
                }
            ]
        },
        options: {
            scales: {
                y1: {
                    type: 'linear',
                    position: 'left',
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis
                    }
                }
            }
        }
    });