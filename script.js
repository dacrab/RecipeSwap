document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Search Functionality
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recipeCards = document.querySelectorAll('.recipe-card');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.toLowerCase();

            recipeCards.forEach(card => {
                const title = card.querySelector('h3, h2').textContent.toLowerCase();
                if (title.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    } else {
        console.log('searchForm not found');
    }

    // Interactive Star Rating System
    const stars = document.querySelectorAll('.star-rating label');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.previousElementSibling.value;
            alert(`You rated this recipe ${rating} stars!`);
        });
    });

    // Form Validation
    const signupForm = document.querySelector('.wrapper form');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            if (password.value !== confirmPassword.value) {
                e.preventDefault();
                alert('Passwords do not match!');
            }
        });
    } else {
        console.log('signupForm not found');
    }

    // Dynamic Content Loading
    const loadMoreButton = document.getElementById('load-more');
    const recipeGrid = document.querySelector('.recipe-grid');

    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            // Simulate an API call to fetch more recipes
            setTimeout(() => {
                const newRecipe = document.createElement('div');
                newRecipe.classList.add('recipe-card');
                newRecipe.innerHTML = `
                    <h3>New Recipe</h3>
                    <img src="images/new-recipe.jpg" alt="New Recipe" height="250">
                    <p>New recipe description.</p>
                    <a href="recipes/new-recipe.html" class="button">Show</a>
                `;
                recipeGrid.appendChild(newRecipe);
            }, 1000);
        });
    } else {
        console.log('loadMoreButton not found');
    }

    // Update Year in Footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
        console.log('Year updated to:', yearSpan.textContent);
    } else {
        console.log('Year span not found');
    }
});
