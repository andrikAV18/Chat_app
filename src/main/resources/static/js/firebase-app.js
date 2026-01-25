// Firebase Chat Application
let currentUser = null;
let currentChannel = 'general';
let messagesUnsubscribe = null;
let usersUnsubscribe = null;
let isLoginMode = true;

// DOM Elements (will be initialized after DOM is ready)
let loginContainer, appContainer, loginForm, registerForm, messageBox;
let messageContainer, messageInput, channelNameEl, currentUsernameEl, currentUserAvatarEl, onlineUsersList;
let sidebar, sidebarOverlay, menuBtn, sidebarClose;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM Elements
    loginContainer = document.getElementById('login-container');
    appContainer = document.getElementById('app-container');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    messageBox = document.getElementById('message-box');
    messageContainer = document.getElementById('message-container');
    messageInput = document.getElementById('message-input');
    channelNameEl = document.getElementById('channel-name');
    currentUsernameEl = document.getElementById('current-username');
    currentUserAvatarEl = document.getElementById('current-user-avatar');
    onlineUsersList = document.getElementById('online-users-list');
    
    // Mobile sidebar elements
    sidebar = document.getElementById('sidebar');
    sidebarOverlay = document.getElementById('sidebar-overlay');
    menuBtn = document.getElementById('menu-btn');
    sidebarClose = document.getElementById('sidebar-close');

    // Initialize the app
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Firebase Chat App...');

    // ==================== AUTH STATE ====================
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        if (user) {
            currentUser = user;
            try {
                await updateUserStatus('online');
            } catch (e) {
                console.log('Could not update status:', e);
            }
            showChat();
            subscribeToChannel(currentChannel);
            subscribeToOnlineUsers();
        } else {
            currentUser = null;
            showLogin();
            unsubscribeAll();
        }
    });

    // ==================== AUTH FUNCTIONS ====================

    // Email/Password Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            showMessage('Signing in...', 'info');
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('Welcome back!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            showMessage(getErrorMessage(error), 'error');
        }
    });

    // Email/Password Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            showMessage('Creating account...', 'info');
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with username
            await userCredential.user.updateProfile({
                displayName: username,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
            });

            // Create user document in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                username: username,
                email: email,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
                status: 'online',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showMessage('Account created successfully!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            showMessage(getErrorMessage(error), 'error');
        }
    });

    // Google Sign In
    document.getElementById('google-signin').addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            showMessage('Signing in with Google...', 'info');
            const result = await auth.signInWithPopup(provider);
            
            // Check if user exists in Firestore, if not create
            const userDoc = await db.collection('users').doc(result.user.uid).get();
            if (!userDoc.exists) {
                await db.collection('users').doc(result.user.uid).set({
                    username: result.user.displayName || 'User',
                    email: result.user.email,
                    avatarUrl: result.user.photoURL || `https://ui-avatars.com/api/?name=User&background=random`,
                    status: 'online',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            showMessage('Welcome!', 'success');
        } catch (error) {
            console.error('Google sign-in error:', error);
            showMessage(getErrorMessage(error), 'error');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await updateUserStatus('offline');
            await auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    // Toggle between login and register forms
    document.getElementById('show-register').addEventListener('click', toggleAuthForm);

    // Channel click handlers
    document.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', () => {
            switchChannel(item.dataset.channel);
        });
    });

    // Send button click
    document.getElementById('send-btn').addEventListener('click', sendMessage);

    // Enter key to send
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (currentUser) {
            if (document.hidden) {
                updateUserStatus('away');
            } else {
                updateUserStatus('online');
            }
        }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            updateUserStatus('offline');
        }
    });

    // ==================== MOBILE SIDEBAR ====================
    
    // Open sidebar
    if (menuBtn) {
        menuBtn.addEventListener('click', openSidebar);
    }
    
    // Close sidebar
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    console.log('Firebase Chat App initialized');
}

// ==================== TOGGLE AUTH FORM ====================

function toggleAuthForm(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        document.getElementById('toggle-auth').innerHTML = 
            'Don\'t have an account? <a href="#" id="show-register" style="color: var(--primary-light); text-decoration: none;">Register here</a>';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        document.getElementById('toggle-auth').innerHTML = 
            'Already have an account? <a href="#" id="show-register" style="color: var(--primary-light); text-decoration: none;">Sign in instead</a>';
    }
    
    // Re-attach event listener to new element
    document.getElementById('show-register').addEventListener('click', toggleAuthForm);
}

// ==================== MOBILE SIDEBAR FUNCTIONS ====================

function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function isMobile() {
    return window.innerWidth <= 768;
}

// ==================== CHAT FUNCTIONS ====================

// Subscribe to messages in a channel
function subscribeToChannel(channelId) {
    // Unsubscribe from previous channel
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }

    currentChannel = channelId;
    if (channelNameEl) {
        channelNameEl.textContent = '# ' + channelId.charAt(0).toUpperCase() + channelId.slice(1);
    }
    if (messageContainer) {
        messageContainer.innerHTML = '';
    }
    updateActiveChannelUI(channelId);

    // Subscribe to real-time messages
    messagesUnsubscribe = db.collection('channels')
        .doc(channelId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limitToLast(100)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    displayMessage(change.doc.data());
                }
            });
        }, (error) => {
            console.error('Error listening to messages:', error);
        });
}

// Subscribe to online users
function subscribeToOnlineUsers() {
    if (usersUnsubscribe) {
        usersUnsubscribe();
    }

    usersUnsubscribe = db.collection('users')
        .where('status', '==', 'online')
        .onSnapshot((snapshot) => {
            if (onlineUsersList) {
                onlineUsersList.innerHTML = '';
                snapshot.forEach((doc) => {
                    const user = doc.data();
                    const userElement = document.createElement('div');
                    userElement.className = 'online-user';
                    userElement.innerHTML = `
                        <span class="status-dot online"></span>
                        <span>${user.username}</span>
                    `;
                    onlineUsersList.appendChild(userElement);
                });
            }
        }, (error) => {
            console.error('Error listening to online users:', error);
        });
}

// Send message
async function sendMessage() {
    if (!messageInput) return;
    const content = messageInput.value.trim();
    if (!content || !currentUser) return;

    try {
        await db.collection('channels')
            .doc(currentChannel)
            .collection('messages')
            .add({
                content: content,
                sender: currentUser.displayName || 'Anonymous',
                senderId: currentUser.uid,
                avatarUrl: currentUser.photoURL || `https://ui-avatars.com/api/?name=User&background=random`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                type: 'CHAT'
            });

        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Failed to send message', 'error');
    }
}

// Display a message
function displayMessage(message) {
    if (!messageContainer) return;
    
    const isOwn = message.senderId === currentUser?.uid;
    
    if (message.type === 'JOIN') {
        const joinElem = document.createElement('div');
        joinElem.className = 'system-message';
        joinElem.textContent = `${message.sender} joined the channel`;
        messageContainer.appendChild(joinElem);
    } else if (message.type === 'LEAVE') {
        const leaveElem = document.createElement('div');
        leaveElem.className = 'system-message';
        leaveElem.textContent = `${message.sender} left the channel`;
        messageContainer.appendChild(leaveElem);
    } else {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'outgoing' : ''}`;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';

        const metaElement = document.createElement('span');
        metaElement.className = 'message-meta';
        metaElement.textContent = message.sender;

        const textElement = document.createElement('p');
        textElement.textContent = message.content;

        contentElement.appendChild(metaElement);
        contentElement.appendChild(textElement);
        messageElement.appendChild(contentElement);

        messageContainer.appendChild(messageElement);
    }

    // Scroll to bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Switch channel
function switchChannel(channelId) {
    if (currentChannel !== channelId) {
        subscribeToChannel(channelId);
    }
    // Close sidebar on mobile after selecting channel
    if (isMobile()) {
        closeSidebar();
    }
}

// Update active channel UI
function updateActiveChannelUI(channelId) {
    document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('active');
        if (ch.dataset.channel === channelId) {
            ch.classList.add('active');
        }
    });
}

// ==================== HELPER FUNCTIONS ====================

function showLogin() {
    if (loginContainer) loginContainer.style.display = 'block';
    if (appContainer) appContainer.style.display = 'none';
}

function showChat() {
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    // Update user info in UI
    if (currentUsernameEl) {
        currentUsernameEl.textContent = currentUser?.displayName || 'User';
    }
    if (currentUserAvatarEl) {
        currentUserAvatarEl.src = currentUser?.photoURL || `https://ui-avatars.com/api/?name=User&background=random`;
    }
}

function showMessage(text, type) {
    if (messageBox) {
        messageBox.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
        if (type !== 'error') {
            setTimeout(() => {
                messageBox.innerHTML = '';
            }, 3000);
        }
    }
}

function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Email is already registered.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/Password sign-in is not enabled. Please enable it in Firebase Console.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed.';
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled.';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked. Please allow popups for this site.';
        case 'auth/configuration-not-found':
            return 'Authentication not configured. Please enable Email/Password and Google sign-in in Firebase Console.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

async function updateUserStatus(status) {
    if (currentUser) {
        try {
            await db.collection('users').doc(currentUser.uid).set({
                status: status,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    }
}

function unsubscribeAll() {
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
        messagesUnsubscribe = null;
    }
    if (usersUnsubscribe) {
        usersUnsubscribe();
        usersUnsubscribe = null;
    }
}

console.log('Firebase Chat App script loaded');
