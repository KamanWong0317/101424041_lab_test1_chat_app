const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const PORT = process.env.PORT || 3000

const app = express()
const User = require('./models/User');
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage")

app.use(cors());
app.use(express.json());

// connect mongodb
MONGO_URI = "mongodb+srv://admin:admin@cluster0.yqpiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB fail to connect ', err));

app.use(express.static(path.join(__dirname, 'public')));
// home page: login.html 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'view/login.html'))
})

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'view/signup.html'));
});

// User signup api
app.post('/signup', async (req, res) => {
    const { username, firstname, lastname, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const newUser = new User({ username, firstname, lastname, password });
        await newUser.save();
        res.status(201).json({ message: "Registration was successful!" });
    } catch (err) {
        res.status(500).json({ message: "Registration Failure", err});
    }
});

// User login api
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        // check user
        if (!user) {
            return res.status(400).json({ message: "Username does not exist" });
        }
        // check password
        if (password !== user.password) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        res.status(200).json({ message: "", username: user.username });
    } catch (err) {
        res.status(500).json({ message: err });
    }
});


//import socket Server object from socket.io module
const {Server} = require('socket.io')

//start listening to server on PORT
const appServer = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/`)
})

// associate app
const io = new Server(appServer)

io.on("connection", (socket)=>{
    console.log(`Client conected. Client ID : ${socket.id}`);

    // user joins chat room
    socket.on("join-room", async ({ username, room }) => {
        socket.join(room);
        io.to(room).emit("chat-message", { username: "System", message: `${username} join ${room} room`, room });
    });

    // users leave the chat room
    socket.on("leave-room", ({ username, room }) => {
        socket.leave(room);
        io.to(room).emit("chat-message", { username: "System", message: `${username} leave ${room} room`, room });
    });

    // group Chat
    socket.on("chat-message", async ({ username, message, room }) => {
        try{
            const timestamp = new Date().toISOString();
            const newMessage = new GroupMessage({ from_user: username, room, message });
            await newMessage.save();
            io.to(room).emit("chat-message", { username, message, room, timestamp });
        }catch{
            console.log("MongoDB save failure:", err);
        }
    });

    // private Message
    socket.on("private-message", async ({ from_user, to_user, message }) => {
        try{
            const timestamp = new Date().toISOString();
            const newPrivateMessage = new PrivateMessage({ from_user, to_user, message });
            await newPrivateMessage.save();
            io.to(to_user).emit("private-message", { from_user, message , timestamp });
        }catch{
            console.log("MongoDB save failure:", err);
        }
    });

    // input indicator
    socket.on("typing", ({ username, room }) => {
        socket.to(room).emit("typing", { username, room });
    });

    socket.on("disconnect", ()=>{
        console.log(`Client disconneccted.Client ID: ${socket.id}`);
    });
    
})

    



