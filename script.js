import { supabase } from './supabase.js';

const logger = {
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args)
};

logger.info('Supabase client initialized:', supabase);

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
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
        changeEmailForm: document.getElementById('change-email-form')
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
                ? 'A network error occurred. Please try again.'
                : 'You are offline. Please check your internet connection.';
            utils.showNotification(message, 'error');
            logger.error('Network Error:', error);
        },
        setLoading: (formElement, isLoading) => {
            const submitButton = formElement.querySelector('input[type="submit"]');
            if (submitButton) {
                submitButton.disabled = isLoading;
                submitButton.value = isLoading ? 'Loading...' : submitButton.dataset.originalValue || 'Submit';
            }
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
                utils.showNotification('Sign up successful! Please check your email for verification.', 'success');
                localStorage.setItem('pendingVerificationEmail', email);
                localStorage.setItem('pendingVerificationUsername', username);
                window.location.href = 'verify-email.html';
                return data.user;
            } catch (error) {
                utils.logError('Sign Up', error);
                utils.showNotification(`Sign up failed: ${error.message}`, 'error');
                throw error;
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                utils.showNotification('Sign in successful!', 'success');
                return data.user;
            } catch (error) {
                utils.logError('Sign In', error);
                utils.showNotification(`Sign in failed: ${error.message}`, 'error');
                throw error;
            }
        },
        signOut: async () => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                utils.showNotification('You have been signed out.', 'info');
                window.location.href = 'index.html';
            } catch (error) {
                utils.logError('Sign Out', error);
                utils.showNotification(`Sign out failed: ${error.message}`, 'error');
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
                utils.showNotification('Password reset email sent. Please check your inbox.', 'success');
            } catch (error) {
                utils.logError('Reset Password', error);
                utils.showNotification(`Failed to send reset email: ${error.message}`, 'error');
            }
        },
        resendVerificationEmail: async (email) => {
            try {
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email
                });
                if (error) throw error;
                utils.showNotification('Verification email resent. Please check your inbox.', 'success');
            } catch (error) {
                utils.logError('Resend Verification', error);
                utils.showNotification(`Failed to resend verification email: ${error.message}`, 'error');
            }
        },
        updateEmail: async (newEmail) => {
            try {
                const { error } = await supabase.auth.updateUser({ email: newEmail });
                if (error) throw error;
                utils.showNotification('Email updated successfully. Please check your new email for verification.', 'success');
                localStorage.setItem('pendingVerificationEmail', newEmail);
                elements.userEmailSpan.textContent = newEmail;
            } catch (error) {
                utils.logError('Update Email', error);
                utils.showNotification(`Failed to update email: ${error.message}`, 'error');
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
                    
                    // Add event listeners to all navigation links
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
                utils.showNotification('Failed to update navigation. Please try again.', 'error');
            }
        }
    };

    // Event Handlers
    const eventHandlers = {
        handleSearch: (event) => {
            event.preventDefault();
            const query = elements.searchInput?.value.toLowerCase().trim() || '';
            elements.recipeCards.forEach(card => {
                const titleElement = card.querySelector('h2, h3');
                if (titleElement) {
                    card.style.display = titleElement.textContent.toLowerCase().includes(query) ? 'block' : 'none';
                }
            });
        },
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
                    utils.showNotification('Passwords do not match!', 'error');
                } else {
                    try {
                        await authFunctions.signUp(username, email, password);
                        // The redirect is now handled in the signUp function
                    } catch (error) {
                        utils.logError('Sign Up Handler', error);
                    }
                }
            } else {
                utils.showNotification('Please fill in all fields.', 'error');
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
                utils.showNotification('Please provide both email and password.', 'error');
            }
            utils.setLoading(form, false);
        },
        handleForgotPassword: async (event) => {
            event.preventDefault();
            const email = document.getElementById('email')?.value;
            email ? await authFunctions.resetPassword(email) : utils.showNotification('Please provide your email address.', 'error');
        },
        handleResendVerification: async (event) => {
            event.preventDefault();
            const form = event.target;
            utils.setLoading(form, true);
            const email = localStorage.getItem('pendingVerificationEmail');
            if (email) {
                await authFunctions.resendVerificationEmail(email);
            } else {
                utils.showNotification('No email address found. Please try signing up again.', 'error');
            }
            utils.setLoading(form, false);
        },
        handleChangeEmail: async (event) => {
            event.preventDefault();
            const newEmail = document.getElementById('new-email').value;
            newEmail ? await authFunctions.updateEmail(newEmail) : utils.showNotification('Please enter a new email address.', 'error');
        },
        toggleChangeEmailForm: (event) => {
            event.preventDefault();
            elements.changeEmailForm.style.display = elements.changeEmailForm.style.display === 'none' ? 'block' : 'none';
        },
        smoothScroll: (event) => {
            event.preventDefault();
            const targetId = event.currentTarget.getAttribute('href');
            document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
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
            if (user) {
                logger.info('User is already signed in:', user);
                const username = user.user_metadata.username || user.email.split('@')[0];
                utils.showNotification(`Welcome back, ${username}!`, 'success');
            } else {
                logger.info('No active session found');
            }

            if (elements.verificationMessage && elements.userEmailSpan) {
                const email = localStorage.getItem('pendingVerificationEmail');
                const username = localStorage.getItem('pendingVerificationUsername');
                if (email) {
                    elements.userEmailSpan.textContent = email;
                }
                if (username) {
                    // Update the verification message to include the username
                    elements.verificationMessage.innerHTML = `We've sent a verification email to <span id="user-email" class="highlighted-email">${email}</span>. Please check your inbox and click the verification link to complete your registration, ${username}!`;
                }
            }
        } catch (error) {
            utils.logError('Initialization', error);
            utils.showNotification('Failed to initialize the application. Please refresh the page.', 'error');
        }
    };

    // Auth State Change Listener
    supabase.auth.onAuthStateChange((event, session) => {
        logger.info('Auth state changed:', event, session);
        navigationFunctions.updateNavigation();
    });

    // Initialize the application
    init();
});
