window.onload = function () {
    // Get the loader element
    var loader = document.querySelector('.loading-container');
    
    // Add a fade-out class to the loader
    loader.classList.add('fade-out');
    
    // Wait for the fade-out effect to complete, then hide the loader
    setTimeout(function () {
        loader.style.display = 'none';
    }, 1000); // The time should match the duration of your CSS fade-out effect
    };
    
    window.addEventListener('load', function () {
    const mainTextSpans = document.querySelectorAll('.main-text span');
    
    // Apply build-up animation to each letter with a delay
    mainTextSpans.forEach((span, index) => {
    span.style.animation = `buildUp 0.5s ease forwards ${index * 0.1}s`;
    });
    
    // After build-up, apply fill and glow animations
    setTimeout(function() {
    document.querySelector('.main-text').style.animation = 'fillText 2s forwards';
    setTimeout(function() {
    document.querySelector('.main-text').style.animation = 'glow 2s ease-in-out forwards';
    }, 2000); // Delay to match the duration of the fillText animation
    }, mainTextSpans.length * 100); // Adjust delay based on number of letters
    });
    
    
    // Initiate the wowjs
    new WOW().init();
    
    // gallery
    document.querySelectorAll('.gallery-item img').forEach((img, index) => {
        img.addEventListener('click', () => {
          const carousel = document.querySelector('#carouselExample');
          const bsCarousel = new bootstrap.Carousel(carousel);
          bsCarousel.to(index); // Jump to the clicked image
        });
    });
    
    // FAQ
    document.querySelectorAll('.faq-item h3').forEach(item => {
        item.addEventListener('click', () => {
            const parentItem = item.parentElement;
            const answer = item.nextElementSibling;
    
            parentItem.classList.toggle('active');
    
            if (parentItem.classList.contains('active')) {
                answer.style.display = 'block';
                item.querySelector('.toggle-icon').textContent = '−';
            } else {
                answer.style.display = 'none';
                item.querySelector('.toggle-icon').textContent = '+';
            }
        });
    });
    
    // Back to top button visibility
    window.onscroll = function () {
    let topButton = document.querySelector('.back-to-top');
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        topButton.style.display = "block";
    } else {
        topButton.style.display = "none";
    }
    };
    
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });
    
    
    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });

    
    document.getElementById('contactForm').addEventListener('submit', function(event) {
        event.preventDefault();
        alert('Message Sent!');
        // Here you can handle the form submission (e.g., via AJAX)
    });