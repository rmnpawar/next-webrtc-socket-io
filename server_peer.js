const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = http.createServer()

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENTURL,
    },
});

const onlineUsers = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("online", ({roomName, userName}) => {
        onlineUsers[socket.id] = {userName, roomName, socketId: socket.id};
        io.emit("new_user", {userName: userName, socketId: socket.id});
    })

    socket.on("getUsers", () => {
        const tempUsers = {...onlineUsers};
        delete tempUsers[socket.id];
        socket.emit("online_users", Object.values(tempUsers));
    })

    socket.on("video_call", ({callee, joinRoom}) => {
        socket.to(callee).emit("call_request", joinRoom);
    })

    socket.on("join", (data) => {
        const { rooms } = io.sockets.adapter;
        const room = rooms.get(data.roomName);

        if (room === undefined) {
            socket.join(data.roomName);
            socket.emit("created");
        } else if (room.size === 1) {
            socket.join(data.roomName);
            socket.emit("joined");
        } else {
            socket.emit("full");
        }
        console.log(rooms);
    });

    socket.on("ready", (roomName) => {
        socket.broadcast.to(roomName).emit("ready");
    });

    socket.on("ice-candidate", (candidate, roomName) => {
        socket.broadcast.to(roomName).emit("ice-candidate", candidate);
    });

    socket.on("offer", (offer, roomName) => {
        console.log("offer received on server")
        socket.broadcast.to(roomName).emit("offer", offer);
        console.log("offer broadcasted to room id", socket.id);
    });

    socket.on("answer", (answer, roomName) => {
        socket.broadcast.to(roomName).emit("answer", answer);
    });

    socket.on("leave", (roomName) => {
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit("leave");
        console.log(`${socket.id} left`)
    });

    socket.on("send_msg", (data) => {
        console.log(data, "DATA");
        socket.to(data.toRoomId).emit("receive_msg", data);
    });

    socket.on("disconnect", () => {
        const {rooms} = io.sockets.adapter;
        delete onlineUsers[socket.id];
        console.log(rooms);
    });
});


const PORT = Number(process.env.PORT);
httpServer.listen(PORT, () => {
    console.log(`Server started at PORT: ${process.env.PORT}`);
});
