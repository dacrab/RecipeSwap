document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Cache DOM Elements
    const elements = {
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('search-input'),
        recipeCards: document.querySelectorAll('.recipe-card'),
        starRating: document.querySelector('.star-rating'),
        signupForm: document.querySelector('.wrapper form'),
        yearElements: document.querySelectorAll('#current-year')
    };

    // Utility Functions
    const updateYear = () => {
        const currentYear = new Date().getFullYear();
        elements.yearElements.forEach(el => el.textContent = currentYear);
    };

    const showNotification = (message, duration = 3000) => {
        const notification = document.createElement('div');
        notification.classList.add('rating-notification');
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    };

    // Event Handlers
    const handleSearch = (event) => {
        event.preventDefault();
        const query = elements.searchInput.value.toLowerCase().trim();
        elements.recipeCards.forEach(card => {
            const titleElement = card.querySelector('h2, h3');
            if (titleElement) {
                card.style.display = titleElement.textContent.toLowerCase().includes(query) ? 'block' : 'none';
            }
        });
    };

    const handleStarRating = (event) => {
        if (event.target.matches('input[type="radio"]')) {
            showNotification(`You rated this recipe ${event.target.value} stars! ⭐️`);
        }
    };

    const validateForm = (event) => {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm-password');
        if (password.value !== confirmPassword.value) {
            event.preventDefault();
            alert('Passwords do not match!');
        }
    };

    const smoothScroll = (event) => {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Go Back Function
    window.goBack = () => window.history.back();

    // Add Event Listeners
    const addEventListeners = () => {
        elements.searchForm?.addEventListener('submit', handleSearch);
        elements.starRating?.addEventListener('change', handleStarRating);
        elements.signupForm?.addEventListener('submit', validateForm);
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', smoothScroll);
        });
    };

    // Initialize Application
    const init = () => {
        updateYear();
        addEventListeners();
    };

    init();
});
