const express = require("express");
const https = require("http");
const app = express();
const server = https.createServer(app);

const socket = require("socket.io");
const io = socket(server);
const chatDataList = {};

io.on("connection", (socket) => {
  console.log(socket.id + " ==== connected");
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

  socket.on("disconnect", () => {
    console.log(socket.id + " disconnected");
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
  });
  //======================================================================
  // socket.on("join room", roomID => {
  //     if (users[roomID]) {
  //         const length = users[roomID].length
  //         if (length === 4) {
  //             socket.emit("room full")
  //             return
  //         }
  //         users[roomID].push(socket.id)
  //     } else {
  //         users[roomID] = [socket.id]
  //     }
  //     socketToRoom[socket.id] = roomID
  //     const usersInThisRoom = users[roomID].filter(id => id !== socket.id)

  //     socket.emit("all users", usersInThisRoom)
  // })

  // socket.on("sending signal", payload => {
  //     io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID })
  // })

  // socket.on("returning signal", payload => {
  //     io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id })
  // })
});

server.listen(80, () => console.log("server is running on port 3001"));

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});
