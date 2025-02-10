document.addEventListener("DOMContentLoaded", function () {
    console.log("Website Loaded - Tracking Visitor");

    // ✅ Automatically Track Website Visits
    fetch('/api/track-visit/', {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => console.log("Visitor tracked:", data))
    .catch(error => console.error("Error tracking visitor:", error));

    // ✅ Loader Fade-Out Effect
    const loader = document.querySelector('.loading-container');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => { loader.style.display = 'none'; }, 1000);
    }

    // ✅ Animate Main Text Build-Up
    const mainTextSpans = document.querySelectorAll('.main-text span');
    mainTextSpans.forEach((span, index) => {
        span.style.animation = `buildUp 0.5s ease forwards ${index * 0.1}s`;
    });

    setTimeout(() => {
        const mainText = document.querySelector('.main-text');
        if (mainText) {
            mainText.style.animation = 'fillText 2s forwards';
            setTimeout(() => {
                mainText.style.animation = 'glow 2s ease-in-out forwards';
            }, 2000);
        }
    }, mainTextSpans.length * 100);

    // ✅ Initialize WOW.js
    new WOW().init();

    // ✅ Gallery Image Click - Bootstrap Carousel
    document.querySelectorAll('.gallery-item img').forEach((img, index) => {
        img.addEventListener('click', () => {
            const carousel = document.querySelector('#carouselExample');
            if (carousel) {
                const bsCarousel = new bootstrap.Carousel(carousel);
                bsCarousel.to(index); // Jump to clicked image
            }
        });
    });

    // ✅ FAQ Toggle
    document.querySelectorAll('.faq-item h3').forEach(item => {
        item.addEventListener('click', () => {
            const parentItem = item.parentElement;
            const answer = item.nextElementSibling;
            parentItem.classList.toggle('active');
            answer.style.display = parentItem.classList.contains('active') ? 'block' : 'none';
            item.querySelector('.toggle-icon').textContent = parentItem.classList.contains('active') ? '−' : '+';
        });
    });

    // ✅ Back to Top Button Visibility
    window.addEventListener("scroll", function () {
        let topButton = document.querySelector('.back-to-top');
        if (topButton) {
            topButton.style.display = window.scrollY > 100 ? "block" : "none";
        }
    });

    // ✅ jQuery-based Scroll & Counter Animations
    $(document).ready(function () {
        $(window).scroll(function () {
            $('.back-to-top').toggle($(this).scrollTop() > 300);
        });

        $('.back-to-top').click(function () {
            $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
            return false;
        });

        // ✅ Facts Counter Animation
        $('[data-toggle="counter-up"]').counterUp({ delay: 10, time: 2000 });
    });

    // ✅ Handle Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            alert('Message Sent!');
        });
    }

    // ✅ Swiper Slider for Services Section
    new Swiper('.tranding-slider', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        slidesPerView: 'auto',
        coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        }
    });
});
