let stompClient = null;
let username = null;
let currentChannel = 'general';
let currentSubscription = null;

const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect() {
    // Fetch current user first
    fetch('/api/current-user')
        .then(response => response.json())
        .then(data => {
            username = data.username;
            document.getElementById('current-username').innerText = username;

            // Connect to WebSocket
            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            stompClient.connect({}, onConnected, onError);
        })
        .catch(err => console.error("Could not fetch user", err));
}

function onConnected() {
    subscribeToChannel(currentChannel);
}

function subscribeToChannel(channelId) {
    if (currentSubscription) {
        currentSubscription.unsubscribe();
    }

    currentChannel = channelId;
    document.getElementById('channel-name').innerText = '# ' + channelId.charAt(0).toUpperCase() + channelId.slice(1);
    // Clear chat
    document.getElementById('message-container').innerHTML = '';

    // Fetch history
    fetch('/api/messages/' + channelId)
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => onMessageReceived({ body: JSON.stringify(msg) }));
        });

    currentSubscription = stompClient.subscribe('/topic/' + channelId, onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat/" + channelId + "/addUser",
        {},
        JSON.stringify({ sender: username, type: 'JOIN' })
    );

    updateActiveChannelUI(channelId);
}

function switchChannel(channelId) {
    if (currentChannel !== channelId) {
        subscribeToChannel(channelId);
    }
}

function updateActiveChannelUI(channelId) {
    // Remove active class from all
    const channels = document.querySelectorAll('.channel-item');
    channels.forEach(ch => ch.classList.remove('active'));

    // Add to current
    channels.forEach(ch => {
        if (ch.getAttribute('onclick').includes(channelId)) {
            ch.classList.add('active');
        }
    });
}

function onError(error) {
    console.log('Could not connect to WebSocket server. ' + error);
}

function sendMessage(event) {
    if (event) event.preventDefault();

    const messageInput = document.getElementById('message-input');
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT',
            channel: currentChannel
        };

        stompClient.send("/app/chat/" + currentChannel + "/sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
}

function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    const messageContainer = document.getElementById('message-container');

    // Only process if it belongs to current channel (just in case)
    if (message.channel && message.channel !== currentChannel) return;

    if (message.type === 'JOIN') {
        const joinElem = document.createElement('div');
        joinElem.style.textAlign = "center";
        joinElem.style.color = "#888";
        joinElem.style.marginBottom = "10px";
        joinElem.innerText = message.sender + " joined!";
        messageContainer.appendChild(joinElem);
    } else if (message.type === 'LEAVE') {
        const leaveElem = document.createElement('div');
        leaveElem.innerText = message.sender + " left!";
        messageContainer.appendChild(leaveElem);
    } else {
        // Chat Message
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        if (message.sender === username) {
            messageElement.classList.add('outgoing');
        }

        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');

        const metaElement = document.createElement('span');
        metaElement.classList.add('message-meta');
        metaElement.innerText = message.sender;

        const textElement = document.createElement('p');
        textElement.innerText = message.content;

        contentElement.appendChild(metaElement);
        contentElement.appendChild(textElement);
        messageElement.appendChild(contentElement);

        messageContainer.appendChild(messageElement);
    }

    // Scroll to bottom
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Add event listener for Enter key
document.getElementById('message-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Handle logout - disconnect WebSocket before form submission
document.querySelector('.logout-form').addEventListener('submit', function (e) {
    if (stompClient && stompClient.connected) {
        // Send leave message before disconnecting
        stompClient.send("/app/chat/" + currentChannel + "/addUser",
            {},
            JSON.stringify({ sender: username, type: 'LEAVE' })
        );
        stompClient.disconnect();
    }
});

// Handle page unload - send leave message
window.addEventListener('beforeunload', function () {
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/chat/" + currentChannel + "/addUser",
            {},
            JSON.stringify({ sender: username, type: 'LEAVE' })
        );
    }
});

// Start connection
connect();
