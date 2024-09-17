import { supabase } from './supabase.js';

// Logger utility
const logger = {
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args)
};

// DOM Elements object
const elements = {
    searchForm: document.querySelector('.search-form'),
    searchInput: document.querySelector('.search-form input[name="search"]'),
    recipeCards: document.querySelectorAll('.recipe-card'),
    starRating: document.querySelector('.star-rating'),
    signupForm: document.getElementById('signup-form'),
    loginForm: document.getElementById('login-form'),
    yearElements: document.querySelectorAll('#current-year'),
    navLinks: document.querySelector('.nav-links'),
    forgotPasswordForm: document.getElementById('forgot-password-form'),
    verificationMessage: document.getElementById('verification-message'),
    userEmailSpan: document.getElementById('user-email'),
    resendVerificationForm: document.getElementById('resend-verification-form'),
    changeEmailLink: document.getElementById('change-email-link'),
    changeEmailForm: document.getElementById('change-email-form'),
    errorContainer: document.getElementById('error-container'),
    searchResults: document.createElement('div')
};

// Utility Functions
const utils = {
    updateYear: () => {
        const currentYear = new Date().getFullYear();
        elements.yearElements.forEach(el => el && (el.textContent = currentYear));
    },
    showNotification: (message, type = 'info', duration = 3000) => {
        const notification = Object.assign(document.createElement('div'), {
            className: `notification notification-${type}`,
            textContent: message
        });
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    },
    logError: (context, error) => {
        logger.error(`[${context}] Error:`, error, '\nStack trace:', error.stack);
    },
    handleNetworkError: (error) => {
        const message = navigator.onLine
            ? 'Oops! We\'re having trouble connecting. Please try again in a moment.'
            : 'It looks like you\'re offline. Please check your internet connection and try again.';
        utils.showNotification(message, 'error');
        logger.error('Network Error:', error);
    },
    setLoading: (formElement, isLoading) => {
        const submitButton = formElement.querySelector('input[type="submit"]');
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.value = isLoading ? 'Loading...' : submitButton.dataset.originalValue || 'Submit';
        }
    },
    displayError: (error) => {
        let userFriendlyMessage = 'Oops! Something went wrong. Please try again.';

        if (error.message) {
            userFriendlyMessage += ` Error details: ${error.message}`;
        }

        if (elements.errorContainer) {
            elements.errorContainer.textContent = userFriendlyMessage;
            elements.errorContainer.style.display = 'block';
        } else {
            utils.showNotification(userFriendlyMessage, 'error');
        }
        
        logger.error('Detailed error:', error);
    }
};

// Authentication Functions
const authFunctions = {
    signUp: async (username, email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });
            if (error) throw error;
            utils.showNotification('Welcome aboard! We\'ve sent you a verification email. Please check your inbox to complete your registration.', 'success', 5000);
            localStorage.setItem('pendingVerificationEmail', email);
            localStorage.setItem('pendingVerificationUsername', username);
            window.location.href = 'verify-email.html';
            return data.user;
        } catch (error) {
            utils.logError('Sign Up', error);
            utils.displayError(error);
            throw error;
        }
    },
    signIn: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            utils.showNotification('Welcome back! You\'ve successfully signed in.', 'success');
            return data.user;
        } catch (error) {
            utils.logError('Sign In', error);
            utils.displayError(error);
            throw error;
        }
    },
    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            utils.showNotification('You\'ve been safely signed out. Come back soon!', 'info');
            window.location.href = 'index.html';
        } catch (error) {
            utils.logError('Sign Out', error);
            utils.displayError(error);
            throw error;
        }
    },
    getCurrentUser: async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            utils.logError('Get Current User', error);
            return null;
        }
    },
    resetPassword: async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            utils.showNotification('We\'ve sent you a password reset email. Please check your inbox and follow the instructions.', 'success', 5000);
        } catch (error) {
            utils.logError('Reset Password', error);
            utils.displayError(error);
        }
    },
    resendVerificationEmail: async (email) => {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });
            if (error) throw error;
            utils.showNotification('We\'ve resent the verification email. It should arrive in your inbox shortly.', 'success');
        } catch (error) {
            utils.logError('Resend Verification', error);
            utils.displayError(error);
        }
    },
    updateEmail: async (newEmail) => {
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            utils.showNotification('Your email has been updated successfully. Please check your new email for verification.', 'success', 5000);
            localStorage.setItem('pendingVerificationEmail', newEmail);
            elements.userEmailSpan.textContent = newEmail;
        } catch (error) {
            utils.logError('Update Email', error);
            utils.displayError(error);
        }
    }
};

// Navigation Functions
const navigationFunctions = {
    updateNavigation: async () => {
        logger.debug('Updating navigation...');
        try {
            const user = await authFunctions.getCurrentUser();
            if (elements.navLinks) {
                elements.navLinks.innerHTML = user
                    ? `
                        <li><a href="/index.html"><i class="fas fa-home"></i> Home</a></li>
                        <li><a href="/collections.html"><i class="fas fa-book-open"></i> Collections</a></li>
                        <li><a href="/profiles.html"><i class="fas fa-user"></i> Profile</a></li>
                        <li><a href="#" id="signout-link"><i class="fas fa-sign-out-alt"></i> Sign Out</a></li>
                    `
                    : `
                        <li><a href="/index.html"><i class="fas fa-home"></i> Home</a></li>
                        <li><a href="/collections.html"><i class="fas fa-book-open"></i> Collections</a></li>
                        <li><a href="/login.html"><i class="fas fa-sign-in-alt"></i> Login</a></li>
                        <li><a href="/signup.html"><i class="fas fa-user-plus"></i> Sign Up</a></li>
                    `;
                if (user) {
                    document.getElementById('signout-link')?.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await authFunctions.signOut();
                    });
                }
                
                elements.navLinks.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', (e) => {
                        if (link.id !== 'signout-link') {
                            e.preventDefault();
                            window.location.href = link.getAttribute('href');
                        }
                    });
                });
            }
        } catch (error) {
            utils.logError('Update Navigation', error);
            utils.displayError(error);
        }
    }
};

// Debounce utility function
const debounce = (func, delay) => {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
};

// Event Handlers
const eventHandlers = {
    handleSearch: debounce(async (event) => {
        const query = event.target.value.toLowerCase().trim();
        if (query.length < 2) {
            elements.searchResults.innerHTML = '';
            return;
        }
        
        try {
            logger.debug('Searching for:', query);
            const { data: recipes, error } = await supabase.rpc('list_recipes', {
                search_query: query,
                limit_val: 5
            });

            if (error) {
                logger.error('Supabase search error:', error);
                throw error;
            }

            logger.debug('Search results:', recipes);
            displaySearchResults(recipes, query);
        } catch (error) {
            logger.error('Search error:', error);
            utils.logError('Search', error);
            utils.displayError(error);
            elements.searchResults.innerHTML = '<p>An error occurred while searching. Please try again.</p>';
        }
    }, 300),

    handleStarRating: (event) => {
        if (event.target.matches('input[type="radio"]')) {
            utils.showNotification(`You rated this recipe ${event.target.value} stars! ⭐️`, 'success');
        }
    },
    handleSignUp: async (event) => {
        event.preventDefault();
        const form = event.target;
        utils.setLoading(form, true);
        const username = document.getElementById('username')?.value;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        
        if (username && email && password && confirmPassword) {
            if (password !== confirmPassword) {
                utils.displayError(new Error('Passwords do not match!'));
            } else {
                try {
                    await authFunctions.signUp(username, email, password);
                } catch (error) {
                    utils.logError('Sign Up Handler', error);
                }
            }
        } else {
            utils.displayError(new Error('Please fill in all fields.'));
        }
        utils.setLoading(form, false);
    },
    handleSignIn: async (event) => {
        event.preventDefault();
        const form = event.target;
        utils.setLoading(form, true);
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        if (email && password) {
            try {
                await authFunctions.signIn(email, password);
                window.location.href = 'index.html';
            } catch (error) {
                utils.logError('Sign In Handler', error);
            }
        } else {
            utils.displayError(new Error('Please provide both email and password.'));
        }
        utils.setLoading(form, false);
    },
    handleForgotPassword: async (event) => {
        event.preventDefault();
        const email = document.getElementById('email')?.value;
        email ? await authFunctions.resetPassword(email) : utils.displayError(new Error('Please provide your email address.'));
    },
    handleResendVerification: async (event) => {
        event.preventDefault();
        const form = event.target;
        utils.setLoading(form, true);
        const email = localStorage.getItem('pendingVerificationEmail');
        if (email) {
            await authFunctions.resendVerificationEmail(email);
        } else {
            utils.displayError(new Error('No email address found. Please try signing up again.'));
        }
        utils.setLoading(form, false);
    },
    handleChangeEmail: async (event) => {
        event.preventDefault();
        const newEmail = document.getElementById('new-email').value;
        newEmail ? await authFunctions.updateEmail(newEmail) : utils.displayError(new Error('Please enter a new email address.'));
    },
    toggleChangeEmailForm: (event) => {
        event.preventDefault();
        elements.changeEmailForm.style.display = elements.changeEmailForm.style.display === 'none' ? 'block' : 'none';
    },
    smoothScroll: (event) => {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href');
        document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
    },
    handleKeyboardShortcuts: (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            elements.searchInput?.focus();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
            event.preventDefault();
            window.location.href = '/index.html';
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
            event.preventDefault();
            window.location.href = '/login.html';
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            window.location.href = '/signup.html';
        }
    }
};

// Function to display search results
const displaySearchResults = (results, query) => {
    elements.searchResults.innerHTML = '';
    elements.searchResults.className = 'search-results';

    if (results.length === 0) {
        elements.searchResults.innerHTML = '<p>No recipes found. Try a different search term.</p>';
    } else {
        const ul = document.createElement('ul');
        results.forEach(recipe => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `recipes/${recipe.slug}.html`;
            
            const titleHtml = recipe.title.replace(new RegExp(query, 'gi'), match => `<strong>${match}</strong>`);
            
            const matchingIngredient = recipe.ingredients.split(',').find(ing => ing.toLowerCase().includes(query));
            const ingredientHtml = matchingIngredient 
                ? `<span class="ingredient">${matchingIngredient.replace(new RegExp(query, 'gi'), match => `<strong>${match}</strong>`)}</span>`
                : '';

            const img = document.createElement('img');
            img.src = recipe.image_url || 'https://img.freepik.com/free-vector/healthy-food-concept-illustration_114360-11817.jpg?t=st=1726588236~exp=1726591836~hmac=d0240d557f44477eb1d5efa203a9063fbe6b744930b6f1d9c5e9445677823b36&w=740';
            img.alt = recipe.title;
            img.className = 'search-result-image';

            const textContent = document.createElement('div');
            textContent.className = 'search-result-text';
            textContent.innerHTML = `<div class="recipe-title">${titleHtml}</div>${ingredientHtml}`;

            link.appendChild(img);
            link.appendChild(textContent);
            li.appendChild(link);
            ul.appendChild(li);
        });
        elements.searchResults.appendChild(ul);
    }

    const searchInput = elements.searchInput;
    const rect = searchInput.getBoundingClientRect();
    elements.searchResults.style.position = 'absolute';
    elements.searchResults.style.top = `${rect.bottom + window.scrollY}px`;
    elements.searchResults.style.left = `${rect.left + window.scrollX}px`;
    elements.searchResults.style.width = `${rect.width}px`;

    if (!document.body.contains(elements.searchResults)) {
        document.body.appendChild(elements.searchResults);
    }
};

// Global Functions
window.goBack = () => window.history.back();

// Event Listeners
const addEventListeners = () => {
    elements.searchForm?.addEventListener('submit', eventHandlers.handleSearch);
    elements.starRating?.addEventListener('change', eventHandlers.handleStarRating);
    elements.signupForm?.addEventListener('submit', eventHandlers.handleSignUp);
    elements.loginForm?.addEventListener('submit', eventHandlers.handleSignIn);
    elements.forgotPasswordForm?.addEventListener('submit', eventHandlers.handleForgotPassword);
    elements.resendVerificationForm?.addEventListener('submit', eventHandlers.handleResendVerification);
    elements.changeEmailLink?.addEventListener('click', eventHandlers.toggleChangeEmailForm);
    elements.changeEmailForm?.addEventListener('submit', eventHandlers.handleChangeEmail);
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', eventHandlers.smoothScroll);
    });
    elements.searchInput?.addEventListener('input', eventHandlers.handleSearch);
    document.addEventListener('click', (event) => {
        if (!elements.searchResults.contains(event.target) && event.target !== elements.searchInput) {
            elements.searchResults.innerHTML = '';
        }
    });
    document.addEventListener('keydown', eventHandlers.handleKeyboardShortcuts);
};

// Initialization
const init = async () => {
    try {
        if (!supabase) throw new Error('Supabase client is not initialized');
        logger.info('Supabase client initialized:', supabase);
        utils.updateYear();
        logger.debug('Initializing app...');
        await navigationFunctions.updateNavigation();
        addEventListeners();

        const { data: { user } } = await supabase.auth.getUser();
        if (user && window.location.pathname === '/index.html') {
            logger.info('User is signed in on index page:', user);
            const username = user.user_metadata.username || user.email.split('@')[0];
            utils.showNotification(`Welcome back, ${username}!`, 'success');
        } else {
            logger.info('No active session found or not on index page');
        }

        if (elements.verificationMessage && elements.userEmailSpan) {
            const email = localStorage.getItem('pendingVerificationEmail');
            const username = localStorage.getItem('pendingVerificationUsername');
            if (email) {
                elements.userEmailSpan.textContent = email;
            }
            if (username) {
                elements.verificationMessage.innerHTML = `We've sent a verification email to <span id="user-email" class="highlighted-email">${email}</span>. Please check your inbox and click the verification link to complete your registration, ${username}!`;
            }
        }
    } catch (error) {
        utils.logError('Initialization', error);
        utils.displayError(error);
    }
};

// Auth State Change Listener
supabase.auth.onAuthStateChange((event, session) => {
    logger.info('Auth state changed:', event, session);
    navigationFunctions.updateNavigation();
});

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
