// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail, 
    sendEmailVerification, 
    updateEmail, 
    updateProfile, 
    onAuthStateChanged, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    writeBatch, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';
import { firebaseConfig } from './config.js';

// Constants
const NOTIFICATION_DURATION = 3000;
const SEARCH_DEBOUNCE_DELAY = 300;
const DEFAULT_RECIPE_IMAGE = 'https://img.freepik.com/free-vector/healthy-food-concept-illustration_114360-11817.jpg?t=st=1726588236~exp=1726591836~hmac=d0240d557f44477eb1d5efa203a9063fbe6b744930b6f1d9c5e9445677823b36&w=740';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Logger utility
const logger = {
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args)
};

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
    changeEmailForm: document.getElementById('change-email-form'),
    errorContainer: document.getElementById('error-container'),
    searchResults: document.createElement('div'),
    predictionResults: document.createElement('div')
};

// Utility Functions
const utils = {
    // Update year in footer
    updateYear: () => {
        const currentYear = new Date().getFullYear();
        elements.yearElements.forEach(el => el && (el.textContent = currentYear));
    },

    // Show notification
    showNotification: (message, type = 'info', duration = NOTIFICATION_DURATION) => {
        const container = document.querySelector('.notification-container') || (() => {
            const div = document.createElement('div');
            div.className = 'notification-container';
            document.body.appendChild(div);
            return div;
        })();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        
        notification.appendChild(content);
        container.appendChild(notification);

        setTimeout(() => notification.remove(), duration);
    },

    // Log error
    logError: (context, error) => {
        logger.error(`[${context}] Error:`, error, '\nStack trace:', error.stack);
    },

    // Handle network error
    handleNetworkError: (error) => {
        const message = navigator.onLine
            ? 'Oops! We\'re having trouble connecting. Please try again in a moment.'
            : 'It looks like you\'re offline. Please check your internet connection and try again.';
        utils.showNotification(message, 'error');
        logger.error('Network Error:', error);
    },

    // Set loading state
    setLoading: (formElement, isLoading) => {
        const submitButton = formElement.querySelector('input[type="submit"]');
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.value = isLoading ? 'Loading...' : submitButton.dataset.originalValue || 'Submit';
        }
    },

    // Display error
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
    },

    // Fuzzy search
    fuzzySearch: (query, text) => {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        let score = 0;
        let textIndex = 0;
        let lastMatchIndex = -1;
        
        for (let i = 0; i < queryLower.length; i++) {
            const char = queryLower[i];
            let found = false;
            
            for (let j = textIndex; j < textLower.length; j++) {
                if (char === textLower[j]) {
                    found = true;
                    score += 1;
                    
                    // Bonus for consecutive matches
                    if (lastMatchIndex !== -1 && j === lastMatchIndex + 1) {
                        score += 0.5;
                    }
                    
                    // Bonus for matching at word boundaries
                    if (j === 0 || textLower[j - 1] === ' ') {
                        score += 0.5;
                    }
                    
                    textIndex = j + 1;
                    lastMatchIndex = j;
                    break;
                }
            }
            
            if (!found) {
                return 0; // If any character is not found, return 0
            }
        }
        
        // Normalize score based on text length
        return score / textLower.length;
    }
};

// Authentication Functions
const authFunctions = {
    // Sign up
    signUp: async (username, email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });
            await sendEmailVerification(userCredential.user);

            // Create user profile in Firestore
            const userProfileData = {
                email: email,
                username: username,
                profilePictureUrl: null, // We'll update this when user uploads a picture
                createdAt: new Date(),
                location: '',
                interests: []
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), userProfileData);

            utils.showNotification('Welcome aboard! We\'ve sent you a verification email. Please check your inbox to complete your registration.', 'success', 5000);
            localStorage.setItem('pendingVerificationEmail', email);
            localStorage.setItem('pendingVerificationUsername', username);
            window.location.href = 'verify-email.html';
            return userCredential.user;
        } catch (error) {
            utils.logError('Sign Up', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Sign in
    signIn: async (usernameOrEmail, password) => {
        try {
            let userCredential;
            
            // Check if the input is an email
            if (usernameOrEmail.includes('@')) {
                userCredential = await signInWithEmailAndPassword(auth, usernameOrEmail, password);
            } else {
                // If it's not an email, assume it's a username
                // First, query Firestore to find the user with this username
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', usernameOrEmail));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    throw new Error('No user found with this username');
                }
                
                const userDoc = querySnapshot.docs[0];
                const email = userDoc.data().email;
                
                // Now sign in with the email
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }
            
            utils.showNotification('Welcome back! You\'ve successfully signed in.', 'success');
            return userCredential.user;
        } catch (error) {
            utils.logError('Sign In', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Sign out
    signOut: async () => {
        try {
            await signOut(auth);
            utils.showNotification('You\'ve been safely signed out. Come back soon!', 'info');
            window.location.href = 'index.html';
        } catch (error) {
            utils.logError('Sign Out', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: () => {
        return new Promise((resolve, reject) => {
            const unsubscribe = auth.onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            }, reject);
        });
    },

    // Reset password
    resetPassword: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            utils.showNotification('We\'ve sent you a password reset email. Please check your inbox and follow the instructions.', 'success', 5000);
        } catch (error) {
            utils.logError('Reset Password', error);
            utils.displayError(error);
        }
    },

    // Resend verification email
    resendVerificationEmail: async (email) => {
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                utils.showNotification('We\'ve resent the verification email. It should arrive in your inbox shortly.', 'success');
            } else {
                throw new Error('No user is currently signed in.');
            }
        } catch (error) {
            utils.logError('Resend Verification', error);
            utils.displayError(error);
        }
    },

    // Update email
    updateEmail: async (newEmail) => {
        try {
            const user = auth.currentUser;
            if (user) {
                await updateEmail(user, newEmail);
                await sendEmailVerification(user);
                utils.showNotification('Your email has been updated successfully. Please check your new email for verification.', 'success', 5000);
                localStorage.setItem('pendingVerificationEmail', newEmail);
                elements.userEmailSpan.textContent = newEmail;
            } else {
                throw new Error('No user is currently signed in.');
            }
        } catch (error) {
            utils.logError('Update Email', error);
            utils.displayError(error);
        }
    },

    // Create user profile
    createUserProfile: async (userId, profileData) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, profileData, { merge: true });
            utils.showNotification('Profile created successfully!', 'success');
        } catch (error) {
            utils.logError('Create User Profile', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Update user profile
    updateUserProfile: async (userId, profileData) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                // If the document doesn't exist, create it
                await setDoc(userRef, profileData);
                utils.showNotification('Profile created successfully!', 'success');
            } else {
                // If the document exists, update it
                await updateDoc(userRef, profileData);
                utils.showNotification('Profile updated successfully!', 'success');
            }
        } catch (error) {
            utils.logError('Update User Profile', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Get user profile
    getUserProfile: async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return userSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            utils.logError('Get User Profile', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Upload profile picture
    uploadProfilePicture: async (userId, file) => {
        try {
            const storageRef = ref(storage, `profile_pictures/${userId}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            utils.logError('Upload Profile Picture', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Delete account
    deleteAccount: async (password) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user is currently signed in.');

            // Re-authenticate the user
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // Delete user data from Firestore
            await deleteDoc(doc(db, 'users', user.uid));

            // Delete user's recipes
            const recipesRef = collection(db, 'recipes');
            const q = query(recipesRef, where('user_id', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Delete the user account
            await user.delete();

            utils.showNotification('Your account has been successfully deleted.', 'info');
            window.location.href = 'index.html';
        } catch (error) {
            utils.logError('Delete Account', error);
            utils.displayError(error);
            throw error;
        }
    }
};

// Recipe Functions
const recipeFunctions = {
    // Create recipe
    createRecipe: async (recipeData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User must be logged in to create a recipe');

            const recipeWithUser = {
                ...recipeData,
                user_id: user.uid,
                created_at: new Date()
            };

            const docRef = await addDoc(collection(db, 'recipes'), recipeWithUser);
            return { id: docRef.id, ...recipeWithUser };
        } catch (error) {
            utils.logError('Create Recipe', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Update recipe
    updateRecipe: async (recipeId, recipeData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User must be logged in to update a recipe');

            const recipeRef = doc(db, 'recipes', recipeId);
            await updateDoc(recipeRef, {
                ...recipeData,
                updated_at: new Date()
            });

            return { id: recipeId, ...recipeData };
        } catch (error) {
            utils.logError('Update Recipe', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Delete recipe
    deleteRecipe: async (recipeId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User must be logged in to delete a recipe');

            await deleteDoc(doc(db, 'recipes', recipeId));
        } catch (error) {
            utils.logError('Delete Recipe', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Upload image
    uploadImage: async (file) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User must be logged in to upload an image');

            const storageRef = ref(storage, `recipe-images/${user.uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            utils.logError('Upload Image', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Get user recipes
    getUserRecipes: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User must be logged in to fetch recipes');

            const recipesRef = collection(db, 'recipes');
            const q = query(recipesRef, where('user_id', '==', user.uid));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            utils.logError('Get User Recipes', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Batch upload recipes
    batchUploadRecipes: async (recipes) => {
        try {
            const batch = writeBatch(db);
            
            recipes.forEach((recipe) => {
                const recipeRef = doc(collection(db, 'recipes'));
                batch.set(recipeRef, {
                    ...recipe,
                    created_at: new Date()
                });
            });

            await batch.commit();
            utils.showNotification('Recipes uploaded successfully!', 'success');
        } catch (error) {
            utils.logError('Batch Upload Recipes', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Get all recipes
    getAllRecipes: async () => {
        try {
            const recipesRef = collection(db, 'recipes');
            const querySnapshot = await getDocs(recipesRef);
            
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            utils.logError('Get All Recipes', error);
            utils.displayError(error);
            throw error;
        }
    },

    // Search recipes by ingredient
    searchRecipesByIngredient: async (ingredient) => {
        try {
            const recipesRef = collection(db, 'recipes');
            const querySnapshot = await getDocs(recipesRef);
            
            const allRecipes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return allRecipes
                .map(recipe => ({
                    ...recipe,
                    score: Math.max(
                        utils.fuzzySearch(ingredient, recipe.title),
                        ...recipe.ingredients.map(ing => utils.fuzzySearch(ingredient, ing))
                    )
                }))
                .filter(recipe => recipe.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        } catch (error) {
            utils.logError('Search Recipes by Ingredient', error);
            utils.displayError(error);
            throw error;
        }
    }
};

// Navigation Functions
const navigationFunctions = {
    // Update navigation
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
    // Handle search
    handleSearch: debounce(async (event) => {
        const searchQuery = event.target.value.toLowerCase().trim();
        if (searchQuery.length < 2) {
            elements.searchResults.innerHTML = '';
            elements.predictionResults.innerHTML = '';
            return;
        }
        
        try {
            logger.debug('Searching for ingredient:', searchQuery);
            const recipes = await recipeFunctions.searchRecipesByIngredient(searchQuery);
            logger.debug('Search results:', recipes);
            
            displaySearchResults(recipes, searchQuery);
        } catch (error) {
            logger.error('Search error:', error);
            utils.logError('Search', error);
            utils.displayError(error);
            elements.searchResults.innerHTML = '<p>An error occurred while searching. Please try again.</p>';
            elements.predictionResults.innerHTML = '';
        }
    }, SEARCH_DEBOUNCE_DELAY),

    // Handle star rating
    handleStarRating: (event) => {
        if (event.target.matches('input[type="radio"]')) {
            utils.showNotification(`You rated this recipe ${event.target.value} stars! ⭐️`, 'success');
        }
    },

    // Handle sign up
    handleSignUp: async (event) => {
        event.preventDefault();
        const form = event.target;
        utils.setLoading(form, true);
        const username = document.getElementById('username')?.value;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        const location = document.getElementById('location')?.value;
        const interests = document.getElementById('interests')?.value;
        const profilePicture = document.getElementById('profile-picture-upload')?.files[0];
        
        if (username && email && password && confirmPassword) {
            if (password !== confirmPassword) {
                utils.displayError(new Error('Passwords do not match!'));
            } else {
                try {
                    const user = await authFunctions.signUp(username, email, password);
                    
                    // Create user profile with additional information
                    const profileData = {
                        location: location || '',
                        interests: interests ? interests.split(',').map(item => item.trim()) : [],
                        profilePictureUrl: null // We'll update this after uploading the picture
                    };
                    
                    if (profilePicture) {
                        const pictureUrl = await authFunctions.uploadProfilePicture(user.uid, profilePicture);
                        profileData.profilePictureUrl = pictureUrl;
                    }
                    
                    await authFunctions.createUserProfile(user.uid, profileData);
                    
                } catch (error) {
                    utils.logError('Sign Up Handler', error);
                }
            }
        } else {
            utils.displayError(new Error('Please fill in all required fields.'));
        }
        utils.setLoading(form, false);
    },

    // Handle sign in
    handleSignIn: async (event) => {
        event.preventDefault();
        const form = event.target;
        utils.setLoading(form, true);
        const usernameOrEmail = document.getElementById('username-or-email')?.value;
        const password = document.getElementById('password')?.value;
        if (usernameOrEmail && password) {
            try {
                await authFunctions.signIn(usernameOrEmail, password);
                window.location.href = 'index.html';
            } catch (error) {
                utils.logError('Sign In Handler', error);
            }
        } else {
            utils.displayError(new Error('Please provide both username/email and password.'));
        }
        utils.setLoading(form, false);
    },

    // Handle forgot password
    handleForgotPassword: async (event) => {
        event.preventDefault();
        const email = document.getElementById('email')?.value;
        email ? await authFunctions.resetPassword(email) : utils.displayError(new Error('Please provide your email address.'));
    },

    // Handle resend verification
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

    // Handle change email
    handleChangeEmail: async (event) => {
        event.preventDefault();
        const newEmail = document.getElementById('new-email').value;
        newEmail ? await authFunctions.updateEmail(newEmail) : utils.displayError(new Error('Please enter a new email address.'));
    },

    // Toggle change email form
    toggleChangeEmailForm: (event) => {
        event.preventDefault();
        elements.changeEmailForm.style.display = elements.changeEmailForm.style.display === 'none' ? 'block' : 'none';
    },

    // Handle smooth scroll
    smoothScroll: (event) => {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href');
        document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
    },

    // Handle keyboard shortcuts
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
    },

    // Handle profile creation/update
    handleProfileSubmit: async (event) => {
        event.preventDefault();
        const form = event.target;
        utils.setLoading(form, true);

        const user = auth.currentUser;
        if (!user) {
            utils.displayError(new Error('No user logged in'));
            return;
        }

        const location = document.getElementById('edit-location').value;
        const interests = document.getElementById('edit-interests').value;
        const profilePicture = document.getElementById('profile-picture-upload').files[0];

        try {
            let profileData = {
                location,
                interests: interests.split(',').map(item => item.trim())
            };

            if (profilePicture) {
                const pictureUrl = await authFunctions.uploadProfilePicture(user.uid, profilePicture);
                profileData.profilePictureUrl = pictureUrl;
            }

            await authFunctions.updateUserProfile(user.uid, profileData);

            await loadUserProfile();
            document.getElementById('edit-profile-form').style.display = 'none';
        } catch (error) {
            utils.logError('Profile Submission', error);
            utils.displayError(error);
        } finally {
            utils.setLoading(form, false);
        }
    },

    // Toggle edit profile form
    toggleEditProfileForm: () => {
        const form = document.getElementById('edit-profile-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    },

    // Handle delete account
    handleDeleteAccount: async (event) => {
        event.preventDefault();
        showDeleteAccountModal();
    }
};

// Add this function to show the modal
const showDeleteAccountModal = () => {
    const modal = document.getElementById('delete-account-modal');
    modal.style.display = 'block';
};

// Function to display search results
const displaySearchResults = (results, query) => {
    elements.searchResults.innerHTML = '';
    elements.searchResults.className = 'search-results';

    if (results.length === 0) {
        elements.searchResults.innerHTML = '<p>No recipes found with this ingredient. Try a different search term.</p>';
    } else {
        const ul = document.createElement('ul');
        results.forEach(recipe => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `recipes/${recipe.slug}.html`;
            
            const titleHtml = highlightMatch(recipe.title, query);
            
            const matchingIngredient = recipe.ingredients.reduce((best, current) => {
                const currentScore = utils.fuzzySearch(query, current);
                return currentScore > utils.fuzzySearch(query, best) ? current : best;
            });
            const ingredientHtml = matchingIngredient 
                ? `<span class="ingredient">${highlightMatch(matchingIngredient, query)}</span>`
                : '';

            const img = document.createElement('img');
            img.src = recipe.image_url || DEFAULT_RECIPE_IMAGE;
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

    positionResultsContainer(elements.searchResults);
};

// Helper function to highlight matched text
const highlightMatch = (text, query) => {
    const matches = [];
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let lastIndex = 0;
    for (let i = 0; i < queryLower.length; i++) {
        const char = queryLower[i];
        const index = textLower.indexOf(char, lastIndex);
        if (index !== -1) {
            matches.push(index);
            lastIndex = index + 1;
        }
    }
    
    let result = '';
    let lastMatchEnd = 0;
    for (const matchIndex of matches) {
        result += text.substring(lastMatchEnd, matchIndex);
        result += `<strong>${text[matchIndex]}</strong>`;
        lastMatchEnd = matchIndex + 1;
    }
    result += text.substring(lastMatchEnd);
    
    return result;
};

// Helper function to position results container
const positionResultsContainer = (container) => {
    const searchInput = elements.searchInput;
    const rect = searchInput.getBoundingClientRect();
    container.style.position = 'absolute';
    container.style.top = `${rect.bottom + window.scrollY}px`;
    container.style.left = `${rect.left + window.scrollX}px`;
    container.style.width = `${rect.width}px`;

    if (!document.body.contains(container)) {
        document.body.appendChild(container);
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

// Function to load user profile
const loadUserProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
        utils.displayError(new Error('No user logged in'));
        return;
    }

    try {
        const profile = await authFunctions.getUserProfile(user.uid);
        const username = user.displayName || user.email.split('@')[0];
        
        const updateElement = (id, content) => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = content;
            }
        };
        
        updateElement('profile-username', `<i class="fas fa-user"></i> ${username}`);
        updateElement('profile-email', `<i class="fas fa-envelope"></i> ${user.email}`);
        
        if (profile) {
            updateElement('profile-location', `<i class="fas fa-map-marker-alt"></i> ${profile.location || 'Not set'}`);
            updateElement('profile-interests', `<i class="fas fa-heart"></i> ${profile.interests ? profile.interests.join(', ') : 'Not set'}`);
            
            const profilePicture = document.getElementById('profile-picture');
            if (profilePicture && profile.profilePictureUrl) {
                profilePicture.src = profile.profilePictureUrl;
            }
        } else {
            updateElement('profile-location', '<i class="fas fa-map-marker-alt"></i> Not set');
            updateElement('profile-interests', '<i class="fas fa-heart"></i> Not set');
        }

        // Populate edit form
        const populateEditForm = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
                element.style.display = value ? 'none' : 'block';
                const label = element.previousElementSibling;
                if (label) {
                    label.style.display = value ? 'none' : 'block';
                }
            }
        };

        populateEditForm('edit-username', username);
        populateEditForm('edit-location', profile?.location);
        populateEditForm('edit-interests', profile?.interests ? profile.interests.join(', ') : '');

    } catch (error) {
        utils.logError('Load User Profile', error);
        utils.displayError(error);
    }
};

// Initialization
const init = async () => {
    try {
        if (!app) throw new Error('Firebase app is not initialized');
        logger.info('Firebase app initialized:', app);
        utils.updateYear();
        logger.debug('Initializing app...');
        await navigationFunctions.updateNavigation();
        addEventListeners();

        const user = await authFunctions.getCurrentUser();
        if (user) {
            // New check: Redirect logged-in users from login page to profile
            if (window.location.pathname.endsWith('/login.html')) {
                window.location.href = 'profiles.html';
                return;
            }

            if (user.emailVerified) {
                if (window.location.pathname.endsWith('/profiles.html')) {
                    await loadUserProfile();
                    const editProfileBtn = document.getElementById('edit-profile-btn');
                    if (editProfileBtn) {
                        editProfileBtn.addEventListener('click', eventHandlers.toggleEditProfileForm);
                    }
                    const updateProfileForm = document.getElementById('update-profile-form');
                    if (updateProfileForm) {
                        updateProfileForm.addEventListener('submit', eventHandlers.handleProfileSubmit);
                    }
                    // Add event listener for delete account button
                    const deleteAccountBtn = document.getElementById('delete-account-btn');
                    if (deleteAccountBtn) {
                        deleteAccountBtn.addEventListener('click', eventHandlers.handleDeleteAccount);
                    }
                }
            } else if (!window.location.pathname.endsWith('/verify-email.html')) {
                window.location.href = 'verify-email.html';
            }
        } else if (window.location.pathname.endsWith('/profiles.html')) {
            window.location.href = 'login.html';
        }

        if (user && window.location.pathname === '/index.html') {
            logger.info('User is signed in on index page:', user);
            const username = user.displayName || user.email.split('@')[0];
            utils.showNotification(`Welcome back, ${username}!`, 'success');
        } else {
            logger.info('No active session found or not on index page');
        }

        const verificationMessage = document.getElementById('verification-message');
        const userEmailSpan = document.getElementById('user-email');
        if (verificationMessage && userEmailSpan) {
            const email = localStorage.getItem('pendingVerificationEmail');
            const username = localStorage.getItem('pendingVerificationUsername');
            if (email) {
                userEmailSpan.textContent = email;
            }
            if (username) {
                verificationMessage.innerHTML = `We've sent a verification email to <span id="user-email" class="highlighted-email">${email}</span>. Please check your inbox and click the verification link to complete your registration, ${username}!`;
            }
        }
    } catch (error) {
        utils.logError('Initialization', error);
        utils.displayError(error);
    }
};

// Auth State Change Listener
onAuthStateChanged(auth, (user) => {
    logger.info('Auth state changed:', user);
    navigationFunctions.updateNavigation();
});

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Your initialization code here
    init();

    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', eventHandlers.handleDeleteAccount);
    }

    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            try {
                const passwordInput = document.getElementById('delete-account-password');
                const password = passwordInput.value;
                if (!password) {
                    throw new Error('Please enter your password to confirm account deletion.');
                }
                await authFunctions.deleteAccount(password);
            } catch (error) {
                utils.logError('Delete Account', error);
                utils.displayError(error);
            } finally {
                document.getElementById('delete-account-modal').style.display = 'none';
            }
        });
    }

    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('delete-account-modal').style.display = 'none';
        });
    }
});