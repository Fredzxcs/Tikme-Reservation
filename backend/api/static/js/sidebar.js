const dropdownBtns = document.querySelectorAll('.dropdown-btn');
dropdownBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Toggle the 'active' class for the button to change its style
        btn.classList.toggle('active');
        
        // Get the adjacent dropdown container
        const dropdownContainer = btn.nextElementSibling;

        // Toggle the display property between 'none' and 'flex'
        if (dropdownContainer.style.display === 'block') {
            dropdownContainer.style.display = 'none';
        } else {
            // Hide other dropdowns if they're open
            document.querySelectorAll('.dropdown-container').forEach(container => {
                if (container !== dropdownContainer) {
                    container.style.display = 'none';
                }
            });
            // Show the clicked dropdown container
            dropdownContainer.style.display = 'block';
        }
    });
});

// Close any open dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-btn')) {
        document.querySelectorAll('.dropdown-container').forEach(container => {
            container.style.display = 'none';
        });
    }
});

// Toggle dropdown menus
document.querySelectorAll('.dropdown-btn').forEach(button => {
    button.addEventListener('click', function () {
        let dropdown = this.nextElementSibling;
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        
        // Toggle the dropdown icon rotation
        let icon = this.querySelector('.dropdown-icon');
        icon.style.transform = icon.style.transform === 'rotate(180deg)' ? 'rotate(0)' : 'rotate(180deg)';
    });
});
