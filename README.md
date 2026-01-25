# Deep Chat - Real-time Chat Application

🔗 **Live Demo:** [https://chat-app-12d1b.web.app](https://chat-app-12d1b.web.app)

A modern real-time chat application built with Firebase (Authentication, Firestore, Hosting).

## Features

- 🔐 **User Authentication**
  - Email/Password sign-in
  - Google Sign-In
  - Secure logout
- 💬 **Real-time Messaging** with Firestore
- 📢 **Multiple Chat Channels** (General, Random, Dev)
- 👥 **Online Users** tracking
- 🎨 **Modern Dark Theme** UI
- 📱 **Responsive Design**
- ⚡ **Offline Support** with Firestore persistence

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase (Serverless)
  - Firebase Authentication
  - Cloud Firestore (Real-time Database)
  - Firebase Hosting
- **UI:** Custom CSS with CSS Variables

## Live Demo

Visit the live app: **[https://chat-app-12d1b.web.app](https://chat-app-12d1b.web.app)**

## Getting Started

### Prerequisites
- Node.js (for Firebase CLI)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/sujan58/Chat_app.git
cd Chat_app
```

2. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```

3. Login to Firebase:
```bash
firebase login
```

4. Start local development server:
```bash
firebase serve
```

5. Open http://localhost:5000 in your browser

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable Authentication:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google**

3. Create Firestore Database:
   - Go to **Firestore Database**
   - Click **Create database**
   - Start in **production mode**

4. Update Firebase config in `src/main/resources/static/js/firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Deployment

### Deploy to Firebase Hosting

```bash
firebase deploy
```

This deploys:
- Static files to Firebase Hosting
- Firestore security rules

### Firebase Configuration Files

| File | Description |
|------|-------------|
| `firebase.json` | Firebase project configuration |
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Firestore indexes |
| `.firebaserc` | Firebase project alias |

## Project Structure

```
Chat_application/
├── src/main/resources/static/
│   ├── index.html          # Main app HTML
│   ├── css/
│   │   └── style.css       # Styles
│   └── js/
│       ├── firebase-config.js  # Firebase configuration
│       └── firebase-app.js     # App logic
├── firebase.json           # Firebase config
├── firestore.rules         # Security rules
└── README.md
```

## Security Rules

Firestore security rules ensure:
- Only authenticated users can read/write
- Users can only modify their own profiles
- Messages are validated before saving

## Testing Multiple Users

To test with different users simultaneously:
- Use an **incognito/private window** for the second user
- Or use a **different browser**
- Each session requires separate login

## Troubleshooting

### "auth/configuration-not-found" Error
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password provider
3. Enable Google provider
4. Save changes

### Messages not showing
1. Check Firestore Database is created
2. Verify security rules are deployed
3. Check browser console for errors

## License

MIT

## Author

Created by [Sujan](https://github.com/sujan58)
