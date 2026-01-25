// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBFEAaVW6_CyKje_I0-dDNieavq6uaQc9o",
    authDomain: "chat-app-12d1b.firebaseapp.com",
    projectId: "chat-app-12d1b",
    storageBucket: "chat-app-12d1b.firebasestorage.app",
    messagingSenderId: "520554774962",
    appId: "1:520554774962:web:3aea5ef3eb0f43423d24ab",
    measurementId: "G-KL6DR7V258"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for Firestore
db.enablePersistence().catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
        console.log('The current browser does not support persistence.');
    }
});

console.log('Firebase initialized successfully');
