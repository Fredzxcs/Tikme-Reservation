import Swiper from 'swiper';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Initialize Swiper with improved centering
const initTrendingSlider = () => {
  return new Swiper('.tranding-slider', {
    modules: [EffectCoverflow, Pagination, Navigation],
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    loop: true,
    slidesPerView: 'auto',
    initialSlide: 2, // Start from center slide
    updateOnWindowResize: true, // Ensure proper updates on resize
    observer: true, // Watch for DOM changes
    observeParents: true,
    
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 100,
      modifier: 2.5,
      slideShadows: false,
    },
    
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true, // Improved pagination display
    },
    
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    
    // Improved responsive breakpoints
    breakpoints: {
      320: {
        slidesPerView: 1,
        centeredSlides: true,
      },
      500: {
        slidesPerView: 1,
        centeredSlides: true,
      },
      768: {
        slidesPerView: 2,
        centeredSlides: true,
      },
      1024: {
        slidesPerView: 3,
        centeredSlides: true,
      },
    },
    
    // Event handlers to ensure proper centering
    on: {
      init: function () {
        this.update(); // Force update on init
      },
      resize: function () {
        this.update(); // Force update on resize
      },
      beforeTransitionStart: function () {
        this.snapGrid = [...this.slidesGrid]; // Ensure proper snap points
      },
    },
  });
};

export default initTrendingSlider;