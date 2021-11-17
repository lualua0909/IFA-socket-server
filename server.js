const express = require("express");
const https = require("https");

var fs = require('fs');
var privateKey  = fs.readFileSync('./smarte.edu.vn.key', 'utf8');
var certificate = fs.readFileSync('./smarte.edu.vn.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

const app = express();
const server = https.createServer(credentials, app);

const socket = require("socket.io");
const io = socket(server);

var cors = require("cors");
app.use(cors());

const chatDataList = {};
const users = {};
const socketToRoom = {};

io.on("connection", (socket) => {
  //PRIVATE CHATTING CHANNEL
  socket.on("subscribe", function (data) {
    console.log("joining room", data.room);
    //add user to room  list
    if (chatDataList[data.room] === undefined) {
      chatDataList[data.room] = [];
    }
    const newUser = {
      id: data.id,
      name: data.name,
      socket: socket.id,
    };

    chatDataList[data.room].push(newUser);
    socket.join(data.room);

    io.to(socket.id).emit("get_data_list", chatDataList[data.room]);
    socket.broadcast.to(data.room).emit("add_new_user", newUser);
  });

  socket.on("send_message", function (data) {
    socket.broadcast.to(data.room).emit("private_channel", {
      sender: data.sender,
      message: data.message,
    });
  });

  socket.on("send_notify", function (data) {
    socket.broadcast.to(data.room).emit("receive_notify", {
      sender: data.sender,
      message: data.message,
    });
  });

  // VIDEO CALL
  socket.on("join room", (roomID) => {
    console.log(`join room ${roomID}`);
    if (users[roomID]) {
      const length = users[roomID].length;
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });
  //DISCONNECT
  socket.on("disconnect", () => {
    console.log(socket.id + " disconnected");
    // REMOVE FROM CHATTING
    for (var prop in chatDataList) {
      if (Object.prototype.hasOwnProperty.call(chatDataList, prop)) {
        chatDataList[prop].forEach(function (item, index) {
          if (chatDataList[prop][index].socket === socket.id) {
            chatDataList[prop].splice(index, 1);
          }
        });
      }
    }
    console.log(chatDataList);
    socket.broadcast.emit("remove_user", socket.id);

    //REMOVE FROM VIDEO CALL
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
  });
});

server.listen(3002, () => console.log("server is running on port 3002"));
