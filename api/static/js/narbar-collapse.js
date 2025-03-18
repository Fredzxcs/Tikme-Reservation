document.addEventListener("DOMContentLoaded", function () {
    console.log("Website Loaded - Tracking Visitor");

    // ✅ Navbar Toggle Button Functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('#navbarCollapse');

    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', () => {
            const isExpanded = navbarToggler.getAttribute('aria-expanded') === 'true';
            navbarToggler.setAttribute('aria-expanded', !isExpanded);
            navbarCollapse.classList.toggle('show');
        });

        // ✅ Close navbar when a link is clicked (for mobile UX)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show')) {
                    navbarToggler.setAttribute('aria-expanded', 'false');
                    navbarCollapse.classList.remove('show');
                }
            });
        });
    }

    // ✅ Loader Fade-Out Effect (keeping your original script intact)
    const loader = document.querySelector('.loading-container');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; }, 1000);
    }

    // ✅ Smooth scroll to section when a nav link is clicked
    document.querySelectorAll('a.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 50,
                    behavior: 'smooth'
                });
            }
        });
    });
});
