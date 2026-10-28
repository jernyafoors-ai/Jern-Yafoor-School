# Jern Yafoor School Asset Management App (PWA)

Web-based Progressive Web App (PWA) for asset tracking and inventory management at Jern Yafoor School. Designed for mobile browsers and hardware/camera scanning.

---

## 🚀 Setup & Installation

### 1. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** with **Email/Password** provider.
3. Create a **Firestore Database** in production mode.
4. Go to **Project Settings > Web App** and copy the configuration keys.
5. Open `src/firebaseConfig.js` and paste your Firebase keys:
   ```js
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 2. Security Rules Setup
Deploy the provided `firestore.rules` file to your Firebase project using the Firebase CLI or copy it directly into **Firebase Console > Firestore Database > Rules**.

### 3. Setting Up the First Admin User
1. Go to **Firebase Console > Authentication > Users** and create your admin account (e.g., `admin@jernyafoor.edu`).
2. Copy the generated `UID` for that user.
3. Go to **Firestore Database > Data**, create a collection named `users`, and add a document with ID = `<YOUR_USER_UID>`:
   ```json
   {
     "email": "admin@jernyafoor.edu",
     "role": "admin",
     "createdAt": "2026-10-28T00:00:00.000Z"
   }
   ```
*(Note: Any other users signing in for the first time will automatically receive the default `staff` role).*

---

## 💻 Local Development

Run the following commands in your terminal:

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub under your repository name.
2. Go to **Repo Settings > Pages**.
3. Set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` will automatically build and deploy the app to GitHub Pages.
