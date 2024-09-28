# RecipeSwap 🍳🥘🍽️

RecipeSwap is a dynamic web application and blog that connects food enthusiasts, offering a platform to share, discover, and explore delicious recipes. Elevate your culinary skills, find inspiration for your next meal, and engage with a community of passionate cooks! 🌟

[![Netlify Status](https://api.netlify.com/api/v1/badges/e222e18c-784b-4a33-8ce0-84b197de2ad1/deploy-status)](https://app.netlify.com/sites/recipe-swap/deploys)

## Table of Contents 📚

1. [Quick Links](#quick-links)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Getting Started](#getting-started)
5. [User Authentication Flow](#user-authentication-flow)
6. [Contributing](#contributing)
7. [License](#license)
8. [Contact](#contact)

## Quick Links 🔗

- [Live Demo](https://recipe-swap.netlify.app/)
- [GitHub Repository](https://github.com/dacrab/RecipeSwap)

## Features ✨

### Recipe and Blog Platform 📝
- Diverse recipe collection and blog posts
- Write and read blog posts about cooking techniques, ingredients, and culinary adventures
- Multilingual support for recipes (e.g., English, Greek)

### User Experience 🖥️
- User-friendly, responsive interface
- Advanced search functionality with real-time suggestions
- Keyboard shortcuts for quick navigation

### User Engagement 👥
- Secure user authentication and email verification
- Personalized user profiles
- Community-driven rating and review system
- Comment and discuss blog posts

## Technology Stack 💻

- Frontend: HTML5, CSS3, JavaScript
- Backend & Authentication: Firebase
- UI Enhancements: Font Awesome, Google Fonts

## Getting Started 🚀

1. Clone the repository:
   ```
   git clone https://github.com/dacrab/RecipeSwap.git
   ```
2. Navigate to the project directory:
   ```
   cd RecipeSwap
   ```
3. Set up Firebase:
   - Create a new project on [Firebase](https://firebase.google.com/)
   - Copy your Firebase configuration
   - Update `config.js` with your Firebase credentials
   - Enable the following services in your Firebase project:
     - Authentication (with Email/Password provider)
     - Firestore Database
     - Storage
   - Set up Firestore security rules:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
   - Set up Storage security rules:
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /{allPaths=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
   - Import necessary Firebase modules as shown in `script.js`
   - Initialize Firebase with your configuration in `script.js`
   - Set up authentication state listener and other Firebase-related functions as demonstrated in `script.js`
4. Open `index.html` in your web browser

## User Authentication Flow 🔐

1. **Sign Up**: Provide username, email, and password
2. **Email Verification**: Click the link sent to your email
3. **Login**: Use verified credentials to access your account
4. **Password Reset**: Available through "Forgot Password" feature

## Contributing 🤝

We welcome contributions! To contribute:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License 📄

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact 📧

- GitHub: [dacrab](https://github.com/dacrab)
- Email: [vkavouras@proton.me](mailto:vkavouras@proton.me)

Happy cooking and blogging with RecipeSwap! 👨‍🍳👩‍🍳📝🍽️
