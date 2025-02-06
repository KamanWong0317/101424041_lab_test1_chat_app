const clientIO= io();
let currentRoom = null;

// check user login
const username = localStorage.getItem("username");
if (!username) {
    window.location.href = "login.html";
} else {
    document.getElementById("user-name").textContent = username;
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

clientIO.on('chat-message', (data)=>{
    if (data.room === currentRoom) {
        document.getElementById("chat-box").innerHTML += `<p>${data.username}: ${data.message}</p><p></p>`;
    }
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
    window.location.href = "/";
}