        // Toggle dropdown menu
        var dropdown = document.getElementsByClassName("dropdown-btn");
        var i;
        for (i = 0; i < dropdown.length; i++) {
            dropdown[i].addEventListener("click", function() {
                this.classList.toggle("active");
                var dropdownContent = this.nextElementSibling;
                if (dropdownContent.style.display === "block") {
                    dropdownContent.style.display = "none";
                } else {
                    dropdownContent.style.display = "block";
                }
            });
        }

        // Toggle sidebar visibility
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            sidebar.classList.toggle('collapsed');
            
            console.log('Sidebar toggled:', sidebar.classList.contains('collapsed')); // Check if toggle is working
            
            // Adjust the main content margin-left based on sidebar state
            if (sidebar.classList.contains('collapsed')) {
                mainContent.style.marginLeft = '60px'; // Adjust this value to match the collapsed sidebar width
            } else {
                mainContent.style.marginLeft = '250px'; // Adjust this value to match the expanded sidebar width
            }
        }
        
        function loadCreateReservation() {
            event.preventDefault(); // Prevent default link navigation
        
            fetch("/create_reservation/")
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not OK');
                    }
                    return response.text();
                })
                .then(html => {
                    // Load the fetched content into the main-content area
                    const mainContent = document.getElementById('main-content');
                    if (mainContent) {
                        mainContent.innerHTML = html;
                    } else {
                        console.error("Element with ID 'main-content' not found.");
                    }
                })
                .catch(error => console.error('Error loading reservation page:', error));
        }