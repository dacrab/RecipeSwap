document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  // DOM Element Selection
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const recipeCards = document.querySelectorAll('.recipe-card');
  const starRating = document.querySelector('.star-rating');
  const signupForm = document.querySelector('.wrapper form');
  const yearSpan = document.getElementById('year');

  // Search Functionality
  function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.toLowerCase().trim();

    recipeCards.forEach(card => {
      const title = card.querySelector('h3, h2').textContent.toLowerCase();
      card.style.display = title.includes(query) ? 'block' : 'none';
    });
  }

  // Interactive Star Rating System
  function handleStarRating(e) {
    if (e.target.matches('input[type="radio"]')) {
      const rating = e.target.value;
      alert(`You rated this recipe ${rating} stars!`);
    }
  }

  // Form Validation
  function validateForm(e) {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    if (password.value !== confirmPassword.value) {
      e.preventDefault();
      alert('Passwords do not match!');
    }
  }

  // Update Year in Footer
  function updateYear() {
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  }

  // Smooth Scrolling
  function smoothScroll(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  }

  // Event Listeners
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', handleSearch);
  }

  if (starRating) {
    starRating.addEventListener('change', handleStarRating);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', validateForm);
  }

  updateYear();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', smoothScroll);
  });
});
