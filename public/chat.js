const clientIO= io();
let currentRoom = null;

// check user login
const username = localStorage.getItem("username");
if (!username) {
    window.location.href = "login.html";
} else {
    document.getElementById("user-name").textContent = username;
    clientIO.emit("register-user", username);
}


// load Users
async function loadUsers() {
        const response = await fetch("http://localhost:3000/users");
        const users = await response.json();

        const userSelect = document.getElementById("private-user-select");
        userSelect.innerHTML = '<option value="" disabled selected>Select a user</option>';

        users.forEach(user => {
            if (user.username !== localStorage.getItem("username")) {
                userSelect.innerHTML += `<option value="${user.username}">${user.username}</option>`;
            }
        });
}

window.onload = () => {
    loadUsers();
};

// time set
const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `[${hours}:${minutes}]`;
}

// join room
const joinRoom= () => {
    const room = document.getElementById("room-select").value;
    clientIO.emit("join-room", { username, room });
    currentRoom = room;
}

// leave room
const  leaveRoom = () => {
    if (currentRoom) {
        clientIO.emit("leave-room", { username, room: currentRoom });
        alert("You leave the chat room");
        currentRoom = null;
    }
}

// send chat message
const sendChatMessage = () => {
    // check room
    if (!currentRoom) {
        alert("Please join the chat room first!");
        return;
    }

    const message = document.getElementById('message-input').value.trim();

    if(message && currentRoom){
        clientIO.emit("chat-message", { username, message, room: currentRoom, });
        document.getElementById("message-input").value = "";
    }else{
        alert("Message is empty. Can't send.");
    }
};

//display chat message 
const displayMessage = (data) => {
    if (data.room === currentRoom) {
        const chatContainer = document.getElementById("chat-box");
        const messageDiv = document.createElement("div");
        
        const formattedTime = formatTimestamp(data.timestamp);
        messageDiv.textContent = `${formattedTime} ${data.username}: ${data.message}`;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Display group message
clientIO.on('chat-message', (data)=>{
    if (data.room === currentRoom) {
        const formattedTime = formatTimestamp(Date.now());
        document.getElementById("chat-box").innerHTML += `<p>${formattedTime} ${data.username}: ${data.message}</p><p></p>`;
    }
});

// Send private message
const sendPrivateMessage = () => {
    const toUser = document.getElementById("private-user").value.trim();
    const message = document.getElementById("private-message-input").value.trim();

    if (toUser && message) {
        clientIO.emit("private-message", { from_user: username, to_user: toUser, message });
        document.getElementById("private-message-input").value = "";
    } else {
        alert("Please select a username and message!");
    }
}

// Display private message
clientIO.on("private-message", (data) => {
    const formattedTime = formatTimestamp(Date.now());
    document.getElementById("private-chat-box").innerHTML += `<p>${formattedTime} ${data.from_user}: ${data.message}</p>`;
});

// Receive group chat messages
clientIO.on("chat-history", (chatHistory) => {
    document.getElementById("chat-box").innerHTML = "";

    chatHistory.forEach((message) => {
        displayMessage({
            username: message.from_user,
            message: message.message,
            room: message.room,
            timestamp: message.date_sent
        });
    });
});

// typing indicator
const sendTypingIndicator = () => {
    if (currentRoom) {
        clientIO.emit("typing", { username, room: currentRoom });
    }
}

clientIO.on("typing", (data) => {
    if (data.room === currentRoom) {
        document.getElementById("typing-indicator").textContent = `${data.username} Inputting...`;
        setTimeout(() => {
            document.getElementById("typing-indicator").textContent = "";
        }, 2000);
    }
});

// logout
const logout = () => {
    localStorage.removeItem("username");
    alert("You are logouting");
    window.location.href = "/";
}